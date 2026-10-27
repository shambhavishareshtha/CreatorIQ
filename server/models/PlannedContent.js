import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'CreatorProfile', required: true, index: true },
  platform: { type: String, enum: ['X', 'Instagram'], required: true },
  topic: { type: String, trim: true, maxlength: 120, default: '' },
  format: { type: String, trim: true, required: true, maxlength: 80 },
  hook: { type: String, trim: true, required: true, maxlength: 2000 },
  objective: { type: String, trim: true, required: true, maxlength: 80 },
  scheduledAt: { type: Date },
  status: { type: String, enum: ['idea', 'drafting', 'ready', 'scheduled', 'published'], default: 'idea', index: true },
  notes: { type: String, trim: true, maxlength: 5000, default: '' },
  experiment: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentExperiment', default: null, index: true },
}, { timestamps: true, strict: 'throw' });
schema.index({ creator: 1, scheduledAt: 1, status: 1 });
export const PlannedContent = mongoose.models.PlannedContent || mongoose.model('PlannedContent', schema);
