const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  subject:     { type: String, required: true },
  description: { type: String },
  creator:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Question 모델의 필드를 여기로 통합
  type:        { type: String, enum: ['multiple', 'ox', 'subjective'], required: true },
  content:     { type: String, required: true },
  options:     [{ type: String }], // 객관식/ox일 때 사용
  answer:      { type: mongoose.Schema.Types.Mixed, required: true }, // string or array
  explanation: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);
