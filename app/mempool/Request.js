module.exports = class Request {
    /**
     * Models a Request
     */


    /**
     * @param requestTimeStamp Optional or defaulted to now
     * @param origTimeStamp The first timestamp so that validation window can be computed accurately
     * @param walletAddress Unique public hash for wallet
     * @param message Optional or defaulted
     * @param validationWindow Seconds that the mempool will keep the request
     */
    constructor({requestTimeStamp, origTimeStamp, walletAddress, message, validationWindow}) {
        this.requestTimeStamp = requestTimeStamp || this._currentTStamp();
        this.origTimeStamp = origTimeStamp || this.requestTimeStamp  ;
        this.walletAddress = walletAddress;
        this.message = `${this.walletAddress}:${this.requestTimeStamp}:starRegistry`;
        this.validationWindow = validationWindow - (this.requestTimeStamp - this.origTimeStamp);
    }


    /**
     * Calculates UTC timestamp as a string
     *
     * @returns {string} current UTC timestamp
     * @private
     */
    _currentTStamp () {
        return new Date().getTime().toString().slice(0, -3);
    }


    /**
     * Getter
     *
     * @returns {string}
     */
    getWalletAddress() {
        return this.walletAddress;
    }


    /**
     * Getter
     *
     * @returns {string}
     */
    getMessage(){
        return this.message;
    }

};
