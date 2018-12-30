const request = require('request')
const chai = require('chai');
const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');
const crypto = require("crypto");
const assert = chai.assert;    // Using Assert style
const should = chai.should();  // Using Should style
chai.use(require('chai-json-schema'));
chai.tv4.multiple = true;

/* These will be setup during test sequence */
let message = null;
let address = null;
let keyPair = null;
let signature = null;
let starHash = null;
const BLOCKS_TO_CREATE = 10;


const requestObjectSchema = {
    required: ['walletAddress',
        'requestTimeStamp',
        'message', 'validationWindow'],
    properties: {
        "walletAddress": {type: 'string'},
        "requestTimeStamp": {type: 'string'},
        "message": {type: 'string'},
        "validationWindow": {type: 'number'}
    }
};

const statusObjSchema = {
    required: ["address", "requestTimeStamp", "message", "validationWindow", "messageSignature"],
    properties: {
        "address": {type: 'string'},
        "requestTimeStamp": {type: 'string'},
        "message": {type: 'string'},
        "validationWindow": {type: 'number'},
        "messageSignature": {type: 'boolean'}
    }
};

const blockRespSchema = {
    required:
        ["hash", "height", "body", "time", "previousBlockHash"],
    properties: {
        "hash": {type: 'string'},
        "height": {type: 'number'},
        "body": {type: 'object'},
        "time": {type: 'string'},
        "previousBlockHash": {type: 'string'}
    }
};


describe('(create a new address)', () => {
    it('should provide an address and a keypair for other tests', (done) => {
        // Always generate random rng so that we can rerun the test
        const rng = () => Buffer.from(crypto.randomBytes(16).toString('hex'));
        keyPair = bitcoin.ECPair.makeRandom({rng: rng});
        address = bitcoin.payments.p2pkh({pubkey: keyPair.publicKey}).address;
        console.log('New address:', address);
        done();
    });
});


let firstValWindow = null;
describe('POST: /requestValidation', function () {
    it('should provide a valid response', function (done) {
        request.post({
            url: 'http://localhost:8000/requestValidation',
            body: JSON.stringify({address})
        }, (err, httpResponse, body) => {
            try {
                if (err) {
                    done(err);
                }
                const jBody = JSON.parse(body);
                console.log(jBody)
                assert.equal(httpResponse.statusCode, 200);
                assert.jsonSchema(jBody, requestObjectSchema);
                message = jBody.message;
                firstValWindow = jBody.validationWindow;
                done();
            } catch (err) {
                done(err);
            }
        });
    });
});

describe('Check validation window updates on new requests', function () {
    it('should reduced validation window on later request', function (done) {
        this.timeout(2000); // Prevent test-case timeout; we need to wait for validation window to change
        setTimeout(() =>
                request.post({
                    url: 'http://localhost:8000/requestValidation',
                    body: JSON.stringify({address})
                }, (err, httpResponse, body) => {
                    try {
                        if (err) {
                            done(err);
                        }
                        const jBody = JSON.parse(body);
                        console.log(jBody)
                        assert.equal(httpResponse.statusCode, 200);
                        assert.jsonSchema(jBody, requestObjectSchema);
                        assert.isBelow(jBody.validationWindow, firstValWindow);
                        message = jBody.message;
                        done();
                    } catch (err) {
                        done(err);
                    }
                })
            , 1200);
    });
});


/**
 * Utility to generate multiple blocks
 *
 * @param {number} block Index of block to create
 */
