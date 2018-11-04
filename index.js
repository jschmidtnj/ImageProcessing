const config = require('./frontend-app/functions/config/config');
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

// createGrayscale(url, "generated/image1.jpg");

function fft1d(re, im) {
  var N = re.length;
  for (var i = 0; i < N; i++) {
      for (var j = 0, h = i, k = N; k >>= 1; h >>= 1)
          j = (j << 1) | (h & 1);
      if (j > i) {
          re[j] = [re[i], re[i] = re[j]][0];
          im[j] = [im[i], im[i] = im[j]][0];
      }
  }
  for (var hN = 1; hN * 2 <= N; hN *= 2)
      for (i = 0; i < N; i += hN * 2)
          for (j = i; j < i + hN; j++) {
              var cos = Math.cos(Math.PI * (j - i) / hN),
                  sin = Math.sin(Math.PI * (j - i) / hN);
              var tre = re[j + hN] * cos + im[j + hN] * sin,
                  tim = -re[j + hN] * sin + im[j + hN] * cos;
              re[j + hN] = re[j] - tre;
              im[j + hN] = im[j] - tim;
              re[j] += tre;
              im[j] += tim;
          }
  return [re, im];
}

function fft2d(re, im) {
  var realcolumns = [];
  var imaginarycolumns = [];
  for (var i = 0; i < re.length; i++) {
    fft1d(re[i], im[i]);
    realcolumns.push([]);
    imaginarycolumns.push([]);
  }
  for (i = 0; i < re.length; i++) {
    for (var j = 0; j < re[i].length; j++) {
      realcolumns[j].push(re[i][j]);
      imaginarycolumns[j].push(re[i][j]);
    }
  }
  for (i = 0; i < realcolumns.length; i++)
    fft1d(realcolumns[i], imaginarycolumns[i]);
  for (i = 0; i < re.length; i++) {
    for (var j = 0; j < re[i].length; j++) {
      realcolumns[j].push(re[i][j]);
      imaginarycolumns[j].push(im[i][j]);
    }
  }
  var realrows = [];
  var imaginaryrows = [];
  for (var i = 0; i < realcolumns.length; i++) {
    realrows.push([]);
    imaginaryrows.push([]);
  }
  for (i = 0; i < realcolumns.length; i++) {
    for (var j = 0; j < realcolumns[i].length; j++) {
      realrows[j].push(realcolumns[i][j]);
      imaginaryrows[j].push(imaginarycolumns[i][j]);
    }
  }
  return [realrows, imaginaryrows];
}

function ifft1d(re, im){
  fft1d(im, re);
  for(var i = 0, N = re.length; i < N; i++){
      im[i] /= N;
      re[i] /= N;
  }
  return [re, im];
}

function ifft2d(re, im) {
  for (var i = 0; i < re.length; i++)
    ifft1d(re[i], im[i]);
  return [re, im];
}

function conv1d(re1, im1, re2, im2) {
  fft1d(re1, im1);
  fft1d(re2, im2);
  var reconvfft = [];
  var imconvfft = [];
  for(i = 0; i < re1.length; i++) {
    reconvfft.push(re1[i] * re1[i]);
    imconvfft.push(im1[i] * im2[i]);
  }
  ifft1d(reconvfft, imconvfft);
  return [reconvfft, imconvfft];
}

function conv2d(re1, im1, re2, im2) {
  var reres = [];
  var imres = [];
  for(i = 0; i < re1.length; i++) {
    var conv1dres = conv1d(re1[i], im1[i], re2[i], im2[i]);
    reres.push(conv1dres[0]);
    imres.push(conv1dres[1]);
  }
  return [reres, imres];
}

re = [1,2,3,4];
im = [0,0,0,0];
fft1d(re, im);
console.log(re, im);
ifft1d(re, im);
console.log(re, im);

re2d = [[1,2],[3,4],[5,6]];
im2d = [[0,0],[0,0],[0,0]];
fft2d(re2d, im2d);
console.log(re2d, im2d);
ifft2d(re2d, im2d);
console.log(re2d, im2d);

var re2 = [0,0,0,0,0];
var im2 = [0,0,0,0,0];
console.log(conv1d(re, im, re2, im2));

re2d2 = [[1,0],[0,0]];
im2d2 = [[0,0],[0,0]];
console.log(conv2d(re2d, im2d, re2d2, im2d2));