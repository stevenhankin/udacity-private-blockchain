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


    /**
     * Get block height by counting blocks in chain
     * This will be equivalent to <height of top block> + 1
     *
     * @returns {number} block height
     */
    getBlockHeight() {
        return this.db.getBlocksCount();
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
        if (block.height > 0) {
            const encodedStory = block.body.star.story;
            block.body.star.storyDecoded = Buffer.from(encodedStory, 'hex').toString('utf8');
        }
        return block;
    }


    /**
     * Gets a Block By Height
     * This is a simple format and is stored in leveldb blockchain
     *
     * @param height
     * @returns {Promise}
     */
    getBlock(height) {
        let self = this;
        return this.db.getLevelDBData(height)
            .then(block => block,
                () => {
                    throw new Error(`No block at height ${height}`);
                });
    }

    /**
     * Gets a Block By Height with a decoded story entry
     *
     * @param height
     * @returns {Promise}
     */
    getBlockDecodedStory(height) {
        let self = this;
        return this.db.getLevelDBData(height)
            .then(block => {
                    return self._withDecodedStory(block);
                },
                () => {
                    throw new Error(`No block at height ${height}`);
                });
    }


    /**
     * Adds a new block to the chain
     * Additionally, when adding a new block to the chain, code checks if a Genesis block already exists
     * If not, one is created before adding the a block
     *
     * @param newBlock Block containing extra meta data that shouldn't be stored in BlockChain
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
                                .then(() => 1);
                        } else {
                            // Genesis block already exists so nothing to do here
                            // except pass-through the height
                            return height;
                        }
                    }
                )
                .then((height) => {
                    // Need previous block to determine
                    // new height and previous block hash
                    return self.getBlock(height - 1);
                })
                .then(prevBlock => {
                    newBlock.height = prevBlock.height + 1;
                    newBlock.previousBlockHash = prevBlock.hash;
                    // Only can compute the hash AFTER the block is setup
                    // since those details form part of the hash
                    newBlock.hash = newBlock.getBlockHash();
                    return self.db.addLevelDBData(newBlock.height, newBlock);
                })
                .then(result => {
                    resolve(result);
                })
                .catch(err => reject(err));
        }).catch(err => console.error('Failed to add a new block - ', err));
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
                            reject(`Block ${height} is invalid. Expected hash ${expectedHash} but got ${block.hash}`);
                        }
                        resolve(`Block ${height} is valid`);
                    });
                })
                .catch(reason => reject(`failed to get Block ${height}`));
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
                        reject(errorLog);
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
                                .catch(err => reject(err));
                        })
                        .on('error', (err) => reject(err));
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
                        const block = self._withDecodedStory(testBlock);
                        resolve(block);
                    }
                })
                .on('end', () => reject(new Error('No such hash in blockchain')));
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
                    if (testBlock && testBlock.body && testBlock.body.address === address) {
                        const block = self._withDecodedStory(testBlock);
                        blockArray.push(block);
                    }
                })
                .on('end', () => resolve(blockArray));
        });
    }

};
