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
    console.log('Attempting to get Kakao token...');
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
    console.log('Kakao token obtained.');

    const { access_token, refresh_token } = tokenResponse.data;
    console.log('카카오 토큰 발급 성공:', access_token);

    console.log('Attempting to get Kakao user info...');
    const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });
    console.log('Kakao user info obtained.');

    const kakaoUser = userResponse.data;
    console.log('카카오 사용자 정보:', kakaoUser);

    // 자체 서비스 사용자 처리 (MongoDB 연동)
    let user;
    console.log('Searching for existing user...');
    const existingUser = await User.findOne({ kakaoId: kakaoUser.id });
    console.log('Existing user search complete.');

    if (existingUser) {
      console.log('Existing user found. Updating...');
      existingUser.nickname = kakaoUser.properties.nickname;
      existingUser.profileImage = kakaoUser.properties.profile_image;
      existingUser.refreshToken = refresh_token; // refresh_token 저장
      await existingUser.save();
      user = existingUser;
      console.log('Existing user updated.');
    } else {
      console.log('No existing user found. Creating new user...');
      user = await User.create({
        kakaoId: kakaoUser.id,
        nickname: kakaoUser.properties.nickname,
        profileImage: kakaoUser.properties.profile_image,
        refreshToken: refresh_token, // refresh_token 저장
      });
      console.log('New user created.');
    }

    console.log('Signing JWT...');
    const quizlyToken = jwt.sign(
      { userId: user._id, nickname: user.nickname }, // 자체 DB의 _id 사용
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('JWT signed.');

    console.log('Sending success response to frontend...');
    res.status(200).json({
      message: '로그인 성공',
      token: quizlyToken,
      user: {
        id: user._id, // 자체 DB의 ID 반환
        nickname: user.nickname,
        profileImage: user.profileImage,
      },
    });
    console.log('Success response sent.');

  } catch (error) {
    console.error('카카오 로그인 처리 중 오류 발생:', error); // Log the full error object
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    } else if (error.request) {
      console.error('Error request:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
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

// 토큰 재발급 엔드포인트
app.post('/api/auth/refresh-token', async (req, res) => {
  const { userId } = req.body; // 클라이언트에서 userId를 보내준다고 가정

  if (!userId) {
    return res.status(400).json({ error: 'userId가 필요합니다.' });
  }

  try {
    const user = await User.findById(userId);

    if (!user || !user.refreshToken) {
      return res.status(401).json({ error: '유효하지 않은 사용자 또는 리프레시 토큰이 없습니다.' });
    }

    // 새로운 액세스 토큰 생성
    const newQuizlyToken = jwt.sign(
      { userId: user._id, nickname: user.nickname },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token: newQuizlyToken });

  } catch (error) {
    console.error('토큰 재발급 중 오류 발생:', error);
    res.status(500).json({ error: '토큰 재발급 실패' });
  }
});
