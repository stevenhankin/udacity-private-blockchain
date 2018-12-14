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
        return this.db.get(key).then(block => {
            return new Promise((resolve,reject) =>{
                resolve(JSON.parse(block))
            })
        });
    }

    // Add data to levelDB with key and value (Promise)
    addLevelDBData(key, value) {
        return this.db.put(key, JSON.stringify(value).toString());
    }

    // Method that returns the height
    getBlocksCount() {
        let self = this;
        // Count each Block from the stream
        // and return the final count
        // when the stream ends
        let blockCount = 0;
        return new Promise(function (resolve, reject) {
            console.log("getBlocksCount()");
            self.db.createReadStream()
                .on('data', (data) => blockCount=blockCount+1)
                .on('error', (err) => reject(err))
                .on('end', () => resolve(blockCount))
                .on('close', () => resolve(blockCount))
        });
    }

}

module.exports.LevelSandbox = LevelSandbox;