/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

const LevelSandbox = require('./LevelSandbox.js');
const Block = require('./Block.js');

module.exports = class BlockChain {


    constructor() {
        this.db = new LevelSandbox.LevelSandbox();
        // this.generateGenesisBlock();
    }

    // Hard-coded genesis block
    static genesisBlock() {
        let genesisBlock = new Block("First block in the chain - Genesis Block");
        genesisBlock.hash = genesisBlock.getBlockHash();
        return genesisBlock;
    }


    // Get block height by counting blocks in chain
    // This will be equivalent to <height of top block> + 1
    getBlockHeight() {
        return this.db.getBlocksCount()
    }


    // Get Block By Height
    // or return a message that the block does not exist
    getBlock(height) {
        return this.db.getLevelDBData(height)
            .then(block => block,
                () => {
                    throw new Error(`Cannot find block ${height}`)
                })
    }


    // Add a new block to the chain
    // Additionally, when adding a new block to the chain, code checks if a Genesis block already exists
    // If not, one is created before adding the a block
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


    // Validate if Block is being tampered by Block Height
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


    // Validate BlockChain
    // Return a Promise that will resolve to an array of invalid blocks
    // which is empty if all blocks are valid
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


    // Utility Method to Tamper a Block for Test Validation
    // This method is for testing purpose
    _modifyBlock(height, block) {
        let self = this;
        return new Promise((resolve, reject) => {
            self.db.addLevelDBData(height, block)
                .then(blockModified => resolve(blockModified))
                .catch(err => reject(err));
        });
    }

};