/**
 * Primary file for the API
 */

 // Dependencies
 var server = require('./lib/server');
 var workers = require('./lib/workers');

 // Declare app
 var app = {};

 // Init the function
 app.init = function(){
     // Start the server
     server.init();

     // Start the workers
     workers.init();

     // Rotate logs
     workers.rotateLogs();

     // Compression loop
     workers.logRotationLoop();
 }

 // Start the app
 app.init();

 // Export the app
 module.exports = app;