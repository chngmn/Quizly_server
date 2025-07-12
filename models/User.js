const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  kakaoId: { type: String, required: true, unique: true },
  nickname: { type: String, required: true },
  profileImage: { type: String },
  refreshToken: { type: String }, // 카카오 refresh token 저장
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
