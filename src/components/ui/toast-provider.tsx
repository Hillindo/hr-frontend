'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastComponent, ToastStyles, ToastData, ToastType } from './toast';

interface ToastContextValue {
  toast: (options: Omit<ToastData, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const MAX_TOASTS = 5;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((options: Omit<ToastData, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastData = { id, ...options };

    setToasts((prev) => {
      const updated = [newToast, ...prev];
      // Keep only MAX_TOASTS visible
      return updated.slice(0, MAX_TOASTS);
    });

    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((title: string, description?: string) => {
    return addToast({ type: 'success', title, description });
  }, [addToast]);

  const error = useCallback((title: string, description?: string) => {
    return addToast({ type: 'error', title, description });
  }, [addToast]);

  const warning = useCallback((title: string, description?: string) => {
    return addToast({ type: 'warning', title, description });
  }, [addToast]);

  const info = useCallback((title: string, description?: string) => {
    return addToast({ type: 'info', title, description });
  }, [addToast]);

  const value: ToastContextValue = {
    toast: addToast,
    success,
    error,
    warning,
    info,
    dismiss,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastStyles />
      {/* Toast Container - top-right position */}
      <div
        className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastComponent toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Convenience hook for simple usage
export function useToastSimple() {
  const { toast: addToast } = useToast();

  const toast = useCallback((type: ToastType, title: string, description?: string) => {
    return addToast({ type, title, description });
  }, [addToast]);

  return { toast, success: (title: string, desc?: string) => toast('success', title, desc), error: (title: string, desc?: string) => toast('error', title, desc), warning: (title: string, desc?: string) => toast('warning', title, desc), info: (title: string, desc?: string) => toast('info', title, desc) };
}
