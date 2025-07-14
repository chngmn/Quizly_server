const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // 카카오 로그인용 필드
  kakaoId: { type: String, sparse: true, unique: true },
  // 이메일/비밀번호 로그인용 필드
  email: { type: String, sparse: true, unique: true },
  password: { type: String },
  // 공통 필드
  nickname: { type: String, required: true, unique: true },
  profileImage: { type: String },
  refreshToken: { type: String }, // 카카오 refresh token 저장
  // 추가 정보
  gender: { type: String, enum: ['male', 'female', 'other'] },
  school: { 
    type: String, 
    enum: [
      'seoul_national', 'yonsei', 'korea', 'sungkyunkwan', 'hanyang', 
      'kyunghee', 'sogang', 'hongik', 'dongguk', 'chungang', 
      'kookmin', 'sejong', 'konkuk', 'kaist', 'other'
    ] 
  },
  marketingAgreement: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
