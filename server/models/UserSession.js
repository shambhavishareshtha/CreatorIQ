import mongoose from 'mongoose';
const schema = new mongoose.Schema({ account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true, index: true }, tokenHash: { type: String, required: true, unique: true }, csrfHash: { type: String, required: true }, csrfToken: { type: String, required: true }, expiresAt: { type: Date, required: true, index: { expires: 0 } }, }, { timestamps: true });
export const UserSession = mongoose.models.UserSession || mongoose.model('UserSession', schema);
