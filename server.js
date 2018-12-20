'use strict';

const Hapi = require('hapi');
const Boom = require('boom');
const BlockChain = require('./BlockChain.js');
const Block = require('./Block.js');
let myBlockChain = new BlockChain();


// Create a server with a host and port
const server = Hapi.server({
    host: 'localhost',
    port: 8000
});


/*******************   Routes defined below   ********************/

// Route for retrieving a block
// at a specified height
server.route({
        method: 'GET',
        path: '/block/{height}',
        handler: async function (request, h) {
            try {
                const height = request.params.height;
                return await myBlockChain.getBlock(height);
            } catch (e) {
                return Boom.badRequest('Invalid block: height should be 0..n');
            }
        }
    }
);


// Route for adding a block
// The complete block is returned to the client
server.route({
    method: 'POST',
    path: '/block',
    handler: async function (request, h) {
        try {
            if (!request.payload) {
                return Boom.badData('Cannot create an empty block')
            }
            const body = request.payload.body;
            const block = new Block(body);
            await myBlockChain.addBlock(block);
            return block;
        } catch (e) {
            return Boom.badRequest('Invalid block');
        }
    }
});


// Route for retrieving information on the Blockchain
// Currently only the height is returned
server.route({
    method: 'GET',
    path: '/info',
    handler: async function (request, h) {
        try {
            return {height: await myBlockChain.getBlockHeight()};
        } catch (e) {
            return Boom.badRequest('Invalid block');
        }
    }
});


// Route for validating the BlockChain
// Since this is a non-mutating action, it's a GET rather than a POST
server.route({
    method: 'GET',
    path: '/validateChain',
    handler: async function (request, h) {
        try {
            const invalidBlocks = await myBlockChain.validateChain();
            return {valid: true, invalidBlocks}
        } catch (invalidBlocks) {
            return {valid: false, invalidBlocks}
        }
    }
});


/*******************   Server starts here   ********************/

// Start the server
async function start() {
    try {
        await server.start();
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
    console.log('Server running at:', server.info.uri);
}

start();
