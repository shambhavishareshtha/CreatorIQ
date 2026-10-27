import mongoose from 'mongoose';
export async function connectDatabase(uri) { if (!uri) throw new Error('MONGODB_URI is not configured'); return mongoose.connect(uri,{serverSelectionTimeoutMS:8000}); }
