var Q = require('q');
var exceptions = require('./exceptions.js');
var https = require('https');

var BoxClient = function(boxAccessToken, log) {
  this.accessToken = boxAccessToken;

  this.get = function(apiEndpoint) {
    this.request(apiEndpoint, 'GET');
  }

  this.post = function(apiEndpoint) {
    this.request(apiEndpoint, 'POST');
  }
  
  this.request = function(apiEndpoint, httpMethod) {
    var requestSettings = {
      host: 'https://api.box.com',
      port: 443,
      path: '/2.0' + apiEndpoint,
      method: httpMethod,
      headers: {
        authorization: "Bearer " + this.accessToken
      }
    }
    var deferred = Q.defer();
    log.info("Making Box API", requestSettings);
    var boxRequest = https.request(requestSettings, function(res) {
      res.setEncoding('utf8');
      var responseData = '';
      res.on('data', function(dataChunk) {
        responseData += dataChunk;
      });
      res.on('end', function() {
        responseDataDict = null;
        if (responseData) {
          try {
            responseDataDict = JSON.parse(responseData);
          } catch(error) {
            console.log(responseData);
            console.log(error);
            throw exceptions.BadGateway("Expected the Box API <" + httpMethod + " " + apiEndpoint + "> to return JSON encoded data.");
          }
        }
        deferred.resolve(responseDataDict);
      });
    });
    boxRequest.on('error', function(error) {
      var msg = 'There was a problem interacting with a Box API';
      log.error(msg, {
        boxApi: httpMethod + ' ' + apiEndpoint,
        err: error
      });
      throw exceptions.BadGateway(msg);
    });
    boxRequest.end();
    return deferred.promise;
  }
}

module.exports = BoxClient;
