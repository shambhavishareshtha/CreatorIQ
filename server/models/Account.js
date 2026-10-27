import mongoose from 'mongoose';
const schema = new mongoose.Schema({ email: { type: String, required: true, lowercase: true, trim: true, unique: true, maxlength: 254, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }, passwordHash: { type: String, required: true, select: false } }, { timestamps: true });
export const Account = mongoose.models.Account || mongoose.model('Account', schema);
