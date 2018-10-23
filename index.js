const config = require('./config/config');
const admin = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.cert(config.firebaseadmin),
    databaseURL: config.other.databaseurl,
    storageBucket: config.other.storagebucket
});
var fs = require('fs');
var path = require('path');
var os = require("os");
var bucket = admin.storage().bucket();
var path = require('path');

const promisePool = require('es6-promise-pool');
const PromisePool = promisePool.PromisePool;
const secureCompare = require('secure-compare');

var secretKey = config.other.secretKey;
var Jimp = require('jimp')

var url = "https://firebasestorage.googleapis.com/v0/b/image-face-detection.appspot.com/o/images%2F4_Dancing_Dancing_4_33.jpg?alt=media&token=bf771f69-07f0-4e99-93df-a1243609c13e";

function createGrayscale(url, outputname) {
  Jimp.read(url, (err, image) => {
    console.log("getting image");
    //console.log(image.bitmap.data)
    var xdim = image.bitmap.width;
    var ydim = image.bitmap.height;
    var grayscaleconstants = config.other.imagegrayscaleconstants
    //console.log(grayscaleconstants);
  
    for (var x = 0; x < xdim; x++) {
      for (var y = 0; y < ydim; y++) {
        var pixelcolor = image.getPixelColor(x,y);
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
    image.write(outputname);
    console.log("finished.");
    //console.log(res);
    var fileName = "outputname";
    bucket.upload(outputname, {
      destination: outputname,
      metadata: {
        contentType: 'image/jpeg'
      }
    });
  });
}

createGrayscale(url, "images/image1.jpg");