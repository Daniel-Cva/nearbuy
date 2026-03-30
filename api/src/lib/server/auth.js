/**
 * auth.js — Nearbuy API Authentication Utilities (Stateless JWT)
 *
 * Stack:
 *   - bcryptjs        → password hashing (pure JS, Cloudflare Workers safe)
 *   - Web Crypto API  → JWT HS256 signing / verification (built into Workers)
 *
 * Token strategy:
 *   - JWT is purely stateless. Validation is done via HMAC-SHA256 signature.
 *   - Expiry is enforced by the 'exp' claim in the payload.
 *   - Sessions survive worker restarts and redeploys.
 *
 * JWT payload shape: { userid, email, username, role, iat, exp }
 */

import bcrypt from 'bcryptjs';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const BCRYPT_ROUNDS      = 10;
const JWT_EXPIRY_SECONDS = 180 * 60; // 3 hours
const JWT_ALGO           = { name: 'HMAC', hash: 'SHA-256' };


// ─── BCRYPT: PASSWORD HASHING ─────────────────────────────────────────────────

/**
 * Hash a plain-text password with bcrypt.
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
    return await bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compare a plain password against a stored bcrypt hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}


// ─── JWT INTERNALS ────────────────────────────────────────────────────────────

/** @param {string} secret @param {'sign'|'verify'} usage */
async function importKey(secret, usage) {
    return await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        JWT_ALGO,
        false,
        [usage]
    );
}

/** Base64url encode (URL-safe, no padding). */
function b64url(str) {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/** Base64url decode back to string. */
function b64urlDecode(str) {
    return atob(str.replace(/-/g, '+').replace(/_/g, '/').padEnd(
        str.length + (4 - str.length % 4) % 4, '='
    ));
}


// ─── JWT: CREATE TOKEN ────────────────────────────────────────────────────────

/**
 * Sign a JWT (HS256).
 *
 * @param {object} payload - { userid, email, username, role }
 * @param {string} secret  - platform.env.JWT_SECRET
 * @returns {Promise<string>}  Signed JWT string
 */
export async function createToken(payload, secret) {
    if (!secret) throw new Error('JWT_SECRET is not set');

    const now = Math.floor(Date.now() / 1000);
    const exp = now + JWT_EXPIRY_SECONDS;

    const fullPayload = { ...payload, iat: now, exp };

    const header    = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body      = b64url(JSON.stringify(fullPayload));
    const message   = `${header}.${body}`;

    const key       = await importKey(secret, 'sign');
    const sigBuf    = await crypto.subtle.sign(JWT_ALGO, key, new TextEncoder().encode(message));
    const signature = b64url(String.fromCharCode(...new Uint8Array(sigBuf)));

    return `${message}.${signature}`;
}


// ─── JWT: VERIFY TOKEN ────────────────────────────────────────────────────────

/**
 * Verify a JWT.
 * Two checks must pass:
 *   1. HMAC-SHA256 signature is valid (not tampered).
 *   2. exp claim has not passed (not expired).
 *
 * @param {string} token
 * @param {string} secret  — platform.env.JWT_SECRET
 * @returns {Promise<object | null>}  The payload or null
 */
export async function verifyToken(token, secret) {
    try {
        if (!secret) throw new Error('JWT_SECRET is not set');
        if (!token) return null;

        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const [header, body, signature] = parts;
        const message = `${header}.${body}`;

        // ── Check 1: HMAC signature ──────────────────────────────────────────
        const sigBuffer = Uint8Array.from(b64urlDecode(signature), c => c.charCodeAt(0));
        const key       = await importKey(secret, 'verify');
        const isValid   = await crypto.subtle.verify(
            JWT_ALGO, key, sigBuffer, new TextEncoder().encode(message)
        );
        
        if (!isValid) {
            console.warn('auth.js - verifyToken: Invalid signature');
            return null;
        }

        // ── Check 2: exp claim ───────────────────────────────────────────────
        const payload = JSON.parse(b64urlDecode(body));
        if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
            console.warn('auth.js - verifyToken: Token expired');
            return null;
        }

        return payload;

    } catch (e) {
        console.error('auth.js - verifyToken error:', e.message);
        return null;
    }
}


// ─── ROUTE HELPERS ────────────────────────────────────────────────────────────

/**
 * Extract Bearer token from request → verify → return payload or null.
 *
 * @param {Request} request
 * @param {string} secret
 * @returns {Promise<object | null>}
 */
export async function getTokenPayload(request, secret) {
    const auth = request.headers.get('Authorization') ?? '';
    if (!auth.startsWith('Bearer ')) return null;
    const token = auth.slice(7).trim();
    return await verifyToken(token, secret);
}

/**
 * Guard helper — verify token AND enforce a specific role.
 *
 * @param {Request} request
 * @param {string} secret
 * @param {'user'|'business'|'admin'} role
 * @returns {Promise<object|null>}
 */
export async function requireRole(request, secret, role) {
    const payload = await getTokenPayload(request, secret);
    if (!payload || payload.role !== role) return null;
    return payload;
}

/**
 * Extract the raw Bearer token string from a request header.
 *
 * @param {Request} request
 * @returns {string|null}
 */
export function extractToken(request) {
    const auth = request.headers.get('Authorization') ?? '';
    if (!auth.startsWith('Bearer ')) return null;
    return auth.slice(7).trim();
}
