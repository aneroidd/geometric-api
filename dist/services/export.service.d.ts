import type { ExportFormat } from '@brewmap/shared';
/**
 * Export location analysis data in the requested format.
 */
export declare function exportLocation(userId: string, regionId: string, format: ExportFormat): Promise<string>;
