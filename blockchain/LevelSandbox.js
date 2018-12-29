/* ===== Persist data with LevelDB ==================
|  Learn more: level: https://github.com/Level/level |
/===================================================*/

const level = require('level');
const chainDB = './chaindata';

class LevelSandbox {

    constructor() {
        this.db = level(chainDB);
    }

    // Get data from levelDB with key (Promise)
    getLevelDBData(key) {
        return this.db.get(key)
            .then(block => {
                return new Promise((resolve, reject) => {
                    try {
                        const jsonText = JSON.parse(block);
                        resolve(jsonText)
                    }
                    catch (error) {
                        reject(error)
                    }
                })
            })
    }

    // Add data to levelDB with key and value (Promise)
    addLevelDBData(key, value) {
        return this.db.put(key, JSON.stringify(value).toString());
    }

    // Method that returns the height by counting all the blocks
    // from a Level DB stream. Resolves once all blocks are counted
    // and rejects if any error occurs
    getBlocksCount() {
        let self = this;
        // Count each Block from the stream
        // and return the final count
        // when the stream ends
        let blockCount = 0;
        return new Promise(function (resolve, reject) {
            self.db.createReadStream()
                .on('data', () => blockCount=blockCount+1)
                .on('error', (err) => reject(err))
                .on('end', () => resolve(blockCount))
        });
    }

    // Return a readable stream of all the block IDs
    getBlockIndexStream() {
        return this.db.createKeyStream();
    }

    // Return a readable stream of all the blocks
    getBlockStream() {
        return this.db.createValueStream();
    }

}

module.exports.LevelSandbox = LevelSandbox;