var log = require("./logging.js");

var http = require("http");
domain = require('domain');
var uuid = require("node-uuid");
var router = require("./router.js");
var HTTPResponse = require("./httpResponse.js");
var port = 80;

log.info("Starting server listening on port: %d", port);
http.createServer(function(request, responseWriter) {
  var requestId = uuid.v1();
  request.requestId = requestId;
  request.startTime = Date.now();
  log.info("Received request", {requestId: requestId, url: request.url, headers: request.headers, httpMethod: request.method});
  requestDomain = domain.create();
  requestDomain.on('error', function(error) {
    handleError(error, request, responseWriter);
  });
  requestDomain.run(function() {
    var controller = router.getController(request.method, request.url);
    var response = controller.execute();
    respond(responseWriter, response);
  });
  log.info("Done");
}).listen(port);

function respond(responseWriter, response) {
  var headers = response.headers;
  var body = response.getRawBody();
  headers["Content-Type"] = response.contentType;
  headers["Content-Length"] = body.length;
  responseWriter.writeHead(response.statusCode, headers);
  responseWriter.write(body);
  responseWriter.end();
  log.info("Responded to request", {
    requestId: response.requestId,
    processingTime: response.processingTime,
    statusCode: response.statusCode,
    headers: headers
  });
}

function handleError(err, request, responseWriter) {
  log.error(err);
  var statusCode = 500;
  var message = "Unexpected server error";
  if (typeof err.statusCode != 'undefined') {
    statusCode = err.statusCode;
  }
  if (typeof err.apiErrorMessage != 'undefined') {
    message = err.apiErrorMessage;
  }
  var httpResponse = new HTTPResponse(statusCode, {}, {error: message}, request);
  respond(responseWriter, httpResponse);
}
