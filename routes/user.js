const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// 내 프로필 정보 조회
router.get('/profile', auth, async (req, res) => {
  try {
    // auth 미들웨어에서 추가해준 userId로 사용자 정보를 찾음
    const user = await User.findById(req.user.userId).select('-refreshToken -kakaoId'); // 민감한 정보 제외
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
