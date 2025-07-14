const mongoose = require('mongoose');

const majorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('Major', majorSchema);
