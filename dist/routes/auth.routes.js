import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as authService from '../services/auth.service.js';
export const authRouter = Router();
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().optional(),
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});
const refreshSchema = z.object({
    refreshToken: z.string(),
});
const updateProfileSchema = z.object({
    fullName: z.string().optional(),
    avatarUrl: z.string().url().optional(),
});
authRouter.post('/register', validate({ body: registerSchema }), async (req, res, next) => {
    try {
        const result = await authService.register(req.body);
        res.status(201).json({ data: result });
    }
    catch (err) {
        next(err);
    }
});
authRouter.post('/login', validate({ body: loginSchema }), async (req, res, next) => {
    try {
        const result = await authService.login(req.body);
        res.json({ data: result });
    }
    catch (err) {
        next(err);
    }
});
authRouter.post('/refresh', validate({ body: refreshSchema }), async (req, res, next) => {
    try {
        const result = await authService.refreshToken(req.body.refreshToken);
        res.json({ data: result });
    }
    catch (err) {
        next(err);
    }
});
authRouter.get('/me', requireAuth, async (req, res, next) => {
    try {
        const result = await authService.getProfile(req.user.userId);
        res.json({ data: result });
    }
    catch (err) {
        next(err);
    }
});
authRouter.patch('/me', requireAuth, validate({ body: updateProfileSchema }), async (req, res, next) => {
    try {
        const result = await authService.updateProfile(req.user.userId, req.body);
        res.json({ data: result });
    }
    catch (err) {
        next(err);
    }
});
