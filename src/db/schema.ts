import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  real,
  numeric,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  customType,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================
// Custom PostGIS geometry type
// ============================================================
const geometry = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'geometry';
  },
  toDriver(value: string): string {
    return value;
  },
  fromDriver(value: string): string {
    return value;
  },
});

const geometryPoint = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'geometry(Point, 4326)';
  },
  toDriver(value: string): string {
    return value;
  },
  fromDriver(value: string): string {
    return value;
  },
});

const geometryMultiPolygon = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'geometry(MultiPolygon, 4326)';
  },
  toDriver(value: string): string {
    return value;
  },
  fromDriver(value: string): string {
    return value;
  },
});

const geometryPolygon = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'geometry(Polygon, 4326)';
  },
  toDriver(value: string): string {
    return value;
  },
  fromDriver(value: string): string {
    return value;
  },
});

// ============================================================
// Domain 1: Identity & Auth
// ============================================================
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// Domain 2: Geography & Administrative Boundaries
// ============================================================
export const regions = pgTable(
  'regions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    level: varchar('level', { length: 50 }).notNull(), // 'province' | 'city' | 'kecamatan' | 'kelurahan'
    parentId: uuid('parent_id').references((): AnyPgColumn => regions.id),
    boundary: geometryMultiPolygon('boundary'),
    center: geometryPoint('center'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ([
    index('idx_regions_parent').on(table.parentId),
    index('idx_regions_level').on(table.level),
  ]),
);

export const pois = pgTable(
  'pois',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(), // 'competitor' | 'office' | 'transport' | ...
    brand: varchar('brand', { length: 255 }),
    location: geometryPoint('location').notNull(),
    address: text('address'),
    regionId: uuid('region_id').references(() => regions.id),
    metadata: jsonb('metadata').default('{}'),
    source: varchar('source', { length: 50 }).default('manual').notNull(), // 'manual' | 'osm' | 'google_places' | 'bps'
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ([
    index('idx_pois_type').on(table.type),
    index('idx_pois_region').on(table.regionId),
  ]),
);

// ============================================================
// Domain 3: Intelligence & Demographics
// ============================================================
export const demographics = pgTable(
  'demographics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    regionId: uuid('region_id').notNull().references(() => regions.id),
    dataYear: integer('data_year').notNull(),
    totalPopulation: integer('total_population'),
    populationDensity: real('population_density'),
    age18_35Pct: real('age_18_35_pct'),
    purchasingPower: real('purchasing_power'), // index 0-100
    avgIncome: numeric('avg_income', { precision: 15, scale: 2 }),
    accessibilityScore: real('accessibility_score'), // 0-100
    metadata: jsonb('metadata').default('{}'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ([
    uniqueIndex('idx_demographics_region_year').on(table.regionId, table.dataYear),
    index('idx_demographics_region').on(table.regionId),
  ]),
);

export const suitabilityPresets = pgTable('suitability_presets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  weightPopulation: real('weight_population').notNull().default(0.80),
  weightPurchasingPower: real('weight_purchasing_power').notNull().default(0.65),
  weightAccessibility: real('weight_accessibility').notNull().default(0.90),
  weightCompetitor: real('weight_competitor').notNull().default(-0.40),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const heatmapCells = pgTable(
  'heatmap_cells',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cellGeom: geometryPolygon('cell_geom').notNull(),
    center: geometryPoint('center').notNull(),
    regionId: uuid('region_id').references(() => regions.id),
    suitability: real('suitability'), // 0-100
    subScores: jsonb('sub_scores').default('{}'),
    zoomLevel: integer('zoom_level').notNull(),
    computedAt: timestamp('computed_at', { withTimezone: true }).defaultNow().notNull(),
    weightHash: varchar('weight_hash', { length: 64 }),
  },
  (table) => ([
    index('idx_heatmap_cells_zoom').on(table.zoomLevel),
  ]),
);

// ============================================================
// Domain 4: User Data
// ============================================================
export const bookmarks = pgTable(
  'bookmarks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    regionId: uuid('region_id').references(() => regions.id),
    location: geometryPoint('location'),
    label: varchar('label', { length: 255 }),
    score: real('score'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ([
    index('idx_bookmarks_user').on(table.userId),
  ]),
);

export const exportLogs = pgTable('export_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  regionId: uuid('region_id').references(() => regions.id),
  format: varchar('format', { length: 20 }).notNull(), // 'csv' | 'geojson'
  parameters: jsonb('parameters').default('{}'),
  fileUrl: text('file_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// Relations
// ============================================================
export const usersRelations = relations(users, ({ many }) => ({
  bookmarks: many(bookmarks),
  exportLogs: many(exportLogs),
  suitabilityPresets: many(suitabilityPresets),
}));

export const regionsRelations = relations(regions, ({ one, many }) => ({
  parent: one(regions, { fields: [regions.parentId], references: [regions.id], relationName: 'regionHierarchy' }),
  children: many(regions, { relationName: 'regionHierarchy' }),
  pois: many(pois),
  demographics: many(demographics),
  heatmapCells: many(heatmapCells),
  bookmarks: many(bookmarks),
}));

export const poisRelations = relations(pois, ({ one }) => ({
  region: one(regions, { fields: [pois.regionId], references: [regions.id] }),
}));

export const demographicsRelations = relations(demographics, ({ one }) => ({
  region: one(regions, { fields: [demographics.regionId], references: [regions.id] }),
}));

export const suitabilityPresetsRelations = relations(suitabilityPresets, ({ one }) => ({
  user: one(users, { fields: [suitabilityPresets.userId], references: [users.id] }),
}));

export const heatmapCellsRelations = relations(heatmapCells, ({ one }) => ({
  region: one(regions, { fields: [heatmapCells.regionId], references: [regions.id] }),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, { fields: [bookmarks.userId], references: [users.id] }),
  region: one(regions, { fields: [bookmarks.regionId], references: [regions.id] }),
}));

export const exportLogsRelations = relations(exportLogs, ({ one }) => ({
  user: one(users, { fields: [exportLogs.userId], references: [users.id] }),
  region: one(regions, { fields: [exportLogs.regionId], references: [regions.id] }),
}));
