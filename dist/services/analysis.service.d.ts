export interface SuitabilityWeights {
    kepadatanPenduduk: number;
    dayaBeli: number;
    aksesibilitas: number;
    kepadatanKompetitor: number;
}
export declare const analyzeLocationPotential: (lat: number, lng: number, weights: SuitabilityWeights) => Promise<{
    koordinat: {
        lat: number;
        lng: number;
    };
    skorPeluangCuan: number;
    rincian: {
        penduduk: string;
        dayaBeli: string;
        aksesibilitas: string;
        pengurangKompetitor: string;
    };
}>;
