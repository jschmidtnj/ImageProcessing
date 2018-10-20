const main = require('bindings')('main');
const config = require('./config/config');
var getPixels = require("get-pixels");
var fs = require('fs');
var Jimp = require('jimp')
var url = "https://cdn.newsapi.com.au/image/v1/9fdbf585d17c95f7a31ccacdb6466af9";

getPixels(url, function (err, pixels) {
  if (err) {
    console.log("Bad image path");
    return;
  }
  var pixeldimensions = pixels.shape.slice();
  var xdim = pixeldimensions[0];
  var ydim = pixeldimensions[1];
  console.log("got pixels", pixeldimensions);
  console.log(pixels.data);
  var array = [];
  for (var x = 0; x < 3; x++) {
    for (var y = 0; y < 3; y++) {
      for (var rgb = 0; rgb < 3; rgb++) {
        array.push(pixels.get(x, y, rgb));
      }
    }
  }
  console.log(array);
  console.log(pixels.get(200, 250, 3));
  var grayscaleconstants = config.other.imagegrayscaleconstants
  console.log(grayscaleconstants);

  var buffer = new Uint8ClampedArray(xdim * ydim * 4);

  var grayscalearr = [];
  for (var x = 0; x < xdim; x++) {
    for (var y = 0; y < ydim; y++) {
      var rval = pixels.get(x, y, 0);
      var gval = pixels.get(x, y, 1);
      var bval = pixels.get(x, y, 2);
      var rgb = [rval, gval, bval];
      var newpixel = [];
      var pos = (y * xdim + x) * 4;
      for (var i = 0; i < grayscaleconstants.length; i++) {
        var value = 0;
        for (var j = 0; j < grayscaleconstants[i].length; j++) {
          value += grayscaleconstants[i][j] * rgb[0];
        }
        newpixel.push(value);
        buffer[pos + i] = value;
      }
      buffer[pos + 3] = 255;
      newpixel.push(255);
      grayscalearr.push(newpixel);
    }
  }

  console.log(grayscalearr);
  console.log(buffer);
  fs.writeFile('test1.png', buffer, function (err) {
    if (err) throw err
    console.log('file saved');
  })
});

const pixelSize = 256
var image1 = new Jimp(pixelSize, pixelSize, function (err, image) {
  let buffer = image.bitmap.data
  for (var x = 0; x < pixelSize; x++) {
    for (var y = 0; y < pixelSize; y++) {
      const offset = (y * pixelSize + x) * 4 // RGBA = 4 bytes
      buffer[offset] = 50    // R
      buffer[offset + 1] = 60    // G
      buffer[offset + 2] = 35    // B
      buffer[offset + 3] = 0  // Alpha
    }
  }
})

image1.write('image.png')


Jimp.read(url, function (err, image) {
  console.log("getting image");
  console.log(image.bitmap.data)
  var xdim = image.bitmap.width;
  var ydim = image.bitmap.height;
  var grayscaleconstants = config.other.imagegrayscaleconstants
  console.log(grayscaleconstants);

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
  image.write('image1.jpg')
  
});


console.log(main.sayHi());