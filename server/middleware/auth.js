import { digest } from '../services/authService.js';
export const sessionMiddleware = ({ Account, Session }) => async (req, _res, next) => {
  try { const token = (req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('creatoriq_session='))?.slice('creatoriq_session='.length); if (!token) return next(); const session = await Session.findOne({ tokenHash: digest(decodeURIComponent(token)), expiresAt: { $gt: new Date() } }); if (session) { req.session = session; req.user = await Account.findById(session.account); } next(); } catch (e) { next(e); }
};
export function requireAuth(req, res, next) { if (!req.user) return res.status(401).json({ success:false,error:{code:'AUTH_REQUIRED',message:'Sign in to continue.'} }); next(); }
export const requireCsrf = () => (req,res,next) => { if (!req.user || !req.session) return res.status(401).json({success:false,error:{code:'AUTH_REQUIRED',message:'Sign in to continue.'}}); const token=req.get('x-csrf-token')||''; if(!token || digest(token)!==req.session.csrfHash)return res.status(403).json({success:false,error:{code:'CSRF_INVALID',message:'Refresh your session and try again.'}}); next(); };
