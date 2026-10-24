const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['customer', 'staff'], default: 'customer' },
    phone: { type: String, trim: true, maxlength: 15 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
