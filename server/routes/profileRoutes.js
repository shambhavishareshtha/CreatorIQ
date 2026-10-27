import{Router}from'express';export function profileRoutes(c){const r=Router();r.get('/',c.get);r.post('/',c.create);r.patch('/',c.update);r.post('/onboarding',c.create);return r}
