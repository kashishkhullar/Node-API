/**
 * Helper library
 */

 // Dependecies
 var crypto = require('crypto');
 var config = require('../config');

 // Container
 var helpers = {};

 //Create hash of the password
 helpers.hash = function(str){
     if(typeof(str) == 'string' && str.length > 0){
        var hash = crypto.createHash('sha256',config.hashingSecret).update(str).digest('hex');
        return hash;
     } else {
         return false;
     }

 };

 // Parse a json
 helpers.parseJsonToObject = function(str){
     try{
         var obj = JSON.parse(str);
         return obj;
     } catch(err){
         return {};
     }
 }

 // Export the module
 module.exports = helpers;