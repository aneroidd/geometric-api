import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as suitabilityService from '../services/suitability.service.js';
import * as heatmapService from '../services/heatmap.service.js';

export const suitabilityRouter = Router();

const weightsSchema = z.object({
  population: z.number().min(0).max(100),
  purchasingPower: z.number().min(0).max(100),
  accessibility: z.number().min(0).max(100),
  competitor: z.number().min(0).max(100),
});

const scoreRequestSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusKm: z.number().positive().default(1),
  weights: weightsSchema,
  dataYear: z.number().int().optional(),
});

const heatmapRequestSchema = z.object({
  bbox: z.object({
    west: z.number(),
    south: z.number(),
    east: z.number(),
    north: z.number(),
  }),
  zoom: z.number().int().min(1).max(20),
  weights: weightsSchema,
  dataYear: z.number().int().optional(),
});

suitabilityRouter.post('/score', requireAuth, validate({ body: scoreRequestSchema }), async (req, res, next) => {
  try {
    const result = await suitabilityService.computeScore(req.body);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

suitabilityRouter.post('/heatmap', requireAuth, validate({ body: heatmapRequestSchema }), async (req, res, next) => {
  try {
    const result = await heatmapService.generateHeatmap(req.body);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});
