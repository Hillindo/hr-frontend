'use client';

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: ModalSize;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showHeader?: boolean;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-[400px]',
  md: 'max-w-[560px]',
  lg: 'max-w-[720px]',
  xl: 'max-w-[900px]',
  full: 'max-w-[calc(100vw-32px)] max-h-[calc(100vh-32px)]',
};

const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
const preferredAutofocusSelector = '[data-autofocus], input:not([type="hidden"]), select, textarea';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showHeader = true,
  footer,
  className,
  bodyClassName,
  headerClassName,
  footerClassName,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const closeOnEscapeRef = useRef(closeOnEscape);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    closeOnEscapeRef.current = closeOnEscape;
  }, [closeOnEscape]);

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscapeRef.current) {
        onCloseRef.current();
        return;
      }

      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter((element) => !element.hasAttribute('disabled'));

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    const focusTimer = window.setTimeout(() => {
      if (!modalRef.current) return;

      if (
        document.activeElement instanceof HTMLElement &&
        modalRef.current.contains(document.activeElement)
      ) {
        return;
      }

      const focusTarget =
        modalRef.current.querySelector<HTMLElement>(preferredAutofocusSelector) ??
        modalRef.current.querySelector<HTMLElement>(focusableSelector);

      focusTarget?.focus({ preventScroll: true });
    }, 10);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
      previousActiveElement.current?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={cn(
          'relative w-full bg-white rounded-[20px] shadow-xl flex flex-col',
          'animate-modal-in max-h-[calc(100vh-64px)]',
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        {showHeader && (
          <div className={cn('flex items-center justify-between p-6 pb-4 border-b border-[var(--color-border)]', headerClassName)}>
            {title && (
              <h2 id="modal-title" className="text-lg font-semibold text-[var(--color-text-primary)]">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'p-2 rounded-xl hover:bg-gray-100 transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
                  !title && 'ml-auto'
                )}
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className={cn('flex-1 overflow-y-auto p-6', bodyClassName)}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className={cn('p-6 pt-4 border-t border-[var(--color-border)]', footerClassName)}>
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-modal-in {
          animation: modalIn 0.2s ease forwards;
        }
      `}</style>
    </div>
  );
}

// Modal Footer helper for consistent button layout
export function ModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-end gap-3', className)}>
      {children}
    </div>
  );
}
