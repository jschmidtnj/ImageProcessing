var jQuery = require('jquery');
//require('jquery.easing');
require("popper.js");
require("bootstrap");
window.$ = window.jQuery = jQuery;

var config = require('../../../config/config.json');

$(document).ready(function () {

    //create terms of service and privacy policy links
    $('#toslink').attr('href', config.other.tosUrl);
    $('#privacypolicylink').attr('href', config.other.privacyPolicyUrl);
    $('#helplink').attr('href', config.other.helpPageUrl);

});
