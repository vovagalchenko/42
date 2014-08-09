function APIException(statusCode, apiErrorMessage) {
    this.statusCode = statusCode;
    this.apiErrorMessage = apiErrorMessage;
}

exports.ServerError = function(apiErrorMessage) {
    return new APIException(500, apiErrorMessage);
}

var util = require('util');

exports.BadRequest = function(httpMethod, urlString, badRequestMessage) {
    return new APIException(400, util.format("%s %s: %s", httpMethod, urlString, badRequestMessage));
}