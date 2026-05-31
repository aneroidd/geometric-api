import { eq, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { regions, demographics, exportLogs } from '../db/schema.js';
import { AppError } from '../middleware/errorHandler.js';
/**
 * Export location analysis data in the requested format.
 */
export async function exportLocation(userId, regionId, format) {
    // Get region data
    const [region] = await db.select().from(regions).where(eq(regions.id, regionId)).limit(1);
    if (!region) {
        throw new AppError(404, 'NOT_FOUND', 'Region not found');
    }
    // Get demographics
    const demoRows = await db
        .select()
        .from(demographics)
        .where(eq(demographics.regionId, regionId));
    // Get POIs in region
    const poiResult = await db.execute(sql `SELECT id, name, type, brand, ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng, address
        FROM pois WHERE region_id = ${regionId} LIMIT 500`);
    // Log the export
    await db.insert(exportLogs).values({
        userId,
        regionId,
        format,
        parameters: { timestamp: new Date().toISOString() },
    });
    if (format === 'geojson') {
        return generateGeoJson(region, demoRows, poiResult.rows);
    }
    else {
        return generateCsv(region, demoRows, poiResult.rows);
    }
}
function generateGeoJson(region, demographics, pois) {
    const features = pois.map((poi) => ({
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [poi.lng, poi.lat],
        },
        properties: {
            id: poi.id,
            name: poi.name,
            type: poi.type,
            brand: poi.brand,
            address: poi.address,
        },
    }));
    const collection = {
        type: 'FeatureCollection',
        metadata: {
            region: region.name,
            exportedAt: new Date().toISOString(),
            demographics: demographics.map((d) => ({
                year: d.dataYear,
                totalPopulation: d.totalPopulation,
                populationDensity: d.populationDensity,
                purchasingPower: d.purchasingPower,
                accessibilityScore: d.accessibilityScore,
            })),
        },
        features,
    };
    return JSON.stringify(collection, null, 2);
}
function generateCsv(region, _demographics, pois) {
    const header = 'id,name,type,brand,lat,lng,address';
    const rows = pois.map((poi) => [
        poi.id,
        `"${(poi.name || '').replace(/"/g, '""')}"`,
        poi.type,
        `"${(poi.brand || '').replace(/"/g, '""')}"`,
        poi.lat,
        poi.lng,
        `"${(poi.address || '').replace(/"/g, '""')}"`,
    ].join(','));
    return `# BrewMap Intelligence Export - ${region.name}\n# Exported: ${new Date().toISOString()}\n${header}\n${rows.join('\n')}`;
}
