const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema(
  {
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    number: { type: Number, required: true },
    display: { type: String, required: true }, // "A-14"
    state: { type: String, enum: ['waiting', 'called', 'serving', 'done', 'no-show', 'cancelled'], default: 'waiting', index: true },
    noShowCount: { type: Number, default: 0 },
    calledAt: { type: Date },
    servedStartAt: { type: Date },
    doneAt: { type: Date },
    durationMin: { type: Number }, // service time, feeds the rolling average
  },
  { timestamps: true }
);

tokenSchema.index({ service: 1, number: 1 });
tokenSchema.index({ user: 1, state: 1 });

module.exports = mongoose.model('Token', tokenSchema);
