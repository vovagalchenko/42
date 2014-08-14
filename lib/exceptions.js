function APIException(statusCode, apiErrorMessage) {
  this.statusCode = statusCode;
  this.apiErrorMessage = apiErrorMessage;
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

exports.UnprocessableEntity = function(apiErrorMessage) {
  return new APIException(422, apiErrorMessage);
}

exports.BadGateway = function(apiErrorMessage) {
  return new APIException(502, apiErrorMessage);
}

exports.AuthenticationFailure = function(apiErrorMessage) {
  return new APIException(401, apiErrorMessage);
}
