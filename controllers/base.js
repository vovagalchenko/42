var Q = require('q');
var exceptions = require('../lib/exceptions.js');
var BoxClient = require('../lib/boxClient.js');
var AuthCredentials = require('../models/authCredentials.js');
var User = require('../models/user.js');
var modelManager = require('../models/modelManager.js');

function authCredentialsValid(authCred)
{
  var msBeforeTokenRefresh = (10*60*1000); // We'll check the credentials with Box every 10 minutes
  return  !!authCred
          && (new Date() - authCred.get('updated_at')) < msBeforeTokenRefresh;
}

function isEmpty(dict) {
    for (var prop in dict) if (dict.hasOwnProperty(prop)) return false;
    return true;
};

var BaseController = function(resourceId, log) {
  this.log = log;
  this.unusedParams = {};

  this.resourceId = resourceId;
  this.needsAuthentication = true;

  this.execute = function(httpBodyManager, queryDictionary, responseFactory, completion) {
    var controller = this;
    return Q.all([
      httpBodyManager.retrieveHttpBody().then(function(bodyDictionary) {
        var params = queryDictionary;
        for (var key in bodyDictionary) {
          params[key] = bodyDictionary[key];
        }
        var unusedParams = params;
        var missingParams = {};
        for (var propertyName in controller) {
          if (controller[propertyName] && controller[propertyName]['extract']) {
            var parameterDefinition = controller[propertyName];
            var required = parameterDefinition.required;
            var paramName = parameterDefinition.getApiAlias() || propertyName;
            var extractedValue = parameterDefinition.extract(params[paramName]);
            if (typeof extractedValue !== 'undefined') {
              controller[propertyName] = extractedValue;
              delete unusedParams[paramName];
            } else if (required && typeof extractedValue === 'undefined') {
              missingParams[paramName] = {
                type: parameterDefinition.type,
              }
              if (parameterDefinition.getDescription()) {
                missingParams[paramName]['description'] = parameterDefinition.getDescription();
              }
            }
          }
        }
        if (!isEmpty(missingParams)) {
          throw exceptions.UnprocessableEntity("You are missing parameters that are required for this call", { 'missing_parameters': missingParams });
        }
        this.unusedParams = unusedParams;
        return params;
      }),
      controller._authenticate(responseFactory.request),
    ]).spread(function(params, authenticatedUser) {
      return controller.run(authenticatedUser, responseFactory);
    }).then(function(response) {
      if (!isEmpty(this.unusedParams)) {
        response.addKeyValue('unused_parameters', this.unusedParams); 
      }
      return response;
    });
  }

  this._authenticate = function(request) {
    if (!this.needsAuthentication) {
      return null;
    }
    
    var accessToken = request.headers.authorization;
    if (!accessToken) {
      throw exceptions.AuthenticationFailure('Authentication is required for this call. Please pass in the access token in the Authorization header');
    }
    return new AuthCredentials({ 'access_token' : accessToken })
      .fetch({ withRelated: ['user'] })
      .then(function(existingAuthCredentials) {
        if (authCredentialsValid(existingAuthCredentials)) {
          return existingAuthCredentials.related('user');
        } else {
          var boxClient = new BoxClient(request.headers.authorization, log);
          return boxClient.get('/users/me?fields=name,login,avatar_url,enterprise').then(function(responseDict) {
            if (!responseDict || !responseDict['id']) {
              throw exceptions.AuthenticationFailure("You've passed in an invalid access token.");
            }
            return Q.all([
              new User({ 'box_user_id' : responseDict['id'] }).fetch()
                .then(function(loggedInUser) {
                  return modelManager.saveModel(loggedInUser, {
                    'box_user_id' : responseDict['id'],
                    'name' : responseDict['name'],
                    'email' : responseDict['login'],
                    'img_url' : responseDict['avatar_url'],
                    'enterprise_id' : responseDict['enterprise']['id']
                  }, User);
                }),
              new AuthCredentials({ 'access_token' : accessToken }).fetch()
                .then(function(authCredentials) {
                  return modelManager.saveModel(authCredentials, {
                    'access_token' : accessToken,
                    'user_id' : responseDict['id']
                  }, AuthCredentials);
                })
            ]).spread(function(savedUser, savedAuthCredentials) { return savedUser; });
          });
        }
    });
  }
}

module.exports = BaseController;
