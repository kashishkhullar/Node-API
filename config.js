/**
 * Create and export configuration variables
 */

// Container of all the environments
var environments = {};

// Staging (default) environment
environments.staging = {
    'port' : 3000,
    'envName': 'staging'
};

// Production object
environments.production = {
    'port' : 5000,
    'envName' : 'production'
};

// Determine which environment was passed as a command-line argument
var currentEvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environment, if not default to staging
var environmentToExport = typeof(environments[currentEvironment]) == 'object' ? environments[currentEvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;