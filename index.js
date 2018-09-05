/**
 * Primary file for the API
 */

 // Dependencies
 const http = require('http');

 // The server should respond to all request with a string
 const server = http.createServer(function(req,res){
     res.end("Hello World\n");
 });
 
 // Start the server, and have it listen at port 3000
 server.listen(3000,function(){
     console.log("The server is listenting on port 3000");
 })