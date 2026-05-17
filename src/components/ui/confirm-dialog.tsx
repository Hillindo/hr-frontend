'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Modal, ModalFooter } from './modal';
import { Button } from './button';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
  children?: React.ReactNode;
}

const variantConfig: Record<ConfirmVariant, {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  confirmVariant: 'destructive' | 'primary' | 'secondary';
}> = {
  danger: {
    icon: <AlertTriangle className="w-6 h-6" />,
    iconBg: 'bg-[var(--color-danger-bg)]',
    iconColor: 'text-[var(--color-danger)]',
    confirmVariant: 'destructive',
  },
  warning: {
    icon: <AlertCircle className="w-6 h-6" />,
    iconBg: 'bg-[var(--color-warning-bg)]',
    iconColor: 'text-[var(--color-warning)]',
    confirmVariant: 'primary',
  },
  info: {
    icon: <Info className="w-6 h-6" />,
    iconBg: 'bg-[var(--color-info-bg)]',
    iconColor: 'text-[var(--color-info)]',
    confirmVariant: 'primary',
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'warning',
  isLoading = false,
  children,
}: ConfirmDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const config = variantConfig[variant];

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClose = () => {
    if (!isConfirming) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="sm"
      showHeader={false}
      closeOnOverlayClick={!isConfirming}
      closeOnEscape={!isConfirming}
      className="p-6"
    >
      <div className="flex flex-col items-center text-center">
        {/* Icon */}
        <div className={cn('w-14 h-14 rounded-full flex items-center justify-center mb-4', config.iconBg)}>
          <span className={config.iconColor}>{config.icon}</span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-[var(--color-text-muted)] mb-6 max-w-sm">
          {description}
        </p>

        {/* Custom content (e.g. rejection reason textarea) */}
        {children}

        {/* Actions */}
        <ModalFooter className="w-full">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isConfirming}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={config.confirmVariant}
            onClick={handleConfirm}
            isLoading={isConfirming || isLoading}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}

// Hook version for programmatic usage
import { createContext, useContext } from 'react';

interface ConfirmDialogOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

interface ConfirmDialogContextValue {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | undefined>(undefined);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  // This is a simplified version - full implementation would use a portal/modal manager
  const confirm = async (_options: ConfirmDialogOptions): Promise<boolean> => {
    // For now, just return false - can be extended with a proper modal manager
    return false;
  };

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within ConfirmDialogProvider');
  }
  return context;
}
