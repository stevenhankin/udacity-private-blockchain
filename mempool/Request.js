module.exports = class Request {
    /**
     * TODO: doc
     */

// {requestTimeStamp: string, walletAddress: *, message: string, validationWindow: number}

    /**
     *
     * @param walletAddress Unique public hash for wallet
     * @param validationWindow Seconds that the mempool will keep the request
     */
    constructor(walletAddress, validationWindow) {
        this.requestTimeStamp = this._currentTStamp();
        this.walletAddress = walletAddress;
        this.message = `${this.walletAddress}:${this.requestTimeStamp}:starRegistry`;
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
     * Returns a copy with an updated validation window
     *
     * The original timestamp and validation window is known
     * so the latest validation window can be determined
     * based on current timestamp
     *
     * @param defaultValidationWindow
     * @returns {module.Request}
     */
    refreshedValidationWindow(defaultValidationWindow) {
        const currentTimeStamp = this._currentTStamp();
        const validationWindow = defaultValidationWindow - (parseInt(currentTimeStamp) - parseInt(this.requestTimeStamp));
        return new Request(this.walletAddress, validationWindow);
    }


    /**
     * Getter
     *
     * @returns {string}
     */
    getWalletAddress() {
        return this.walletAddress;
    }
}