const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    prefix: { type: String, required: true, match: /^[A-Z]$/, message: 'Prefix is a single capital letter' },
    description: { type: String, trim: true, maxlength: 200 },
    open: { type: Boolean, default: true, index: true },
    // rolling service-time statistics (fed automatically by completed tokens)
    avgDurationMin: { type: Number, default: 5 },
    stdDevMin: { type: Number, default: 1 },
    lastNumbers: { type: Number, default: 0 }, // tokens issued today
    counterDate: { type: String },             // YYYY-MM-DD the counter resets on
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);
