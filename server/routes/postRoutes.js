import{Router}from'express';export function postRoutes(c){const r=Router();r.get('/',c.list);r.get('/:id',c.get);r.post('/import/preview',c.preview);r.post('/import',c.importCsv);return r}
