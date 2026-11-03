const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 40 },
    kind: { type: String, enum: ['category', 'tag'], default: 'category' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
