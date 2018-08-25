var geohash = require('ngeohash');
var geohashes = {};

Geohashes = new Mongo.Collection("geohashes");
Projects = new Mongo.Collection("projects");

// Taken from https://github.com/sunng87/node-geohash/blob/master/main.js#L165
var BASE32_CODES = "0123456789bcdefghjkmnpqrstuvwxyz";
var BASE32_CODES_DICT = {};
for (var i = 0; i < BASE32_CODES.length; i++) {
    BASE32_CODES_DICT[BASE32_CODES.charAt(i)] = i;
}

var decode_bbox = function (hash_string) {
    var isLon = true,
        maxLat = 90,
        minLat = -90,
        maxLon = 180,
        minLon = -180,
        mid;

    var hashValue = 0;
    for (var i = 0, l = hash_string.length; i < l; i++) {
        var code = hash_string[i].toLowerCase();
        hashValue = BASE32_CODES_DICT[code];

        for (var bits = 4; bits >= 0; bits--) {
            var bit = (hashValue >> bits) & 1;
            if (isLon) {
                mid = (maxLon + minLon) / 2;
                if (bit === 1) {
                    minLon = mid;
                } else {
                    maxLon = mid;
                }
            } else {
                mid = (maxLat + minLat) / 2;
                if (bit === 1) {
                    minLat = mid;
                } else {
                    maxLat = mid;
                }
            }
            isLon = !isLon;
        }
    }
    return [minLat, minLon, maxLat, maxLon];
};


var SessionStore = _.extend({}, Session, {
    keys: _.object(_.map(amplify.store(), function (value, key) {
        return [key, JSON.stringify(value)];
    })),
    set: function (key, value) {
        Session.set.apply(this, arguments);
        amplify.store(key, value);
    }
});

Template.indicator.events({

    'click': function (evt) {
        var gh = geohash.decode(Session.get('currentHash'));
        window.map.instance.setCenter(new google.maps.LatLng(gh[0], gh[1]));
        window.map.instance.setZoom(16);
    },
});


Template.registerHelper('geohashIndicator', function (input) {
    return Session.get("currentHash");
});

Meteor.startup(function () {
    GoogleMaps.load({ key: '' });
});

Template.map.helpers({
    mapOptions: function () {
        if (GoogleMaps.loaded()) {
            return {
                center: new google.maps.LatLng(52.157787, 5.388809),
                zoom: 13,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                scrollwheel: false
            };
        }
    }
});

Template.project_picker.helpers({

    current: function () {
        return SessionStore.get('project');

    },

    projects: function () {
        return Projects.find({}).fetch().map((doc) => doc.name);
    }

})

Template.project_picker.events({

    'change': function (evt) {

        var project = evt.target.options[evt.target.selectedIndex].value;

        evt.preventDefault();
        evt.stopPropagation();  // stops the full-page click handler above from firing
        SessionStore.set('project', project);

        window.location.reload(false);
    },
});


Template.map.onCreated(function () {

    GoogleMaps.ready('map', function (map) {

        window.map = map;

        map.instance.data.loadGeoJson(SessionStore.get('project') + '.geojson')
        console.log('ready');


        map.instance.data.setStyle({
            fillColor: 'transparent',
            strokeWeight: 1
        });

        map.instance.data.addListener('click', function (event) {

            console.log('inserting');

            var gh = geohash.encode(event.latLng.lat(), event.latLng.lng(), 7);
            var bbox = decode_bbox(gh);

            // geohash van event.latLng.lat() en event.latLng.lng() opzoeken
            // vervolgens bounding box berekenn, deze zetten op lat1, long1, lat2, long2.
            console.log(gh);

            Geohashes.insert({
                hash: gh,
                lat1: bbox[0],
                lng1: bbox[1],
                lat2: bbox[2],
                lng2: bbox[3],
                project: SessionStore.get('project')
            });

        });

        google.maps.event.addListener(map.instance, 'click', function (event) {

            console.log('inserting');

            var gh = geohash.encode(event.latLng.lat(), event.latLng.lng(), 7);
            var bbox = decode_bbox(gh);

            // geohash van event.latLng.lat() en event.latLng.lng() opzoeken
            // vervolgens bounding box berekenn, deze zetten op lat1, long1, lat2, long2.
            console.log(gh);

            Geohashes.insert({
                hash: gh,
                lat1: bbox[0],
                lng1: bbox[1],
                lat2: bbox[2],
                lng2: bbox[3],
                project: SessionStore.get('project')
            });

        });

        Geohashes.find({project: SessionStore.get('project')}).observe({
            added: function (doc) {

                var gh = new google.maps.Rectangle({
                    draggable: false,
                    editable: false,
                    strokeColor: '#39FF14',
                    strokeOpacity: 0.8,
                    strokeWeight: 4,
                    fillColor: '#c8dcaa',
                    fillOpacity: 0.35,
                    map: map.instance,
                    bounds: new google.maps.LatLngBounds(new google.maps.LatLng(doc.lat1, doc.lng1),
                        new google.maps.LatLng(doc.lat2, doc.lng2))
                });

                // This listener lets us drag markers on the map and update their corresponding document.
                google.maps.event.addListener(gh, 'click', function (event) {
                    Session.set('currentHash', gh.hash);
                    Geohashes.remove(doc._id);
                });

                // This listener lets us drag geohashes on the map and update their corresponding document.
                google.maps.event.addListener(gh, 'dragend', function (event) {

                    var ght = geohash.encode(event.latLng.lat(), event.latLng.lng(), 7);
                    var bbox = decode_bbox(ght);

                    Geohashes.update(doc._id, {
                        $set: {
                            hash: ght,
                            lat1: bbox[0],
                            lng1: bbox[1],
                            lat2: bbox[2],
                            lng2: bbox[3],
                            project: SessionStore.get('project')
                        }
                    });

                });

                Session.set('currentHash', doc.hash);

                // Store this marker instance within the markers object.
                geohashes[doc._id] = gh;
            },
            changed: function (newDocument, oldDocument) {

                console.log('updated ' + oldDocument.geohash);

                geohashes[newDocument._id].setBounds(
                    new google.maps.LatLngBounds(new google.maps.LatLng(newDocument.lat1, newDocument.lng1),
                        new google.maps.LatLng(newDocument.lat2, newDocument.lng2))
                );

                Session.set('currentHash', newDocument.hash);

            },
            removed: function (oldDocument) {

                console.log('removed ' + oldDocument.hash);

                // Remove the geohash from the map
                geohashes[oldDocument._id].setMap(null);

                // Clear the event listener
                google.maps.event.clearInstanceListeners(
                    geohashes[oldDocument._id]);

                // Remove the reference to this geohash instance
                delete geohashes[oldDocument._id];
            }
        });


    });

});