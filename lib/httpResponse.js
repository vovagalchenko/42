function HTTPResponse(statusCode, headers, bodyDict, request) {
  this.statusCode = statusCode;
  this.contentType = "application/json";
  this.headers = headers;
  this.bodyDict = bodyDict;
  this.processingTime = (Date.now() - request.startTime)/1000.0;
  this.requestId = request.requestId;

  this.getRawBody = function() {
    if (this.bodyDict) {
      return JSON.stringify(this.bodyDict);
    } else {
      return '';
    }
  }

  this.addKeyValue = function(key, value) {
    if (this.statusCode === 204) {
      this.statusCode = 200;
    }
    if (!this.bodyDict) {
      this.bodyDict = {};
    }
    this.bodyDict[key] = value;
  }
}

function HTTPResponseFactory(request) {
  this.request = request;

  this.createResponse = function(statusCode, headers, bodyDict) {
    return new HTTPResponse(statusCode, headers, bodyDict, request);
  }

  this.ok = function(bodyDict) {
    return this.createResponse(200, {}, bodyDict);
  }

  this.created = function(bodyDict) {
    return this.createResponse(201, {}, bodyDict);
  }

  this.noContent = function() {
    return this.createResponse(204, {}, null);
  }
}

module.exports = HTTPResponseFactory;
