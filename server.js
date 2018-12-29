'use strict';

const MemPool = require('./mempool/MemPool.js');
const Hapi = require('hapi');
const assignRoutes = require('./api/routes.js')


// Create a server with a host and port
const server = Hapi.server({
    host: 'localhost',
    port: 8000
});

let memPool = new MemPool();

assignRoutes(server, memPool);


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

