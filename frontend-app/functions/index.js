const functions = require('firebase-functions');
const config = require('./config/config');
const admin = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.cert(config.firebaseadmin),
    databaseURL: config.other.databaseurl
});

const promisePool = require('es6-promise-pool');
const PromisePool = promisePool.PromisePool;
const secureCompare = require('secure-compare');

var secretKey = config.other.secretKey;

//see https://github.com/firebase/functions-samples/tree/master/delete-unused-accounts-cron for more details
exports.facerecognition = functions.https.onRequest((req, res) => {
    //console.log(MAX_CONCURRENT);
    const key = req.query.key;
    // Exit if the keys don't match.
    if (!secureCompare(key, functions.config().cron.key)) {
        console.log('The key provided in the request does not match the key set in the environment. Check that', key,
            'matches the cron.key attribute in `firebase env:get`');
        res.status(403).send('Security key does not match. Make sure your "key" URL query parameter matches the ' +
            'cron.key environment variable.');
        return null;
    }

    res.send('face recognition finished');
    return null;
});
