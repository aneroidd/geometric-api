import type { Region, GeocodeResult } from '@brewmap/shared';
export declare function listRegions(params: {
    level?: string;
    parentId?: string;
    search?: string;
}): Promise<Region[]>;
export declare function getRegionById(id: string): Promise<Region>;
export declare function forwardGeocode(query: string): Promise<GeocodeResult[]>;
export declare function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null>;
export declare function getPoiLayer(params: {
    west: number;
    south: number;
    east: number;
    north: number;
    type?: string;
    types?: string[];
}): Promise<Record<string, unknown>>;
