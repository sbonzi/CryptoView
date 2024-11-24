const express = require("express");
const {
  getBalance,
} = require("../controllers/tokensController.js");
const requireAuth = require("../middleware/requireAuth.js");

const router = express.Router();

router.use(requireAuth);

router.get("/", getBalance);

module.exports = router;
