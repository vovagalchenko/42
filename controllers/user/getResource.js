var BaseController = require('../base.js');

var GetUserController = function(resourceId, log) {
  BaseController.apply(this, arguments);

  this.run = function(params, responseFactory, completion) {
    completion(responseFactory.success(params));
  }
}

module.exports = GetUserController;
