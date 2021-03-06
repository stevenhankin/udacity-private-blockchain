const loki = require('lokijs');
const Request = require('./Request');
const BitcoinMessage = require('bitcoinjs-message');
const config = require('config');
const VALIDATION_WINDOW = config.get("mempool.validationWindow");

/**
 * LokiJS is an in-memory synchronous database
 * (it's synchronous because it's single-threaded
 * and in-memory hence you won't see callbacks below)
 */

module.exports = class MemPool {

    /**
     * Starts the LokiJS in-memory database
     * and instantiates a Request collection
     *
     * @fires lokijs.Loki#addCollection
     */
    constructor() {
        this.db = new loki("blockchain.db");
        this.requests = this.db.addCollection("request");
    }


    /**
     * Updates an existing request or adds if new
     *
     * When a new request is created it is set with the default validation window
     * and a timeout call to remove the request once the window expires.
     * If a successful validation occurs before the timeout, the timeout will be cancelled
     * and the message flagged as correctly signed.
     *
     * @fires lokijs.Collection#update
     * @fires lokijs.Collection#insert
     * @param {Request} request Request to add into mempool
     * @returns {Request} request with current validation window
     * @private
     */
    _upsertRequest(request) {
        const existingRequest = this.requests.findObject({walletAddress: request.getWalletAddress()});
        if (existingRequest) {
            if (existingRequest.messageSignature) {
                throw new Error("Request was already signed");
            }
            // Existing request: make sure validation window is current
            let updatedRequest = new Request(existingRequest);
            Object.assign(existingRequest, updatedRequest);
            this.requests.update(existingRequest);
            return existingRequest;
        } else {
            // Once the Validation Window expires, the request will be removed from mempool
            request.timeoutID = setTimeout(this._removeRequest(request), VALIDATION_WINDOW * 1000);
            this.requests.insert(request);
            return request;
        }
    }


    /**
     * Generates a function to delete a specified request
     *
     * When the returned function is executed, the request
     * (which is unique for an address) is removed from the Mempool
     *
     * @fires lokijs.Collection#findAndRemove
     * @param walletAddress String that represents a unique wallet address
     * @returns {Function} Mempool request deleter
     * @private
     */
    _removeRequest({walletAddress}) {
        return () => {
            this.requests.findAndRemove({walletAddress});
        };
    }


    /**
     * Updates an existing request (validation window) or creates new
     *
     * @param walletAddress
     * @returns {Request} A new or modified request
     */
    addARequestValidation(walletAddress) {
        const request = new Request({walletAddress, validationWindow: VALIDATION_WINDOW});
        const newRequest = this._upsertRequest(request);
        // LokiJS metadata and additional Request fields are stripped out
        return {
            "walletAddress":newRequest.walletAddress,
            "requestTimeStamp":newRequest.requestTimeStamp,
            "message":newRequest.message,
            "validationWindow":newRequest.validationWindow
        };
    }


    /**
     * Returns the request for the wallet address
     * There is only either 1 or 0 requests in the mempool for an address
     *
     * @param {string} walletAddress
     * @param {string} signature
     * @returns {Request}
     */
    validateRequestByWallet(walletAddress, signature) {
        const request = this.requests.find({walletAddress})[0];
        if (!request) {
            throw new Error('No pending request for address');
        }
        if (request.messageSignature) {
            throw new Error('Request already successfully signed - you can already register a star');
        }
        const isValid = BitcoinMessage.verify(request.message, walletAddress, signature);
        if (isValid) {
            // Once correctly signed, the timeout is cancelled
            clearTimeout(request.timeoutID);
            // Flag this request as permissioned for registering a single star
            request.messageSignature = true;
            this.requests.update(request);
            // Prepare return payload
            return {
                "registerStar": true,
                "status": {
                    "address": request.walletAddress,
                    "requestTimeStamp": request.requestTimeStamp,
                    "message": request.message,
                    "validationWindow": request.validationWindow,
                    "messageSignature": true
                }
            };
        }
        throw new Error("Invalid signature");
    }


    /**
     * Verify that the address has been signed
     *
     * @param {string} walletAddress signed wallet address
     * @returns {boolean} true if the address has already been verified with a correct signature
     */
    verifyAddressRequest(walletAddress) {
        const request = this.requests.find({walletAddress})[0];
        if (!request) {
            throw new Error('Not a valid address');
        }
        if (!request.messageSignature) {
            throw new Error('Address not signed/authorized');
        }
        return true;
    }


    /**
     * Removes request from MemPool
     *
     * Used to ensure that a request can only be used
     * to claim one star on the blockchain
     *
     * @param {string} walletAddress address to remove from mempool
     */
    removeRequestFromPool(walletAddress) {
        this.requests.findAndRemove({walletAddress});
    }

};
