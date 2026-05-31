import { sql } from 'drizzle-orm';
import { db } from '../config/database.js';
/**
 * Get demographic choropleth layer as GeoJSON FeatureCollection.
 */
export async function getDemographicLayer(params) {
    const dataYear = params.dataYear || 2023;
    const result = await db.execute(sql `
      SELECT
        r.id,
        r.name,
        r.level,
        ST_AsGeoJSON(r.boundary)::json AS geometry,
        d.total_population,
        d.population_density,
        d.age_18_35_pct,
        d.purchasing_power,
        d.accessibility_score,
        d.data_year
      FROM regions r
      LEFT JOIN demographics d ON d.region_id = r.id AND d.data_year = ${dataYear}
      WHERE r.level = 'kelurahan'
        AND ST_Intersects(
          r.boundary,
          ST_MakeEnvelope(${params.west}, ${params.south}, ${params.east}, ${params.north}, 4326)
        )
      LIMIT 200
    `);
    return {
        type: 'FeatureCollection',
        features: result.rows.map((row) => ({
            type: 'Feature',
            geometry: row.geometry,
            properties: {
                id: row.id,
                name: row.name,
                level: row.level,
                totalPopulation: row.total_population,
                populationDensity: row.population_density,
                age18_35Pct: row.age_18_35_pct,
                purchasingPower: row.purchasing_power,
                accessibilityScore: row.accessibility_score,
                dataYear: row.data_year,
            },
        })),
    };
}
