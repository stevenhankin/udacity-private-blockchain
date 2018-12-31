const Boom = require('boom');
const Joi = require('joi');
const BlockChain = require('../blockchain/BlockChain.js');
const Block = require('../blockchain/Block.js');
const MemPool = require('../mempool/MemPool.js');


/**
 * @desc Configure routing, setup BlockChain ledger and MemPool
 * @param server
 */
module.exports = function assignRoutes(server) {

    let myBlockChain = new BlockChain();
    let memPool = new MemPool();

    /**
     * Post a request validation for an address
     */
    server.route({
        method: 'POST',
        path: '/requestValidation',
        handler: async function (request, h) {
            try {
                const requestAddress = request.payload.address;
                // validationResponse
                return await memPool.addARequestValidation(requestAddress);
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
    });


    // Web API POST endpoint validates message signature with JSON response
    server.route({
        method: 'POST',
        path: '/message-signature/validate',
        handler: async function (request, h) {
            try {
                const address = request.payload.address;
                const signature = request.payload.signature;
                // validationResponse
                return memPool.validateRequestByWallet(address, signature);
            } catch (e) {
                return Boom.badRequest(e.message);
            }
        },
        options: {
            validate: {
                payload: {
                    address: Joi.string().required().min(26).max(35).regex(/^[1|3]/),
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
                if (memPool.verifyAddressRequest(address)) {
                    const encodedStar = {
                        ...star,
                        story: encodedStory
                    };
                    const body = {
                        address,
                        star: encodedStar
                    };
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
                    address: Joi.string().required().min(26).max(35).regex(/^[1|3]/),
                    star: Joi.object().required()
                }
            }
        }
    });


    /**
     * Get Star block by hash with JSON response.
     *
     * http://localhost:8000/stars/hash:[HASH]
     */
    server.route({
            method: 'GET',
            path: '/stars/hash:{hash}',
            handler: async function (request, h) {
                try {
                    const hash = request.params.hash;
                    return await myBlockChain.getStarByHash(hash);
                } catch (e) {
                    return Boom.badRequest(e.message);
                }
            },
            options: {
                validate: {
                    params: {
                        hash: Joi.string().required().min(60)
                    }
                }
            }
        }
    );


    /**
     * Get Star block by wallet address (blockchain identity)
     * with JSON response.
     *
     * Returns a list of Stars because of one wallet address
     * can be used to register multiple Stars
     *
     * http://localhost:8000/stars/address:[ADDRESS]
     */
    server.route({
            method: 'GET',
            path: '/stars/address:{address}',
            handler: async function (request, h) {
                try {
                    const address = request.params.address;
                    // blockArray
                    return await myBlockChain.getStarsByAddress(address);
                } catch (e) {
                    return Boom.badRequest(e.message);
                }
            },
            options: {
                validate: {
                    params: {
                        address: Joi.string().required().min(26).max(35).regex(/^[1|3]/)
                    }
                }
            }
        }
    );


    /**
     * Get star block by star block height with JSON response.
     *
     * http://localhost:8000/block/[HEIGHT]
     */
    server.route({
            method: 'GET',
            path: '/block/{height}',
            handler: async function (request, h) {
                try {
                    const height = request.params.height;
                    // block
                    return await myBlockChain.getBlockDecodedStory(height);
                } catch (e) {
                    return Boom.badRequest(e.message);
                }
            },
            options: {
                validate: {
                    params: {
                        height: Joi.number().required().min(0)
                    }
                }
            }
        }
    );


    /**
     * Get current info.
     *
     * Only height is currently returned.
     *
     * http://localhost:8000/info
     */
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


    /**
     * Validate BlockChain
     * Since this is a non-mutating action, it's a GET rather than a POST
     */
    server.route({
        method: 'GET',
        path: '/validateChain',
        handler: async function (request, h) {
            try {
                const invalidBlocks = await myBlockChain.validateChain();
                return {valid: true, invalidBlocks};
            } catch (invalidBlocks) {
                if (invalidBlocks) {
                    return {valid: false, invalidBlocks};
                } else {
                    return Boom.serverUnavailable('Unexpected error');
                }
            }
        }
    });

};

