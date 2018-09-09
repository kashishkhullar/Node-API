/**
 * Request Handlers
 */

 // Dependencies
 var _data = require('./data');
 var helpers = require('./helpers');

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
 // @TODO only let authenticated user access their data
 // Required data : phone
 handlers._users.get = function(data,callback){
     var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
     if(phone){
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
         callback(404,{"Error" : "Missing required field"});
     }
 };

 // Users - put
 // @TODO only allow authenticated users update their own data
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
            callback(400,{"error":"missing required fields to update"});
         }
     } else {
         callback(400,{"error":"missing required fields"});
     }
     
 };

 // Users - delete
 // @TODO only allow authenticated users delete their own data
 // @TODO delete users checks
 handlers._users.delete = function(data,callback){
     // Check for required field
     var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

     if(phone){
         // Lookup the user
         _data.read('users',phone,function(err,data){
            if(!err && data){
                _data.delete('users',phone,function(err){
                    if(!err){
                        callback(200);
                    } else {
                        callback(500,{'error':"could not delete the specified user"});
                    }
                });
            } else {
                callback(400,{"error":"could not find user"});
            }
        });

     } else {
         callback(400,{"error":"missing required fields"});
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
