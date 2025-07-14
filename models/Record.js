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
  submittedAnswer: { type: mongoose.Schema.Types.Mixed },
  wrongQuizzes: [wrongQuizSchema]
}, { timestamps: true });

module.exports = mongoose.model('Record', recordSchema);