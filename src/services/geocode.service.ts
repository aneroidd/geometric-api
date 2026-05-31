import { eq, ilike, sql, and } from 'drizzle-orm';
import { db } from '../config/database.js';
import { regions, pois } from '../db/schema.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Region, GeocodeResult } from '@brewmap/shared';

export async function listRegions(params: { level?: string; parentId?: string; search?: string }): Promise<Region[]> {
  const conditions = [];
  if (params.level) conditions.push(eq(regions.level, params.level));
  if (params.parentId) conditions.push(eq(regions.parentId, params.parentId));
  if (params.search) conditions.push(ilike(regions.name, `%${params.search}%`));

  const rows = await db
    .select()
    .from(regions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(100);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    level: r.level as Region['level'],
    parentId: r.parentId,
    center: r.center ? parsePointToLatLng(r.center) : { lat: 0, lng: 0 },
  }));
}

export async function getRegionById(id: string): Promise<Region> {
  const [row] = await db.select().from(regions).where(eq(regions.id, id)).limit(1);
  if (!row) {
    throw new AppError(404, 'NOT_FOUND', 'Region not found');
  }
  return {
    id: row.id,
    name: row.name,
    level: row.level as Region['level'],
    parentId: row.parentId,
    center: row.center ? parsePointToLatLng(row.center) : { lat: 0, lng: 0 },
  };
}

export async function forwardGeocode(query: string): Promise<GeocodeResult[]> {
  const rows = await db
    .select()
    .from(regions)
    .where(ilike(regions.name, `%${query}%`))
    .limit(10);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    fullAddress: r.name, // TODO: build full address from parent chain
    location: r.center ? parsePointToLatLng(r.center) : { lat: 0, lng: 0 },
    regionLevel: r.level as GeocodeResult['regionLevel'],
    regionId: r.id,
  }));
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
  const result = await db.execute(
    sql`SELECT * FROM regions WHERE ST_Contains(boundary, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)) ORDER BY CASE level WHEN 'kelurahan' THEN 1 WHEN 'kecamatan' THEN 2 WHEN 'city' THEN 3 WHEN 'province' THEN 4 END LIMIT 1`
  );

  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;

  return {
    id: row.id as string,
    name: row.name as string,
    fullAddress: row.name as string,
    location: { lat, lng },
    regionLevel: row.level as GeocodeResult['regionLevel'],
    regionId: row.id as string,
  };
}

export async function getPoiLayer(params: { west: number; south: number; east: number; north: number; type?: string; types?: string[] }): Promise<Record<string, unknown>> {
  const bboxSql = sql`ST_MakeEnvelope(${params.west}, ${params.south}, ${params.east}, ${params.north}, 4326)`;

  let typeCondition = sql`TRUE`;
  if (params.type) {
    typeCondition = sql`type = ${params.type}`;
  } else if (params.types && params.types.length > 0) {
    typeCondition = sql`type = ANY(${params.types})`;
  }

  const result = await db.execute(
    sql`SELECT id, name, type, brand, ST_AsGeoJSON(location)::json as geometry, address, metadata FROM pois WHERE ST_Within(location, ${bboxSql}) AND ${typeCondition} LIMIT 500`
  );

  return {
    type: 'FeatureCollection',
    features: (result.rows as Record<string, unknown>[]).map((row) => ({
      type: 'Feature',
      geometry: row.geometry,
      properties: {
        id: row.id,
        name: row.name,
        type: row.type,
        brand: row.brand,
        address: row.address,
        metadata: row.metadata,
      },
    })),
  };
}

// Utility: parse PostGIS point WKT/EWKT to { lat, lng }
function parsePointToLatLng(wkt: string): { lat: number; lng: number } {
  // Handles both WKT "POINT(lng lat)" and EWKT "SRID=4326;POINT(lng lat)"
  const match = wkt.match(/POINT\(([\d.-]+)\s+([\d.-]+)\)/);
  if (!match) return { lat: 0, lng: 0 };
  return { lat: parseFloat(match[2]), lng: parseFloat(match[1]) };
}
