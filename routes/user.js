const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const axios = require('axios'); // axios import 추가

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

// 회원 탈퇴
router.delete('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 카카오 유저라면 연결 끊기 API 호출
    if (user.kakaoId) {
      const KAKAO_ADMIN_KEY = process.env.KAKAO_ADMIN_KEY;
      try {
        const resUnlink = await axios.post(
          'https://kapi.kakao.com/v1/user/unlink',
          `target_id_type=user_id&target_id=${encodeURIComponent(user.kakaoId)}`,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `KakaoAK ${KAKAO_ADMIN_KEY}`,
            },
          }
        );
        console.log('카카오 연결 끊기 성공:', resUnlink.data);
      } catch (err) {
        console.error('카카오 연결 끊기 실패:', err.response?.data || err);
      }
    }

    await User.findByIdAndDelete(req.user.userId);
    res.json({ message: '회원 탈퇴 및 카카오 연결 해제 완료' });
  } catch (error) {
    res.status(500).json({ error: '회원 탈퇴 또는 카카오 연결 해제 중 서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
