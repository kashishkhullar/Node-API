/**
 * Create and export configuration variables
 */

// Container of all the environments
var environments = {};

// Staging (default) environment
environments.staging = {
    'httpPort' : 3000,
    'httpsPort': 3001,
    'envName': 'staging',
    'hashingSecret':'thisIsASecret',
    'maxChecks':5
};

// Production object
environments.production = {
    'httpPort' : 5000,
    'httpsPort':5001,
    'envName' : 'production',
    'hashingSecret':'thisIsAlsoASecret',
    'maxChecks':5
};

// Determine which environment was passed as a command-line argument
var currentEvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environment, if not default to staging
var environmentToExport = typeof(environments[currentEvironment]) == 'object' ? environments[currentEvironment] : environments.staging;


// Export the module
module.exports = environmentToExport;