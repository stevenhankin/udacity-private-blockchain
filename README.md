# Project #4 - Build a Private Blockchain Notary Service

* Star Registry Service that allows users to claim ownership of their favorite star in the night sky
* Implemented as a blockchain that is persisted using LevelDB and made externally available via a Web API (HAPI framework)
* A mempool stores validated and signed requests using [LokiJS](http://lokijs.org/#/)



## Setup


### Requirements

[Node](http://nodejs.org/) is really easy to install & now include [NPM](https://npmjs.org/).
You should be able to run the following command after the installation procedure below:

    $ node --version
    v11.5.0

    $ npm --version
    6.5.0


### Installation

To setup the project for review do the following:

    $ git clone https://github.com/stevenhankin/udacity-private-blockchain.git
    $ cd udacity-private-blockchain
    $ npm install


### Project structure
Key files are listed below:
```bash
├── app
│   ├── api
│   │   └── routes.js      <-- Controller for HTTP routing, initialises mempool/ledger
│   ├── blockchain
│   │   ├── Block.js       <-- Block model
│   │   ├── BlockChain.js  <-- BlockChain functionality
│   │   └── Ledger.js      <-- Wrapper for LevelDB file storage
│   ├── mempool
│   │   ├── MemPool.js     <-- Wrapper for LokiJS in-memory database
│   │   └── Request.js     <-- Request model
│   └── server.js          <-- MAIN entry point
├── config
│   └── default.json       <-- Project constants
└── test
```
Node modules, documentation, etc are not included above


### Running the project

To start the Web API on **localhost:8000**, run the following:

    $ npm start


### Testing the project

When the Web API service is running, just run the following in a separate shell:

    $ npm test

This is a comprehensive test suite using [Mocha](https://mochajs.org)


## API

Resource | Description | Example
--- | --- | ---
Request Validation | /requestValidation | `curl -X POST   http://localhost:8000/requestValidation -H 'Content-Type: application/json'    -H 'cache-control: no-cache'  -d '{    "address":"18ecEqCy8LfsK17b4v5ansJfXpiyhDzB3T"}'`
Validate a Signature | /message-signature/validate | `curl -X POST http://localhost:8000/message-signature/validate -H 'Content-Type: application/json'   -H 'cache-control: no-cache'  -d '{"address":"18ecEqCy8LfsK17b4v5ansJfXpiyhDzB3T",   "signature":"H2mEWlo0AnE6XjUIkDpSV93XAawqib3kHa+uIPWGphklO+bF5hrMNdVqu0NTgVvolZ/WV6uJi8mwXB/7by8K0KQ="}'`
Post a claim for a star | /block | `curl -X POST http://localhost:8000/block-H 'Content-Type: application/json'-H 'cache-control: no-cache' -d $'{"address":"18ecEqCy8LfsK17b4v5ansJfXpiyhDzB3T",  "star": {"dec": "68° 52\' 56.9","ra": "16h 29m 1.0s","story": "Found star using https://www.google.com/sky/"}}'`
Get star block by block hash | /stars/hash:[HASH] | `curl -X GET http://localhost:8000/stars/hash:6f508d6ab09a044e7dd2795b76f0945fb48ae670d4ce547a46594f6d13931d1c -H 'Content-Type: application/json'   -H 'cache-control: no-cache'`
Get stars by wallet address | /stars/address:[ADDRESS] | `curl -X GET http://localhost:8000/stars/address:18ecEqCy8LfsK17b4v5ansJfXpiyhDzB3T -H 'Content-Type: application/json'   -H 'cache-control: no-cache'`
Get star block by block height | /block/{height} | `curl --location --request GET "http://localhost:8000/block/1"`
Get BlockChain info | /info | `curl --location --request GET "http://localhost:8000/info"`
Validate BlockChain | /validateChain | `curl --location --request GET "http://localhost:8000/validateChain"`

## Samples (API Outputs)
Below are examples of inputs and formatted outputs from CLI
#### /requestValidation 
###### input
```shell
curl -X POST   http://localhost:8000/requestValidation \
        -H 'Content-Type: application/json' \
        -H 'cache-control: no-cache'  -d '{"address":"18ecEqCy8LfsK17b4v5ansJfXpiyhDzB3T"}'
```
###### output
```json
{
  "walletAddress": "18ecEqCy8LfsK17b4v5ansJfXpiyhDzB3T",
  "requestTimeStamp": "1546255945",
  "message": "18ecEqCy8LfsK17b4v5ansJfXpiyhDzB3T:1546255945:starRegistry",
  "validationWindow": 300
}
````

#### /message-signature/validate 
###### input
```shell
curl -X POST \
  http://localhost:8000/message-signature/validate \
  -H 'Content-Type: application/json' \
  -H 'cache-control: no-cache' \
  -d '{"address":"18ecEqCy8LfsK17b4v5ansJfXpiyhDzB3T",   
       "signature":"H6CdLlHZBfDcUbl2iGzMFXPVfn4EEtHLagia4yQP1M6vDxuk7PSg71lr6Cb75DeF+HrSnooqjKAYFlHcfeOruSk="}'
```
###### output
```json
{
  "registerStar": true,
  "status": {
    "address": "18ecEqCy8LfsK17b4v5ansJfXpiyhDzB3T",
    "requestTimeStamp": "1546256313",
    "message": "18ecEqCy8LfsK17b4v5ansJfXpiyhDzB3T:1546256313:starRegistry",
    "validationWindow": 300,
    "messageSignature": true
  }
}
````

#### /block
###### input
```shell
curl -X POST \
  http://localhost:8000/block \
  -H 'Content-Type: application/json' \
  -H 'cache-control: no-cache' \
  -d $'{"address":"18ecEqCy8LfsK17b4v5ansJfXpiyhDzB3T", 
       "star": {
                "dec": "68° 52\' 56.9",
                "ra": "16h 29m 1.0s",
                "story": "Found star using https://www.google.com/sky/"
            }
}'
```
###### output
```json
{
  "hash": "78cd0333a2065660785244293241007ac5a029b881fbc873c00ac9d96bca7364",
  "height": 31,
  "body": {
    "address": "18ecEqCy8LfsK17b4v5ansJfXpiyhDzB3T",
    "star": {
      "dec": "68° 52' 56.9",
      "ra": "16h 29m 1.0s",
      "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f"
    }
  },
  "time": "1546256476",
  "previousBlockHash": "ab499550ea6b727ae5148eda016d4f2b03605b40038943935d8044cd2256e328"
}
````

#### /stars/hash:[HASH]
###### input
```shell
curl -X GET http://localhost:8000/stars/hash:78cd0333a2065660785244293241007ac5a029b881fbc873c00ac9d96bca7364  \
     -H 'Content-Type: application/json'  \
     -H 'cache-control: no-cache' 
```
###### output
```json
{
  "hash": "78cd0333a2065660785244293241007ac5a029b881fbc873c00ac9d96bca7364",
  "height": 31,
  "body": {
    "address": "18ecEqCy8LfsK17b4v5ansJfXpiyhDzB3T",
    "star": {
      "dec": "68° 52' 56.9",
      "ra": "16h 29m 1.0s",
      "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
      "storyDecoded": "Found star using https://www.google.com/sky/"
    }
  },
  "time": "1546256476",
  "previousBlockHash": "ab499550ea6b727ae5148eda016d4f2b03605b40038943935d8044cd2256e328"
}
````

#### /stars/address:[ADDRESS] 
###### input
```shell
curl -X GET http://localhost:8000/stars/address:18ecEqCy8LfsK17b4v5ansJfXpiyhDzB3T  \
     -H 'Content-Type: application/json' -H 'cache-control: no-cache' 
```
###### output
```json
[
  {
    "hash": "78cd0333a2065660785244293241007ac5a029b881fbc873c00ac9d96bca7364",
    "height": 31,
    "body": {
      "address": "18ecEqCy8LfsK17b4v5ansJfXpiyhDzB3T",
      "star": {
        "dec": "68° 52' 56.9",
        "ra": "16h 29m 1.0s",
        "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
        "storyDecoded": "Found star using https://www.google.com/sky/"
      }
    },
    "time": "1546256476",
    "previousBlockHash": "ab499550ea6b727ae5148eda016d4f2b03605b40038943935d8044cd2256e328"
  }
]
````

#### /block/{height}
###### input
```shell
curl -X GET http://localhost:8000/block/1 -H 'Content-Type: application/json'   -H 'cache-control: no-cache'
```
###### output
```json
{
  "hash": "dd3cb5c31adb75702ae97bd0b79e0cf92d4286d9dc0cfe5f41a40158bf1c0d65",
  "height": 1,
  "body": {
    "address": "1DHEcCVTpQisJVwoDtoSzyD86SwzmY4UzG",
    "star": {
      "dec": "68° 52' 56.9",
      "ra": "16h 29m 1.0s",
      "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
      "storyDecoded": "Found star using https://www.google.com/sky/"
    }
  },
  "time": "1546255664",
  "previousBlockHash": "78c601d161387579963fd8462717c53b188ce95f8baffb612edc4df8b50768a5"
}
````


## Documentation 
Documentation can be generated via esdoc as follows:

    $ npm run docs

The html output will be in the ./docs subfolder


## What I learned with this Project

* Implementing a "Mempool" in-memory store using [Loki](http://lokijs.org/#/)
* Creating JS tests using [Mocha](https://mochajs.org)
* Signing and validating messages using Bitcoin core libraries
* Routing using [hapi](https://hapijs.com)
* Exposing blockchain interaction via a Web API
* RESTful API testing using Postman
* Error handling using [Boom](https://www.npmjs.com/package/boom)
