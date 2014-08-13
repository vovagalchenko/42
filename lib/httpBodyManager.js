var exceptions = require('./exceptions.js');

function HTTPBodyManager(request, log) {
  this.withJSONHttpBody = function(closure) {
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
      closure(httpBodyDict);
    });
  }
}

module.exports = HTTPBodyManager;
