import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as bookmarkService from '../services/bookmark.service.js';

export const bookmarksRouter = Router();

const createBookmarkSchema = z.object({
  regionId: z.string().uuid().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  label: z.string().optional(),
  score: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

bookmarksRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const result = await bookmarkService.listBookmarks(req.user!.userId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

bookmarksRouter.post('/', requireAuth, validate({ body: createBookmarkSchema }), async (req, res, next) => {
  try {
    const result = await bookmarkService.createBookmark(req.user!.userId, req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});

bookmarksRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await bookmarkService.deleteBookmark(req.user!.userId, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
