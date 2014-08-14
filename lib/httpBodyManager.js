var exceptions = require('./exceptions.js');
var Q = require('q');

function HTTPBodyManager(request, log) {
  this.retrieveHttpBody = function() {
    var deferred = Q.defer();
    var httpBody = '';
    
    request.on('data', function(data) {
      httpBody += data;

      // No reason to accept JSON http body larger than 1 MB
      if (httpBody.length > (1 << 20)) {
        throw exceptions.BodyTooLarge();
      }
    });
    request.on('end', function() {
      var httpBodyDict = {};
      if (httpBody) {
        try {
          httpBodyDict = JSON.parse(httpBody);
        } catch(error) {
          throw exceptions.BadRequest(request.method, request.url, "HTTP body for this request should be JSON-encoded.");
        }
      }
      deferred.resolve(httpBody);
    });
    return deferred.promise;
  }
}

module.exports = HTTPBodyManager;
