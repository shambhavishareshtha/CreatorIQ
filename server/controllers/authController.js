import { randomBytes } from 'node:crypto';
import { hashPassword, verifyPassword, digest } from '../services/authService.js';
const publicUser = account => ({ id: String(account._id), email: account.email });
const cookieOptions = () => ({ httpOnly:true, secure:process.env.NODE_ENV==='production', sameSite:process.env.NODE_ENV==='production'?'none':'lax', path:'/api', maxAge:7*24*60*60*1000 });
export const authController = ({ Account, Session }) => {
 const establish=async(account,res)=>{ const token=randomBytes(32).toString('base64url'), csrf=randomBytes(24).toString('base64url'); await Session.create({account:account._id,tokenHash:digest(token),csrfHash:digest(csrf),csrfToken:csrf,expiresAt:new Date(Date.now()+7*86400000)}); res.cookie('creatoriq_session',token,cookieOptions()); return {user:publicUser(account),csrfToken:csrf}; };
 return {
  register:async(req,res,next)=>{try{const email=String(req.body?.email||'').trim().toLowerCase(),password=req.body?.password;if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||typeof password!=='string'||password.length<12||password.length>128)return res.status(422).json({success:false,error:{code:'INVALID_REGISTRATION',message:'Use a valid email and a password between 12 and 128 characters.'}});const account=await Account.create({email,passwordHash:await hashPassword(password)});res.status(201).json({success:true,data:await establish(account,res)});}catch(e){next(e)}},
  login:async(req,res,next)=>{try{const email=String(req.body?.email||'').trim().toLowerCase(),password=typeof req.body?.password==='string'?req.body.password:'';const account=await Account.findOne({email}).select('+passwordHash');if(!account||!await verifyPassword(password,account.passwordHash))return res.status(401).json({success:false,error:{code:'INVALID_CREDENTIALS',message:'Email or password is incorrect.'}});res.json({success:true,data:await establish(account,res)});}catch(e){next(e)}},
  session:async(req,res)=>{if(!req.user||!req.session)return res.status(401).json({success:false,error:{code:'AUTH_REQUIRED',message:'Sign in to continue.'}});res.json({success:true,data:{user:publicUser(req.user),csrfToken:req.session.csrfToken}});},
  logout:async(req,res,next)=>{try{if(req.session)await Session.deleteOne({_id:req.session._id,account:req.user._id});res.clearCookie('creatoriq_session',{...cookieOptions(),maxAge:undefined});res.json({success:true,data:{loggedOut:true}});}catch(e){next(e)}}
 };
};
