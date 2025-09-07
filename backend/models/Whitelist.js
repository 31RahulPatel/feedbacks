const mongoose = require('mongoose');

const whitelistSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

whitelistSchema.index({ email: 1 });

module.exports = mongoose.model('Whitelist', whitelistSchema);