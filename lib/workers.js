/**
 * These are worker related tasks
 */

 // Dependencies
 var path = require('path');
 var fs = require('fs');
 var _data = require('./data');
 var http = require('http');
 var https = require('https');
 var helpers = require('./helpers');
 var url = require('url');
 var _logs = require('./logs');

 // Instantiate workers object
 var workers = {};

 // Lookup all checks and sent toa a validator
 workers.gatherAllChecks = function(){
     // Get all the  checks
    //  console.log('listing checks');
     _data.list('checks',function(err,checks){
        // console.log(checks);
         if(!err && checks && checks.length>0){
             // Loop through the data
            //  console.log(checks);
             checks.forEach(function(check){
                 // Read each check
                 _data.read('checks',check,function(err,originalCheckData){
                     if(!err && originalCheckData){
                        // Pass the check data to the validator, and let the validator continue or log errors
                        // console.log('validating checks');
                        workers.validateCheckData(originalCheckData);
                     } else {
                        console.log('Error reading the checks data')
                     }
                 })
             });
         } else {
            console.log("error: Could not find any checks to the process");
         }
     }); 
 };

 // Sanity check the check data
 workers.validateCheckData = function(originalCheckData){
     originalCheckData = typeof(originalCheckData) == 'object' && originalCheckData!=null ? originalCheckData : {};
     originalCheckData.id = typeof(originalCheckData.id) == 'string' && originalCheckData.id.length == 20 ? originalCheckData.id.trim() : false ;
     originalCheckData.userPhone = typeof(originalCheckData.userPhone) == 'string' && originalCheckData.userPhone.length == 10 ? originalCheckData.userPhone.trim() : false ;
     originalCheckData.protocol = typeof(originalCheckData.protocol) == 'string' && ['http','https'].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol : false ;
     originalCheckData.url = typeof(originalCheckData.url) == 'string' && originalCheckData.url.length > 0 ? originalCheckData.url.trim() : false ;
     originalCheckData.method = typeof(originalCheckData.method) == 'string' && ['post','get','put','delete'].indexOf(originalCheckData.method) > -1 ? originalCheckData.method : false ;
     originalCheckData.successCode = typeof(originalCheckData.successCode) == 'object' && originalCheckData.successCode.length>0 ? originalCheckData.successCode : false ;
     originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) == 'number' && originalCheckData.timeoutSeconds % 1 == 0 && originalCheckData.timeoutSeconds >= 1 && originalCheckData.timeoutSeconds <= 5 ? originalCheckData.timeoutSeconds : false ;

     // Set the keys if not set if the workers have not seen the check before
     originalCheckData.state = typeof(originalCheckData.state) == 'string' && ['up','down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down' ;
     originalCheckData.lastChecked = typeof(originalCheckData.lastChecked) == 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;
     
     // if all the checks pass, pass the data to the next step in process
     if(originalCheckData.id &&
        originalCheckData.userPhone &&
        originalCheckData.protocol &&
        originalCheckData.url &&
        originalCheckData.method &&
        originalCheckData.successCode &&
        originalCheckData.timeoutSeconds){
            workers.performCheck(originalCheckData);
        } else {
            console.log("error : one of the checks was not passed skipping it");
        }

 };

 // Perform the check, send the originalCheckData and the outcome of the check process to the next process
 workers.performCheck = function(originalCheckData){
     // Prepare the initial check outcome
     var checkOutcome = {
         'error':false,
         'responseCode':false,
     };

     // Mark that outcome has not been sent yet
     var outcomeSent = false;

     // Get the url
     var parsedUrl = url.parse(originalCheckData.protocol + '://' + originalCheckData.url,true);
     var hostname = parsedUrl.hostname;
     var path = parsedUrl.path;

     // Contruct the request
     var requestDetails = {
         'protocol':originalCheckData.protocol+':',
         'hostname':hostname,
         'method':originalCheckData.method.toUpperCase(),
         'path':path,
         'timeout':originalCheckData.timeoutSeconds*1000
     }

     // Make a request
     var _modeleToUse = originalCheckData.protocol =='http' ? http : https ;
     var req =_modeleToUse.request(requestDetails,function(res){
         // Grab the status of the sent request
         var status = res.statusCode;

         // Update the checkOutcome and pass the data along
         checkOutcome.responseCode = status;
         if(!outcomeSent){
            workers.processCheckOutcome(originalCheckData,checkOutcome);
            outcomeSent = true;
         }
     });

     // Bind to the error event so it doesn't get thrown
     req.on('error',function(e){
         // Update the checkoutcome and pass the date along
         checkOutcome.error = {
             'error':true,
             'value':e
         }
         if(!outcomeSent){
            workers.processCheckOutcome(originalCheckData,checkOutcome);
            outcomeSent = true;
         }


     });

     // Bind to timeout event
     req.on('timeout',function(e){
        // Update the checkoutcome and pass the date along
        checkOutcome.error = {
            'error':true,
            'value':'timeout'
        }
        if(!outcomeSent){
           workers.processCheckOutcome(originalCheckData,checkOutcome);
           outcomeSent = true;
        }


    });

    // Send the request
    req.end();

 }

 // Process the check outcome and update the check data and trigger an alert to the user
 workers.processCheckOutcome = function(originalCheckData,checkOutcome){

    // Check if the checlk is up or down
    var state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCode.indexOf(checkOutcome.responseCode) >-1? 'up':'down' ;

    // Decide if the an alert is warranted
    var alertWarrented = originalCheckData.lastChecked && originalCheckData.state != state ? true : false;

    // Update the check data
    var newCheckData = originalCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();

    var timeOfCheck = Date.now();

    workers.log(originalCheckData,checkOutcome,state,alertWarrented,timeOfCheck);

    // Save the updates
    _data.update('checks',newCheckData.id,newCheckData,function(err){
        if(!err){
            // send the new check if warranted
            if(alertWarrented){
                workers.alertUserToStatusChange(newCheckData);
            } else {
                console.log('Check outcome not changed');
            }

        } else {
            console.log('error updating the check');
        }
    });
 }

 // Loging
 workers.log = function(originalCheckData,checkOutcome,state,alertWarrented,timeOfCheck){
    // Form the log
    var logData = {
        'check':originalCheckData,
        'outcome':checkOutcome,
        'state':state,
        'alert':alertWarrented,
        'time':timeOfCheck
    };

    // Conbvert to string
    var logString = JSON.stringify(logData);

    // determine log file name
    var logFileName = originalCheckData.id;

    // Append to the file
    _logs.append(logFileName,logString,function(err){
        if(!err){
            console.log("logging completed");
        } else {
            console.log('Logging failed');
        }
    });
 };

 // Alert the user
 workers.alertUserToStatusChange = function(newCheckData){
     var msg = 'Alert: ypur check for ' + newCheckData.method + newCheckData.protocol + '://' + newCheckData.url + "is currently " + newCheckData.state ;
     helpers.sendTwilioSms(newCheckData.userPhone,msg,function(err){
         if(!err){
             console.log("success user was alerted ",msg);
         } else {
             console.log("could not send msg ",msg);
         }
     });
 }

 // Timer to execute the worker-process once per minute
 workers.loop = function(){
     setInterval(function(){
         workers.gatherAllChecks();
     },1000*5);
 };

 // Rotate the logs
 workers.rotateLogs = function(){
     // List the uncompressed file
     _logs.list(false,function(err,logs){
         if(!err && logs && logs.length>0){
             logs.forEach(function(logName){
                // Compress the data
                var logId = logName.replace('.log','');
                var newFileId = logId + '-' +Date.now();
                _logs.compress(logId,newFileId,function(err){
                    if(!err){
                        // Truncate the log
                        _logs.truncate(logId,function(err){
                            if(!err){
                                console.log('truncated log file')
                            } else {
                                console.log('error truncating');
                            }
                        });

                    } else {
                        console.log('Error compressing one of the log files',err);
                    }
                });
             });
         } else {
             console.log("could not find logs");
         }
     });
 }

 // Timer to execute log rotation
 workers.logRotationLoop = function(){
     setInterval(function(){
        workers.rotateLogs()
     },1000*60);
 }

 // Init script
 workers.init = function(){
     // Execute all the checks immediately
     workers.gatherAllChecks();

     // Call the loop so the checks will execute later on
     workers.loop();
 }

 // Ezport the module
 module.exports = workers;
 
 