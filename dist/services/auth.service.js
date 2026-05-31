import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { users } from '../db/schema.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
function generateTokens(payload) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
    const refreshToken = jwt.sign({ ...payload, type: 'refresh' }, env.JWT_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });
    return { accessToken, refreshToken };
}
export async function register(data) {
    // Check if email already exists
    const existing = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    if (existing.length > 0) {
        throw new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
    }
    const passwordHash = await bcrypt.hash(data.password, 12);
    const [user] = await db.insert(users).values({
        email: data.email,
        passwordHash,
        fullName: data.fullName || null,
    }).returning();
    const tokens = generateTokens({ userId: user.id, email: user.email });
    return {
        ...tokens,
        user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt.toISOString(),
        },
    };
}
export async function login(data) {
    const [user] = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    if (!user) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }
    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }
    const tokens = generateTokens({ userId: user.id, email: user.email });
    return {
        ...tokens,
        user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt.toISOString(),
        },
    };
}
export async function refreshToken(token) {
    try {
        const payload = jwt.verify(token, env.JWT_SECRET);
        if (payload.type !== 'refresh') {
            throw new AppError(401, 'INVALID_TOKEN', 'Not a refresh token');
        }
        return generateTokens({ userId: payload.userId, email: payload.email });
    }
    catch {
        throw new AppError(401, 'INVALID_TOKEN', 'Invalid or expired refresh token');
    }
}
export async function getProfile(userId) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
        throw new AppError(404, 'NOT_FOUND', 'User not found');
    }
    return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.toISOString(),
    };
}
export async function updateProfile(userId, data) {
    const [user] = await db
        .update(users)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
    if (!user) {
        throw new AppError(404, 'NOT_FOUND', 'User not found');
    }
    return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.toISOString(),
    };
}
