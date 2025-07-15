const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const axios = require('axios'); // axios import 추가
const bcrypt = require('bcryptjs');

// 내 프로필 정보 조회
router.get('/profile', auth, async (req, res) => {
  try {
    // auth 미들웨어에서 추가해준 userId로 사용자 정보를 찾음
    const user = await User.findById(req.user.userId).select('-refreshToken -kakaoId'); // 민감한 정보 제외
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 프로필 정보 업데이트
router.put('/profile', auth, async (req, res) => {
  try {
    const { nickname, email, gender, school, profileImage } = req.body;
    
    // 닉네임 중복 체크 (자신 제외)
    if (nickname) {
      const existingUser = await User.findOne({ 
        nickname, 
        _id: { $ne: req.user.userId } 
      });
      if (existingUser) {
        return res.status(400).json({ error: '이미 사용 중인 닉네임입니다.' });
      }
    }

    // 이메일 중복 체크 (자신 제외)
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: req.user.userId } 
      });
      if (existingUser) {
        return res.status(400).json({ error: '이미 사용 중인 이메일입니다.' });
      }
    }

    const updateData = {};
    if (nickname) updateData.nickname = nickname;
    if (email) updateData.email = email;
    if (gender) updateData.gender = gender;
    if (school) updateData.school = school;
    if (profileImage) updateData.profileImage = profileImage;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true }
    ).select('-refreshToken -kakaoId');

    if (!updatedUser) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    res.json({ 
      message: '프로필이 성공적으로 업데이트되었습니다.',
      user: updatedUser 
    });
  } catch (error) {
    console.error('프로필 업데이트 오류:', error);
    res.status(500).json({ error: '프로필 업데이트 중 서버 오류가 발생했습니다.' });
  }
});

// 비밀번호 변경
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: '새 비밀번호는 최소 6자 이상이어야 합니다.' });
    }
    
    // 사용자 정보 조회
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    // 카카오 로그인 사용자는 비밀번호 변경 불가
    if (user.kakaoId && !user.password) {
      return res.status(400).json({ error: '카카오 로그인 사용자는 비밀번호를 변경할 수 없습니다.' });
    }
    
    // 현재 비밀번호 확인
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: '현재 비밀번호가 일치하지 않습니다.' });
    }
    
    // 새 비밀번호 해시화
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    
    // 비밀번호 업데이트
    await User.findByIdAndUpdate(req.user.userId, {
      password: hashedNewPassword
    });
    
    res.json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
  } catch (error) {
    console.error('비밀번호 변경 오류:', error);
    res.status(500).json({ error: '비밀번호 변경 중 서버 오류가 발생했습니다.' });
  }
});

// 회원 탈퇴
router.delete('/', auth, async (req, res) => {
  try {
    console.log('탈퇴 요청 받음, userId:', req.user.userId);
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      console.log('사용자를 찾을 수 없음');
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    console.log('탈퇴할 사용자 정보:', {
      _id: user._id,
      kakaoId: user.kakaoId,
      nickname: user.nickname
    });

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

    // MongoDB에서 직접 삭제
    const deleteResult = await User.collection.deleteOne({ _id: user._id });
    console.log('삭제 결과:', deleteResult);
    
    console.log('사용자 완전 삭제 완료:', req.user.userId);
    res.json({ message: '회원 탈퇴 및 카카오 연결 해제 완료' });
  } catch (error) {
    console.error('회원 탈퇴 오류:', error);
    res.status(500).json({ error: '회원 탈퇴 또는 카카오 연결 해제 중 서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
