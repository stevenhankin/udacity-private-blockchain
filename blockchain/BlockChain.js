/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

const LevelSandbox = require('./LevelSandbox.js');
const Block = require('./Block.js');


module.exports = class BlockChain {


    constructor() {
        this.db = new LevelSandbox.LevelSandbox();
    }


    /**
     * Hard-coded genesis block
     *
     * @returns {module.Block|*}
     */
    static genesisBlock() {
        let genesisBlock = new Block("First block in the chain - Genesis Block");
        genesisBlock.hash = genesisBlock.getBlockHash();
        return genesisBlock;
    }


    // Returns a requestObject from the mempool

    // /**
    //  * Requests a validation object (which will be stored in mempool)
    //  *
    //  * @param requestAddress Wallet address
    //  * @returns {module.Request|*}  Request object with current validation window
    //  */
    // requestValidation(requestAddress){
    //     const requestObject = this.MemPool.addARequestValidation(requestAddress);
    //     console.log('** requestObject',requestObject)
    //     return requestObject;
    // }


    // /**
    //  * Validate the signature for a request
    //  *
    //  * If valid, the timeout will be removed from the request in the mempool
    //  *
    //  * @param {string} address
    //  * @param {string} signature
    //  */
    // validateRequestByWallet(address,signature) {
    //     console.log('validateRequestByWallet');
    //     const request = this.MemPool.getRequest(address);
    //     if (!request) {
    //         throw Error('No such request pending');
    //     }
    //     console.log(request.getMessage());
    //     console.log(`verify: ${request.getMessage()},${address},${signature}`)
    //     let isValid = BitcoinMessage.verify(request.getMessage(), address, signature);
    //     if (isValid) {
    //
    //     }
    //     console.log('isValid',isValid)
    //     console.log('request---',JSON.stringify(request))
    //     return {isValid}//TODO
    // }


    /**
     * Get block height by counting blocks in chain
     * This will be equivalent to <height of top block> + 1
     *
     * @returns {number} block height
     */
    getBlockHeight() {
        return this.db.getBlocksCount()
    }


    /**
     * Utility to inject a decoded story into block
     * (but NOT for genesis block)
     *
     * @param block
     * @return {Block} block with a storyDecoded
     * @private
     */
    _withDecodedStory(block) {
        console.log('_withDecodedStory', block);
        if (block.height > 0) {
            const encodedStory = block.body.star.story;
            const storyDecoded = Buffer.from(encodedStory, 'hex').toString('utf8');
            block.body.star.storyDecoded = storyDecoded;
        }
        return block;
    }


    /**
     * Gets Block By Height
     * or throw error that the block does not exist
     *
     * @param height
     * @returns {Promise}
     */
    getBlock(height) {
        let self = this;
        return this.db.getLevelDBData(height)
            .then(block => {
                    return self._withDecodedStory(block);
                },
                () => {
                    throw new Error(`No block at height ${height}`)
                })
    }


    /**
     * Adds a new block to the chain
     * Additionally, when adding a new block to the chain, code checks if a Genesis block already exists
     * If not, one is created before adding the a block
     *
     * @param newBlock
     * @returns {Promise<any | void>}
     */
    addBlock(newBlock) {
        let self = this;
        return new Promise((resolve, reject) => {
            self.getBlockHeight()
                .then(height => {
                        if (height === 0) {
                            // Empty blockchain; create Genesis Block
                            return self.db.addLevelDBData(0, BlockChain.genesisBlock())
                                .then(() => {
                                    return 1
                                })
                        } else {
                            // Genesis block already exists so nothing to do here
                            // except pass-through the height
                            return height
                        }
                    }
                )
                .then((height) => {
                    // Need previous block to determine
                    // new height and previous block hash
                    return self.getBlock(height - 1)
                })
                .then(prevBlock => {
                    newBlock.height = prevBlock.height + 1;
                    newBlock.previousBlockHash = prevBlock.hash;
                    // Only can compute the hash AFTER the block is setup
                    // since those details form part of the hash
                    newBlock.hash = newBlock.getBlockHash();
                    return self.db.addLevelDBData(newBlock.height, newBlock)
                })
                .then(result => resolve(result))
                .catch(err => reject(err))
        }).catch(err => console.error('Failed to add a new block - ', err))
    }


    /**
     * Validates Block at specified height has not been tampered with
     *
     * @param height
     * @returns {Promise<any>}
     */
    validateBlock(height) {
        let self = this;
        return new Promise((resolve, reject) => {
            self.getBlock(height)
                .then(rawBlock => {
                    // Convert the JSON into an actual Block instance
                    // with methods (i.e. the getBlockHash which will
                    // be applied)
                    let block = Object.assign(new Block, rawBlock);
                    return new Promise(() => {
                        const expectedHash = block.getBlockHash();
                        if (block.hash !== expectedHash) {
                            reject(`Block ${height} is invalid. Expected hash ${expectedHash} but got ${block.hash}`)
                        }
                        resolve(`Block ${height} is valid`)
                    })
                })
                .catch(reason => reject(`failed to get Block ${height}`))
        });
    }


    /**
     * Validates BlockChain
     * Return a Promise that will resolve to an array of invalid blocks
     * which is empty if all blocks are valid
     *
     * @returns {Promise<any>}
     */
    validateChain() {
        let self = this;
        let blockCount = 0;
        let errorLog = [];

        return new Promise((resolve, reject) => {
            // Utility to keep a running total of blocks validated
            const chainValidator = (height) => {
                blockCount++;
                // Once all blocks processed, resolve/reject as appropriate
                if (blockCount === height) {
                    if (errorLog.length > 0) {
                        reject(errorLog)
                    } else {
                        resolve(errorLog);
                    }
                }
            };
            // Need to know the BlockChain height before we start
            // so that we know when we've checked ALL the blocks
            self.getBlockHeight()
                .then((height) => {
                    if (height === 0) {
                        resolve();
                    }
                    this.db.getBlockIndexStream()
                        .on('data', block => {
                            self.validateBlock(block)
                                .then(() => chainValidator(height),
                                    (reason) => {
                                        // All invalid blocks are appended
                                        // to array for reporting afterwards
                                        errorLog.push(reason);
                                        chainValidator(height);
                                    })
                                .catch(err => reject(err))
                        })
                        .on('error', (err) => reject(err))
                });
        });
    }

    /**
     * Returns block for Star data with matching hash
     *
     * If all blocks are read and none match then an error is thrown
     *
     * @param {string} hash Hash of block in blockchain to find
     * @returns {Promise<Block>} Promise that represents block for supplied hash
     */
    getStarByHash(hash) {
        let self = this;
        return new Promise((resolve, reject) => {
            this.db.getBlockStream()
                .on('data', blockStr => {
                    const testBlock = JSON.parse(blockStr);
                    if (testBlock.hash === hash) {
                        console.log(testBlock)
                        const block = self._withDecodedStory(testBlock);
                        console.log(block);
                        resolve(block)
                    }
                })
                .on('end', () => reject(new Error('No such hash in blockchain')))
        });
    }


    /**
     * Returns array of Stars with matching address
     *
     * @param {string} address Address of blocks to match
     * @return {Promise<Block[]>} Promise that represents array of blocks for supplied wallet address
     */
    getStarsByAddress(address) {
        let self = this;
        let blockArray = [];
        return new Promise((resolve, reject) => {
            this.db.getBlockStream()
                .on('data', blockStr => {
                    const testBlock = JSON.parse(blockStr);
                    // console.log(testBlock)
                    console.log('testBlock:', testBlock);
                    if (testBlock && testBlock.body && testBlock.body.address === address) {
                        const block = self._withDecodedStory(testBlock);
                        blockArray.push(block);
                        // console.log(block);
                    }
                })
                .on('end', () => resolve(blockArray))
        });
    }


    /**
     * Utility Method to Tamper a Block for Test Validation
     * This method is for testing purpose
     *
     * @param height
     * @param block
     * @returns {Promise<any>}
     * @private
     */
    _modifyBlock(height, block) {
        let self = this;
        return new Promise((resolve, reject) => {
            self.db.addLevelDBData(height, block)
                .then(blockModified => resolve(blockModified))
                .catch(err => reject(err));
        });
    }

};
