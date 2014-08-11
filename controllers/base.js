function BaseController(resourceId, parentResourceId, log) {
  this.resourceId = resourceId;
  this.parentResourceId = parentResourceId;
  this.log = log;
  this.needsAuthentication = true;
}

module.exports = BaseController;
