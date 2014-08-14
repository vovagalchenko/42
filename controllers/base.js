var Q = require('q');
var exceptions = require('../lib/exceptions.js');
var BoxClient = require('../lib/boxClient.js');

var BaseController = function(resourceId, log) {
  this.resourceId = resourceId;
  this.log = log;

  this.needsAuthentication = true;

  this.execute = function(httpBodyManager, queryDictionary, responseFactory, completion) {
    var controller = this;
    return Q.all([
      httpBodyManager.retrieveHttpBody().then(function(bodyDictionary) {
        var params = queryDictionary;
        for (var key in bodyDictionary) {
          params[key] = bodyDictionary[key];
        }
        return params;
      }),
      controller.authenticate(responseFactory.request),
    ]).spread(function(params, authenticatedUser) {
      return controller.run(params, authenticatedUser, responseFactory);
    });
  }

  this.authenticate = function(request) {
    if (!this.needsAuthentication) {
      return null;
    }
    
    var accessToken = request.headers.authorization;
    if (!accessToken) {
      throw exceptions.AuthenticationFailure('Authentication is required for this call. Please pass in the access token in the Authorization header');
    }
    var boxClient = new BoxClient(request.headers.authorization, log);
    return boxClient.get('/users/me');
  }
}

module.exports = BaseController;
