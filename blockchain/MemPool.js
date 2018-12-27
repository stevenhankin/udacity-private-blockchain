const loki = require('lokijs');

/**
 * LokiJS is an in-memory synchronous database
 * (it's synchronous because it's single-threaded
 * and in-memory hence you won't see callbacks below)
 */

// const VALIDATION_WINDOW = 60 * 5; // Validation window is set to 5 minutes
const VALIDATION_WINDOW = 20;

module.exports = class MemPool {
    /**
     * TODO: doc
     */

    constructor() {
        this.db = new loki('blockchain.db');
        // this.pendingValidations = this.db.addCollection('pendingValidations');
        this.request = this.db.addCollection('request');
    }


    /**
     * Add a new or update existing request
     *
     * When a new request is created it is set with the default validation window
     * and a timeout call to remove the request once the window expires. If the
     *
     * @param request Request to add into mempool
     */
    addRequest(request) {
        const existingRequest = this.request.findObject({walletAddress: request.walletAddress});
        console.log(existingRequest)
        if (existingRequest) {
            console.log('Request already exists!',existingRequest)
            const requestTimeStamp = existingRequest.requestTimeStamp;
            const currentTimeStamp = new Date().getTime().toString().slice(0, -3);
            const validationWindow = VALIDATION_WINDOW - (parseInt(currentTimeStamp) - parseInt(requestTimeStamp));
            console.log('windowRemaining',validationWindow)
            const updatedRequest = {...existingRequest, validationWindow};

            this.request.update(updatedRequest);
        } else {
            console.log('new request..',this.removeRequest)
            this.request.insert(request);
            // Once the Validation Window expires, the request will be removed from mempool
            setTimeout(this.removeRequest(request), VALIDATION_WINDOW * 1000);
        }
    }


    // Called on the timeout of a request
    // to remove from the mempool (there is
    // only one request per address)
    removeRequest({walletAddress}) {
        console.log('called removeRequest', walletAddress);
        return () => {
            const req = this.request.find({walletAddress});
            if (req) {
                console.log('Removing', req)
                this.request.remove(req);
            } else {
                console.log('Cannot find request')
            }
        }
    }


    // validationWindow - seconds before request times out
    addARequestValidation(requestAddress) {
        const walletAddress = requestAddress;
        const requestTimeStamp = new Date().getTime().toString().slice(0, -3);
        const message = `${requestAddress}:${requestTimeStamp}:starRegistry`;
        const validationWindow = VALIDATION_WINDOW;

        const request = {walletAddress, requestTimeStamp, message, validationWindow};
        this.addRequest(request);


        return request;
    }


    validateRequestByWallet() {
        // TODO : Return a validRequest
    }


    verifyAddressRequest() {
        // TODO : Return isValid response
    }
};
