import { sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import type { HeatmapGenerateRequest, HeatmapGenerateResponse, HeatmapCell } from '@brewmap/shared';

/**
 * Generate a heatmap grid over the given bounding box.
 * Creates a hexagonal/square grid and computes suitability scores for each cell.
 */
export async function generateHeatmap(request: HeatmapGenerateRequest): Promise<HeatmapGenerateResponse> {
  const { bbox, zoom, weights, dataYear } = request;

  // Determine cell size based on zoom level (in degrees, approximate)
  const cellSizeDeg = getCellSize(zoom);

 // Generate grid cells using PostGIS ST_SquareGrid with LATERAL optimizations
  const gridResult = await db.execute(
    sql`
      WITH bbox_env AS (
        -- 1. Kacamata Kuda: Kunci area pencarian HANYA seukuran layar (Bounding Box)
        SELECT ST_MakeEnvelope(${bbox.west}, ${bbox.south}, ${bbox.east}, ${bbox.north}, 4326) AS geom
      ),
      grid AS (
        -- 2. Buat grid hanya di dalam layar
        SELECT (ST_SquareGrid(
          ${cellSizeDeg},
          (SELECT geom FROM bbox_env)
        )).*
      ),
      local_regions AS (
        -- 3. Tarik data demografi HANYA untuk kelurahan yang ada di layar (Pakai operator indeks spasial &&)
        SELECT r.boundary, d.purchasing_power, d.population_density, d.accessibility_score
        FROM regions r
        LEFT JOIN demographics d ON d.region_id = r.id ${dataYear ? sql`AND d.data_year = ${dataYear}` : sql``}
        WHERE r.level = 'kelurahan' AND r.boundary && (SELECT geom FROM bbox_env)
      ),
      local_pois AS (
        -- 4. Tarik data kompetitor HANYA yang ada di layar
        SELECT location FROM pois 
        WHERE type = 'competitor' AND location && (SELECT geom FROM bbox_env)
      )
      SELECT
        ST_AsGeoJSON(g.geom)::json AS cell_geojson,
        ST_Y(ST_Centroid(g.geom)) AS lat,
        ST_X(ST_Centroid(g.geom)) AS lng,
        COALESCE(r_stats.avg_purchasing, 0) AS avg_purchasing,
        COALESCE(r_stats.avg_density, 0) AS avg_density,
        COALESCE(r_stats.avg_accessibility, 0) AS avg_accessibility,
        COALESCE(p_stats.competitor_count, 0) AS competitor_count
      FROM grid g
      -- 5. Gunakan LATERAL JOIN agar kalkulasi wilayah dan POI dipisah (mencegah Cartesian Explosion)
      LEFT JOIN LATERAL (
        SELECT
          AVG(lr.purchasing_power) AS avg_purchasing,
          AVG(lr.population_density) AS avg_density,
          AVG(lr.accessibility_score) AS avg_accessibility
        FROM local_regions lr
        WHERE ST_Intersects(lr.boundary, g.geom)
      ) r_stats ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS competitor_count
        FROM local_pois lp
        WHERE ST_Intersects(lp.location, g.geom)
      ) p_stats ON true
    `
  );
  

  const cells: HeatmapCell[] = (gridResult.rows as Record<string, unknown>[]).map((row) => {
    // Compute weighted score per cell
    const densityNorm = normalize(row.avg_density as number, 0, 50000);
    const purchasingScore = (row.avg_purchasing as number) || 0;
    const accessScore = (row.avg_accessibility as number) || 0;
    const compCount = (row.competitor_count as number) || 0;
    const compPenalty = Math.max(0, 100 * Math.exp(-0.3 * compCount));

    const totalWeight = (weights.population + weights.purchasingPower + weights.accessibility + weights.competitor) / 100;
    const rawScore =
      (weights.population / 100) * densityNorm +
      (weights.purchasingPower / 100) * purchasingScore +
      (weights.accessibility / 100) * accessScore -
      (weights.competitor / 100) * (100 - compPenalty);

    const score = Math.max(0, Math.min(100, totalWeight > 0 ? rawScore / totalWeight : 0));

    return {
      cellGeoJson: row.cell_geojson as Record<string, unknown>,
      center: { lat: row.lat as number, lng: row.lng as number },
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

function getCellSize(zoom: number): number {
  // Approximate cell size in degrees based on zoom level
  const sizes: Record<number, number> = {
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

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}
