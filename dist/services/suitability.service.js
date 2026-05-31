import { eq, sql } from 'drizzle-orm';
import { db } from '../config/database.js';
import { regions } from '../db/schema.js';
import { AppError } from '../middleware/errorHandler.js';
/**
 * Normalize a raw value into 0-100 range using min-max normalization.
 */
function normalize(value, min, max) {
    if (max === min)
        return 50;
    return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}
/**
 * Compute competitor penalty: more competitors = lower score.
 * Uses an inverse exponential decay.
 */
function competitorPenalty(count, maxReasonable = 10) {
    // 0 competitors = 100 (best), 10+ competitors = ~0
    return Math.max(0, 100 * Math.exp(-0.3 * count));
}
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
export async function computeScore(request) {
    const { lat, lng, radiusKm = 1, weights, dataYear } = request;
    // 1. Find the containing region (kelurahan level)
    const regionResult = await db.execute(sql `SELECT id FROM regions WHERE ST_Contains(boundary, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)) AND level = 'kelurahan' LIMIT 1`);
    const regionRow = regionResult.rows[0];
    if (!regionRow) {
        throw new AppError(404, 'REGION_NOT_FOUND', 'No kelurahan found for the given coordinates');
    }
    const regionId = regionRow.id;
    // 2. Get demographic data
    const yearCondition = dataYear ? sql `AND data_year = ${dataYear}` : sql `ORDER BY data_year DESC`;
    const demoResult = await db.execute(sql `SELECT * FROM demographics WHERE region_id = ${regionId} ${yearCondition} LIMIT 1`);
    const demo = demoResult.rows[0];
    if (!demo) {
        throw new AppError(404, 'NO_DEMOGRAPHICS', 'No demographic data available for this region');
    }
    // 3. Count competitors in radius
    const competitorResult = await db.execute(sql `SELECT COUNT(*)::int as count FROM pois WHERE type = 'competitor' AND ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radiusKm * 1000})`);
    const competitorCount = competitorResult.rows[0]?.count || 0;
    // 4. Compute sub-scores
    const populationScore = normalize(demo.population_density, 0, 50000);
    const purchasingScore = demo.purchasing_power || 0; // Already 0-100
    const accessibilityScore = demo.accessibility_score || 0; // Already 0-100
    const compPenalty = competitorPenalty(competitorCount);
    // 5. Weighted composite score
    const totalWeight = (weights.population + weights.purchasingPower + weights.accessibility + weights.competitor) / 100;
    const rawScore = (weights.population / 100) * populationScore +
        (weights.purchasingPower / 100) * purchasingScore +
        (weights.accessibility / 100) * accessibilityScore -
        (weights.competitor / 100) * (100 - compPenalty);
    const score = Math.max(0, Math.min(100, rawScore / totalWeight));
    return {
        score: Math.round(score * 10) / 10,
        breakdown: {
            dayaBeli: Math.round(purchasingScore * 10) / 10,
            kepadatan: Math.round(populationScore * 10) / 10,
            aksesibilitas: Math.round(accessibilityScore * 10) / 10,
        },
    };
}
/**
 * Full location analysis for the right-panel.
 */
export async function getLocationAnalysis(regionId, params) {
    // Get region info
    const [region] = await db.select().from(regions).where(eq(regions.id, regionId)).limit(1);
    if (!region) {
        throw new AppError(404, 'NOT_FOUND', 'Region not found');
    }
    // Get parent name
    let parentName = '';
    if (region.parentId) {
        const [parent] = await db.select().from(regions).where(eq(regions.id, region.parentId)).limit(1);
        parentName = parent?.name || '';
    }
    // Get demographics
    const yearCondition = params.dataYear
        ? sql `AND data_year = ${params.dataYear}`
        : sql ``;
    const demoResult = await db.execute(sql `SELECT * FROM demographics WHERE region_id = ${regionId} ${yearCondition} ORDER BY data_year DESC LIMIT 1`);
    const demo = demoResult.rows[0];
    // Default weights
    const weights = params.weights || {
        population: 80,
        purchasingPower: 65,
        accessibility: 90,
        competitor: 40,
    };
    // Compute score using region center if available
    let score = 0;
    let breakdown = { dayaBeli: 0, kepadatan: 0, aksesibilitas: 0 };
    if (region.center) {
        // Parse center point to get lat/lng for scoring
        const centerMatch = region.center.match(/POINT\(([\d.-]+)\s+([\d.-]+)\)/);
        if (centerMatch) {
            const result = await computeScore({
                lat: parseFloat(centerMatch[2]),
                lng: parseFloat(centerMatch[1]),
                radiusKm: params.radiusKm || 1,
                weights,
                dataYear: params.dataYear,
            });
            score = result.score;
            breakdown = result.breakdown;
        }
    }
    // Count nearby POIs
    const radiusMeters = (params.radiusKm || 1) * 1000;
    const poiCountResult = await db.execute(sql `SELECT type, COUNT(*)::int as count FROM pois WHERE ST_DWithin(location::geography, (SELECT center::geography FROM regions WHERE id = ${regionId}), ${radiusMeters}) AND type IN ('competitor', 'office') GROUP BY type`);
    const poiCounts = poiCountResult.rows.reduce((acc, row) => ({ ...acc, [row.type]: row.count }), { competitor: 0, office: 0 });
    return {
        region: {
            id: region.id,
            name: region.name,
            parentName,
        },
        eligibilityScore: score,
        breakdown,
        demographics: {
            totalPopulation: demo?.total_population || 0,
            age18_35Pct: demo?.age_18_35_pct || 0,
            dataYear: demo?.data_year || 2023,
        },
        radiusAnalysis: {
            radiusKm: params.radiusKm || 1,
            competitors: poiCounts.competitor || 0,
            offices: poiCounts.office || 0,
        },
    };
}
