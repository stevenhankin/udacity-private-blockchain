'use strict';

/**
 * @module Main entry point
 */

const Hapi = require('hapi');
const assignRoutes = require('./api/routes.js');


// Create a server with a host and port
const server = Hapi.server({
    host: 'localhost',
    port: 8000
});


assignRoutes(server);


// Start the server
(() => {
    try {
        server.start();
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
    console.log('Server running at:', server.info.uri);
})();

