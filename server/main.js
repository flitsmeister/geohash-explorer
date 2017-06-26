import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';

Meteor.startup(() => {
    Geohashes = new Mongo.Collection("geohashes");
    Projects = new Mongo.Collection("projects");
});
