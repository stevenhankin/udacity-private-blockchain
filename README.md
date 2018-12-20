# Project #3 - Private Blockchain with Web API

The blockchain is persisted using LevelDB and made externally available
via a Web API (HAPI framework)

## Setup

### Requirements

[Node](http://nodejs.org/) is really easy to install & now include [NPM](https://npmjs.org/).
You should be able to run the following command after the installation procedure
below.

    $ node --version
    v8.11.3

    $ npm --version
    6.4.1

### Installation

To setup the project for review do the following:

    $ git clone https://github.com/stevenhankin/udacity-private-blockchain.git
    $ cd udacity-private-blockchain
    $ npm install

### Running the project
To start the Web API on **localhost:8000**, run the following:

    $ npm start


## API

Resource | Description | Example
--- | --- | ---
Get block | /block/{height} | `curl --location --request GET "http://localhost:8000/block/1"`
Get BlockChain info | /info | `curl --location --request GET "http://localhost:8000/info"`
Validate BlockChain | /validateChain | `curl --location --request GET "http://localhost:8000/validateChain"`
Add Block | /block | `curl --location --request POST "http://localhost:8000/block" --header "Content-Type: application/json" --data "{ \"body\": \"Testing block with test string data\" }"`


## Testing the project

Apart from testing the API (with examples available in the API section above), the following utilities can be used to setup and modify blockchain data to help with API testing.

Note: This only works if server.js is NOT running (otherwise a EADDRINUSE will result).

The file __simpleChain.js__ in the blockchain subdirectory has code to facilitate testing the project, please review the comments in the file and uncomment the code to be able to test each feature implemented:

* Uncomment the function:
```
(function theLoop (i) {
	setTimeout(function () {
		let blockTest = new Block.Block("Test Block - " + (i + 1));
		myBlockChain.addNewBlock(blockTest).then((result) => {
			console.log(result);
			i++;
			if (i < 10) theLoop(i);
		});
	}, 10000);
  })(0);
```
This function will create 10 test blocks in the chain.
* Uncomment the function
```
myBlockChain.getBlockChain().then((data) => {
	console.log( data );
})
.catch((error) => {
	console.log(error);
})
```
This function print in the console the list of blocks in the blockchain
* Uncomment the function
```
myBlockChain.getBlock(0).then((block) => {
	console.log(JSON.stringify(block));
}).catch((err) => { console.log(err);});

```
This function get from the Blockchain the block requested.
* Uncomment the function
```
myBlockChain.validateBlock(0).then((valid) => {
	console.log(valid);
})
.catch((error) => {
	console.log(error);
})
```
This function validate and show in the console if the block is valid or not, if you want to modify a block to test this function uncomment this code:
```
myBlockChain.getBlock(5).then((block) => {
	let blockAux = block;
	blockAux.body = "Tampered Block";
	myBlockChain._modifyBlock(blockAux.height, blockAux).then((blockModified) => {
		if(blockModified){
			myBlockChain.validateBlock(blockAux.height).then((valid) => {
				console.log(`Block #${blockAux.height}, is valid? = ${valid}`);
			})
			.catch((error) => {
				console.log(error);
			})
		} else {
			console.log("The Block wasn't modified");
		}
	}).catch((err) => { console.log(err);});
}).catch((err) => { console.log(err);});

myBlockChain.getBlock(6).then((block) => {
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
```
* Uncomment this function:
```
myBlockChain.validateChain().then((errorLog) => {
	if(errorLog.length > 0){
		console.log("The chain is not valid:");
		errorLog.forEach(error => {
			console.log(error);
		});
	} else {
		console.log("No errors found, The chain is Valid!");
	}
})
.catch((error) => {
	console.log(error);
})
```

This function validates the whole chain and return a list of errors found during the validation.


## What I learned with this Project

* Exposing blockchain interaction via a Web API
* RESTful API testing using Postman
* Error handling using Boom
