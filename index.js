require('dotenv').config();
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const app = express();
const port = 8000;

app.use(express.json());
app.use(cors());

const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID;
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/quizly';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send('Hello from Quizly Backend (Node.js/Express)!');
});

// 이메일/비밀번호 회원가입
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, nickname, password, gender, school, marketingAgreement } = req.body;
    if (!email || !nickname || !password) {
      return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '유효한 이메일 주소를 입력해주세요.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: '비밀번호는 최소 6자 이상이어야 합니다.' });
    }
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: '이미 사용 중인 이메일입니다.' });
    }
    const existingNickname = await User.findOne({ nickname });
    if (existingNickname) {
      return res.status(400).json({ error: '이미 사용 중인 닉네임입니다.' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      email,
      nickname,
      password: hashedPassword,
      gender,
      school,
      marketingAgreement: marketingAgreement || false,
    });

    const quizlyToken = jwt.sign(
      { userId: user._id, nickname: user.nickname },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      message: '회원가입 성공',
      token: quizlyToken,
      user: {
        id: user._id,
        nickname: user.nickname,
        email: user.email,
      },
    });

  } catch (error) {
    console.error('회원가입 처리 중 오류 발생:', error);
    res.status(500).json({ error: '회원가입 처리 실패' });
  }
});

// 이메일/비밀번호 로그인
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
    const quizlyToken = jwt.sign(
      { userId: user._id, nickname: user.nickname },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.status(200).json({
      message: '로그인 성공',
      token: quizlyToken,
      user: {
        id: user._id,
        nickname: user.nickname,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('로그인 처리 중 오류 발생:', error);
    res.status(500).json({ error: '로그인 처리 실패' });
  }
});

// 카카오 로그인
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
    const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });
    const kakaoUser = userResponse.data;
    let user = await User.findOne({ kakaoId: kakaoUser.id });
    if (user) {
      user.nickname = kakaoUser.properties.nickname;
      user.profileImage = kakaoUser.properties.profile_image;
      user.refreshToken = refresh_token;
      await user.save();
    } else {
      user = await User.create({
        kakaoId: kakaoUser.id,
        nickname: kakaoUser.properties.nickname,
        profileImage: kakaoUser.properties.profile_image,
        refreshToken: refresh_token,
      });
    }
    const quizlyToken = jwt.sign(
      { userId: user._id, nickname: user.nickname },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.status(200).json({
      message: '로그인 성공',
      token: quizlyToken,
      user: {
        id: user._id,
        nickname: user.nickname,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error('카카오 로그인 처리 중 오류 발생:', error);
    res.status(500).json({ error: '카카오 로그인 처리 실패' });
  }
});

app.listen(port, () => {
  console.log(`Quizly backend listening at http://localhost:${port}`);
});
