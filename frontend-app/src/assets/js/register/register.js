var jQuery = require('jquery');
require('jquery-validation');
require("popper.js");
require("bootstrap");
var $script = require('scriptjs');
window.$ = window.jQuery = jQuery;

$script.path('assets/js/');
$script('global/loginCSSHelper.js');

var config = require('../../../config/config.json');

var firebase = require("firebase/app");
require("firebase/auth");
require("firebase/database");
require("firebase/functions");

firebase.initializeApp(config.firebase);

var provider = new firebase.auth.GoogleAuthProvider();
firebase.auth().useDeviceLanguage();

function handleError(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    //console.log(errorCode, errorMessage);
    var customMessage = "";
    if (errorMessage !== "" && errorMessage !== undefined && errorMessage !== null) {
        customMessage = errorMessage;
    }
    if (errorCode == "auth/email-already-in-use") {
        customMessage = "Email already in use";
    } else if (errorCode == "auth/bad-email-user") {
        customMessage = "Email address not permitted";
    }
    if (error.code !== "" && error.message !== "") {
        if (customMessage !== "") {
            $('#error-info').text(customMessage);
        } else {
            $('#error-info').text("Error: " + errorMessage + " Code: " + errorCode);
        }
    } else {
        $('#error-info').text("No Error code found.");
    }
    $('#alertregistrationfailure').fadeIn();
    setTimeout(function () {
        $('#alertregistrationfailure').fadeOut();
    }, config.other.alerttimeout);
}

$(document).ready(function () {

    $('#toslink').attr('href', config.other.tosUrl);
    $('#privacypolicylink').attr('href', config.other.privacyPolicyUrl);

    $.validator.addMethod(
        "regex1",
        function (value, element, regexp) {
            var re = new RegExp(regexp, 'i');
            return this.optional(element) || re.test(value);
        },
        ""
    );

    $.validator.addMethod(
        "regex2",
        function (value, element, regexp) {
            var re = new RegExp(regexp, 'i');
            return this.optional(element) || re.test(value);
        },
        ""
    );

    $.validator.addMethod(
        "regex3",
        function (value, element, regexp) {
            var re = new RegExp(regexp, 'i');
            return this.optional(element) || re.test(value);
        },
        ""
    );

    //create terms of service and privacy policy links
    $('#toslink').attr('href', config.other.tosUrl);
    $('#privacypolicylink').attr('href', config.other.privacyPolicyUrl);
    $('#helplink').attr('href', config.other.helpPageUrl);

    function addUser(formData) {
        var email = formData[0].value.toString();
        var userName = email.split("@")[0];
        firebase.auth().createUserWithEmailAndPassword(email, formData[1].value).then(function () {
            //save data to database
            var user = firebase.auth().currentUser;
            user.updateProfile({
                displayName: userName,
                email: email
            }).then(function () {
                // Update successful.
                var userId = user.uid;
                firebase.database().ref('users/' + userId).set({
                    username: userName,
                    email: email,
                    signintype: "email"
                }).then(function () {
                    user.sendEmailVerification().then(function () {
                        // Email sent.
                        //console.log("successfully registered!")
                        firebase.auth().signOut().then(function () {
                            //console.log('Signed Out');
                            $('#alertsuccessregistered').fadeIn();
                            setTimeout(function () {
                                $('#alertsuccessregistered').fadeOut();
                                setTimeout(function () {
                                    //console.log("redirecting to login")
                                    window.location.href = 'login.html';
                                }, config.other.redirecttimeout);
                            }, config.other.alerttimeout);
                        }).catch(function (error) {
                            //console.error('Sign Out Error', error);
                            handleError(error);
                        });
                    }).catch(function (error) {
                        // An error happened.
                        handleError(error);
                    });
                }).catch(function (error) {
                    console.log(error);
                    user.delete().then(function () {
                        firebase.auth().signOut().then(function () {
                            //console.log('Signed Out');
                            handleError({
                                code: "auth/bad-email-user",
                                message: "Email not permitted"
                            });
                        }, function (error) {
                            //console.error('Sign Out Error', error);
                            handleError(error);
                        });
                    }, function (error) {
                        //console.error('Sign Out Error', error);
                        handleError(error);
                    });
                });
            }).catch(function (error) {
                // An error happened.
                handleError(error);
            });
        }).catch(function (error) {
            handleError(error);
        });
    }

    function validateForm() {
        $("#registerForm").validate({
            rules: {
                password: {
                    required: true,
                    minlength: 6,
                    maxlength: 15,
                    regex1: config.regex.passwordcontainsletter,
                    regex2: config.regex.passwordcontainsnumber,
                    regex3: config.regex.passwordcontainsspecialcharacter
                },
                confirm_password: {
                    required: true,
                    equalTo: "#password"
                },
                email: {
                    required: true,
                    regex1: config.regex.validemail
                },
                agree: "required"
            },
            messages: {
                password: {
                    required: "Please provide a password",
                    minlength: "Your password must be at least 6 characters long",
                    maxlength: "Your password cannot exceed 15 characters",
                    regex1: "Your password must contain at least one alpha-numerical character",
                    regex2: "Your password must contain at least one digit (0-9)",
                    regex3: "Your password must contain at least one special character (!@#$%^&*)"
                },
                confirm_password: {
                    required: "Please provide a password",
                    equalTo: "Please enter the same password as above"
                },
                email: "Please enter a valid email address",
                agree: "Please accept our privacy polity"
            },
            errorElement: "div",
            errorPlacement: function (error, element) {
                // Add the `invalid-feedback` class to the div element
                error.addClass("invalid-feedback");
    
                if (element.prop("type") === "checkbox") {
                    error.insertAfter(element.parent("label"));
                } else {
                    error.insertAfter(element);
                }
            },
            highlight: function (element) {
                $(element).addClass("is-invalid").removeClass("is-valid");
            },
            unhighlight: function (element) {
                $(element).addClass("is-valid").removeClass("is-invalid");
            }
        });
    }

    var submittedData = false;

    $("#submitData").on('click touchstart', function (e) {
        e.stopImmediatePropagation();
        if(e.type == "touchstart") {
            submittedData = true;
            submitDataHandle();
        }
        else if(e.type == "click" && !submittedData) {
            submitDataHandle();
        }
        else {
            submittedData = false;
        }
        return false;
    });

    function submitDataHandle() {
        if ($("#registerForm").valid()) {
            var formData = $("#registerForm").serializeArray();
            addUser(formData);
        } else {
            console.log("form invalid");
        }
    }

    var expandedForm = 0; //collapsed = 0
    var handledEmail = false;

    $("#registerEmail").on('click touchstart', function (e) {
        e.stopImmediatePropagation();
        if(e.type == "touchstart") {
            handledEmail = true;
            toggleEmail();
        }
        else if(e.type == "click" && !handledEmail) {
            toggleEmail();
        }
        else {
            handledEmail = false;
        }
        return false;
    });

    function toggleEmail() {
        if (expandedForm == 1) { //if it is mode 1 collapse
            $("#expandForm").addClass("collapse");
            expandedForm = 0;
        } else {
            $("#expandForm").removeClass("collapse");
            expandedForm = 1;
        }
        validateForm();
    }
});