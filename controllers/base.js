var BaseController = function(resourceId, log) {
  this.resourceId = resourceId;
  this.log = log;

  this.needsAuthentication = true;

  this.execute = function(httpBodyManager, queryDictionary, responseFactory, completion) {
    var controller = this;
    httpBodyManager.withJSONHttpBody(function(bodyDictionary) {
      var params = queryDictionary;
      for (var key in bodyDictionary) {
        params[key] = bodyDictionary[key];
      }
      controller.run(params, responseFactory, completion);
    });
  }
}

module.exports = BaseController;
