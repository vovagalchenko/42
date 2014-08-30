var logFactory = require("./lib/logging.js");
var http = require("http");
var domain = require('domain');
var url = require("url");
var uuid = require("node-uuid");
var router = require("./router.js");
var exceptions = require("./lib/exceptions.js");
var HTTPResponseFactory = require("./lib/httpResponse.js");
var HTTPBodyManager = require("./lib/httpBodyManager.js");
var env = require("./environment.js");
var port = 80;

logFactory("none").info("Starting server listening on port: %d", port);
http.createServer(function(request, responseWriter) {
  var requestId = uuid.v1();
  request.requestId = requestId;
  request.startTime = Date.now();
  var log = logFactory(requestId);
  log.info({
    url: request.url,
    headers: request.headers,
    httpMethod: request.method
  }, "Received request");
  requestDomain = domain.create();
  requestDomain.add(request);
  requestDomain.add(responseWriter);
  var responseFactory = new HTTPResponseFactory(request);
  requestDomain.on('error', function(error) {
    handleError(error, responseFactory, responseWriter, log);
  });
  // The request and responseWriter event emitters have already been created by the time
  // the requestDomain has been set up. Here, we bind them to the requestDomain explicitly.
  requestDomain.run(function() {
    var httpBodyManager = new HTTPBodyManager(request, log);
    var parsedUrl = url.parse(request.url, true);
    var controller = router.getController(request.method, parsedUrl.pathname, log);
    controller.execute(httpBodyManager, parsedUrl.query, responseFactory)
      .timeout(10000)
      .then(function(response) {
        respond(responseWriter, response, log);
      }, function(error) {
        handleError(error, responseFactory, responseWriter, log);
      });
  });
}).listen(port);

function respond(responseWriter, response, log) {
  var headers = response.headers;
  var body = response.getRawBody();
  headers["Content-Type"] = response.contentType;
  headers["Content-Length"] = body.length;
  responseWriter.writeHead(response.statusCode, headers);
  responseWriter.write(body);
  responseWriter.end();
  log.info({
    'processingTime': response.processingTime,
    'statusCode': response.statusCode,
    'contentLength': body.length,
  }, "Finished processing request");
}

function handleError(err, responseFactory, responseWriter, log) {
  var statusCode = 500;
  var message = "Unexpected server error";
  if (typeof err.statusCode != 'undefined') {
    statusCode = err.statusCode;
  }
  if (typeof err.apiErrorMessage != 'undefined') {
    message = err.apiErrorMessage;
    log.warn(message, { 'err' : err });
  } else {
    log.error({ 'err' : err });
  }
  var responseDict = { error: message };
  if (err['troubleshootingData']) {
    for (var key in err['troubleshootingData']) {
      responseDict[key] = err['troubleshootingData'][key];
    }
  }
  var httpResponse = responseFactory.createResponse(statusCode, {}, responseDict);
  respond(responseWriter, httpResponse, log);
}
