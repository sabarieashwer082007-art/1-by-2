import React, { useState, useEffect } from 'react';
import { Lock, Mail, Key, AlertCircle, ShieldCheck, Terminal, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStudio } from '../context/StudioContext';
import { runAdminDiagnostics, DiagnosticReport } from '../utils/adminDiagnostic';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onNavigate: (page: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onNavigate }) => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, isAdmin, user } = useAuth();
  const { siteSettings } = useStudio();

  const [email, setEmail] = useState('brucetamilyt@gmail.com');
  const [password, setPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Diagnostic state (development & troubleshooting panel)
  const [diagnostics, setDiagnostics] = useState<DiagnosticReport | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);

  useEffect(() => {
    // Avoid setState during render by scheduling in next tick
    if (user && isAdmin) {
      const timer = setTimeout(() => {
        onLoginSuccess();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, isAdmin, onLoginSuccess]);

  const refreshDiagnostics = async () => {
    setRunningDiagnostics(true);
    try {
      const report = await runAdminDiagnostics();
      setDiagnostics(report);
    } catch (e) {
      console.error('Failed to run diagnostics:', e);
    } finally {
      setRunningDiagnostics(false);
    }
  };

  useEffect(() => {
    refreshDiagnostics();
  }, [user, isAdmin]);

  if (user && isAdmin) {
    return (
      <div className="bg-[#F4F1EC] min-h-[85vh] flex items-center justify-center text-[#1C1C1A]">
        <div className="flex items-center gap-3 text-sm font-sans">
          <RefreshCw className="w-5 h-5 animate-spin text-[#6B4F3A]" />
          <span>Verifying administrator access...</span>
        </div>
      </div>
    );
  }

  const handleGoogleLogin = async () => {
    setError('');
    setInfoMsg('');
    setLoading(true);
    try {
      await loginWithGoogle();
      setTimeout(() => onLoginSuccess(), 50);
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups for this site or use the email/password option below.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error connecting to Firebase Authentication. Please check your internet connection and retry.');
      } else {
        setError(err.message || 'Google sign in failed. Please ensure your account has admin access.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    setLoading(true);
    try {
      if (isRegisterMode) {
        await registerWithEmail(email, password);
        setTimeout(() => onLoginSuccess(), 50);
      } else {
        try {
          await loginWithEmail(email, password);
          setTimeout(() => onLoginSuccess(), 50);
        } catch (authErr: any) {
          if (authErr.code === 'auth/user-not-found' || authErr.message?.includes('user-not-found')) {
            setIsRegisterMode(true);
            setInfoMsg('Account not found in Firebase Auth yet. Click below to set this password for your admin account.');
          } else {
            throw authErr;
          }
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setIsRegisterMode(false);
        setError('This email is already registered. Please enter your existing password, or sign in with Google above.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters long.');
      } else {
        setError(err.message || 'Invalid credentials or unauthorized account.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="admin-login-page" className="bg-[#F4F1EC] min-h-[85vh] flex items-center justify-center px-6 py-16 text-[#1C1C1A]">
      <div className="max-w-md w-full p-8 sm:p-10 rounded-[6px] border border-[#D8D2C8] bg-[#FFFFFF] shadow-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-[4px] mx-auto flex items-center justify-center bg-[#E8E3DB] border border-[#D8D2C8] text-[#6B4F3A]">
            <Lock className="w-5 h-5" />
          </div>
          <span className="text-[11px] uppercase tracking-[0.25em] font-sans font-semibold text-[#6B4F3A] block">
            CONFIDENTIAL ATELIER PORTAL
          </span>
          <h1 className="font-heading text-3xl font-light text-[#1C1C1A]">
            Studio Administrator
          </h1>
          <p className="text-xs text-[#66645F] font-sans">
            Administrative studio control and calendar coordination for {siteSettings.studioName}.
          </p>
        </div>

        {/* Admin Credentials Helper Banner */}
        <div className="p-4 rounded-[4px] bg-[#F4F1EC] border border-[#D8D2C8] text-xs text-[#1C1C1A] space-y-2 font-sans">
          <div className="flex items-center justify-between font-semibold">
            <span className="text-[#66645F]">Authorized Admin:</span>
            <code className="bg-[#E8E3DB] px-2 py-0.5 rounded text-[#1C1C1A] font-mono text-[11px]">brucetamilyt@gmail.com</code>
          </div>
          <p className="text-[11px] text-[#66645F] leading-relaxed">
            Use <strong>Sign in with Google</strong> for instant authorized access, or enter your email and set a password.
          </p>
        </div>

        {infoMsg && (
          <div className="p-4 rounded-[4px] bg-[#E8E3DB] border border-[#6B4F3A] text-[#1C1C1A] text-xs flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-[#6B4F3A] shrink-0" />
            <span>{infoMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-[4px] bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Google Admin Sign-in */}
        <div className="space-y-4 font-sans">
          <button
            type="button"
            id="admin-google-login-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-[4px] border border-[#D8D2C8] bg-[#FFFFFF] text-[#1C1C1A] hover:bg-[#F4F1EC] text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-3 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Studio Admin Google</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-[#D8D2C8]" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#66645F] font-semibold">
              Or {isRegisterMode ? 'Set Password' : 'Email Login'}
            </span>
            <div className="flex-1 border-t border-[#D8D2C8]" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1 text-[#66645F]">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-[#66645F]" />
                <input
                  type="email"
                  required
                  placeholder="nilora23x@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-[4px] bg-[#FFFFFF] border border-[#D8D2C8] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#66645F]">
                  {isRegisterMode ? 'New Password (min 6 chars)' : 'Password'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(!isRegisterMode);
                    setError('');
                    setInfoMsg('');
                  }}
                  className="text-[11px] text-[#6B4F3A] hover:underline cursor-pointer"
                >
                  {isRegisterMode ? 'Already have password? Log in' : 'First time? Set Password'}
                </button>
              </div>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3.5 top-3.5 text-[#66645F]" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder={isRegisterMode ? 'Choose a secure password' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-[4px] bg-[#FFFFFF] border border-[#D8D2C8] text-[#1C1C1A] focus:outline-none focus:border-[#6B4F3A]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="admin-submit-login-btn"
              className="w-full py-3.5 text-xs font-semibold uppercase tracking-[0.08em] rounded-[4px] bg-[#1C1C1A] text-[#F4F1EC] hover:bg-[#6B4F3A] transition-colors cursor-pointer"
            >
              {loading
                ? 'Authenticating...'
                : isRegisterMode
                ? 'Set Admin Password & Enter'
                : 'Enter Studio Control Center'}
            </button>
          </form>
        </div>

        <div className="pt-4 border-t border-[#D8D2C8] text-center space-y-3 font-sans">
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#66645F]">
            <ShieldCheck className="w-4 h-4 text-[#6B4F3A]" />
            <span>Protected Atelier Authentication</span>
          </div>
          <button
            onClick={() => onNavigate('home')}
            className="text-xs text-[#66645F] hover:text-[#1C1C1A] transition-colors"
          >
            Return to Studio Home
          </button>
        </div>

        {/* Diagnostic Panel Toggle & Card */}
        <div className="pt-3 border-t border-[#D8D2C8] space-y-3 font-sans">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="inline-flex items-center gap-1.5 text-[11px] text-[#6B4F3A] hover:underline cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{showDiagnostics ? 'Hide Diagnostic Panel' : 'Show Environment & Auth Diagnostics'}</span>
            </button>

            {showDiagnostics && (
              <button
                type="button"
                onClick={refreshDiagnostics}
                disabled={runningDiagnostics}
                className="text-[10px] text-[#66645F] hover:text-[#1C1C1A] flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${runningDiagnostics ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            )}
          </div>

          {showDiagnostics && diagnostics && (
            <div className="p-3.5 rounded bg-[#1C1C1A] text-[#F4F1EC] text-[11px] font-mono space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-neutral-700 pb-1.5">
                <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px]">Studio Auth Diagnostics</span>
                <span className="text-neutral-400 text-[9px]">{diagnostics.environment}</span>
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Firebase Init:</span>
                  <span className={diagnostics.firebaseInitialized ? 'text-emerald-400' : 'text-rose-400'}>
                    {diagnostics.firebaseInitialized ? 'READY' : 'MISSING KEYS'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Project ID:</span>
                  <span className="text-neutral-200">{diagnostics.projectId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Backend Server:</span>
                  <span className={diagnostics.backendConnected ? 'text-emerald-400' : 'text-amber-400'}>
                    {diagnostics.backendConnected ? 'CONNECTED' : (diagnostics.backendError || 'OFFLINE')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Active User:</span>
                  <span className="text-neutral-200 truncate max-w-[180px]">{diagnostics.currentUserEmail || 'None (Signed Out)'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Admin Clearance:</span>
                  <span className={diagnostics.isAuthorizedAdmin ? 'text-emerald-400 font-bold' : 'text-neutral-400'}>
                    {diagnostics.isAuthorizedAdmin ? 'AUTHORIZED' : 'PENDING LOGIN'}
                  </span>
                </div>
                <div className="pt-1 border-t border-neutral-800 text-[9px] text-neutral-400">
                  <span>Allowed: {diagnostics.allowedAdmins.join(', ')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
