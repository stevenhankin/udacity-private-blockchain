const loki = require('lokijs');
const Request = require('./Request');

/**
 * LokiJS is an in-memory synchronous database
 * (it's synchronous because it's single-threaded
 * and in-memory hence you won't see callbacks below)
 */

// const VALIDATION_WINDOW = 60 * 5; // Validation window is set to 5 minutes
const VALIDATION_WINDOW = 20; //TODO : remove this test setting

module.exports = class MemPool {
    /**
     * TODO: doc
     */

    /**
     * Starts the LokiJS in-memory database
     * and instantiates a Request collection
     *
     * @fires lokijs.Loki#addCollection
     */
    constructor() {
        this.db = new loki('blockchain.db');
        this.requests = this.db.addCollection('request');
    }


    /**
     * Updates an existing request or adds if new
     *
     * When a new request is created it is set with the default validation window
     * and a timeout call to remove the request once the window expires. If the
     *
     * @fires lokijs.Collection#update
     * @fires lokijs.Collection#insert
     * @param {Request} request Request to add into mempool
     * @private
     */
    _upsertRequest(request) {
        console.log('_upsertRequest')
        const existingRequest = this.requests.findObject({walletAddress: request.getWalletAddress()});
        console.log('existingRequest', existingRequest)
        if (existingRequest) {
            console.log('Request already exists!', existingRequest)
            const updatedRequest = existingRequest.refreshedValidationWindow(VALIDATION_WINDOW)
            console.log('updatedRequest', updatedRequest);
            this.requests.update(updatedRequest);
        } else {
            console.log('new request..')
            this.requests.insert(request);
            // Once the Validation Window expires, the request will be removed from mempool
            setTimeout(this._removeRequest(request), VALIDATION_WINDOW * 1000);
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
        console.log('called _removeRequest', walletAddress);
        return () => {
            this.requests.findAndRemove({walletAddress});
        }
    }


    /**
     * Updates an existing request (validation window) or creates new
     *
     * @param requestAddress Wallet address
     * @returns {module.Request|*} A new or modified request
     */
    addARequestValidation(requestAddress) {
        const request = new Request(requestAddress, VALIDATION_WINDOW);
        this._upsertRequest(request);
        return request;
    }


    validateRequestByWallet() {
        // TODO : Return a validRequest
    }


    verifyAddressRequest() {
        // TODO : Return isValid response
    }
};
