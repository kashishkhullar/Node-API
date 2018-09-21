/**
 *  Server realated tasks
 */

 // Dependencies
 var http = require('http');
 var https = require('https');
 var url  = require('url');
 var StringDecoder = require('string_decoder').StringDecoder;
 var config = require('../config');
 var fs = require('fs');
 var handlers = require('./handlers');
 var helpers = require('./helpers');
 var path = require('path');

 // Instantiate the server module object
 var server = {}

 // Instantiate the HTTP serve
 server.httpServer = http.createServer(function(req,res){
    server.unifiedServer(req,res);
 });

 // HTTPS server options
 server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
    'cert':fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
 };

 // Instantiate the HTTPS serve
 server.httpsServer = https.createServer(server.httpsServerOptions,function(req,res){
    server.unifiedServer(req,res);
 });

 // All the server logic for both the http and https
 server.unifiedServer = function(req,res){

    // Get the URL and parse it
    var parsedUrl = url.parse(req.url,true);

    // Get the path from the url
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g,'');

    // Get the query string as an object
    var queryStringObject = parsedUrl.query;

    // Get the HTTP method
    var method = req.method.toLowerCase();

    // Get the headers as an object
    var headers = req.headers;

    // Get the payload, if there is any
    var decoder = new StringDecoder('utf8');
    var buffer = '';
    req.on('data',function(data){
        buffer += decoder.write(data);
    });
    req.on('end',function(){
        buffer += decoder.end();

        // Choose the handler this request should go to
        // If not found use the not found handler
        var chosenHandler = typeof(server.router[trimmedPath])!=='undefined' ? server.router[trimmedPath] : handlers.notFound; 

        // Construct the data object to send to the handler
        var data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload':helpers.parseJsonToObject(buffer)
        };

        // Route the request with the data and a callback function
        chosenHandler(data,function(statusCode,payload){
            // Use the status code called back by the handler or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
            
            // Use the payload called back by the hanlder or default to empty object
            payload = typeof(payload) == 'object' ? payload : {}; 

            // Convert the payload to a string
            var payloadString = JSON.stringify(payload);
            
            // Return the respose
            res.setHeader('Content-Type','application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            // Log the response
            console.log("Returning this response ",statusCode,payloadString);

        });

        // Send a response
        // res.end("Hello World\n");

        // Log the request path
        // console.log('Request recieved on path: ' + trimmedPath + ' with method: ' + method + ' with query string parameters ', queryStringObject );
        // console.log("Request recieved with payload ",buffer);
    });

 };

 // Define a request router
 server.router = {

    'ping' : handlers.ping,
    'users': handlers.users,
    'tokens': handlers.tokens,
    'checks': handlers.checks

 };

 // Init script
 server.init = function(){
     // Start the HTTP server
     server.httpServer.listen(config.httpPort,function(){
         console.log("The server is listenting on port",config.httpPort,"now in",config.envName, "mode");
     });

     // Start the HTTP server
     server.httpsServer.listen(config.httpsPort,function(){
         console.log("The server is listenting on port",config.httpsPort,"now in",config.envName, "mode");
     });

 }
 module.exports = server;