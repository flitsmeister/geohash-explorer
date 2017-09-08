# geohash-explorer
Simple Meteor Webapp to manually translate Geojson features to Geohashes with a map.

- Install Meteor via `npm i meteor -g`

Project is supplied as is, feature improvements are welcome as a PR :-)

- Run with `meteor`.
- Add project to MongoDB database `meteor -> projects`, with `name` set to project-name.
- Place .geojson files in the `public/` folder, with name '<Project>.geojson'.
- Click on the map to add a Geohash to the project, and click it again to make it disappear.

![Demo Screenshot](screenshot.jpg?raw=true "Screenshot")


