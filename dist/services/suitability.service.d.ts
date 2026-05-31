import type { SuitabilityScoreRequest, SuitabilityScoreResponse, SuitabilityWeights, LocationAnalysis } from '@brewmap/shared';
/**
 * Core suitability scoring algorithm.
 *
 * score = (w1 × normalize(population_density))
 *       + (w2 × normalize(purchasing_power))
 *       + (w3 × normalize(accessibility_score))
 *       - (w4 × (100 - competitor_penalty(count)))
 *
 * All weights are normalized to sum to 1.0 before application.
 */
export declare function computeScore(request: SuitabilityScoreRequest): Promise<SuitabilityScoreResponse>;
/**
 * Full location analysis for the right-panel.
 */
export declare function getLocationAnalysis(regionId: string, params: {
    radiusKm?: number;
    dataYear?: number;
    weights?: SuitabilityWeights;
}): Promise<LocationAnalysis>;
