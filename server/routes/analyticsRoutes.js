import { Router } from 'express';
export function analyticsRoutes(controller){const router=Router();router.get('/',controller);return router}
