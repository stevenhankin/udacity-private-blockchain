const Boom = require('boom');
const Joi = require('joi');
const BlockChain = require('../blockchain/BlockChain.js');
const Block = require('../blockchain/Block.js');
let myBlockChain = new BlockChain();


module.exports = function assignRoutes(server, memPool) {

    //
    // requestValidation(requestAddress){
    //     const requestObject = this.MemPool.addARequestValidation(requestAddress);
    //     console.log('** requestObject',requestObject)
    //     return requestObject;
    // }


    // Web API POST endpoint to validate request with JSON response
    server.route({
        method: 'POST',
        path: '/requestValidation',
        handler: async function (request, h) {
            try {
                const requestAddress = request.payload.address;
                // console.log('payload',request.payload)
                console.log('requestAddress', requestAddress)
                // const validationResponse = await myBlockChain.requestValidation(requestAddress);
                const validationResponse = await memPool.addARequestValidation(requestAddress);

                return validationResponse;
            } catch (e) {
                return Boom.badRequest(e.message);
            }
        },
        options: {
            validate: {
                payload: {
                    // A Bitcoin address, or simply address, is an identifier of 26-35 alphanumeric characters, beginning with the number 1 or 3
                    // See https://en.bitcoin.it/wiki/Address
                    address: Joi.string().required().min(26).max(35).regex(/^[1|3]/)
                }
            }
        }
        // config: {
        //     validate: {
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
                const address = request.payload.address;
                const signature = request.payload.signature;
                const validationResponse = memPool.validateRequestByWallet(address, signature);
                return validationResponse;
            } catch (e) {
                return Boom.badRequest(e.message);
            }
        },
        options: {
            validate: {
                payload: {
                    address: Joi.string().required(),
                    signature: Joi.string().required()
                }
            }
        }
    });


    // Route for adding a block
    // The complete block is returned to the client
    server.route({
        method: 'POST',
        path: '/block',
        handler: async function (request, h) {
            try {
                const address = request.payload.address;
                const star = request.payload.star;
                const encodedStory = Buffer.from(star.story, 'utf8').toString('hex');
                console.log('encodedStory:',encodedStory);
                if (memPool.verifyAddressRequest(address)) {
                    const encodedStar = {
                        ...star,
                        story:encodedStory
                    };
                    const body ={
                        address,
                        encodedStar
                    };
                    console.log('body:',body);
                    const block = new Block(body);
                    await myBlockChain.addBlock(block);
                    // Make sure only one Star can be send in the request
                    memPool.removeRequestFromPool(address);
                    return block;
                }
            } catch (e) {
                return Boom.badRequest(e.message);
            }
        },
        options: {
            validate: {
                payload: {
                    address: Joi.string().required(),
                    star: Joi.object().required()
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

