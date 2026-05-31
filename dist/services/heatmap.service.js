import { sql } from 'drizzle-orm';
import { db } from '../config/database.js';
/**
 * Generate a heatmap grid over the given bounding box.
 * Creates a hexagonal/square grid and computes suitability scores for each cell.
 */
export async function generateHeatmap(request) {
    const { bbox, zoom, weights, dataYear } = request;
    // Determine cell size based on zoom level (in degrees, approximate)
    const cellSizeDeg = getCellSize(zoom);
    // Generate grid cells using PostGIS ST_SquareGrid
    const gridResult = await db.execute(sql `
      WITH grid AS (
        SELECT (ST_SquareGrid(
          ${cellSizeDeg},
          ST_MakeEnvelope(${bbox.west}, ${bbox.south}, ${bbox.east}, ${bbox.north}, 4326)
        )).*
      ),
      cell_stats AS (
        SELECT
          g.geom AS cell_geom,
          ST_Centroid(g.geom) AS center,
          COALESCE(AVG(d.purchasing_power), 0) AS avg_purchasing,
          COALESCE(AVG(d.population_density), 0) AS avg_density,
          COALESCE(AVG(d.accessibility_score), 0) AS avg_accessibility,
          COUNT(DISTINCT p.id) FILTER (WHERE p.type = 'competitor') AS competitor_count
        FROM grid g
        LEFT JOIN regions r ON ST_Intersects(r.boundary, g.geom) AND r.level = 'kelurahan'
        LEFT JOIN demographics d ON d.region_id = r.id ${dataYear ? sql `AND d.data_year = ${dataYear}` : sql ``}
        LEFT JOIN pois p ON ST_Within(p.location, g.geom) AND p.type = 'competitor'
        GROUP BY g.geom
      )
      SELECT
        ST_AsGeoJSON(cell_geom)::json AS cell_geojson,
        ST_Y(center) AS lat,
        ST_X(center) AS lng,
        avg_purchasing,
        avg_density,
        avg_accessibility,
        competitor_count
      FROM cell_stats
    `);
    const cells = gridResult.rows.map((row) => {
        // Compute weighted score per cell
        const densityNorm = normalize(row.avg_density, 0, 50000);
        const purchasingScore = row.avg_purchasing || 0;
        const accessScore = row.avg_accessibility || 0;
        const compCount = row.competitor_count || 0;
        const compPenalty = Math.max(0, 100 * Math.exp(-0.3 * compCount));
        const totalWeight = (weights.population + weights.purchasingPower + weights.accessibility + weights.competitor) / 100;
        const rawScore = (weights.population / 100) * densityNorm +
            (weights.purchasingPower / 100) * purchasingScore +
            (weights.accessibility / 100) * accessScore -
            (weights.competitor / 100) * (100 - compPenalty);
        const score = Math.max(0, Math.min(100, totalWeight > 0 ? rawScore / totalWeight : 0));
        return {
            cellGeoJson: row.cell_geojson,
            center: { lat: row.lat, lng: row.lng },
            score: Math.round(score * 10) / 10,
            subScores: {
                dayaBeli: Math.round(purchasingScore * 10) / 10,
                kepadatan: Math.round(densityNorm * 10) / 10,
                aksesibilitas: Math.round(accessScore * 10) / 10,
            },
        };
    });
    return {
        cells,
        computedAt: new Date().toISOString(),
    };
}
function getCellSize(zoom) {
    // Approximate cell size in degrees based on zoom level
    const sizes = {
        10: 0.05,
        11: 0.025,
        12: 0.012,
        13: 0.006,
        14: 0.003,
        15: 0.0015,
        16: 0.0008,
        17: 0.0004,
        18: 0.0002,
    };
    return sizes[zoom] || 0.003;
}
function normalize(value, min, max) {
    if (max === min)
        return 50;
    return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}
