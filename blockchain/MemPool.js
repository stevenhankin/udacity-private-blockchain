const loki = require('lokijs');

module.exports = class MemPool {
    constructor() {
        this.db = new loki('blockchain.db');
        // this.pendingValidations = this.db.addCollection('pendingValidations');
    }

    addARequestValidation(requestAddress) {
        // TODO : Return a requestObject
    }

    validateRequestByWallet() {
        // TODO : Return a validRequest
    }

    verifyAddressRequest() {
        // TODO : Return isValid response
    }
};
