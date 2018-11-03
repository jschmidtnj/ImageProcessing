var jQuery = require("jquery");
require('jquery-validation');
require("popper.js");
require("bootstrap");
window.$ = window.jQuery = jQuery;

var firebase = require("firebase/app");
require("firebase/auth");
require("firebase/database");
var config = require('../../../config/config.json');
firebase.initializeApp(config.firebase);

function handleError(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    //console.log(errorCode, errorMessage);
    var customMessage = "";
    if (errorCode == "auth/notsignedin") {
        customMessage = errorMessage;
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
    $('#alertsignoutfailure').fadeIn();
    setTimeout(function () {
        $('#alertsignoutfailure').fadeOut();
    }, config.other.alerttimeout);
}


function getInitialValues() {
    firebase.database().ref('users/' + window.userId).once('value').then(function (userData) {
        var userDataVal = userData.val();
        //console.log(userDataVal);
        var name = userDataVal.name;
        $("#fullname").val(name);
        //var username = userDataVal.username;
        //$("#username").val(username);
    }).catch(function (err) {
        handleError(err);
    });
}

$(document).ready(function () {

    $('#toslink').attr('href', config.other.tosUrl);
    $('#privacypolicylink').attr('href', config.other.privacyPolicyUrl);
    $('#helplink').attr('href', config.other.helpPageUrl);

    var signed_in_initially = false;
    function signoutComplete() {
        firebase.auth().signOut().then(function () {
            // Sign-out successful.
        }).catch(function (error) {
            // An error happened.
            handleError(error);
        });
    }
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            window.email = user.email;
            window.userId = firebase.auth().currentUser.uid;
            // User is signed in.
            //console.log("signed in");
            signed_in_initially = true;
            var handledLogout = false;
            $(".logoutButton").on('click touchstart', function (e) {
                e.stopImmediatePropagation();
                if (e.type == "touchstart") {
                    handledLogout = true;
                    signoutComplete();
                }
                else if (e.type == "click" && !handledLogout) {
                    signoutComplete();
                }
                else {
                    handledLogout = false;
                }
                return false;
            });
            $("#email").text(window.email);
            $("#bodycollapse").removeClass("collapse");
            getInitialValues();
            //console.log(window.userstatus);
            //console.log(window.userId);
            firebase.database().ref('users/' + window.userId).once('value').then(function (userData) {
                //console.log("getting user data");
                var signintype = userData.val().signintype;
                //console.log(signintype);
                $("#changePasswordCollapse").removeClass("collapse");
            }).catch(function (err) {
                handleError(err);
            });
        } else {
            // No user is signed in. redirect to login page:
            if (signed_in_initially) {
                $('#alertsignoutsuccess').fadeIn();
                setTimeout(function () {
                    $('#alertsignoutsuccess').fadeOut();
                    //console.log("redirecting to login page");
                    setTimeout(function () {
                        window.location.href = 'login.html';
                    }, config.other.redirecttimeout);
                }, config.other.alerttimeout);
            } else {
                //slow redirect
                handleError({
                    code: "auth/notsignedin",
                    message: "Not Signed in. Redirecting."
                });
                //console.log("redirecting to login page");
                setTimeout(function () {
                    window.location.href = 'login.html';
                }, config.other.redirecttimeout);
                //fast redirect
                // window.location.href = 'login.html';
            }
        }
    });

    function changePasswordSub() {
        if ($("#changePassword").valid()) {
            var user = firebase.auth().currentUser;
            var formdata = $("#changePassword").serializeArray();
            var newPass = formdata[0].value.toString();
            user.updatePassword(newPass).then(function () {
                // Update successful.
                //console.log("update success");
                $('#alertpasswordchangesuccess').fadeIn();
                setTimeout(function () {
                    $('#alertpasswordchangesuccess').fadeOut();
                }, config.other.alerttimeout);
            }).catch(function (error) {
                // An error happened.
                handleError(error);
            });
        }
    }

    $("#deleteAccount").on('click touchstart', function () {
        var started = false;
        $('#alertconfirmdeleteaccount').fadeIn();

        $("#cancelDeleteAccount").on('click touchstart', function () {
            if (!started) {
                $('#alertconfirmdeleteaccount').fadeOut();
                started = true;
            }
            return false;
        });

        $("#confirmDeleteAccount").on('click touchstart', function () {
            if (!started) {
                var user = firebase.auth().currentUser;
                firebase.database().ref('users/' + window.userId).remove().catch(function (err) {
                    handleError(err);
                }).then(function () {
                    user.delete().then(function () {
                        // User deleted.
                        //console.log("user deleted");
                        window.location.href = "login.html";
                    }).catch(function (error) {
                        // An error happened.
                        handleError(error);
                    });
                });
            }
            return false;
        });
        return false;
    });

    var changedPassword = false;
    $("#changePasswordSubmit").on('click touchstart', function (e) {
        e.stopImmediatePropagation();
        if(e.type == "touchstart") {
            changedPassword = true;
            changePasswordSub();
        }
        else if(e.type == "click" && !changedPassword) {
            changePasswordSub();
        }
        else {
            changedPassword = false;
        }
        return false;
    });

    $("#confirm_password").keypress(function (event) {
        if (event.which == '13') {
            event.preventDefault();
            changePasswordSub();
        }
    });

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

    $("#changePassword").validate({
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
            }
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
            }
        },
        errorElement: "div",
        errorPlacement: function (error, element) {
            // Add the `invalid-feedback` class to the div element
            error.addClass("invalid-feedback");
            error.insertAfter(element);
        },
        highlight: function (element) {
            $(element).addClass("is-invalid").removeClass("is-valid");
        },
        unhighlight: function (element) {
            $(element).addClass("is-valid").removeClass("is-invalid");
        }
    });
});