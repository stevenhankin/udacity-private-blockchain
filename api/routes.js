const Boom = require('boom');
const Joi = require('joi');
const BlockChain = require('../blockchain/BlockChain.js');
const Block = require('../blockchain/Block.js');
let myBlockChain = new BlockChain();


module.exports = function assignRoutes(server) {


    // Web API POST endpoint to validate request with JSON response
    server.route({
        method: 'POST',
        path: '/requestValidation',
        handler: async function (request, h) {
            try {
                const requestAddress = request.payload.address;
                // console.log('payload',request.payload)
                console.log('requestAddress',requestAddress)
                const validationResponse = await myBlockChain.requestValidation(requestAddress);

                return validationResponse;
            } catch (e) {
                return Boom.badRequest('Invalid request - please check API');
            }
        },
        // config: {
        //     validate: {
        //         // A Bitcoin address, or simply address, is an identifier of 26-35 alphanumeric characters, beginning with the number 1 or 3
        //         // See https://en.bitcoin.it/wiki/Address
        //         payload: {
        //             address: Joi.any().required() //.required().min(26).max(35).regex(/^[1|3]/)
        //         },
        //         // Validation Response will be in this example format:
        //         // {
        //         //     "walletAddress": "19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL",
        //         //     "requestTimeStamp": "1544451269",
        //         //     "message": "19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL:1544451269:starRegistry",
        //         //     "validationWindow": 300
        //         // }
        //         // ...where:
        //         //    Message format = [walletAddress]:[timeStamp]:starRegistry
        //         //    validationWindow = seconds left until validation expires
        //         response: {
        //             walletAddress: Joi.string(),
        //             requestTimeStamp:Joi.string(),
        //             message:Joi.string(),
        //             validationWindow:Joi.string()
        //         }
        //     }
        // }
    });

    // Web API POST endpoint validates message signature with JSON response
    server.route({
        method: 'POST',
        path: '/message-signature/validate',
        handler: async function (request, h) {
            try {
                const body = request.payload.body;
                const block = new Block(body);
                const validationResponse = await myBlockChain.validateMessageSignature(request);
                // Example response format:
                // {
                //     "registerStar": true,
                //     "status": {
                //     "address": "19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL",
                //         "requestTimeStamp": "1544454641",
                //         "message": "19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL:1544454641:starRegistry",
                //         "validationWindow": 193,
                //         "messageSignature": true
                //     }
                // }
                return validationResponse;
            } catch (e) {
                return Boom.badRequest('Invalid request - please check API');
            }
        },
        options: {
            validate: {
                payload: {
                    // A Bitcoin address, or simply address, is an identifier of 26-35 alphanumeric characters, beginning with the number 1 or 3
                    // See https://en.bitcoin.it/wiki/Address
                    address: Joi.string().min(26).max(35).regex(/^[1|3]/)
                }
            }
        }
    });


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

