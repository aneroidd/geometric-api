/**
 * Get demographic choropleth layer as GeoJSON FeatureCollection.
 */
export declare function getDemographicLayer(params: {
    west: number;
    south: number;
    east: number;
    north: number;
    zoom?: number;
    dataYear?: number;
}): Promise<Record<string, unknown>>;
