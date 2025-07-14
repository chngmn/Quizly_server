const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  major: { type: mongoose.Schema.Types.ObjectId, ref: 'Major', required: true }
});

module.exports = mongoose.model('Subject', subjectSchema);
