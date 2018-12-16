/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

const SHA256 = require('crypto-js/sha256');
const LevelSandbox = require('./LevelSandbox.js');
const Block = require('./Block.js');

class Blockchain {


    constructor() {
        this.db = new LevelSandbox.LevelSandbox();
        this.generateGenesisBlock();
    }

    // Method to create a Genesis Block (always with height = 0)
    // You have to options, because the method will always execute when you create your blockchain
    // you will need to set this up statically or instead you can verify if the height !== 0 then you
    // will not create the genesis block
    generateGenesisBlock() {
        let self = this;
        // Only create the Genesis Block if chain is 0 height
        this.getBlockHeight()
            .then(
                height => {
                    if (height === 0) {
                        self.addBlock(new Block("First block in the chain - Genesis Block"))
                    }
                })
            .catch(reason => console.error('Failed to create Genesis Block: ', reason))
    }


    // Get block height by counting blocks in chain
    // This will be equivalent to <height of top block> + 1
    getBlockHeight() {
        return this.db.getBlocksCount()
    }


    // Add new block by chaining together promises
    // to get the height of chain..
    // to get the top block..
    // to add a new block with some details based on previous block
    addBlock(newBlock) {
        let self = this;
        return new Promise((resolve, reject) => {
                self.getBlockHeight()
                    .then(height => {
                        if (height === 0) {
                            // This will be the Genesis Block
                            newBlock.hash = newBlock.getBlockHash();
                            self.db.addLevelDBData(0, newBlock)
                                .then(resolve('Genesis Block created'))
                                .catch(reject('Failed to add Genesis Block'))
                        } else {
                            // Need previous block to determine
                            // new height and previous block hash
                            return self.getBlock(height - 1)
                                .then(prevBlock => {
                                    newBlock.height = prevBlock.height + 1;
                                    newBlock.previousBlockHash = prevBlock.hash;
                                    // Only can compute the hash AFTER the block is setup
                                    // since those details form part of the hash
                                    newBlock.hash = newBlock.getBlockHash();
                                    self.db.addLevelDBData(newBlock.height, newBlock)
                                        .then(resolve('Block created'))
                                        .catch(reject('Failed to add block'))
                                })
                                .catch(() => reject(`failed to get Block ${height}`))
                        }
                    })
                    .catch(() => reject('failed to getBlockHeight'));
            }
        )
    }


    // Get Block By Height
    getBlock(height) {
        return this.db.getLevelDBData(height)
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


    // Validate Blockchain
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
            // Need to know the blockchain height before we start
            // so that we know when we've checked ALL the blocks
            self.getBlockHeight()
                .then((height) => {
                    this.db.getBlockIndexStream()
                        .on('data', block => {
                            self.validateBlock(block)
                                .then((message) => chainValidator(height),
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

}

module.exports.Blockchain = Blockchain;