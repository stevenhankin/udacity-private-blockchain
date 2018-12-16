/* ===== Executable Test ==================================
|  Use this file to test your project.
|  =========================================================*/

const BlockChain = require('./BlockChain.js');
const Block = require('./Block.js');
let myBlockChain = new BlockChain.Blockchain();


// Test: Each second, add one block to blockchain
(function theLoop(i) {
    setTimeout(function () {
        let blockTest = new Block("Test Block - " + (i + 1) );
        myBlockChain
            .addBlock(blockTest)
            .then(result => {
                i++;
                console.log(`Added block ${i}`);
                if (i < 10) {
                	theLoop(i);
				}
            },(reason) => console.error(reason))
            .catch(reason => {
                console.log('Failed to add a block:', reason);
            });
    }, 1000);
})(0);


/***********************************************
 ** Function to get the Height of the Chain ****
 ***********************************************/
myBlockChain.getBlockHeight().then(height => {
    console.log(height);
}).catch(err => {
    console.error(err);
});


/***********************************************
 ******** Function to Get a Block  *************
 ***********************************************/
myBlockChain.getBlock(0).then(block => {
	console.log('Get Block', JSON.stringify(block));
}).catch((err) => {
	console.error('Block does not exist');
});

// Validate Genesis Block
myBlockChain.validateBlock(0).then(valid => console.log(valid)).catch(err => console.error(err));

// Validate 2nd block
myBlockChain.validateBlock(1).then(valid => console.log(valid)).catch(err => console.error(err));

// Validate 3rd block
myBlockChain.validateBlock(2).then(valid => console.log(valid)).catch(err => console.error(err));


/** Tampering a Block this is only for the purpose of testing the validation methods */
myBlockChain.getBlock(5).then((block) => {
	let blockAux = block;
	blockAux.body = "Tampered Block";
	myBlockChain._modifyBlock(blockAux.height, blockAux).then((blockModified) => {
		if(blockModified){
			myBlockChain.validateBlock(blockAux.height).then((valid) => {
				console.log(`Block #${blockAux.height}, is valid? = ${valid}`);
			})
			.catch((error) => {
				console.error(error);
			})
		} else {
			console.log("The Block wasn't modified");
		}
	}).catch((err) => { console.log(err);});
}).catch((err) => { console.log(err);});


myBlockChain.getBlock(3).then((block) => {
	let blockAux = block;
	blockAux.previousBlockHash = "jndininuud94j9i3j49dij9ijij39idj9oi";
	myBlockChain._modifyBlock(blockAux.height, blockAux).then((blockModified) => {
		if(blockModified){
			console.log("The Block was modified");
		} else {
			console.log("The Block wasn't modified");
		}
	}).catch((err) => { console.log(err);});
}).catch((err) => { console.log(err);});


/***********************************************
 ***************** Validate Chain  *************
 ***********************************************/
myBlockChain.validateChain().then((errorLog) => {
	if(errorLog.length > 0){
		console.log("The chain is not valid:");
		errorLog.forEach(error => {
			console.log(error);
		});
	} else {
		console.log("No errors found, The chain is Valid!");
	}
}).catch((error) => {
	console.log(error);
});
