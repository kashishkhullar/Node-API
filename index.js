/**
 * Primary file for the API
 */

 // Dependencies
 const http = require('http');
 const url  = require('url');
 const StringDecoder = require('string_decoder').StringDecoder;
 const config = require('./config');

 // The server should respond to all request with a string
 const server = http.createServer(function(req,res){

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
        var chosenHandler = typeof(router[trimmedPath])!=='undefined' ? router[trimmedPath] : handlers.notFound; 

        // Construct the data object to send to the handler
        var data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload':buffer
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
    
});

 // Start the server
 server.listen(config.port,function(){
     console.log("The server is listenting on port",config.port,"now in",config.envName, "mode");
 });

 // Define the handlers

 var handlers = {};

 // Sample handler
 handlers.sample = function(data,callback){
    // Callback a http status code and a payload
    callback(406,{'name':'sample handler'});
 };

 // Not found handler
 handlers.notFound = function(data,callback){
    callback(404);
 };

 // Define a request router

 var router = {

    'sample' : handlers.sample

 };