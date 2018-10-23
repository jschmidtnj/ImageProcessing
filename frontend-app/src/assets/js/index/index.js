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
firebase.initializeApp(config.firebase);

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

    var submittedFile = false;
    $("#inputFileSubmit").on('click touchstart', function (e) {
        e.stopImmediatePropagation();
        if (e.type == "touchstart") {
            submittedFile = true;
            submitFile();
        }
        else if (e.type == "click" && !submittedFile) {
            submitFile();
        }
        else {
            submittedFile = false;
        }
        return false;
    });

    function submitFile() {
        var docelem = document.getElementById("fileinput");
        var file = docelem.files[0];
        console.log(file);
        $("#resultimagediv").addClass("collapse");
        $("#loadingimage").removeClass("collapse");
        var uniqueid = uuidv4();
        console.log("added unique id");
        console.log(uniqueid);
        var metadata = {
            contentType: 'image/jpeg',
        };
        var storageRef = firebase.storage().ref();
        var uploadTask = storageRef.child("images/" + uniqueid + ".jpg").put(file, metadata);
        // Register three observers:
        // 1. 'state_changed' observer, called any time the state changes
        // 2. Error observer, called on failure
        // 3. Completion observer, called on successful completion
        console.log("uploading");
        uploadTask.on('state_changed', function (snapshot) {
            console.log("starting progress report");
            // Observe state change events such as progress, pause, and resume
            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
            var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
            switch (snapshot.state) {
                case firebase.storage.TaskState.PAUSED: // or 'paused'
                    console.log('Upload is paused');
                    break;
                case firebase.storage.TaskState.RUNNING: // or 'running'
                    console.log('Upload is running');
                    break;
            }
        }, function (error) {
            // Handle unsuccessful uploads
            console.log(error);
        }, function () {
            console.log("uploaded");
            // Handle successful uploads on complete
            // For instance, get the download URL: https://firebasestorage.googleapis.com/...
            uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
                console.log('File available at', downloadURL);
                var getfile = firebase.functions().httpsCallable('facedetect');
                getfile({
                    url: downloadURL,
                    outputname: uniqueid
                }).then(function (result) {
                    // Read result of the Cloud Function.
                    //console.log(result);
                    console.log("getting image");
                    firebase.storage().ref("outputimages/" + uniqueid + ".jpg").getDownloadURL().then(function (imagesrc) {
                        console.log("getting final image");
                        console.log(imagesrc);
                        $("#resultimage").attr('src', imagesrc);
                        $("#loadingimage").addClass("collapse");
                        $("#resultimagediv").removeClass("collapse");
                    }).catch(function (err) {
                        handleError(err);
                    });
                }).catch(function (error) {
                    // Getting the Error details.
                    //console.log(error);
                    handleError(error);
                });
            });
        });
    }

    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
});
