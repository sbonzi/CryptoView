const axios = require('axios');
const { Web3 } = require('web3');
const process = require("process");

// 4. Token Balance Lookup:
// The Challenge: Build an API endpoint that accepts a token contract address and a wallet address. It should query the blockchain (using web3.js) to retrieve the balance of the specified token held by the wallet address and return the balance.
// Focus: Understanding of token contracts and token balance retrieval through web3.js.

const erc20Abi = [
  {
    "constant": true,
    "inputs": [
      {
        "name": "account",
        "type": "address"
      }
    ],

    "name":"balanceOf",
    "outputs":[
         {
            "name":"",
            "type":"uint256"
         }
      ],
    "stateMutability":"view",
    "type":"function"
  },
  {
    "constant": true,
    "inputs":[],
    "name":"symbol",
    "outputs":[
       {
          "name":"",
          "type":"string"
       }
    ],
    "type":"function"
 },
 {
  "constant": true,
  "inputs":[],
  "name":"decimals",
  "outputs":[
     {
        "name":"",
        "type":"uint8"
     }
  ],
  "type":"function"
},
];

const getBalance = async (req, res) => {

  const web3 = new Web3(`https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`);
  const {tokenContractAddress, walletAddress} = req.query;

  if (!web3.utils.isAddress(tokenContractAddress) || !web3.utils.isAddress(walletAddress))
    { return res.status(400).send("Invalid Address"); }

  try {

    //contract
    const contract = new web3.eth.Contract(erc20Abi, tokenContractAddress);
    const symbol = await contract.methods.symbol().call();
    const decimals = await contract.methods.decimals().call();

    //get balance
    const balance = await contract.methods.balanceOf(walletAddress).call();

    const formattedBalance = balance / BigInt(10 ** Number(decimals));

    res.status(200).json(`${formattedBalance.toString()} ${symbol}`);
  } catch (error) {
    res.status(500).json({
      error: `Unable to return ${tokenContractAddress} balance for address: ${walletAddress}. Error: ${error}`,
    });
  }
};

module.exports = { getBalance };
