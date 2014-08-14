var exceptions = require("./lib/exceptions.js");
var util = require("util");

exports.getController = function(httpMethod, pathString, log) {
  var path = pathString.replace(/^\/|\/$/g, '');
  var pathComponents = path.split("/").filter(function (str) { return str.length > 0; });
  if (pathComponents.length > 3 || pathComponents.length < 1) {
    throw exceptions.BadRequest(httpMethod, pathString, 'the path of your URL must be of the form <resource_type>/<resource_id>/<secondary_resource_type>.');
  }

  var resourceType = (pathComponents.length === 3)? pathComponents[2] : pathComponents[0];
  var resourceId = (pathComponents.length >= 2)? pathComponents[1] : null;
  var parentResourceType = (pathComponents.length == 3)? pathComponents[0] : null;
  var actionComponents = null;
  
  switch (httpMethod.toUpperCase()) {
    case 'GET':
      if (resourceId === null) {
        actionComponents = ['list', 'resources'];
      } else if (parentResourceType === null) {
        actionComponents = ['get', 'resource'];
      } else {
        actionComponents = ['list', 'children', 'of', parentResourceType];
      }
      break;
    case 'POST':
      if (resourceId === null) {
        actionComponents = ['create', 'resource'];
      } else if (parentResourceType !== null) {
        actionComponents = ['create', 'child', 'of', parentResourceType];
      }
      break;
    case 'PUT':
      if (resourceId !== null && parentResourceType === null) {
        actionComponents = ['update', 'resource'];
      }
  }

  if (actionComponents === null) {
    throw exceptions.BadRequest(httpMethod, pathString, "don't understand what you're trying to do.");
  }

  var controllerPath = "./controllers/" + resourceType + "/" + stringComponentsToCamelcase(actionComponents) + ".js";
  log.info("Looking for controller at: %s", controllerPath);
  try {
    var Controller = require(controllerPath);
    return new Controller(resourceId, log);
  } catch (err) {
    log.warn(err);
    throw exceptions.UnprocessableEntity(util.format("%s %s: Cannot %s of type <%s>. This operation is not supported.", httpMethod, pathString, actionComponents.join(' '), resourceType));
  }
}

function stringComponentsToCamelcase(components)
{
  var result = '';
  for (var i = 0; i < components.length; i++) {
    if (i === 0) {
      result += components[i];
    } else {
      result += stringToCamelcaseComponent(components[i]);
    }
  }
  return result;
}

function stringToCamelcaseComponent(str)
{
  return str.charAt(0).toUpperCase() + str.slice(1);
}
