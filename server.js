var logFactory = require("./lib/logging.js");
var http = require("http");
var domain = require('domain');
var url = require("url");
var uuid = require("node-uuid");
var router = require("./router.js");
var exceptions = require("./lib/exceptions.js");
var HTTPResponse = require("./lib/httpResponse.js");
var env = require("./environment.js");
var port = 80;

var knex = require('knex')({
  client: 'mysql',
  connection: env.dbConnection
});
var bookshelf = require('bookshelf')(knex);

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
  requestDomain.on('error', function(error) {
    handleError(error, request, responseWriter, log);
  });
  // The request and responseWriter event emitters have already been created by the time
  // the requestDomain has been set up. Here, we bind them to the requestDomain explicitly.
  requestDomain.run(function() {
    var parsedUrl = url.parse(request.url);
    var controller = router.getController(request.method, parsedUrl.pathname, log);
    var response = controller.execute();
    respond(responseWriter, response, log);
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
  }, "Finished processing request");
}

function handleError(err, request, responseWriter, log) {
  log.error({ 'err' : err });
  var statusCode = 500;
  var message = "Unexpected server error";
  if (typeof err.statusCode != 'undefined') {
    statusCode = err.statusCode;
  }
  if (typeof err.apiErrorMessage != 'undefined') {
    message = err.apiErrorMessage;
  }
  var httpResponse = new HTTPResponse(statusCode, {}, {error: message}, request);
  respond(responseWriter, httpResponse, log);
}
