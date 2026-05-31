import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as exportService from '../services/export.service.js';

export const exportRouter = Router();

const exportQuery = z.object({
  format: z.enum(['csv', 'geojson']).default('csv'),
});

exportRouter.get('/locations/:id', requireAuth, validate({ query: exportQuery }), async (req, res, next) => {
  try {
    const format = (req.query as unknown as z.infer<typeof exportQuery>).format;
    const result = await exportService.exportLocation(req.user!.userId, req.params.id as string, format);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="brewmap-${req.params.id as string}.csv"`);
    } else {
      res.setHeader('Content-Type', 'application/geo+json');
      res.setHeader('Content-Disposition', `attachment; filename="brewmap-${req.params.id as string}.geojson"`);
    }

    res.send(result);
  } catch (err) {
    next(err);
  }
});
