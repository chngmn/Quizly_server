const express = require('express');
const router = express.Router();
const Major = require('../models/Major');

// 모든 전공 조회
router.get('/', async (req, res) => {
  try {
    const majors = await Major.find({});
    res.json(majors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
