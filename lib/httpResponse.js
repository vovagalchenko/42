function HTTPResponse(statusCode, headers, bodyDict, request) {
  this.statusCode = statusCode;
  this.contentType = "application/json";
  this.headers = headers;
  this.bodyDict = bodyDict;
  this.processingTime = (Date.now() - request.startTime)/1000.0;
  this.requestId = request.requestId;

  this.getRawBody = function() {
    return JSON.stringify(bodyDict);
  }
}

function HTTPResponseFactory(request) {
  this.request = request;

  this.create = function(statusCode, headers, bodyDict) {
    return new HTTPResponse(statusCode, headers, bodyDict, request);
  }

  this.success = function(bodyDict) {
    return this.create(200, {}, bodyDict);
  }
}

module.exports = HTTPResponseFactory;
