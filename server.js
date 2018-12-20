'use strict';

const Hapi = require('hapi');
const Boom = require('boom');
const BlockChain = require('./BlockChain.js');
const Block = require('./Block.js');
let myBlockChain = new BlockChain.Blockchain();


// Create a server with a host and port
const server = Hapi.server({
    host: 'localhost',
    port: 8000
});




// Route for adding a block
server.route({
    method: 'POST',
    path: '/block',
    handler: async function (request, h) {
        try {
            console.log(request.payload)
            const payload = JSON.parse(request.payload);
            console.log(payload)
            const block = new Block(JSON.parse(request.payload).body);
            const result = await myBlockChain.addBlock(block);
            return block;
        } catch (e) {
            return Boom.badRequest('Invalid block');
        }
    }
});


// Route for retrieving a block
server.route({
    method: 'GET',
    path: '/block/{height}',
    handler: async function (request, h) {
        try {
            const height = request.params.height;
            console.log(height)
            return await myBlockChain.getBlock(height);
        } catch (e) {
            return Boom.badRequest('Invalid block');
        }
    }
});


// Start the server
async function start() {
    try {
        console.log(myBlockChain);
        await server.start();
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
    console.log('Server running at:', server.info.uri);
}

start();
