// ============================================================
// Common
// ============================================================
export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

// ============================================================
// Auth
// ============================================================
export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  avatarUrl?: string;
}

// ============================================================
// Regions
// ============================================================
export type RegionLevel = 'province' | 'city' | 'kecamatan' | 'kelurahan';

export interface Region {
  id: string;
  name: string;
  level: RegionLevel;
  parentId: string | null;
  center: LatLng;
  boundary?: Record<string, unknown>; // GeoJSON MultiPolygon
}

export interface RegionListParams {
  level?: RegionLevel;
  parentId?: string;
  search?: string;
}

// ============================================================
// Geocoding
// ============================================================
export interface GeocodeResult {
  id: string;
  name: string;
  fullAddress: string;
  location: LatLng;
  regionLevel?: RegionLevel;
  regionId?: string;
}

// ============================================================
// POIs
// ============================================================
export type PoiType = 'competitor' | 'office' | 'transport' | 'school' | 'hospital' | 'mall' | 'other';
export type PoiSource = 'manual' | 'osm' | 'google_places' | 'bps';

export interface Poi {
  id: string;
  name: string;
  type: PoiType;
  brand: string | null;
  location: LatLng;
  address: string | null;
  regionId: string | null;
  metadata: Record<string, unknown>;
  source: PoiSource;
}

export interface PoiQueryParams {
  bbox?: BBox;
  type?: PoiType | PoiType[];
  regionId?: string;
}

// ============================================================
// Map Layers
// ============================================================
export type LayerType = 'demographics' | 'competitors' | 'pois';

export interface LayerQueryParams {
  bbox: BBox;
  zoom?: number;
  dataYear?: number;
}

// GeoJSON FeatureCollection response - typed loosely to avoid
// pulling in full GeoJSON types
export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

export interface GeoJsonFeature {
  type: 'Feature';
  geometry: Record<string, unknown>;
  properties: Record<string, unknown>;
}

// ============================================================
// Suitability Engine
// ============================================================
export interface SuitabilityWeights {
  population: number;       // 0-100, e.g. 80
  purchasingPower: number;  // 0-100, e.g. 65
  accessibility: number;    // 0-100, e.g. 90
  competitor: number;       // 0-100 (applied as penalty), e.g. 40
}

export interface SuitabilityScoreRequest {
  lat: number;
  lng: number;
  radiusKm?: number; // defaults to 1
  weights: SuitabilityWeights;
  dataYear?: number;
}

export interface SuitabilityScoreResponse {
  score: number; // 0-100 composite
  breakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  dayaBeli: number;
  kepadatan: number;
  aksesibilitas: number;
}

// ============================================================
// Heatmap
// ============================================================
export interface HeatmapGenerateRequest {
  bbox: BBox;
  zoom: number;
  weights: SuitabilityWeights;
  dataYear?: number;
}

export interface HeatmapCell {
  cellGeoJson: Record<string, unknown>; // Polygon geometry
  center: LatLng;
  score: number;
  subScores: ScoreBreakdown;
}

export interface HeatmapGenerateResponse {
  cells: HeatmapCell[];
  computedAt: string;
}

// ============================================================
// Location Analysis (Right Panel)
// ============================================================
export interface LocationAnalysisParams {
  radiusKm?: number;
  weights?: SuitabilityWeights;
  dataYear?: number;
}

export interface LocationAnalysis {
  region: {
    id: string;
    name: string;
    parentName: string;
  };
  eligibilityScore: number;
  breakdown: ScoreBreakdown;
  demographics: {
    totalPopulation: number;
    age18_35Pct: number;
    dataYear: number;
  };
  radiusAnalysis: {
    radiusKm: number;
    competitors: number;
    offices: number;
  };
}

// ============================================================
// Bookmarks
// ============================================================
export interface Bookmark {
  id: string;
  userId: string;
  regionId: string | null;
  location: LatLng | null;
  label: string | null;
  score: number | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateBookmarkRequest {
  regionId?: string;
  lat?: number;
  lng?: number;
  label?: string;
  score?: number;
  notes?: string;
}

// ============================================================
// Export
// ============================================================
export type ExportFormat = 'csv' | 'geojson';

export interface ExportRequest {
  format: ExportFormat;
  weights?: SuitabilityWeights;
}

export interface ExportLogEntry {
  id: string;
  format: ExportFormat;
  parameters: Record<string, unknown>;
  fileUrl: string | null;
  createdAt: string;
}

// ============================================================
// Demographics
// ============================================================
export interface DemographicData {
  regionId: string;
  dataYear: number;
  totalPopulation: number;
  populationDensity: number;
  age18_35Pct: number;
  purchasingPower: number;
  avgIncome: number;
  accessibilityScore: number;
  metadata: Record<string, unknown>;
}

export interface DemographicCompareParams {
  regionId: string;
  years: number[]; // e.g. [2022, 2023, 2024]
}
