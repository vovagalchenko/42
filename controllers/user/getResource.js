var BaseController = require('../base.js');
var exceptions = require('../../lib/exceptions.js');

var GetUserController = function(resourceId, log) {
  BaseController.apply(this, arguments);

  this.run = function(authenticatedUser, responseFactory) {
    if (this.resourceId !== authenticatedUser.get('box_user_id')) {
      throw exceptions.AuthenticationFailure("You can't get user information on any user other than you. Your user id is: " + authenticatedUser.get('box_user_id'));
    }
    return responseFactory.ok({ user: authenticatedUser });
  }
}

module.exports = GetUserController;
