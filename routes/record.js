const express = require('express');
const router = express.Router();
const Record = require('../models/Record');

// 응시 기록 저장
router.post('/', async (req, res) => {
  try {
    const record = new Record(req.body);
    await record.save();
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 기록 조회 등도 필요에 따라 추가
module.exports = router;
