import { auth } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';

export interface DiagnosticReport {
  timestamp: string;
  firebaseInitialized: boolean;
  projectId: string;
  authDomain: string;
  hasApiKey: boolean;
  currentUserEmail: string | null;
  currentUserUid: string | null;
  isAuthorizedAdmin: boolean;
  backendConnected: boolean;
  backendError?: string;
  allowedAdmins: string[];
  environment: string;
}

export const KNOWN_ADMINS = ['brucetamilyt@gmail.com', 'nilora23x@gmail.com', 'dhanush0220066@gmail.com'];

export async function runAdminDiagnostics(): Promise<DiagnosticReport> {
  const currentUser = auth.currentUser;
  const userEmail = currentUser?.email?.toLowerCase() || null;
  
  let backendConnected = false;
  let backendError: string | undefined = undefined;
  let allowedAdmins = [...KNOWN_ADMINS];

  try {
    const res = await fetch('/api/admin/integration-status');
    if (res.ok) {
      const data = await res.json();
      backendConnected = true;
      if (Array.isArray(data.allowedAdmins) && data.allowedAdmins.length > 0) {
        allowedAdmins = data.allowedAdmins;
      }
    } else {
      backendError = `HTTP ${res.status}: ${res.statusText}`;
    }
  } catch (err: any) {
    backendError = err.message || 'Network error reaching backend server';
  }

  const isAuthorizedAdmin = Boolean(
    userEmail && (allowedAdmins.includes(userEmail) || KNOWN_ADMINS.includes(userEmail))
  );

  return {
    timestamp: new Date().toISOString(),
    firebaseInitialized: Boolean(firebaseConfig.projectId && firebaseConfig.apiKey),
    projectId: firebaseConfig.projectId || 'oceanic-carrier-1dtd0',
    authDomain: firebaseConfig.authDomain || 'unknown',
    hasApiKey: Boolean(firebaseConfig.apiKey),
    currentUserEmail: userEmail,
    currentUserUid: currentUser?.uid || null,
    isAuthorizedAdmin,
    backendConnected,
    backendError,
    allowedAdmins,
    environment: import.meta.env.MODE || 'development',
  };
}
