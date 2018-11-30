var jQuery = require('jquery');
//require('jquery.easing');
require("popper.js");
require("bootstrap");
window.$ = window.jQuery = jQuery;

require("bootstrap-select");
require("bootstrap-select/dist/css/bootstrap-select.css");

var config = require('../../../config/config.json');

var firebase = require("firebase/app");
require("firebase/database");
require("firebase/storage");
require("firebase/functions");
require("firebase/auth");
firebase.initializeApp(config.firebase);

//get Jimp
var Jimp = require("jimp");

// get graph stuff (histogram)
var echarts = require("echarts");
var ecStat = require("echarts-stat");

function handleError(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    //console.log(errorCode, errorMessage);
    var customMessage = errorMessage;
    if (error.code !== "" && error.message !== "") {
        if (customMessage !== "") {
            $('#error-info').text(customMessage);
        } else {
            $('#error-info').text("Error: " + errorMessage + " Code: " + errorCode);
        }
    } else {
        $('#error-info').text("No Error code found.");
    }
    $('#alertsubmitfailure').fadeIn();
    setTimeout(function () {
        $('#alertsubmitfailure').fadeOut();
    }, config.other.alerttimeout);
}

$(document).ready(function () {

    //create terms of service and privacy policy links
    $('#toslink').attr('href', config.other.tosUrl);
    $('#privacypolicylink').attr('href', config.other.privacyPolicyUrl);
    $('#helplink').attr('href', config.other.helpPageUrl);

    var signed_in_initially = false;

    function handleLogout() {
        firebase.auth().signOut().then(function () {
            // Sign-out successful.
        }).catch(function (error) {
            // An error happened.
            handleError(error);
        });
    }

    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            $("#collapseLoggedInNavbar").removeClass("collapse");
            $("#collapseLoggedOutNavbar").addClass("collapse");
            window.email = user.email;
            window.userId = firebase.auth().currentUser.uid;
            // User is signed in.
            //console.log("signed in");
            var handledLogout = false;
            $("#logoutButton").on('click touchstart', function (e) {
                e.stopImmediatePropagation();
                if (e.type == "touchstart") {
                    handledLogout = true;
                    handleLogout();
                } else if (e.type == "click" && !handledLogout) {
                    handleLogout();
                } else {
                    handledLogout = false;
                }
                return false;
            });
        } else {
            $("#collapseLoggedInNavbar").addClass("collapse");
            $("#collapseLoggedOutNavbar").removeClass("collapse");
            window.email = "";
            window.userId = "";
            // User is signed out.
            //console.log("signed out");
        }
    });

    var submittedFile = false;
    $("#inputFileSubmit").on('click touchstart', function (e) {
        e.stopImmediatePropagation();
        if (e.type == "touchstart") {
            submittedFile = true;
            submitFile();
        } else if (e.type == "click" && !submittedFile) {
            submitFile();
        } else {
            submittedFile = false;
        }
        return false;
    });

    var fileData;

    function getBuffer(resolve) {
        var reader = new FileReader();
        reader.readAsArrayBuffer(fileData);
        reader.onload = function () {
            var arrayBuffer = reader.result;
            // var bytes = new Uint8Array(arrayBuffer);
            // var binaryString = String.fromCharCode.apply(null, bytes);
            resolve(arrayBuffer);
        };
    }

    function submitFile() {
        $("#selectcollapse").addClass("collapse");
        $("#resultimagediv").addClass("collapse");
        $("#loadingimage").removeClass("collapse");
        //window.filename = uuidv4() + ".jpg";
        //console.log("added unique id");
        var input = document.getElementById('fileinput');
        window.originalName = input.value.split("\\").pop();
        //console.log(window.originalName);
        var files = input.files;
        // Pass the file to the blob, not the input[0].
        fileData = new Blob([files[0]]);
        // Pass getBuffer to promise.
        var promise = new Promise(getBuffer);
        // Wait for promise to be resolved, or log error.
        promise.then(function (data) {
            // Here you can pass the bytes to another function.
            //console.log(window.filename);
            //console.log(data);
            createJimpFile(data);
            //console.log("creating filter select");
            createFilterSelect();
            //console.log("creating histogram select");
            createHistogramSelect();
            filterImage([
                [1]
            ]);
        }).catch(function (err) {
            //console.log('Error: ', err);
        });
    }

    function createFilterSelect() {
        //console.log("creating select");
        $('#filterSelect').selectpicker('destroy');
        $('#filterSelect').selectpicker();
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
            $('#filterSelect').selectpicker('mobile');
        }
        $("#filterSelect").selectpicker("val", "");
        $('#filterSelect').selectpicker("refresh");
        $('.filterSelect').on("change", function (elem) {
            $("#nofilterwarning").addClass("collapse");
            // on select update locationSelect variable
            //console.log($(this));
            //console.log("changed value");
            var filterSelect = elem.target.value;
            //console.log("selected " + filterSelect);
            //console.log(filterSelect);
            window.filterSelect = filterSelect;
            if (window.filterSelect == "") {
                $('#nofilterwarning').removeClass("collapse");
            } else {
                $('#nofilterwarning').addClass("collapse");
            }
        });
        $("#addFilter").on('click touchstart', function () {
            //console.log("add filter");
            switch (window.filterSelect) {
                case "grayscale":
                    $('#nofilterwarning').addClass("collapse");
                    //console.log("making it grayscale");
                    convertToGrayscale();
                    updateImageSrc();
                    break;
                case "negative":
                    $('#nofilterwarning').addClass("collapse");
                    console.log("making it negative");
                    convertToNegative();
                    updateImageSrc();
                    break;
                case "histogramequalization":
                    $('#nofilterwarning').addClass("collapse");
                    console.log("making it histogram equalized");
                    histogramequalization();
                    updateImageSrc();
                    break;
                case "smoothing3x3":
                    $('#nofilterwarning').addClass("collapse");
                    //console.log("making it smooth");
                    filterImage(config.filters.smoothing3x3);
                    updateImageSrc();
                    break;
                case "laplacian":
                    $('#nofilterwarning').addClass("collapse");
                    //console.log("making it laplacian");
                    compositeLaplacian(config.filters.laplacian);
                    updateImageSrc();
                    break;
                case "compositelaplacian":
                    $('#nofilterwarning').addClass("collapse");
                    //console.log("making it composite laplacian");
                    filterImage(config.filters.composite);
                    updateImageSrc();
                    break;
                case "pointdetect":
                    $('#nofilterwarning').addClass("collapse");
                    //console.log("making it point detect");
                    filterImage(config.filters.pointdetect);
                    updateImageSrc();
                    break;
                case "horizontallinedetect":
                    $('#nofilterwarning').addClass("collapse");
                    //console.log("making it horizontal line detect");
                    filterImage(config.filters.horizontallinedetect);
                    updateImageSrc();
                    break;
                case "verticallinedetect":
                    $('#nofilterwarning').addClass("collapse");
                    //console.log("making it vertical line detect");
                    filterImage(config.filters.verticallinedetect);
                    updateImageSrc();
                    break;
                case "linedetect45":
                    $('#nofilterwarning').addClass("collapse");
                    //console.log("making it line detect 45");
                    filterImage(config.filters.linedetect45);
                    updateImageSrc();
                    break;
                case "linedetect325":
                    $('#nofilterwarning').addClass("collapse");
                    //console.log("making it line detect -45");
                    filterImage(config.filters.linedetect325);
                    updateImageSrc();
                    break;
            }
        });
        $("#selectcollapse").removeClass("collapse");
    }

    function createHistogramSelect() {
        //console.log("creating histo select");
        $('#histogramSelect').selectpicker('destroy');
        $('#histogramSelect').selectpicker();
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
            $('#histogramSelect').selectpicker('mobile');
        }
        $("#histogramSelect").selectpicker("val", "");
        $('#histogramSelect').selectpicker("refresh");
        $('.histogramSelect').on("change", function (elem) {
            $("#nohistogramwarning").addClass("collapse");
            // on select update histogramselect variable
            //console.log($(this));
            //console.log("changed value");
            var histogramselect = elem.target.value;
            //console.log("selected " + histogramselect);
            //console.log(histogramselect);
            window.histogramselect = histogramselect;
            if (window.histogramselect == "") {
                $('#nohistogramwarning').removeClass("collapse");
            } else {
                $('#nohistogramwarning').addClass("collapse");
            }
        });
        $("#viewHistogram").on('click touchstart', function () {
            //console.log("add histogram");
            switch (window.histogramselect) {
                case "luminance":
                    //console.log("luminance");
                    createHistogramData(window.histogramselect);
                    break;
                case "brightness":
                    //console.log("brightness");
                    createHistogramData(window.histogramselect);
                    break;
                case "perceived_brightness":
                    //console.log("perceived_brightness");
                    createHistogramData(window.histogramselect);
                    break;
                case "red":
                    //console.log("red");
                    createHistogramData(window.histogramselect);
                    break;
                case "green":
                    //console.log("green");
                    createHistogramData(window.histogramselect);
                    break;
                case "blue":
                    //console.log("blue");
                    createHistogramData(window.histogramselect);
                    break;
            }
            if (window.histogramselect == "") {
                $("#histogramcollapse").addClass("collapse");
            } else {
                $("#histogramcollapse").removeClass("collapse");
            }
        });
        $("#histogramselectcollapse").removeClass("collapse");
    }

    function createHistogramData(mode) {
        // https://stackoverflow.com/a/596243
        // luminance = (0.2126*R + 0.7152*G + 0.0722*B)
        luminance = [];
        // brightness = (0.299*R + 0.587*G + 0.114*B)
        brightness = [];
        // perceived brightness = sqrt( 0.299*R^2 + 0.587*G^2 + 0.114*B^2)
        perceived_brightness = [];
        // red histogram
        red = [];
        // green histogram
        green = [];
        // blue histogram
        blue = [];
        //console.log("making data");
        //console.log(mode);
        //console.log(window.width, window.height);
        for (var x = 0; x < window.width; x++) {
            for (var y = 0; y < window.height; y++) {
                var pixelcolor = window.image.getPixelColor(x, y);
                var rgba = Jimp.intToRGBA(pixelcolor);
                switch (mode) {
                    case "luminance":
                        luminance.push(0.2126 * rgba.r + 0.7152 * rgba.g + 0.0722 * rgba.b);
                        break;
                    case "brightness":
                        brightness.push(0.299 * rgba.r + 0.587 * rgba.g + 0.114 * rgba.b);
                        break;
                    case "perceived_brightness":
                        perceived_brightness.push(0.299 * rgba.r + 0.587 * rgba.g + 0.114 * rgba.b);
                        break;
                    case "red":
                        red.push(rgba.r);
                        break;
                    case "green":
                        green.push(rgba.g);
                        break;
                    case "blue":
                        blue.push(rgba.b);
                        break;
                }
            }
        }
        //console.log("got data");
        //console.log(luminance, brightness, perceived_brightness, red, green, blue);
        var customtitle = "";
        var data;
        switch (mode) {
            case "luminance":
                customtitle = "Luminance";
                data = luminance;
                break;
            case "brightness":
                customtitle = "Brightness";
                data = brightness;
                break;
            case "perceived_brightness":
                customtitle = "Perceived Brightness";
                data = perceived_brightness;
                break;
            case "red":
                customtitle = "Red";
                data = red;
                break;
            case "green":
                customtitle = "Green";
                data = green;
                break;
            case "blue":
                customtitle = "Blue";
                data = blue;
                break;
        }
        //console.log(data);
        //console.log("got data and title");
        var myChart = echarts.init(document.getElementById('histogram'));
        //console.log("got div");
        var bins = ecStat.histogram(data);
        //console.log("added data to ecStat");
        var option = {
            title: {
                text: customtitle,
                left: 'center',
                top: 20
            },
            color: ['rgb(25, 183, 207)'],
            grid: {
                left: '3%',
                right: '3%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: [{
                type: 'value',
                scale: true
            }],
            yAxis: [{
                type: 'value'
            }],
            series: [{
                name: 'height',
                type: 'bar',
                barWidth: '99.3%',
                label: {
                    normal: {
                        show: true,
                        position: 'insideTop',
                        formatter: function (params) {
                            return params.value[1];
                        }
                    }
                },
                data: bins.data
            }]
        };
        //console.log("create histogram");
        myChart.setOption(option);
    }

    function convertToNegative() {
        for (var x = 0; x < window.width; x++) {
            for (var y = 0; y < window.height; y++) {
                var pixelcolor = window.image.getPixelColor(x, y);
                var rgba = Jimp.intToRGBA(pixelcolor);
                var newred = 255 - rgba.r;
                var newgreen = 255 - rgba.g;
                var newblue = 255 - rgba.b;
                var hexval = Jimp.rgbaToInt(newred, newgreen, newblue, 255);
                window.image.setPixelColor(hexval, x, y);
            }
        }
        console.log("finished");
    }

    function convertToGrayscale() {
        var grayscaleconstants = config.filters.imagegrayscaleconstants;
        //console.log(grayscaleconstants);

        for (var x = 0; x < window.width; x++) {
            for (var y = 0; y < window.height; y++) {
                var pixelcolor = window.image.getPixelColor(x, y);
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
                window.image.setPixelColor(hexval, x, y);
            }
        }
        //console.log("finished");
    }

    function histogramequalization() {
        // work on this more to get the actual rgba values...
        var num_pixel_vals = 256;
        var histogram_red = new Array(num_pixel_vals); // histogram counter
        var histogram_green = new Array(num_pixel_vals);
        var histogram_blue = new Array(num_pixel_vals);
        var equalization_map_red = new Array(num_pixel_vals); // equalization mapping
        var equalization_map_green = new Array(num_pixel_vals);
        var equalization_map_blue = new Array(num_pixel_vals);
        var one_pixel = 1.0 / (window.width * window.height);
        // console.log(one_pixel);
        var max_pixel_val = 255;

        for (var i = 0; i < num_pixel_vals; i++) {
            histogram_red[i] = 0.0;
            histogram_green[i] = 0.0;
            histogram_blue[i] = 0.0;
            equalization_map_red[i] = 0.0;
            equalization_map_green[i] = 0.0;
            equalization_map_blue[i] = 0.0;
        }

        // console.log(histogram_red);

        for (var x = 0; x < window.width; x++)
            for (var y = 0; y < window.height; y++) {
                var pixelcolor = window.image.getPixelColor(x, y);
                var rgba = Jimp.intToRGBA(pixelcolor);
                histogram_red[rgba.r] += one_pixel;
                histogram_green[rgba.g] += one_pixel;
                histogram_blue[rgba.b] += one_pixel;
            }

        // console.log(histogram_red);

        for (var i = 0; i < num_pixel_vals; i++) {
            for (var j = 0; j < i + 1; j++) {
                equalization_map_red[i] += histogram_red[j];
                equalization_map_green[i] += histogram_green[j];
                equalization_map_blue[i] += histogram_blue[j];
            }
            equalization_map_red[i] = Math.floor(equalization_map_red[i] * max_pixel_val);
            equalization_map_green[i] = Math.floor(equalization_map_green[i] * max_pixel_val);
            equalization_map_blue[i] = Math.floor(equalization_map_blue[i] * max_pixel_val);
        }

        // console.log(histogram_red);
        // console.log(equalization_map_red);

        for (var x = 0; x < window.width; x++)
            for (var y = 0; y < window.height; y++) {
                var pixelcolor = window.image.getPixelColor(x, y);
                var rgba = Jimp.intToRGBA(pixelcolor);
                var hexval = Jimp.rgbaToInt(equalization_map_red[rgba.r], equalization_map_green[rgba.g], equalization_map_blue[rgba.b], 255);
                window.image.setPixelColor(hexval, x, y);
            }
    }

    function filterImage(filter) {

        // filter for red, green and blue

        var newimage = window.image.clone();

        for (var x = 0; x < window.width; x++)
            for (var y = 0; y < window.height; y++)
                if (!(x == 0 || x == width - 1 || y == 0 || y == height - 1)) {
                    var sums = [0, 0, 0];
                    for (var i = 0; i < filter.length; i++)
                        for (var j = 0; j < filter[i].length; j++) {
                            var pixelcolor = window.image.getPixelColor(x + i - 1, y + j - 1);
                            var rgba = Jimp.intToRGBA(pixelcolor);
                            sums[0] += rgba.r * filter[i][j];
                            sums[1] += rgba.g * filter[i][j];
                            sums[2] += rgba.b * filter[i][j];
                        }
                    for (i = 0; i < sums.length; i++) {
                        if (sums[i] > 255)
                            sums[i] = 255;
                        if (sums[i] < 0)
                            sums[i] = 0;
                    }
                    var hexval = Jimp.rgbaToInt(sums[0], sums[1], sums[2], 255);
                    newimage.setPixelColor(hexval, x, y);
                }
        window.image = newimage;
        //console.log("finished.");
    }

    function compositeLaplacian(filter) {
        var original = window.image.clone();
        filterImage(filter);
        for (var x = 0; x < window.width; x++)
            for (var y = 0; y < window.height; y++) {
                var originalpixelcolor = original.getPixelColor(x, y);
                var rgbaorig = Jimp.intToRGBA(originalpixelcolor);
                var transformedpixelcolor = window.image.getPixelColor(x, y);
                var rgbatrans = Jimp.intToRGBA(transformedpixelcolor);
                var sums = [0, 0, 0];
                sums[0] = rgbatrans.r + rgbaorig.r;
                sums[1] = rgbatrans.g + rgbaorig.g;
                sums[2] = rgbatrans.b + rgbaorig.b;
                for (var i = 0; i < sums.length; i++) {
                    if (sums[i] > 255)
                        sums[i] = 255;
                    else if (sums[i] < 0)
                        sums[i] = 0;
                }
                var hexval = Jimp.rgbaToInt(sums[0], sums[1], sums[2], 255);
                window.image.setPixelColor(hexval, x, y);
            }
    }

    function createJimpFile(file) {
        Jimp.read(file, function (err, image) {
            if (err) {
                //console.log(err);
                handleError(err);
            } else {
                //console.log("getting image");
                window.image = image;
                window.width = image.bitmap.width;
                window.height = image.bitmap.height;
                //console.log(image.bitmap.data);
                //console.log("done with jimp stuff");
                updateImageSrc();
            }
        });
    }

    function updateImageSrc() {
        window.image.getBase64(Jimp.MIME_JPEG, function (err, src) {
            if (err) {
                //console.log(err.message);
                handleError(err);
            }
            //console.log("got base64");
            $("#loadingimage").addClass("collapse");
            //console.log(src);
            $("#resultimage").attr("src", src);
            //console.log("added src");
            $("#resultimagediv").removeClass("collapse");
            //console.log("updated.");
        });
    }

    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
});