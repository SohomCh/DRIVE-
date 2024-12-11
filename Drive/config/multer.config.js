const multer = require('multer');
const firebaseStorage = require('multer-firebase-storage');
const firebase = require('./firebase.config');

const serviceAccount = require('drive-f9a57-firebase-adminsdk-fhn8u-82c727f2bc.json');


const storage = firebaseStorage({
    credentials: firebase.credential.cert(serviceAccount),
    bucketName: ' drive-f9a57.firebasestorage.app',
    unique: true,
})


const upload = multer({
    storage: storage,
})

module.exports = upload;