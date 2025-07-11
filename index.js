require('dotenv').config();
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const mongoose = require('mongoose'); // mongoose 임포트
const User = require('./models/User'); // User 모델 임포트

const app = express();
const port = 8000;

app.use(express.json());
app.use(cors());

const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID;
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/quizly'; // MongoDB URI

// MongoDB 연결
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send('Hello from Quizly Backend (Node.js/Express)!');
});

app.post('/api/auth/kakao', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: '인가 코드가 없습니다.' });
  }

  try {
    const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: KAKAO_CLIENT_ID,
        redirect_uri: KAKAO_REDIRECT_URI,
        code: code,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    const { access_token, refresh_token } = tokenResponse.data;
    console.log('카카오 토큰 발급 성공:', access_token);

    const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    const kakaoUser = userResponse.data;
    console.log('카카오 사용자 정보:', kakaoUser);

    // 자체 서비스 사용자 처리 (MongoDB 연동)
    let user;
    const existingUser = await User.findOne({ kakaoId: kakaoUser.id });

    if (existingUser) {
      // 기존 사용자 업데이트
      existingUser.nickname = kakaoUser.properties.nickname;
      existingUser.profileImage = kakaoUser.properties.profile_image;
      await existingUser.save();
      user = existingUser;
    } else {
      // 새 사용자 생성
      user = await User.create({
        kakaoId: kakaoUser.id,
        nickname: kakaoUser.properties.nickname,
        profileImage: kakaoUser.properties.profile_image,
      });
    }

    const quizlyToken = jwt.sign(
      { userId: user._id, nickname: user.nickname }, // 자체 DB의 _id 사용
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: '로그인 성공',
      token: quizlyToken,
      user: {
        id: user._id, // 자체 DB의 ID 반환
        nickname: user.nickname,
        profileImage: user.profileImage,
      },
    });

  } catch (error) {
    console.error('카카오 로그인 처리 중 오류 발생:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: '카카오 로그인 처리 실패' });
  }
});

app.listen(port, () => {
  console.log(`Quizly backend listening at http://localhost:${port}`);
});

// 로그아웃 엔드포인트
app.post('/api/auth/logout', (req, res) => {
  console.log('로그아웃 요청 수신. 클라이언트에서 토큰 삭제 처리됨.');
  res.status(200).json({ message: '로그아웃 성공' });
});
