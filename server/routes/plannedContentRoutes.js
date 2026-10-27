import { Router } from 'express';
export function plannedContentRoutes(c) { const r = Router(); r.get('/', c.list); r.post('/', c.create); r.get('/:id', c.get); r.patch('/:id', c.update); r.delete('/:id', c.remove); return r; }
