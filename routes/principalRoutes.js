const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getPrincipalData,
} = require("../controllers/principalController");

const router = express.Router();

router.get("/", protect, getPrincipalData);

module.exports = router;
