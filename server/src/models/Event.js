const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, maxlength: 2000, default: '' },
    location: { type: String, trim: true, maxlength: 200 },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date },
    coverImage: { type: String },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['active', 'cancelled'], default: 'active' },
  },
  { timestamps: true }
);
eventSchema.index({ community: 1, startsAt: 1 });

module.exports = mongoose.model('Event', eventSchema);
