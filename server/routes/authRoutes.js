import { Router } from 'express';
export function authRoutes(controller, requireCsrf) { const r=Router(); r.post('/register',controller.register); r.post('/login',controller.login); r.get('/session',controller.session); r.post('/logout',requireCsrf,controller.logout); return r; }
