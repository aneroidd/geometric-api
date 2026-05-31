import type { Bookmark, CreateBookmarkRequest } from '@brewmap/shared';
export declare function listBookmarks(userId: string): Promise<Bookmark[]>;
export declare function createBookmark(userId: string, data: CreateBookmarkRequest): Promise<Bookmark>;
export declare function deleteBookmark(userId: string, bookmarkId: string): Promise<void>;
