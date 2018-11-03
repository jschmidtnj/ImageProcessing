var jQuery = require('jquery');
//require('jquery.easing');
require("popper.js");
require("bootstrap");
window.$ = window.jQuery = jQuery;

var config = require('../../../config/config.json');

var firebase = require("firebase/app");
require("firebase/database");
require("firebase/storage");
require("firebase/functions");
require("firebase/auth");
firebase.initializeApp(config.firebase);

//get Jimp
var Jimp = require("jimp");

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
        $("#resultimagediv").addClass("collapse");
        $("#loadingimage").removeClass("collapse");
        //window.filename = uuidv4() + ".jpg";
        //console.log("added unique id");
        var input = document.getElementById('fileinput');
        window.originalName = input.value.split("\\").pop();
        // console.log(window.originalName);
        var files = input.files;
        // Pass the file to the blob, not the input[0].
        fileData = new Blob([files[0]]);
        // Pass getBuffer to promise.
        var promise = new Promise(getBuffer);
        // Wait for promise to be resolved, or log error.
        promise.then(function (data) {
            // Here you can pass the bytes to another function.
            // console.log(window.filename);
            // console.log(data);
            createJimpFile(data);
        }).catch(function (err) {
            console.log('Error: ', err);
        });
    }

    function createJimpFile(file) {
        Jimp.read(file, function (err, image) {
            if (err) {
                // console.log(err);
                handleError(err);
            } else {
                //console.log("getting image");
                window.theimage = image;
                window.width = image.bitmap.width;
                window.height = image.bitmap.height;
                //console.log(image.bitmap.data);
                //console.log("done with jimp stuff");
                updateImageSrc();
            }
        });
    }

    function updateImageSrc() {
        window.theimage.getBase64(Jimp.MIME_JPEG, function (err, src) {
            if (err) {
                // console.log(err.message);
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