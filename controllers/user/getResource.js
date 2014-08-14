var BaseController = require('../base.js');

var GetUserController = function(resourceId, log) {
  BaseController.apply(this, arguments);

  this.run = function(params, authenticatedUser, responseFactory) {
    return responseFactory.success(authenticatedUser);
  }
}

module.exports = GetUserController;
