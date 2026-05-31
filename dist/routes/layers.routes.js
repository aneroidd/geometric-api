import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as demographicsService from '../services/demographics.service.js';
import * as geocodeService from '../services/geocode.service.js';
export const layersRouter = Router();
const bboxQuery = z.object({
    west: z.coerce.number(),
    south: z.coerce.number(),
    east: z.coerce.number(),
    north: z.coerce.number(),
    zoom: z.coerce.number().int().optional(),
    dataYear: z.coerce.number().int().optional(),
});
const poiLayerQuery = z.object({
    west: z.coerce.number(),
    south: z.coerce.number(),
    east: z.coerce.number(),
    north: z.coerce.number(),
    type: z.string().optional(), // comma-separated types
});
layersRouter.get('/demographics', requireAuth, validate({ query: bboxQuery }), async (req, res, next) => {
    try {
        const query = req.query;
        const result = await demographicsService.getDemographicLayer(query);
        res.json({ data: result });
    }
    catch (err) {
        next(err);
    }
});
layersRouter.get('/competitors', requireAuth, validate({ query: poiLayerQuery }), async (req, res, next) => {
    try {
        const query = req.query;
        const result = await geocodeService.getPoiLayer({ ...query, type: 'competitor' });
        res.json({ data: result });
    }
    catch (err) {
        next(err);
    }
});
layersRouter.get('/pois', requireAuth, validate({ query: poiLayerQuery }), async (req, res, next) => {
    try {
        const query = req.query;
        const types = query.type?.split(',') || [];
        const result = await geocodeService.getPoiLayer({ ...query, types });
        res.json({ data: result });
    }
    catch (err) {
        next(err);
    }
});
