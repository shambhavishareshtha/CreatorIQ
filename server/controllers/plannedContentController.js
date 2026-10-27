import { asyncHandler } from '../utils/asyncHandler.js';
const cleanFields = ['platform', 'topic', 'format', 'hook', 'objective', 'scheduledAt', 'status', 'notes', 'experiment'];
const idMatch = /^[a-f\d]{24}$/i;
export const plannedContentController = ({ PlannedContent, Profile, Experiment }) => {
  const profile = req => Profile.findOne({ owner: req.user._id });
  const validate = async (body, creator) => {
    if (body.platform && !['X', 'Instagram'].includes(body.platform)) return 'Platform must be X or Instagram.';
    if (body.scheduledAt && Number.isNaN(+new Date(body.scheduledAt))) return 'Scheduled date must be valid.';
    if (body.experiment) {
      if (!idMatch.test(String(body.experiment))) return 'Experiment reference is invalid.';
      const experiment = await Experiment.findById(body.experiment);
      if (!experiment || String(experiment.creator) !== String(creator._id)) return 'Experiment was not found for this creator.';
    }
    return null;
  };
  return {
    list: asyncHandler(async (req, res) => {
      const creator = await profile(req);
      if (!creator) return res.json({ success: true, data: [] });
      const filter = { creator: creator._id };
      for (const key of ['platform', 'status', 'topic']) if (req.query[key]) filter[key] = key === 'topic' ? new RegExp(String(req.query[key]).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : req.query[key];
      if (req.query.from || req.query.to) { filter.scheduledAt = {}; for (const [key, op] of [['from', '$gte'], ['to', '$lte']]) if (req.query[key]) { const d = new Date(req.query[key]); if (Number.isNaN(+d)) return res.status(400).json({ success: false, error: { code: 'INVALID_DATE', message: `${key} must be a valid date.` } }); if (key === 'to' && /^\d{4}-\d{2}-\d{2}$/.test(req.query[key])) d.setUTCHours(23,59,59,999); filter.scheduledAt[op] = d; } }
      res.json({ success: true, data: await PlannedContent.find(filter).sort({ scheduledAt: 1, createdAt: -1 }) });
    }),
    create: asyncHandler(async (req, res) => {
      const creator = await profile(req); if (!creator) return res.status(409).json({ success: false, error: { code: 'PROFILE_REQUIRED', message: 'Save a creator profile before creating planned content.' } });
      const error = await validate(req.body, creator); if (error) return res.status(422).json({ success: false, error: { code: 'INVALID_PLANNED_CONTENT', message: error } });
      const item = await PlannedContent.create({ ...Object.fromEntries(cleanFields.filter(k => k in req.body).map(k => [k, req.body[k]])), creator: creator._id });
      res.status(201).json({ success: true, data: item });
    }),
    get: asyncHandler(async (req, res) => { const creator=await profile(req); const item = creator?await PlannedContent.findOne({_id:req.params.id,creator:creator._id}):null; if (!item) return res.status(404).json({ success: false, error: { code: 'PLANNED_CONTENT_NOT_FOUND', message: 'Planned content not found.' } }); res.json({ success: true, data: item }); }),
    update: asyncHandler(async (req, res) => {
      const creator = await profile(req); const item = creator?await PlannedContent.findOne({_id:req.params.id,creator:creator._id}):null; if (!item) return res.status(404).json({ success: false, error: { code: 'PLANNED_CONTENT_NOT_FOUND', message: 'Planned content not found.' } });
      const fields = Object.fromEntries(cleanFields.filter(k => k in req.body).map(k => [k, req.body[k]])); const error = await validate(fields, creator); if (error) return res.status(422).json({ success: false, error: { code: 'INVALID_PLANNED_CONTENT', message: error } });
      Object.assign(item, fields); await item.save(); res.json({ success: true, data: item });
    }),
    remove: asyncHandler(async (req, res) => { const creator=await profile(req); const item=creator?await PlannedContent.findOneAndDelete({_id:req.params.id,creator:creator._id}):null; if (!item) return res.status(404).json({ success: false, error: { code: 'PLANNED_CONTENT_NOT_FOUND', message: 'Planned content not found.' } }); res.json({ success: true, data: { deleted: true, id: req.params.id } }); }),
  };
};
