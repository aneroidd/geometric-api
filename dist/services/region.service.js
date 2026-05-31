import { sql } from 'drizzle-orm';
// Sesuaikan path import db di bawah ini dengan letak file database aslimu
import { db } from '../config/database';
export const getRegionsGeoJSON = async () => {
    const result = await db.execute(sql `
    SELECT 
      id, 
      name, 
      level, 
      ST_AsGeoJSON(boundary)::jsonb as geojson 
    FROM regions 
    WHERE boundary IS NOT NULL
  `);
    const featureCollection = {
        type: "FeatureCollection",
        features: result.rows.map((row) => ({
            type: "Feature",
            properties: {
                id: row.id,
                name: row.name,
                level: row.level
            },
            geometry: row.geojson
        }))
    };
    return featureCollection;
};
// 🔥 OTAK POSTGIS: Versi Full Weighted Overlay (4 Parameter Aktif)
export async function getSuitabilityGrid(regionId, weights) {
    const wDayaBeli = Number(weights.dayaBeli) || 70;
    const wKompetitor = Math.abs(Number(weights.kompetitor) || 30);
    const wAksesbilitas = Number(weights.akses) || 75;
    const wPenduduk = Number(weights.penduduk) || 50;
    const query = sql `
    WITH region_geom AS (
      SELECT id, boundary, COALESCE(population, 5000) as pop_total FROM regions WHERE id = ${regionId}
    ),
    -- Hitung luas kelurahan dalam Km² menggunakan SRID 3857 (meter)
    region_area AS (
      SELECT id, pop_total, (ST_Area(ST_Transform(boundary, 3857)) / 1000000.0) as luas_km2 FROM region_geom
    ),
    grid AS (
      SELECT (ST_SquareGrid(0.002, boundary)).*
      FROM region_geom
    ),
    clipped_grid AS (
      SELECT ST_Intersection(grid.geom, region_geom.boundary) AS cell_geom
      FROM grid
      CROSS JOIN region_geom
      WHERE ST_Intersects(grid.geom, region_geom.boundary)
    ),
    scored_grid AS (
      SELECT
        cell_geom,
        -- 1. Hitung Potensi Pasar (Kampus/Kantor)
        (SELECT count(*) FROM pois WHERE category IN ('education', 'office') AND ST_DWithin(location, cell_geom, 0.01)) AS potensi_pasar,
        
        -- 2. Hitung Kompetitor (Kedai Kopi)
        (SELECT count(*) FROM pois WHERE category = 'coffee_shop' AND ST_DWithin(location, cell_geom, 0.005)) AS saingan,
        
        -- 3. Hitung Jarak ke Jalan Terdekat (Menggunakan Operator KNN <-> agar instan)
        (SELECT ST_Distance(cell_geom, r.geom) FROM roads r ORDER BY r.geom <-> cell_geom LIMIT 1) AS jarak_jalan,

        -- 4. Kepadatan Jiwa per Km²
        (SELECT (pop_total / GREATEST(luas_km2, 0.1)) FROM region_area) AS kepadatan_pddk
      FROM clipped_grid
    )
    SELECT
      json_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(json_agg(
          json_build_object(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(cell_geom)::json,
            'properties', json_build_object(
              'potensi_pasar', potensi_pasar,
              'saingan', saingan,
              'jarak_jalan', jarak_jalan,
              -- 🔥 RUMUS OVERLAY PENUH: Menggabungkan 4 Layer Analisis Spasial
              'score', GREATEST(0.0, LEAST(100.0, 
                25.0 
                + (potensi_pasar::numeric * ${wDayaBeli}::numeric * 0.1) 
                - (saingan::numeric * ${wKompetitor}::numeric * 0.5)
                + (CASE WHEN jarak_jalan < 0.001 THEN 15.0 ELSE GREATEST(0.0, 15.0 - (jarak_jalan * 5000)) END * ${wAksesbilitas}::numeric * 0.02)
                + (LEAST(20.0, (kepadatan_pddk::numeric / 500.0)) * ${wPenduduk}::numeric * 0.02)
              ))
            )
          )
        ), '[]'::json)
      ) as geojson
    FROM scored_grid;
  `;
    try {
        const result = await db.execute(query);
        return result.rows[0]?.geojson || { type: 'FeatureCollection', features: [] };
    }
    catch (error) {
        console.error("❌ SQL Crash di getSuitabilityGrid:", error);
        return { type: 'FeatureCollection', features: [] };
    }
}