const generateBlocks = (block) => {

    describe(`POST: /requestValidation (block ${block})`, function () {
        it('should provide a valid response', function (done) {
            request.post({
                url: 'http://localhost:8000/requestValidation',
                body: JSON.stringify({address})
            }, (err, httpResponse, body) => {
                try {
                    if (err) {
                        done(err);
                    }
                    const jBody = JSON.parse(body);
                    console.log(jBody)
                    assert.equal(httpResponse.statusCode, 200);
                    assert.jsonSchema(jBody, requestObjectSchema);
                    message = jBody.message;
                    firstValWindow = jBody.validationWindow;
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });
    });

    describe('(signing the message)', () => {
        it('should have input (from previous test)', (done) => {
            assert.isNotNull(message);
            done();
        });
        it('should provide a signed message', (done) => {
            const privateKey = keyPair.privateKey;
            signature = bitcoinMessage.sign(message, privateKey, keyPair.compressed).toString('base64');
            console.log('Signature:', signature.toString('base64'));
            done();
        });
    });


    describe(`POST: /message-signature/validate (block ${block})`, () => {
        it('should have inputs (from previous test)', (done) => {
            assert.isNotNull(address);
            assert.isNotNull(signature);
            done();
        });
        it('should provide a valid response when a valid address/signature is supplied', function (done) {
            request.post({
                url: 'http://localhost:8000/message-signature/validate',
                body: JSON.stringify(
                    {
                        address,
                        signature
                    })
            }, (err, httpResponse, body) => {
                try {
                    if (err) {
                        done(err);
                    }
                    const jBody = JSON.parse(body);
                    console.log(jBody);
                    assert.equal(httpResponse.statusCode, 200);
                    assert.jsonSchema(jBody.status, statusObjSchema);
                    done();
                } catch (err) {
                    console.error(err);
                    done(err);
                }
            });
        });
    });


    describe(`POST: /block (block ${block})`, () => {
        it('should provide a valid response', function (done) {
            request.post({
                url: 'http://localhost:8000/block',
                body: JSON.stringify(
                    {
                        address,
                        star: {
                            "dec": "68° 52' 56.9",
                            "ra": "16h 29m 1.0s",
                            "story": "Found star using https://www.google.com/sky/"
                        }
                    })
            }, (err, httpResponse, body) => {
                try {
                    if (err) {
                        done(err);
                    }
                    const jBody = JSON.parse(body);
                    console.log(jBody);
                    assert.equal(httpResponse.statusCode, 200);
                    assert.jsonSchema(jBody, blockRespSchema);
                    starHash = jBody.hash;
                    console.log('starHash',starHash)
                    done();
                } catch (err) {
                    console.error(err);
                    done(err);
                }
            });
        });
    });
};



for (let block=1;block<=BLOCKS_TO_CREATE;block++) {
    generateBlocks(block);
}





describe('GET: /stars/hash:[HASH]', () => {
    it('should have input (from previous test)', (done) => {
        assert.isNotNull(starHash);
        console.log(starHash);
        done();
    });
    it('should provide a valid response', function (done) {
        request.get({
            url: 'http://localhost:8000/stars/hash:' + starHash,
            body: JSON.stringify(
                {
                    address,
                    star: {
                        "dec": "68° 52' 56.9",
                        "ra": "16h 29m 1.0s",
                        "story": "Found star using https://www.google.com/sky/"
                    }
                })
        }, (err, httpResponse, body) => {
            try {
                if (err) {
                    done(err);
                }
                const jBody = JSON.parse(body);
                console.log(jBody);
                assert.equal(httpResponse.statusCode, 200);
                assert.jsonSchema(jBody, blockRespSchema);
                starHash = jBody.hash;
                done();
            } catch (err) {
                console.error(err);
                done(err);
            }
        });
    });
});


describe('GET: /stars/address:[ADDRESS]', () => {
    it('should provide a valid response', function (done) {
        request.get({
            url: 'http://localhost:8000/stars/address:' + address,
            body: JSON.stringify(
                {
                    address,
                    star: {
                        "dec": "68° 52' 56.9",
                        "ra": "16h 29m 1.0s",
                        "story": "Found star using https://www.google.com/sky/"
                    }
                })
        }, (err, httpResponse, body) => {
            try {
                if (err) {
                    done(err);
                }
                const jBody = JSON.parse(body);
                console.log(jBody);
                assert.equal(httpResponse.statusCode, 200);
                assert.jsonSchema(jBody[0], blockRespSchema);
                // Created multiple blocks for the random address
                // and they should all be returned as an array
                assert.equal(jBody.length,BLOCKS_TO_CREATE);
                starHash = jBody.hash;
                done();
            } catch (err) {
                console.error(err);
                done(err);
            }
        });
    });
});


describe('GET: /block/[HEIGHT]', () => {
    it('should retrieve block 1 (first block after genesis)', function (done) {
        request.get({
            url: 'http://localhost:8000/block/1',
            body: JSON.stringify(
                {
                    address,
                    star: {
                        "dec": "68° 52' 56.9",
                        "ra": "16h 29m 1.0s",
                        "story": "Found star using https://www.google.com/sky/"
                    }
                })
        }, (err, httpResponse, body) => {
            try {
                if (err) {
                    done(err);
                }
                const jBody = JSON.parse(body);
                console.log(jBody);
                assert.equal(httpResponse.statusCode, 200);
                assert.jsonSchema(jBody, blockRespSchema);
                starHash = jBody.hash;
                done();
            } catch (err) {
                console.error(err);
                done(err);
            }
        });
    });
});
