const mongoose = require('mongoose');

const wrongQuizSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  submittedAnswer: { type: mongoose.Schema.Types.Mixed }, 
  correctAnswer: { type: mongoose.Schema.Types.Mixed },
  recordedAt: { type: Date, default: Date.now }
}, { _id: false });

const recordSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz:      { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  isCorrect: { type: Boolean, required: true },
  everWrong: { type: Boolean, default: false }, // 한 번이라도 틀린 적이 있는지 여부
  submittedAnswer: { type: mongoose.Schema.Types.Mixed },
  wrongQuizzes: [wrongQuizSchema]
}, { timestamps: true });

module.exports = mongoose.model('Record', recordSchema);