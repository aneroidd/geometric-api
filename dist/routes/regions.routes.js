import { Router } from 'express';
import * as geocodeService from '../services/geocode.service.js';
// 🔥 TAMBAHAN BARU: Import service peta dan otak heatmap kita
import { getRegionsGeoJSON, getSuitabilityGrid } from '../services/region.service.js';
export const regionsRouter = Router();
// Kita bypass Zod validation di level router untuk menghindari bentrok 'getter'
regionsRouter.get('/', async (req, res, next) => {
    try {
        const result = await geocodeService.listRegions(req.query);
        res.json({ data: result });
    }
    catch (err) {
        next(err);
    }
});
regionsRouter.get('/geocode', async (req, res, next) => {
    try {
        // Memaksa tipe data string agar service tidak protes
        const queryStr = req.query.q || '';
        const result = await geocodeService.forwardGeocode(queryStr);
        res.json({ data: result });
    }
    catch (err) {
        next(err);
    }
});
regionsRouter.get('/reverse-geocode', async (req, res, next) => {
    try {
        const lat = Number(req.query.lat);
        const lng = Number(req.query.lng);
        const result = await geocodeService.reverseGeocode(lat, lng);
        res.json({ data: result });
    }
    catch (err) {
        next(err);
    }
});
// 🔥 TAMBAHAN BARU: Endpoint Peta GeoJSON (Aman ditaruh di sini)
regionsRouter.get('/map', async (req, res, next) => {
    try {
        const geojsonData = await getRegionsGeoJSON();
        // Kita langsung render JSON-nya tanpa dibungkus { data: ... } 
        // karena format FeatureCollection dari Leaflet/Mapbox maunya langsung murni.
        res.json(geojsonData);
    }
    catch (err) {
        next(err);
    }
});
// 🔥 TAMBAHAN BARU: Endpoint Otak Heatmap Grid
regionsRouter.get('/grid/:id', async (req, res, next) => {
    try {
        // Melempar ID kelurahan dan nilai slider bobot (req.query) ke otak PostGIS
        const gridData = await getSuitabilityGrid(req.params.id, req.query);
        res.json(gridData);
    }
    catch (err) {
        next(err);
    }
});
// ⚠️ JARING ID: Harus selalu berada di paling bawah!
regionsRouter.get('/:id', async (req, res, next) => {
    try {
        const result = await geocodeService.getRegionById(req.params.id);
        res.json({ data: result });
    }
    catch (err) {
        next(err);
    }
});
