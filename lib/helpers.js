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
 };

 // Create a random string of a given length
 helpers.createRandomString = function(strLength){
     strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;

     if(strLength){
         // Define all possible characters that could go in the random string
         var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

         // Start the final string
         var str = '';
         for(var i = 0;i<strLength;i++){
             // Get a random character
             var randomCharacter = possibleCharacters.charAt(Math.random() * possibleCharacters.length);

             // append to the string
             str+=randomCharacter;
         } 
         return str;
     } else {
        return false;
    }
 };

 // Export the module
 module.exports = helpers;