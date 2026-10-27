import 'dotenv/config';
import { createServer } from './server.js';
import { connectDatabase } from './config/database.js';
const port = Number(process.env.PORT || 4000);
const { app } = createServer();
try { await connectDatabase(process.env.MONGODB_URI); }
catch { console.error('MongoDB connection failed. Check MONGODB_URI, Atlas network access, and database credentials.'); }
app.listen(port, () => console.log(`CreatorIQ API listening on ${port}`));
