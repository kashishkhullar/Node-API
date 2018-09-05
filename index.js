/**
 * Primary file for the API
 */

 // Dependencies
 const http = require('http');
 const url  = require('url');

 // The server should respond to all request with a string
 const server = http.createServer(function(req,res){

    // Get the URL and parse it
    var parsedUrl = url.parse(req.url,true);

    // Get the path from the url
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g,'');

    // Send a response
    res.end("Hello World\n");

    // Log the request path
    console.log('Request recieved on path: ' + trimmedPath);
 });

 // Start the server, and have it listen at port 3000
 server.listen(3000,function(){
     console.log("The server is listenting on port 3000");
 })