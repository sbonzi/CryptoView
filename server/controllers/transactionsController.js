const TransactionsSchema = require("../models/transactionsModel.js");
const PortfolioSchema = require("../models/userPortfolioModel.js");
const axios = require('axios');
const mongoose = require("mongoose");

const createTransaction = async (req, res) => {
  const { id, quantity, price, spent, date } = req.body;

  const user_id = req.user._id;

  if (!user_id) {
    return res.status(400).json({ error: "User ID is required" });
  }

  if (!id) {
    return res.status(400).json({ error: "Please provide an ID" });
  }

  if (!quantity) {
    return res.status(400).json({ error: "Please provide a quantity" });
  }

  if (!price) {
    return res.status(400).json({ error: "Please provide a price" });
  }

  if (!spent) {
    return res.status(400).json({ error: "Please provide a spend" });
  }

  if (!date) {
    return res.status(400).json({ error: "Please provide a date" });
  }

  try {
    const transaction = await TransactionsSchema.create({
      id,
      quantity,
      price,
      spent,
      date,
      user_id,
    });

    let portfolio = await PortfolioSchema.findOne({ user_id: user_id });

    if (!portfolio) {
      res.status(404).json({
        error: "portfolio not found",
      });
    }

    res.status(200).json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 2. Simple Cryptocurrency Transaction Tracking:
// The Challenge: Build an API endpoint that accepts a cryptocurrency address (Ethereum, for example). It should retrieve the last 5 transactions for that address from a blockchain explorer API (e.g., Etherscan) and store them in MongoDB. Allow users to query for transactions by address and date range.
// Focus: Exposes knowledge of external APIs, data parsing, and efficient database storage.

const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const {address, endDate, startDate} = req.query;

    let now = endDate ? endDate : new Date();

    const userFolio = await PortfolioSchema.findOne({
      user_id: userId,
    }).populate("transactions");

    if (!userFolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    const response = await axios.get(`https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${address}&sort=desc&apikey=${process.env.ETHERSCAN_API_KEY}`);
    const transactions = response.data.result.slice(0,5);

    const transactionsToStore = transactions.map(tx => ({ id: tx.hash ,quantity: 1, price: tx.value, spent: tx.gasUsed, date: new Date(parseInt(tx.timeStamp)  * 1000), user_id: userId }));
    
    try{
      const transactionStored = await TransactionsSchema.insertMany(transactionsToStore);
    }
    catch (error)
    {
      console.log(error)      ;
    }

    const txQuery = {
      user_id : userId,
      date: startDate ? {
         $gte: new Date(startDate),
         $lte: new Date(now)
      }: null
    }
    
    const existingTxs = await TransactionsSchema.find(txQuery);

    res.status(200).json(existingTxs);
  } catch (error) {
    res.status(500).json({
      error: `Unable to return transactions. Error: ${error}`,
    });
  }
};

module.exports = { createTransaction, getTransactions };
