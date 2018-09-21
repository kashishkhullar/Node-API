/**
 * Library for storing logs
 */

 // Dependecies
 var fs = require('fs');
 var path = require('path');
 var zlib = require('zlib'); // For compressing and decompressing

 // container
 var lib = {};

 // Base dir
 lib.baseDir = path.join(__dirname,'/../.logs/');

 lib.append = function(file,str,callback){
     // Open the file
     fs.open(lib.baseDir + file + '.log','a',function(err,fileDiscriptor){
         if(!err && fileDiscriptor){
             // Append to the file
             fs.appendFile(fileDiscriptor,str + '\n',function(err){
                 if(!err){
                     // Close the file
                     fs.close(fileDiscriptor,function(err){
                         if(!err){
                             callback(false);
                         } else {
                             callback('Error closing files');
                         }
                     })

                 } else {
                     callback('Error appending to file')
                 }
             })
         } else {
             callback('Could not open the file');
         }
     })
 }

 // List all logs

 lib.list = function(includeCompressedLogs,callback){
     fs.readdir(lib.baseDir,function(err,data){
         if(!err && data && data.length>0){
             var trimmedFileNames = [];
             data.forEach(function(fileName){
                 if(fileName.indexOf('.log')>-1){
                    trimmedFileNames.push(fileName.replace('.json',''));
                 }
                 // Add on the .gz files
                 if(fileName.indexOf('.gz.b64')>-1 && includeCompressedLogs){
                    trimmedFileNames.push(fileName.replace('.gz.b64',''));
                 }
             });
             callback(false,trimmedFileNames);
         } else {
             callback(err,data);
         }
     });
 }

 // Compress the contents of the .log file into .gz.b64
 lib.compress = function(logId,newFileId,callback){
     var sourceFile = logId + '.log';
     var destFile = newFileId + '.gz.b64';

     // Read the source file
     fs.readFile(lib.baseDir + sourceFile,'utf8',function(err,inputString){
         if(!err && inputString){
            // Compress
            zlib.gzip(inputString,function(err,buffer){
                if(!err && buffer){
                    // Send the data to the destination file
                    fs.open(lib.baseDir + destFile,'wx',function(err,fileDiscriptor){
                        if(!err && fileDiscriptor){
                            // Write to file
                            fs.writeFile(fileDiscriptor,buffer.toString('base64'),function(err){
                                if(!err){
                                    // Close the file
                                    fs.close(fileDiscriptor,function(err){
                                        if(!err){
                                            callback(false);
                                        } else {
                                            callback(err);
                                        }
                                    });
                                } else {
                                    callback(err);
                                }
                            });
                        } else {
                            callback(err);
                        }
                    });
                } else {
                    callback(err);
                }
            });
         } else {

         }
     })
 };

 // Decompress log files

 lib.decompress = function(fileId,callback){
     var fileName = fileId + '.gz.b64';
     fs.readFile(lib.baseDir + fileName,'utf8',function(err,str){
        if(!err && str){
            // Decompress the data
            var inputBuffer = Buffer.from(str,'base64');
            zlib.unzip(inputBuffer,function(err,outputBuffer){
                if(!err && outputBuffer){
                    var str = outputBuffer.toString();
                    callback(false);
                } else {
                    callback(err);
                }
            });
        } else {
            callback(err);
        }
     })
    
 }

 lib.truncate = function(logId,callback){
     fs.truncate(lib.baseDir + logId + '.log',0,function(err){
         if(!err){
             callback(false);
         } else {
             callback(err);
         }
     })
 }

 // Export the module
 module.exports = lib;