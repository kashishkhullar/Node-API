/**
 * Request Handlers
 */

 // Dependencies
 var _data = require('./data');
 var helpers = require('./helpers');
 var config = require('../config');

 // Define the handlers
 var handlers = {};

 // Users
 handlers.users = function(data,callback){

    var acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._users[data.method](data,callback);
    } else {
        callback(405);
    }

 };

 // Container for the users submethods
 handlers._users = {};

 // Users - post
 // Required data : first name, last name, phone, password, tosAgreement
 handlers._users.post = function(data,callback){
     // Check that all required fields are filled out
     var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
     var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
     var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
     var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
     var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

     if(firstName && lastName && phone && password && tosAgreement){
         // Make sure user doesn't exist
         _data.read('users',phone,function(err,data){
            if(err){
                // Hash the password
                var hashedPassword = helpers.hash(password);

                if(hashedPassword){
                    // Create user object
                    var userObject = {
                        'firstName': firstName,
                        'lastName':lastName,
                        'phone':phone,
                        'hashedPassword':hashedPassword,
                        'tosAgreement':tosAgreement
                    };

                    _data.create('users',phone,userObject,function(err){
                        if(!err){
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500,{'Error' : "Could not create the new user"});
                        }
                    });

                } else {
                    callback(500,{'Error' : 'Could not hash the users password'});
                }

                
            } else {
                // User already exists
                callback(400,{"Error":"User already exists"});
            }
         });

     } else {
         callback(400,{'Error':'Missing required field'});
     }

 };

 // Users - get
 // Required data : phone
 handlers._users.get = function(data,callback){
     var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
     if(phone){
         // Get the token from the headers
         var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

         // Verify the token
         handlers._tokens.verifyToken(token,phone,function(tokenIsValid){
             if(tokenIsValid){
                 // Lookup the user
                 _data.read('users',phone,function(err,data){
                    if(!err && data){
                        // Remove the hashed password
                        delete data.hashedPassword;
                        callback(200,data);
                    } else {
                        callback(404,{"error":"user not found"});
                    }
                });
             } else {
                 callback(403,{"error":"Missing token in the header"});
             }
         });
     } else {
         callback(404,{"Error" : "Missing required field"});
     }
 };

 // Users - put
 handlers._users.put = function(data,callback){
     // Check for required field
     var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

     // Check for optional fields
     var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
     var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
     var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

     // Error if phone is invalid
     if(phone){
         if(firstName || lastName || password){
             // Get the token from the headers
             var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

             // Verify the token
             handlers._tokens.verifyToken(token,phone,function(tokenIsValid){
                 if(tokenIsValid){
                    
                    _data.read('users',phone,function(err,userData){
                        if(!err && userData){
                            // Update fields
                            if(firstName){
                                userData.firstName = firstName;
                            }
                            if(lastName){
                                userData.lastName = lastName;
                            }
                            if(password){
                                userData.hashedPassword = helpers.hash(password);
                            }
                            // Store the new updates
                            _data.update('users',phone,userData,function(err){
                            if(!err){
                                callback(200);
                            } else {
                                console.log(err);
                                callback(500,{"Error":"Error updating"});
                            }      
                            });
                        } else {
                            callback(400,{'Error' : 'User doesnt exist'});
                        }
                    });
                } else {
                    callback(400,{"error":"Missing token in the header"});
                }
            });
         } else {
            callback(400,{"error":"missing required fields to update"});
         }
     } else {
         callback(400,{"error":"missing required fields"});
     }
     
 };

 // Users - delete
 handlers._users.delete = function(data,callback){
     // Check for required field
     var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

     if(phone){
         // Get the token from the headers
         var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

         // Verify the token
         handlers._tokens.verifyToken(token,phone,function(tokenIsValid){
             if(tokenIsValid){
                 // Lookup the user
                _data.read('users',phone,function(err,data){
                    if(!err && data){
                        var userData = data;
                        _data.delete('users',phone,function(err){
                            if(!err){
                                // Delete each checks of the user
                                var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                                var totalChecks = userChecks.length;
                                var deletionError = false;
                              
                                if(totalChecks>0){
                                    for(var i = 0;i<totalChecks;i++){
                                        _data.delete('checks',userChecks[i],function(err){
                                            
                                            if(err){
                                                deletionError = err;
                                            } 
                                        });
                                    }
                                    if(!deletionError){
                                        callback(200);
                                    } else {
                                        callback(500);
                                    }

                                } else {
                                    callback(400,{"error":"no checks to delete"});
                                }
                                
                            } else {
                                callback(500,{'error':"could not delete the specified user"});
                            }
                        });
                    } else {
                        callback(400,{"error":"could not find user"});
                    }
                });
             } else {
                 callback(403,{"error":"Missing token in the header"});
             }
            });
         

     } else {
         callback(400,{"error":"missing required fields"});
     }

 };

 // Tokens
 handlers.tokens = function(data,callback){

    var acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._tokens[data.method](data,callback);
    } else {
        callback(405);
    }

 };

 // Containers for all the tokens methods
 handlers._tokens = {};

 // Tokens - post
 handlers._tokens.post = function(data,callback){
    // Check for required field
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if(phone && password){
        // Lookup the user who matches the phone number
        _data.read('users',phone,function(err,userData){
           if(!err && userData){
               // hash the sent password and compare with the current users hashed password
                var hashedPassword = helpers.hash(password);
                if(hashedPassword == userData.hashedPassword){
                    // if vaild create a new token with a valid name. set expiration date 1hr in the future
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + 1000 *60 *60;
                    var tokenObject = {
                        'phone':phone,
                        'id': tokenId,
                        'expires':expires
                    };

                    // Store the token
                    _data.create('tokens',tokenId,tokenObject,function(err){
                        if(!err){
                            callback(200,tokenObject);
                        } else {
                            callback(500,{'Error':'Could not create a token file'});
                        }
                    });
                }
               
           } else {
               callback(400,{"error":"could not find user"});
           }
       });

    } else {
        callback(400,{"error":"missing required fields"});
    }

 };

 // Tokens - get
 // Required data : id
 handlers._tokens.get = function(data,callback){
    // Check for required field
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;

     if(id){
         // Lookup the user
         _data.read('tokens',id,function(err,tokenData){
             if(!err && tokenData){          
                 callback(200,tokenData);
             } else {
                 callback(404,{"error":"token not found"});
             }
         });
     } else {
         callback(404,{"Error" : "Missing required id field"});
     }

 };

 // Tokens - put
 // Required data : id,extend
 handlers._tokens.put = function(data,callback){
    // Check for required field
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend  ? data.payload.extend : false;

    if(id && extend){
        // Lookup the user
        _data.read('tokens',id,function(err,tokenData){
           if(!err && tokenData){
               // Check if the token is not expired already
               if(tokenData.expires > Date.now()){
                   // Set the expiration an hour from now
                   tokenData.expires = Date.now() + 1000 * 60 * 60;

                   // Store the new updates
                   _data.update('tokens',id,tokenData,function(err){
                       if(!err){
                           callback(200);
                       } else {
                           callback(500,{"error":"could not update the token"});
                       }
                   });
               } else {
                   callback(400,{"error":"token already expired"});
               }
           } else {
               callback(400,{"error":"could not find token"});
           }
       });

    } else {
        callback(400,{"error":"missing required fields"});
    }

 };

 // Tokens - delete
 handlers._tokens.delete = function(data,callback){
    // Check for required field
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;

    if(id){
        // Lookup the user
        _data.read('tokens',id,function(err,data){
           if(!err && data){
               _data.delete('tokens',id,function(err){
                   if(!err){
                       callback(200);
                   } else {
                       callback(500,{'error':"could not delete the specified token"});
                   }
               });
           } else {
               callback(400,{"error":"could not find token"});
           }
       });

    } else {
        callback(400,{"error":"missing required fields"});
    }

 };

 // Verify if a given token id is currently valid for a given ser
 handlers._tokens.verifyToken = function(id,phone,callback){
     // Lookup the token
     _data.read('tokens',id,function(err,tokenData){
        if(!err && tokenData){
            // Check that the token is for the given user and has not expired
            if(tokenData.phone == phone && tokenData.id == id){
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
     });
 };

 
 // Checks
 handlers.checks = function(data,callback){

    var acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._checks[data.method](data,callback);
    } else {
        callback(405);
    }

 };

 // Containers for all the checks methods
 handlers._checks = {};

 // Checks - post
 // Required data: protocol, url, method, successCode, timeoutSeconds
 handlers._checks.post = function(data,callback){
     // validate input
     var protocol = typeof(data.payload.protocol) == 'string' && ['http','https'].indexOf(data.payload.protocol) > -1 ?data.payload.protocol : false;
     var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
     var method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ?data.payload.method : false;
     var successCode = typeof(data.payload.successCode) == 'object' && data.payload.successCode.length > 0 && data.payload.successCode instanceof Array ? data.payload.successCode : false;
     var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
     
     if(url && method && timeoutSeconds && protocol && successCode){
         // Get token from the headers
         var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

         // Loopup the user by reading the token
         _data.read('tokens',token,function(err,tokenData){

            if(!err && tokenData){
                // Get user
                var userPhone = tokenData.phone;

                _data.read('users',userPhone,function(err,userData){
                    
                    if(!err && userData){
                        var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];

                        // Verify that the user has less than number of max checks
                        if(userChecks.length < config.maxChecks){
                            // Create a random id for the check
                            var checkId = helpers.createRandomString(20);

                            // create the check object and include the users phone
                            var checkObject = {
                                'id': checkId,
                                'userPhone': userPhone,
                                'protocol':protocol,
                                'method':method,
                                'successCode':successCode,
                                'timeoutSeconds':timeoutSeconds,
                                'url' : url
                            };

                            _data.create('checks',checkId,checkObject,function(err){
                                if(!err){
                                    // Add the check id to the user's object
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);

                                    // Save the new user data
                                    _data.update('users',userPhone,userData,function(err){
                                        if(!err){
                                            // Return data about the new check
                                            callback(200,checkObject);

                                        } else {
                                            callback(500,{'error':'could not update user data'});

                                        }
                                    });

                                } else {
                                    callback(500,{'error':'could not create new check'})
                                }
                            });

                        } else {
                            callback(400,{'error': 'user has max number of checks' + config.maxChecks});
                        }


                    } else {
                        callback(403);
                    }
                });

            } else {
                callback(403,{'error':'token not found'});
            }

         });



     } else {
         callback(400,{'error': 'missignrequired fields, or input invalid'});
     }
     
     
 };

 // Checks - get
 // required data : check id
 handlers._checks.get = function(data,callback){
     // Verfiy check Id
     var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
     if(id){
        // Look up the check
        _data.read('checks',id,function(err,checkData){
            if(!err && checkData){
                // Get the token from the headers
                var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

                if(token){
                    // Verify the token
                    handlers._tokens.verifyToken(token,checkData.userPhone,function(tokenIsValid){
                        if(tokenIsValid){
                            // Return the check data
                            callback(200,checkData);
                        } else {
                            callback(403);
                        }
                    });

                } else {
                        callback(403,{"error":"Missing token in the header"});
                }
            } else {
                callback(404)
            }
        });
        
     } else {
        callback(404,{"Error" : "Missing required field"});
     }
 };

 // Checks - put
 // Required Data - id
 // Optional data protocol, url,method, timeout seconds, successcodes
 handlers._checks.put = function(data,callback){
    // Check for required field
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;

    // Check for optional fields
    var protocol = typeof(data.payload.protocol) == 'string' && ['http','https'].indexOf(data.payload.protocol) > -1 ?data.payload.protocol : false;
    var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ?data.payload.method : false;
    var successCode = typeof(data.payload.successCode) == 'object' && data.payload.successCode.length > 0 && data.payload.successCode instanceof Array ? data.payload.successCode : false;
    var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
     
    // Error if phone is invalid
    if(id){
        // Check if optional data is sent
        if(url || protocol || method || successCode || timeoutSeconds){
            _data.read('checks',id,function(err,checkData){
                if(!err && checkData){
                    // Check token
                    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

                    if(token){
                        // Verify the token
                        handlers._tokens.verifyToken(token,checkData.userPhone,function(tokenIsValid){
                            if(tokenIsValid){
                                // Return the check data
                                if(protocol){
                                    checkData.protocol = protocol;
                                }
                                if(url){
                                    checkData.url = url;
                                }
                                if(successCode){
                                    checkData.successCode = successCode;
                                }
                                if(timeoutSeconds){
                                    checkData.timeoutSeconds = timeoutSeconds;
                                }
                                if(method){
                                    checkData.method = method;
                                }

                                // Store the updates
                                _data.update('checks',id,checkData,function(err){
                                    if(!err){
                                        callback(200);
                                    } else {
                                        callback(500,{'error':'could not update the check'});
                                    }
                                });

                                

                            } else {
                                callback(403);
                            }
                        });

                    } else {
                            callback(403,{"error":"Missing token in the header"});
                    }
                        
                    } else {
                        callback(400,{'error':'check doesnt exists'});
                    }
            });
        } else {
            callback(400,{'error':'optional data not sent'});
        }
    } else {
        callback(400,{"error":"missing required fields check id"});
    }
    
 };

 // Checks - delete
 // Required data id
 handlers._checks.delete = function(data,callback){
    // Check for required field
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;

    if(id){
        // Lookup check
        _data.read('checks',id,function(err,checkData){
            if(!err && checkData){
                // Get the token
                var token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false;

                if(token){
                    // Verify token
                    handlers._tokens.verifyToken(token,checkData.userPhone,function(tokenIsValid){
                        if(tokenIsValid){
                            // Read user
                            _data.read('users',checkData.userPhone,function(err,userData){
                                if(!err){
                                    // remove check from user
                                    if(userData.checks.indexOf(id)>-1){
                                        userData.checks.splice(userData.checks.indexOf(id),1);
                                        // Update user checks
                                        _data.update('users',checkData.userPhone,userData,function(err){
                                            if(!err){
                                                // delete check
                                                _data.delete('checks',id,function(err){
                                                    if(!err){
                                                        callback(200);
                                                    } else {
                                                        callback(500,{"error":"couldnt delete check"});
                                                    }
                                                });
                                            } else {
                                                console.log(err);
                                                callback(500,{"error":"error updating user"});
                                            }
                                        });
                                    } else {
                                        callback(404)
                                    }
                                } else {
                                    callback(403,{"error":"user not found"});
                                }
                            });

                        } else {
                            callback(403);
                        }
                    });


                } else {
                    callback(403,{'error':'missing token'});
                }

            } else {
                callback(400,{"error":"missing required fields"});
            }
            

        });
        

    } else {
        callback(400,{"error":"missing required fields check id"});
    }

 };
 

 




 // Ping handler
 handlers.ping = function(data,callback){
     callback(200);
 };

 // Not found handler
 handlers.notFound = function(data,callback){
    callback(404);
 };

 // Export the module
 module.exports = handlers;
