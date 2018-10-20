const config = require('./config/config');
var Jimp = require('jimp')
var url = "https://images.pexels.com/photos/248797/pexels-photo-248797.jpeg?auto=compress&cs=tinysrgb&h=350";

function createGrayscale(url, outputname) {
  Jimp.read(url, function (err, image) {
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
  });
}

createGrayscale(url, "images/image1.jpg");