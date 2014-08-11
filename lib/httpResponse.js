function HTTPResponse(statusCode, headers, bodyDict, request) {
  this.statusCode = statusCode;
  this.contentType = "application/json";
  this.headers = headers;
  this.bodyDict = bodyDict;
  this.processingTime = (Date.now() - request.startTime)/1000.0;
  this.requestId = request.requestId;

  var rawBody = JSON.stringify(bodyDict);
  this.getRawBody = function() {
    return rawBody;
  }
}

module.exports = HTTPResponse;
