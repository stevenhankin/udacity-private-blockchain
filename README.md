# Project #4 - Build a Private Blockchain Notary Service

Star Registry Service that allows users to claim ownership of their favorite star in the night sky.
Implemented as a blockchain that is persisted using LevelDB and made externally available
via a Web API (HAPI framework). A mempool stores validated and signed requests using 
[LokiJS](http://lokijs.org/#/)

## Setup

### Requirements

[Node](http://nodejs.org/) is really easy to install & now include [NPM](https://npmjs.org/).
You should be able to run the following command after the installation procedure
below.

    $ node --version
    v11.5.0

    $ npm --version
    6.5.0

### Installation

To setup the project for review do the following:

    $ git clone https://github.com/stevenhankin/udacity-private-blockchain.git
    $ cd udacity-private-blockchain
    $ npm install

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
Get star block by block hash | stars/hash:[HASH] | `curl -X GET http://localhost:8000/stars/hash:6f508d6ab09a044e7dd2795b76f0945fb48ae670d4ce547a46594f6d13931d1c -H 'Content-Type: application/json'   -H 'cache-control: no-cache'`
Get stars by wallet address | stars/address:[ADDRESS] | `curl -X GET http://localhost:8000/stars/address:18ecEqCy8LfsK17b4v5ansJfXpiyhDzB3T -H 'Content-Type: application/json'   -H 'cache-control: no-cache'`
Get star block by block height | /block/{height} | `curl --location --request GET "http://localhost:8000/block/1"`
Get BlockChain info | /info | `curl --location --request GET "http://localhost:8000/info"`
Validate BlockChain | /validateChain | `curl --location --request GET "http://localhost:8000/validateChain"`


## What I learned with this Project

* Implementing a "Mempool" in-memory store using [Loki](http://lokijs.org/#/)
* Creating JS tests using [Mocha](https://mochajs.org)
* Signing and validating messages using Bitcoin core libraries
* Routing using [hapi](https://hapijs.com)
* Exposing blockchain interaction via a Web API
* RESTful API testing using Postman
* Error handling using [Boom](https://www.npmjs.com/package/boom)
