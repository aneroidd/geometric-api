export declare const getRegionsGeoJSON: () => Promise<{
    type: string;
    features: {
        type: string;
        properties: {
            id: any;
            name: any;
            level: any;
        };
        geometry: any;
    }[];
}>;
export declare function getSuitabilityGrid(regionId: string, weights: any): Promise<{}>;
