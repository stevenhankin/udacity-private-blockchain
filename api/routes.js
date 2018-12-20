const Boom = require('boom');
const BlockChain = require('../blockchain/BlockChain.js');
const Block = require('../blockchain/Block.js');
let myBlockChain = new BlockChain();


module.exports = function assignRoutes(server) {

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
                    return Boom.badRequest('No such block');
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
                return Boom.badRequest('Invalid request - please check API');
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
                return Boom.badImplementation('Unexpected error', e);
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
                if (invalidBlocks) {
                    return {valid: false, invalidBlocks}
                } else {
                    return Boom.serverUnavailable('Unexpected error')
                }
            }
        }
    });


}

