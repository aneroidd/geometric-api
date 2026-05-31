import { eq, and, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { bookmarks } from '../db/schema.js';
import { AppError } from '../middleware/errorHandler.js';
import type { Bookmark, CreateBookmarkRequest } from '@brewmap/shared';

export async function listBookmarks(userId: string): Promise<Bookmark[]> {
  const rows = await db.select().from(bookmarks).where(eq(bookmarks.userId, userId));

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    regionId: r.regionId,
    location: r.location ? parsePointToLatLng(r.location as string) : null,
    label: r.label,
    score: r.score,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function createBookmark(userId: string, data: CreateBookmarkRequest): Promise<Bookmark> {
  const locationValue = data.lat !== undefined && data.lng !== undefined
    ? sql`ST_SetSRID(ST_MakePoint(${data.lng}, ${data.lat}), 4326)`
    : null;

  const result = await db.execute(
    sql`INSERT INTO bookmarks (user_id, region_id, location, label, score, notes)
        VALUES (${userId}, ${data.regionId || null}, ${locationValue}, ${data.label || null}, ${data.score || null}, ${data.notes || null})
        RETURNING *`
  );

  const row = (result.rows as Record<string, unknown>[])[0];
  return {
    id: row.id as string,
    userId: row.user_id as string,
    regionId: row.region_id as string | null,
    location: row.location ? parsePointToLatLng(row.location as string) : null,
    label: row.label as string | null,
    score: row.score as number | null,
    notes: row.notes as string | null,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

export async function deleteBookmark(userId: string, bookmarkId: string): Promise<void> {
  const [row] = await db
    .select()
    .from(bookmarks)
    .where(and(eq(bookmarks.id, bookmarkId), eq(bookmarks.userId, userId)))
    .limit(1);

  if (!row) {
    throw new AppError(404, 'NOT_FOUND', 'Bookmark not found');
  }

  await db.delete(bookmarks).where(eq(bookmarks.id, bookmarkId));
}

function parsePointToLatLng(wkt: string): { lat: number; lng: number } {
  const match = wkt.match(/POINT\(([\d.-]+)\s+([\d.-]+)\)/);
  if (!match) return { lat: 0, lng: 0 };
  return { lat: parseFloat(match[2]), lng: parseFloat(match[1]) };
}
