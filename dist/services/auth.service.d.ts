import type { RegisterRequest, LoginRequest, AuthTokens, UserProfile, UpdateProfileRequest } from '@brewmap/shared';
export declare function register(data: RegisterRequest): Promise<AuthTokens & {
    user: UserProfile;
}>;
export declare function login(data: LoginRequest): Promise<AuthTokens & {
    user: UserProfile;
}>;
export declare function refreshToken(token: string): Promise<AuthTokens>;
export declare function getProfile(userId: string): Promise<UserProfile>;
export declare function updateProfile(userId: string, data: UpdateProfileRequest): Promise<UserProfile>;
