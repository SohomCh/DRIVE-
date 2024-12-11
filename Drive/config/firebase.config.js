const Firebase = require('firebase-admin');
const serviceAccount = require('..drive-f9a57-firebase-adminsdk-fhn8u-82c727f2bc.json')

const firebase = Firebase.initializeApp({
    credential: Firebase.credential.cert(serviceAccount),
    storageBucket :' drive-f9a57.firebasestorage.app'

})
module.exports = Firebase;