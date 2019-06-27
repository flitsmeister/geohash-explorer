'use strict'

const Fs = require('fs')
const NGeohash = require('ngeohash');
const MongoClient = require('mongodb').MongoClient
const Sync = require('yield-yield')

const generate = Sync(function *(geohashesFile, project) {
    const client = yield MongoClient.connect('mongodb://127.0.0.1:3001', yield)
    const db = client.db('meteor')

    const GeohashesDb = db.collection('geohashes', null)
    const ProjectsDb = db.collection('geohashes', null)

    const file = Fs.readFileSync(geohashesFile)
    const geohashes = file.toString().split('\n')

    for (const geohash of geohashes) {
        if (!geohash) continue

        console.log(`Adding ${geohash} to ${project}`)
        const bbox = NGeohash.decode_bbox(geohash);
        const result = yield GeohashesDb.insertOne({ hash: geohash, lat1: bbox[0], lng1: bbox[1], lat2: bbox[2], lng2: bbox[3], project }, yield)
    }
    yield client.close()
})

if (require.main === module) {
    const geohashesFile = process.argv.slice(2)[0]
    const project = process.argv.slice(3)[0]

    if (!geohashesFile || !project) {
        console.log('Usage:\n\tnode generate_from_geohashes.js <geohashes_file> <project_name>')
        console.log('\nGeohashes file should have a geohash per line, without any special characters (no spaces, comma\'s, etc)')
        return
    }

    generate(geohashesFile, project)
}
