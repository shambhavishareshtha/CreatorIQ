import { asyncHandler } from '../utils/asyncHandler.js';
import { normalizeCsv } from '../services/csvImportService.js';
const escapeRegex = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const postController = ({ Post, Profile }) => ({
  list: asyncHandler(async (req, res) => {
    const profile=await Profile.findOne({owner:req.user._id}); if(!profile)return res.json({success:true,data:[]}); const filter = {creator:profile._id};
    if (req.query.platform) {
      if (!['Instagram', 'X'].includes(req.query.platform)) return res.status(400).json({ success:false, error:{code:'INVALID_PLATFORM',message:'platform must be Instagram or X.'} });
      filter.platform = req.query.platform;
    }
    if (req.query.format) filter.format = req.query.format;
    if (req.query.topic) filter.topic = new RegExp(escapeRegex(req.query.topic), 'i');
    if (req.query.from || req.query.to) {
      filter.publishedAt = {};
      for (const [key, operator] of [['from','$gte'],['to','$lte']]) if (req.query[key]) {
        const date = new Date(req.query[key]);
        if (key === 'to' && /^\d{4}-\d{2}-\d{2}$/.test(String(req.query[key]))) date.setUTCHours(23,59,59,999);
        if (Number.isNaN(+date)) return res.status(400).json({success:false,error:{code:'INVALID_DATE',message:`${key} must be a valid date.`}});
        filter.publishedAt[operator] = date;
      }
    }
    const data = await Post.find(filter).sort({publishedAt:-1}).limit(Math.min(Number(req.query.limit)||100,500));
    res.json({success:true,data});
  }),
  get: asyncHandler(async (req,res) => { const profile=await Profile.findOne({owner:req.user._id}); const post=profile?await Post.findOne({_id:req.params.id,creator:profile._id}):null; if(!post)return res.status(404).json({success:false,error:{code:'POST_NOT_FOUND',message:'Post not found.'}}); res.json({success:true,data:post}); }),
  preview: asyncHandler(async (req,res) => { try { res.json({success:true,data:normalizeCsv(req.body?.csvText,req.body?.mapping)}); } catch(error) { if(error.code==='MISSING_COLUMNS')return res.status(422).json({success:false,error:{code:error.code,message:error.message,headers:error.headers,columns:error.columns}}); throw error; } }),
  importCsv: asyncHandler(async (req,res) => {
    const parsed=normalizeCsv(req.body?.csvText,req.body?.mapping);
    const profile=await Profile.findOne({owner:req.user._id});
    if(!profile)return res.status(409).json({success:false,error:{code:'PROFILE_REQUIRED',message:'Create a creator profile before importing posts.'}});
    const errors=parsed.records.filter(row=>row.errors.length).map(row=>({line:row.line,errors:row.errors}));let imported=0;
    for(const row of parsed.records.filter(item=>item.post))try{await Post.create({...row.post,creator:profile._id});imported++;}catch(error){if(error.code===11000)errors.push({line:row.line,errors:['This post was already imported.']});else if(error.name==='ValidationError'||error.name==='CastError')errors.push({line:row.line,errors:[error.message]});else throw error;}
    res.json({success:true,data:{imported,rejected:errors.length,errors}});
  }),
});
