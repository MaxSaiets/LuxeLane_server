// Firebase
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path')

// FOR DEPLOY
const serviceAccountPath = path.resolve(__dirname, 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
// const serviceAccount = require('./keys/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://reactmarket-79722.appspot.com',
});

const bucket = admin.storage().bucket();

module.exports = { admin, bucket };