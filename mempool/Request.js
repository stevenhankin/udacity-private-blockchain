module.exports = class Request {
    /**
     * Models a Request
     */


    /**
     * Dual purpose constructor
     *
     * Two approaches are supported:
     * 1) Accept a wallet address and validation window and determine the other fields
     * 2) Construct with all supplied and recognised arguments
     * Approach 2 is when the Object contains additional LokiJS metadata that
     * we want to strip out before passing back to blockchain to avoid pollution
     *
     * @param requestTimeStamp Optional or defaulted to now
     * @param walletAddress Unique public hash for wallet
     * @param message Optional or defaulted
     * @param validationWindow Seconds that the mempool will keep the request
     */
    constructor({requestTimeStamp, walletAddress, message, validationWindow}) {
        this.requestTimeStamp = requestTimeStamp || this._currentTStamp();
        this.walletAddress = walletAddress;
        this.message = message || `${this.walletAddress}:${this.requestTimeStamp}:starRegistry`;
        this.validationWindow = validationWindow;
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
     * Updates the validation window if changed and returns true
     * Otherwise returns false
     *
     * The original timestamp and validation window is known
     * so the latest validation window can be determined
     * based on current timestamp
     * If multiple requests are made and the validation window
     * has not changed then do not update and let caller know
     * (for optimisation)
     *
     * @param defaultValidationWindow defined by mempool
     * @returns {boolean} true if validation window changed
     */
    refreshValidationWindow(defaultValidationWindow) {
        const currentTimeStamp = this._currentTStamp();
        const newValidationWindow = defaultValidationWindow - (parseInt(currentTimeStamp) - parseInt(this.requestTimeStamp));
        if (this.validationWindow !== newValidationWindow ) {
            this.validationWindow = newValidationWindow;
            return true;
        }
        return false;
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
