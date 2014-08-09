var url = require("url");
var exceptions = require("./exceptions.js");

exports.getController = function(httpMethod, urlString) {
  var parsedUrl = url.parse(urlString);
  var path = parsedUrl.pathname.replace(/^\/|\/$/g, '');
  var pathComponents = path.split("/");
  if (pathComponents.length > 3 || pathComponents[0].length === 0) {
      throw exceptions.BadRequest(httpMethod, urlString, "the path of your URL must be of the form <resource_type>/<resource_id>/<secondary_resource_type>.");
  }
  
}
