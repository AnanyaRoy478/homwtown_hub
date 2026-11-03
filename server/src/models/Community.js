const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    type: { type: String, enum: ['city', 'town', 'village'], default: 'city' },
    city: { type: String, required: true, trim: true, maxlength: 80 }, // city / village name
    state: { type: String, trim: true, maxlength: 80 },
    description: { type: String, required: true, maxlength: 1000 },
    rules: { type: String, default: '', maxlength: 3000 },
    coverImage: { type: String },
    joinPolicy: { type: String, enum: ['open', 'approval'], default: 'approval' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    memberCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);
communitySchema.index({ name: 'text', city: 'text', state: 'text' });
communitySchema.index({ city: 1 });

module.exports = mongoose.model('Community', communitySchema);
