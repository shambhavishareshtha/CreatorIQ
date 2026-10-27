import { asyncHandler } from '../utils/asyncHandler.js';
import { calculateAnalytics } from '../services/analyticsService.js';
export const analyticsController = ({ Post, Profile }) => asyncHandler(async (req,res) => {
  const profile=await Profile.findOne({owner:req.user._id});
  const posts=profile?await Post.find({creator:profile._id}):[];
  try { res.json({success:true,data:calculateAnalytics(posts,req.query)}); }
  catch(error) { if(error.status===400)return res.status(400).json({success:false,error:{code:'INVALID_ANALYTICS_FILTER',message:error.message}}); throw error; }
});
