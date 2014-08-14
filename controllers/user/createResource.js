var BaseController = require('../base.js');

var CreateUserController = function(resourceId, log) {
  BaseController.apply(this, arguments);

  this.run = function(params, authenticatedUser, responseFactory) {
    return responseFactory.success(params);
  }
}

module.exports = CreateUserController;
