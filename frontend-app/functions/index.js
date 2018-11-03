const functions = require('firebase-functions');
const config = require('./config/config');
const admin = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.cert(config.firebaseadmin),
    databaseURL: config.other.databaseurl,
    storageBucket: config.other.storagebucket
});
var Jimp = require('jimp');
var bucket = admin.storage().bucket();
var fs = require("fs");
var os = require('os');
var path = require('path');

const promisePool = require('es6-promise-pool');
const PromisePool = promisePool.PromisePool;
//const secureCompare = require('secure-compare');

//var secretKey = config.other.secretKey;

exports.facedetect = functions.https.onCall((data, context) => {
    const url = data.url;
    const outputname = data.outputname;
    const uid = data.uid;
    console.log(url, outputname);
    var status = "";
    return convertToGrayscale(url, outputname, uid);
});

function convertToGrayscale(url, outputname, uid) {
    return new Promise((resolve, reject) => {
        Jimp.read(url, (err, image) => {
            if (err) {
                console.log(err);
                return null;
            }
            console.log("getting image");
            //console.log(image.bitmap.data)
            var xdim = image.bitmap.width;
            var ydim = image.bitmap.height;
            var grayscaleconstants = config.other.imagegrayscaleconstants;
            console.log(grayscaleconstants);
    
            for (var x = 0; x < xdim; x++) {
                for (var y = 0; y < ydim; y++) {
                    var pixelcolor = image.getPixelColor(x, y);
                    var rgba = Jimp.intToRGBA(pixelcolor);
                    var newvals = [];
                    for (var i = 0; i < grayscaleconstants.length; i++) {
                        var value = 0;
                        value = value + grayscaleconstants[i][0] * rgba.r;
                        value = value + grayscaleconstants[i][1] * rgba.g;
                        value = value + grayscaleconstants[i][2] * rgba.b;
                        newvals.push(value);
                    }
                    var hexval = Jimp.rgbaToInt(newvals[0], newvals[0], newvals[0], 255);
                    image.setPixelColor(hexval, x, y);
                }
            }
            var imagename = outputname + ".jpg";
            const tempFilePath = path.join(os.tmpdir(), imagename);
            image.write(tempFilePath, (err) => {
                if (err !== null) {
                    console.log(err);
                    status = "failed image write";
                    reject(err);
                }
            });
            console.log("finished.");
            var destination = "users/" + uid + "/outputimages/" + imagename;
            return bucket.upload(tempFilePath, {
                destination: destination,
                metadata: {
                    contentType: 'image/jpeg'
                }
            }).then(() => {
                console.log("delete file");
                fs.unlinkSync(tempFilePath);
                status = "success";
                resolve({
                    status: status
                });
                return null;
            }).catch((err) => {
                console.log(err);
                status = "failed reupload";
                reject(err);
            });
        });
    });
}