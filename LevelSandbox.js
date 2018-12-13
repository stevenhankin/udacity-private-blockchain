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
        let self = this;
        return new Promise(function (resolve, reject) {
            self.db.get(key, (err, value) => {
                if (err) reject(err);
                resolve(value)
            })
        });
    }

    // Add data to levelDB with key and value (Promise)
    addLevelDBData(key, value) {
        let self = this;
        return new Promise((resolve, reject) => {
                console.log('will put ', value);
                self.db.put(key, (err, value) => {
                    if (err) reject(err);
                    resolve(value)
                })
            }
        );
    }

    // Method that returns the height
    getBlocksCount() {
        let self = this;
        // Count each Block from the stream
        // and return the final count
        // when the stream ends
        let blockCount = 0;
        return new Promise(function (resolve, reject) {
            self.db.createReadStream()
                .on('data', (data) => blockCount++)
                .on('error', (err) => reject(err))
                .on('end', () => resolve(blockCount))
        });
    }

}

module.exports.LevelSandbox = LevelSandbox;