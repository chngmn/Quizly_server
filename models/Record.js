const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  question:  { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  answer:    { type: mongoose.Schema.Types.Mixed, required: true },
  isCorrect: { type: Boolean }
}, { _id: false });

const recordSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz:      { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  answers:   [answerSchema],
  score:     { type: Number },
  startedAt: { type: Date },
  submittedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Record', recordSchema);
