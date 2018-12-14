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

    // Auxiliar method to create a Genesis Block (always with height= 0)
    // You have to options, because the method will always execute when you create your blockchain
    // you will need to set this up statically or instead you can verify if the height !== 0 then you
    // will not create the genesis block
    generateGenesisBlock() {
        let self = this;
        this.getBlockHeight().then(
            height => {
                console.log('height is ', height)
                if (height === 0) {

                    let block = new Block("First block in the chain - Genesis block");
                    console.log('HERE');
                    self.addBlock(block)
                        .then((result) => console.log(result));
                }
            })
            .catch(reason => console.log('Failed to create Genesis Block: ', reason))
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
        return self.getBlockHeight()
                    .then(height => {
                        if (height === 0) {
                            // This will be the Genesis Block
                            return self.db.addLevelDBData(0, newBlock)
                        } else {
                            return self.getBlock(height - 1)
                                .then(prevBlock => {
                                    newBlock.height = prevBlock.height + 1;
                                    newBlock.previousBlockHash = prevBlock.hash;
                                    newBlock.hash = newBlock.getBlockHash();
                                    console.log('newBlock',newBlock)
                                    return self.db.addLevelDBData(newBlock.height, newBlock)
                                })
                                .catch(reason => console.error('failed to getBlock for height', height, reason))
                        }
                    })
                    .catch(reason => console.error('failed to getBlockHeight', reason));
            }



    // Get Block By Height
    getBlock(height) {
        return this.db.getLevelDBData(height)
    }

    // Validate if Block is being tampered by Block Height
    validateBlock(height) {
        let self = this;
        // Add your code here
        return self.getBlock(height)
            .then(rawBlock => {
                let block = Object.assign(new Block,rawBlock)
                console.log('validating block',block);
                return new Promise((resolve,reject) => {
                    if (block.hash !== block.getBlockHash()) {
                        reject('Hash is invalid')
                    }
                    resolve('Hash is valid')
                })
            })
            .catch(reason => console.error('failed to getBlock for height', height, reason))
    }

    // Validate Blockchain
    validateChain() {
        // Add your code here
    }

    // Utility Method to Tamper a Block for Test Validation
    // This method is for testing purpose
    _modifyBlock(height, block) {
        let self = this;
        return new Promise((resolve, reject) => {
            self.db.addLevelDBData(height, block).then((blockModified) => {
                resolve(blockModified);
            }).catch((err) => {
                console.log(err);
                reject(err)
            });
        });
    }

}

module.exports.Blockchain = Blockchain;