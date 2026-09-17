import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X, Loader2 } from 'lucide-react';
import { ToastItem, ToastType } from '../types';

interface ToastContextType {
  toasts: ToastItem[];
  showSuccess: (message: string, duration?: number) => string;
  showError: (message: string, duration?: number) => string;
  showWarning: (message: string, duration?: number) => string;
  showInfo: (message: string, duration?: number) => string;
  showLoading: (message: string) => string;
  dismissToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<ToastItem>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Standalone global dispatcher support
let globalToastHandler: ToastContextType | null = null;

export const showSuccess = (message: string, duration?: number) => globalToastHandler?.showSuccess(message, duration) || '';
export const showError = (message: string, duration?: number) => globalToastHandler?.showError(message, duration) || '';
export const showWarning = (message: string, duration?: number) => globalToastHandler?.showWarning(message, duration) || '';
export const showInfo = (message: string, duration?: number) => globalToastHandler?.showInfo(message, duration) || '';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, duration = 4500, loading = false): string => {
    // Avoid exact duplicate toasts within active window
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => {
      const isDuplicate = prev.some((t) => t.message === message && t.type === type);
      if (isDuplicate) return prev;
      return [...prev, { id, type, message, duration, loading }];
    });

    if (!loading && duration > 0) {
      const timeout = setTimeout(() => {
        dismissToast(id);
      }, duration);
      timeoutsRef.current.set(id, timeout);
    }

    return id;
  }, [dismissToast]);

  const updateToast = useCallback((id: string, updates: Partial<ToastItem>) => {
    setToasts((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, ...updates };
          if (updated.loading === false && (updates.duration ?? 4500) > 0) {
            const timeout = setTimeout(() => {
              dismissToast(id);
            }, updates.duration || 4500);
            timeoutsRef.current.set(id, timeout);
          }
          return updated;
        }
        return t;
      })
    );
  }, [dismissToast]);

  const showSuccessFn = useCallback((message: string, duration = 4500) => addToast('success', message, duration), [addToast]);
  const showErrorFn = useCallback((message: string, duration = 5500) => addToast('error', message, duration), [addToast]);
  const showWarningFn = useCallback((message: string, duration = 5000) => addToast('warning', message, duration), [addToast]);
  const showInfoFn = useCallback((message: string, duration = 4500) => addToast('info', message, duration), [addToast]);
  const showLoadingFn = useCallback((message: string) => addToast('info', message, 0, true), [addToast]);

  const contextValue: ToastContextType = {
    toasts,
    showSuccess: showSuccessFn,
    showError: showErrorFn,
    showWarning: showWarningFn,
    showInfo: showInfoFn,
    showLoading: showLoadingFn,
    dismissToast,
    updateToast,
  };

  globalToastHandler = contextValue;

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast Notification Container */}
      <aside
        id="toast-notifications-container"
        aria-label="Notifications"
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2.5rem)] pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            let bgClass = 'bg-slate-900 border-slate-700 text-slate-100';
            let Icon = Info;
            let iconColor = 'text-blue-400';

            if (toast.loading) {
              Icon = Loader2;
              iconColor = 'text-amber-400 animate-spin';
              bgClass = 'bg-slate-900 border-amber-500/40 text-slate-100';
            } else if (toast.type === 'success') {
              Icon = CheckCircle2;
              iconColor = 'text-emerald-400';
              bgClass = 'bg-slate-900 border-emerald-500/40 text-slate-100';
            } else if (toast.type === 'error') {
              Icon = XCircle;
              iconColor = 'text-rose-400';
              bgClass = 'bg-slate-900 border-rose-500/40 text-slate-100';
            } else if (toast.type === 'warning') {
              Icon = AlertTriangle;
              iconColor = 'text-amber-400';
              bgClass = 'bg-slate-900 border-amber-500/40 text-slate-100';
            }

            return (
              <motion.div
                key={toast.id}
                id={`toast-${toast.id}`}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md ${bgClass}`}
                role="alert"
              >
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
                <div className="flex-1 text-sm font-medium leading-snug break-words">
                  {toast.message}
                </div>
                {!toast.loading && (
                  <button
                    id={`close-toast-${toast.id}`}
                    onClick={() => dismissToast(toast.id)}
                    aria-label="Close notification"
                    className="shrink-0 p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </aside>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
