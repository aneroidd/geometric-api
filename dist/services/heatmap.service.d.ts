import type { HeatmapGenerateRequest, HeatmapGenerateResponse } from '@brewmap/shared';
/**
 * Generate a heatmap grid over the given bounding box.
 * Creates a hexagonal/square grid and computes suitability scores for each cell.
 */
export declare function generateHeatmap(request: HeatmapGenerateRequest): Promise<HeatmapGenerateResponse>;
