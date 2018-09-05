/**
 * Primary file for the API
 */

 // Dependencies
 const http = require('http');
 const url  = require('url');
 const StringDecoder = require('string_decoder').StringDecoder;

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

        // Send a response
        res.end("Hello World\n");

        // Log the request path
        // console.log('Request recieved on path: ' + trimmedPath + ' with method: ' + method + ' with query string parameters ', queryStringObject );
        console.log("Request recieved with payload ",buffer);
    });
    
});

 // Start the server, and have it listen at port 3000
 server.listen(3000,function(){
     console.log("The server is listenting on port 3000");
 })