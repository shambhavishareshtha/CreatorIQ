import { asyncHandler } from '../utils/asyncHandler.js';
import { generateHooks } from '../services/hookGenerationService.js';
export const hookController = ({ Post, Profile }) => asyncHandler(async (req, res) => {
  const input = req.body || {};
  for (const key of ['platform', 'niche', 'audience', 'format', 'objective', 'tone']) if (typeof input[key] !== 'string' || !input[key].trim()) return res.status(422).json({ success: false, error: { code: 'HOOK_INPUT_REQUIRED', message: `${key} is required.` } });
  if (!['X', 'Instagram'].includes(input.platform)) return res.status(422).json({ success: false, error: { code: 'INVALID_PLATFORM', message: 'Platform must be X or Instagram.' } });
  let evidence = null;
  if (Post?.db?.readyState === 1 && Profile?.db?.readyState === 1) {
    const profile = await Profile.findOne({ owner: req.user._id });
    if (profile) {
      const posts = await Post.find({ creator: profile._id, platform: input.platform });
      const topic = posts.filter(p => String(p.topic || '').toLowerCase() === input.niche.toLowerCase());
      const candidates = topic.length >= 2 ? topic : posts;
      const formats = new Map(); for (const p of candidates) { const m = formats.get(p.format) || { n: 0, views: 0, observed: 0 }; m.n++; if (Number.isFinite(p.views)) { m.views += p.views; m.observed++; } formats.set(p.format, m); }
      const best = [...formats].filter(([,m]) => m.observed >= 2).sort((a,b) => b[1].views/b[1].observed - a[1].views/a[1].observed)[0];
      if (best) evidence = `In imported ${input.platform} posts, ${best[0]} had the highest observed average views (${Math.round(best[1].views / best[1].observed)} across ${best[1].observed} posts). Descriptive signal only.`;
    }
  }
  res.json({ success: true, data: generateHooks(input, { seed: input.seed, evidence }) });
});
