# geohash-explorer
Simple Meteor Webapp to manually translate Geojson features to Geohashes with a map.

- Install Meteor via instructions on https://www.meteor.com/install

Project is supplied as is, feature improvements are welcome as a PR :-)

- Install dependencies with `meteor npm install`
- Run with `meteor`.
- Connect to Meteor MongoDB `127.0.0.1` and port `3001`, without auth.
- Add database `meteor` if it doesn't exist yet.
- Add collection `projects` to `meteor` db, and add objects with `name` set to project-names.
- Place .geojson files in the `public/` folder, with same name '<Project>.geojson'.
- Click on the map to add a Geohash to the project, and click it again to make it disappear.


To extract a list of geohashes from robomongo, you can run the following:
```
records = [];
var cursor = db.getCollection('geohashes').find({"project": "project"}, {});
while(cursor.hasNext()) {
    records.push(cursor.next().hash)
}
print(tojson(records));
```

![Demo Screenshot](screenshot.jpg?raw=true "Screenshot")
