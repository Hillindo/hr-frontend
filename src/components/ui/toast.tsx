'use client';

import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastComponentProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-[var(--color-success)]" />,
  error: <XCircle className="w-5 h-5 text-[var(--color-danger)]" />,
  warning: <AlertTriangle className="w-5 h-5 text-[var(--color-warning)]" />,
  info: <Info className="w-5 h-5 text-[var(--color-info)]" />,
};

const toastStyles: Record<ToastType, string> = {
  success: 'border-l-[var(--color-success)]',
  error: 'border-l-[var(--color-danger)]',
  warning: 'border-l-[var(--color-warning)]',
  info: 'border-l-[var(--color-info)]',
};

export function ToastComponent({ toast, onDismiss }: ToastComponentProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = toast.duration ?? 4000;
    const exitDelay = duration - 300; // Start exit animation 300ms before dismissal

    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, exitDelay);

    const dismissTimer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(dismissTimer);
    };
  }, [toast.id, toast.duration, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 p-4 bg-white rounded-xl shadow-lg border border-[var(--color-border)] border-l-4',
        'transition-all duration-300 ease-out',
        toastStyles[toast.type],
        isExiting
          ? 'opacity-0 translate-x-full'
          : 'opacity-100 translate-x-0 animate-slide-in-right'
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex-shrink-0 mt-0.5">
        {toastIcons[toast.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{toast.title}</p>
        {toast.description && (
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{toast.description}</p>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Add animation keyframes for slide-in-right
const style = `
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  .animate-slide-in-right {
    animation: slideInRight 0.3s ease forwards;
  }
`;

export function ToastStyles() {
  return <style>{style}</style>;
}
