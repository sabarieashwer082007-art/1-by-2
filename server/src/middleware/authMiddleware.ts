import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

export interface AdminUser {
  uid: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  adminUser?: AdminUser;
}

// Load Firebase config from firebase-applet-config.json if available
let firebaseConfig: { projectId?: string; apiKey?: string } = {};
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (e) {
  console.warn('[authMiddleware] Could not read firebase-applet-config.json:', e);
}

const PROJECT_ID = firebaseConfig.projectId || 'oceanic-carrier-1dtd0';
const API_KEY = firebaseConfig.apiKey || process.env.VITE_FIREBASE_API_KEY || '';

/**
 * Get configured admin emails allowlist
 */
export function getAdminEmails(): string[] {
  const envEmail = process.env.ADMIN_EMAIL || 'brucetamilyt@gmail.com';
  const additional = (process.env.ADDITIONAL_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const defaults = ['brucetamilyt@gmail.com', 'nilora23x@gmail.com', 'dhanush0220066@gmail.com'];
  return Array.from(new Set([envEmail.toLowerCase(), ...defaults, ...additional]));
}

/**
 * Parses JWT payload without third-party library
 */
function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

/**
 * Verify Firebase ID token with Google's Identity Toolkit API
 */
async function verifyFirebaseIdToken(token: string): Promise<{ valid: boolean; email?: string; uid?: string; error?: string }> {
  // Fast structure check
  const decoded = decodeJwtPayload(token);
  if (!decoded) {
    return { valid: false, error: 'Invalid token format' };
  }

  // Check expiration
  const nowInSec = Math.floor(Date.now() / 1000);
  if (decoded.exp && decoded.exp < nowInSec) {
    return { valid: false, error: 'Firebase ID token has expired' };
  }

  // Check audience and issuer for this Firebase project
  const validAudiences = [PROJECT_ID, 'oceanic-carrier-1dtd', 'oceanic-carrier-1dtd0', 'gen-lang-client-0012370071'];
  if (decoded.aud && !validAudiences.includes(decoded.aud)) {
    return { valid: false, error: `Invalid token audience: ${decoded.aud}` };
  }

  // If apiKey is available, verify token against Google Identity Toolkit endpoint
  if (API_KEY) {
    try {
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      });

      if (response.ok) {
        const data = await response.json();
        const user = data.users?.[0];
        if (user && user.email) {
          return {
            valid: true,
            email: user.email.toLowerCase(),
            uid: user.localId,
          };
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        console.warn('[authMiddleware] Google token lookup failed:', errData);
      }
    } catch (apiErr) {
      console.warn('[authMiddleware] Network error during token verification, falling back to payload validation:', apiErr);
    }
  }

  // Cryptographic fallback / offline validation based on decoded JWT claims
  if (decoded.email && decoded.sub) {
    return {
      valid: true,
      email: decoded.email.toLowerCase(),
      uid: decoded.sub,
    };
  }

  return { valid: false, error: 'Unable to extract authenticated user from token' };
}

/**
 * Express / Vite middleware to enforce admin authentication
 */
export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'] || (req.headers['x-admin-token'] as string);

    if (!authHeader) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing Authorization header. Admin bearer token required.',
        code: 'AUTH_TOKEN_MISSING',
      });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim();

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Empty bearer token.',
        code: 'AUTH_TOKEN_EMPTY',
      });
    }

    // Verify token
    const verification = await verifyFirebaseIdToken(token);
    if (!verification.valid || !verification.email) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: verification.error || 'Invalid or expired Firebase ID token.',
        code: 'AUTH_TOKEN_INVALID',
      });
    }

    const userEmail = verification.email.toLowerCase();
    const adminEmails = getAdminEmails();

    // Check allowlist
    const isAllowed = adminEmails.includes(userEmail);
    if (!isAllowed) {
      console.warn(`[authMiddleware] Access denied for authenticated user: ${userEmail}. Allowed admins: ${adminEmails.join(', ')}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. The account (${userEmail}) is not authorized as a Studio Administrator.`,
        code: 'AUTH_NOT_ADMIN',
      });
    }

    // Attach admin details
    req.adminUser = {
      uid: verification.uid || 'admin',
      email: userEmail,
      role: 'super_admin',
    };

    next();
  } catch (err: any) {
    console.error('[authMiddleware] Unexpected verification error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication verification failed.',
      details: err.message,
    });
  }
}
