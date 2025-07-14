const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');

// 특정 전공에 속한 과목 조회
router.get('/:majorId', async (req, res) => {
  try {
    const subjects = await Subject.find({ major: req.params.majorId });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
