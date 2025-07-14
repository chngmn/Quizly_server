require('dotenv').config();
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const userRouter = require('./routes/user');

const app = express();
const port = 8000;

app.use(express.json());
app.use(cors());
app.use('/api/user', userRouter);

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
      // 기존 유저: 프로필 정보 업데이트
      user.nickname = kakaoUser.properties.nickname;
      user.profileImage = kakaoUser.properties.profile_image;
      user.refreshToken = refresh_token;
      await user.save();
      
      // school, gender 등 추가 정보가 없으면 needsAdditionalInfo: true로 응답
      if (!user.school || !user.gender) {
        return res.status(200).json({
          needsAdditionalInfo: true,
          kakaoId: user.kakaoId,
          nickname: user.nickname,
          profileImage: user.profileImage,
          refreshToken: user.refreshToken,
        });
      }
      
      // 추가 정보가 모두 있으면 바로 로그인 처리
      const quizlyToken = jwt.sign(
        { userId: user._id, nickname: user.nickname },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      return res.status(200).json({
        message: '로그인 성공',
        token: quizlyToken,
        user: {
          id: user._id,
          nickname: user.nickname,
          profileImage: user.profileImage,
        },
      });
    } else {
      // 신규 유저: 임시 유저 생성 (추가 정보 입력 후 완전히 저장)
      console.log('신규 카카오 유저 생성:', kakaoUser.id);
      const tempUser = new User({
        kakaoId: kakaoUser.id,
        nickname: kakaoUser.properties.nickname,
        profileImage: kakaoUser.properties.profile_image,
        refreshToken: refresh_token,
      });
      await tempUser.save();
      console.log('임시 유저 저장 완료:', tempUser._id);
      
      return res.status(200).json({
        needsAdditionalInfo: true,
        kakaoId: tempUser.kakaoId,
        nickname: tempUser.nickname,
        profileImage: tempUser.profileImage,
        refreshToken: tempUser.refreshToken,
      });
    }
  } catch (error) {
    console.error('카카오 로그인 처리 중 오류 발생:', error);
    res.status(500).json({ error: '카카오 로그인 처리 실패' });
  }
});

// 카카오 추가 정보 입력(최종 회원가입)
app.post('/api/auth/kakao/complete-signup', async (req, res) => {
  try {
    const { kakaoId, nickname, profileImage, refreshToken, gender, school, marketingAgreement } = req.body;
    console.log('카카오 회원가입 완료 요청:', { kakaoId, nickname, gender, school });
    
    if (!kakaoId || !nickname || !gender || !school) {
      return res.status(400).json({ error: '필수 정보를 모두 입력해주세요.' });
    }
    
    // 닉네임 중복 체크 (같은 kakaoId가 아닌 다른 유저와 중복 체크)
    const existingNickname = await User.findOne({ 
      nickname, 
      kakaoId: { $ne: kakaoId } 
    });
    if (existingNickname) {
      return res.status(400).json({ error: '이미 사용 중인 닉네임입니다.' });
    }
    
    // 해당 카카오 유저 찾기
    let user = await User.findOne({ kakaoId });
    if (!user) {
      return res.status(404).json({ error: '카카오 유저를 찾을 수 없습니다.' });
    }
    
    // gender 값 처리 (프론트엔드에서 이미 영어로 보내고 있음)
    let genderValue = gender;
    // 혹시 한글 값이 들어올 경우를 대비한 변환
    if (gender === '남성') genderValue = 'male';
    if (gender === '여성') genderValue = 'female';
    if (gender === '기타') genderValue = 'other';
    
    // school 한글 → 영어 enum 변환
    const schoolMap = {
      '서울대': 'seoul_national',
      '연세대': 'yonsei',
      '고려대': 'korea',
      '성균관대': 'sungkyunkwan',
      '한양대': 'hanyang',
      '경희대': 'kyunghee',
      '서강대': 'sogang',
      '홍익대': 'hongik',
      '동국대': 'dongguk',
      '중앙대': 'chungang',
      '국민대': 'kookmin',
      '세종대': 'sejong',
      '건국대': 'konkuk',
      '카이스트': 'kaist',
      '기타': 'other'
    };
    let schoolValue = schoolMap[school] || school;
    
    // 유저 정보 업데이트
    user.nickname = nickname;
    user.profileImage = profileImage;
    user.refreshToken = refreshToken;
    user.gender = genderValue;
    user.school = schoolValue;
    user.marketingAgreement = marketingAgreement || false;
    await user.save();
    console.log('카카오 유저 정보 업데이트 완료:', user._id);
    
    const quizlyToken = jwt.sign(
      { userId: user._id, nickname: user.nickname },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log('카카오 회원가입 완료:', user.nickname);
    res.status(200).json({
      message: '회원가입 성공',
      token: quizlyToken,
      user: {
        id: user._id,
        nickname: user.nickname,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error('카카오 추가 정보 입력 처리 중 오류:', error);
    res.status(500).json({ error: '카카오 추가 정보 입력 처리 실패' });
  }
});

app.listen(port, () => {
  console.log(`Quizly backend listening at http://localhost:${port}`);
});
