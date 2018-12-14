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
                    console.log('HERE')
                    self.addBlock(block)
                        .then((result) => console.log(result));
                }
            })
            .catch(reason => console.log('Failed to create Genesis Block: ', reason))
    }

    // Get block height, it is auxiliar method that return the height of the blockchain
    getBlockHeight() {
        return this.db.getBlocksCount()
    }

    // Add new block
    addBlock(newBlock) {
        console.log('In addBlock()');
        let self = this;
        return new Promise(
            (resolve, reject) => {
                self.getBlockHeight()
                    .then(height => self.db.addLevelDBData(height, newBlock)
                        .then(result => resolve(result))
                        .catch(reason => reject(reason)))
                    .catch(reason => reject(reason));
            }
        )
        // return this.db.addLevelDBData(newBlock)
    }

    // Get Block By Height
    getBlock(height) {
        return this.db.getLevelDBData(height)
    }

    // Validate if Block is being tampered by Block Height
    validateBlock(height) {
        // Add your code here
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
            self.db.addLevelDBData(height, JSON.stringify(block).toString()).then((blockModified) => {
                resolve(blockModified);
            }).catch((err) => {
                console.log(err);
                reject(err)
            });
        });
    }

}

module.exports.Blockchain = Blockchain;