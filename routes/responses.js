/**
 * Created by harsh on 12/3/14.
 */

var logging = require('./logging');


exports.parameterMissingResponse = function (res) {
    var response = {
        "message": constants.responseMessages.PARAMETER_MISSING,
        "data" : {}
    };
    res.status(constants.responseFlags.PARAMETER_MISSING).json(response);
};

exports.authenticationErrorResponse = function (res){
    var response = {
        "message": constants.responseMessages.INVALID_ACCESS_TOKEN,
        "data" : {}
    };
    res.status(constants.responseFlags.INVALID_ACCESS_TOKEN).json(response);
};

exports.sendError = function (res) {
    var response = {
        "message": constants.responseMessages.ERROR_IN_EXECUTION,
        "data" : {}
    };
    res.status(constants.responseFlags.ERROR_IN_EXECUTION).json(response);
};