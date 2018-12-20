/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

const SHA256 = require("crypto-js/sha256");

module.exports = class Block {
    constructor(data) {
        // Default properties for a new block
        this.hash = '';
        this.height = 0;
        this.body = data;
        this.time = new Date().getTime().toString().slice(0, -3);
        this.previousBlockHash = '';
    }


    // Create a block hash of all the elements
    // but EXCLUDING the hash so that we can
    // validate the same hash every time
    //
    // Note that we are using a double SHA hash
    // to give some protection against 'birthday attacks'
    getBlockHash() {
        return SHA256(SHA256(JSON.stringify({...this,hash:''})).toString()).toString();
    }
};
