function APIException(statusCode, apiErrorMessage, troubleshootingData) {
  this.statusCode = statusCode;
  this.apiErrorMessage = apiErrorMessage;
  this.troubleshootingData = troubleshootingData;
}
APIException.prototype = new Error;

exports.ServerError = function(apiErrorMessage) {
  return new APIException(500, apiErrorMessage);
}

var util = require('util');

exports.BadRequest = function(httpMethod, urlString, badRequestMessage) {
  return new APIException(400, util.format("%s %s: %s", httpMethod, urlString, badRequestMessage));
}

exports.BodyTooLarge = function() {
  return new APIException(413, "The HTTP body you're attempting to send is too large.");
}

exports.UnprocessableEntity = function(apiErrorMessage, troubleshootingData) {
  return new APIException(422, apiErrorMessage, troubleshootingData);
}

exports.BadGateway = function(apiErrorMessage) {
  return new APIException(502, apiErrorMessage);
}

exports.AuthenticationFailure = function(apiErrorMessage) {
  return new APIException(401, apiErrorMessage);
}

exports.Forbidden = function(apiErrorMessage) {
  return new APIException(403, apiErrorMessage);
}

exports.NotFound = function(apiErrorMessage) {
  return new APIException(404, apiErrorMessage);
}
