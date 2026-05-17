'use client';

import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';
import { Mail, Phone, MapPin, Calendar, Building, Users } from 'lucide-react';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  return (
    <div
      className={cn(
        'rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-semibold',
        sizes[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}

interface InfoRowProps {
  icon?: React.ElementType;
  label: string;
  value: string | React.ReactNode;
  className?: string;
}

export function InfoRow({ icon: Icon, label, value, className }: InfoRowProps) {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      {Icon && (
        <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-premium)] flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-[var(--color-accent)]" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{value}</p>
      </div>
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md';
}

export function ProgressBar({ value, max = 100, label, showPercentage = true, size = 'md' }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs text-[var(--color-text-muted)]">{label}</span>}
          {showPercentage && (
            <span className={cn(
              'text-xs font-medium',
              percentage >= 90 ? 'text-[var(--color-success)]' :
              percentage >= 70 ? 'text-[var(--color-warning)]' :
              'text-[var(--color-danger)]'
            )}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-gray-100 rounded-full overflow-hidden', heights[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            percentage >= 90 ? 'bg-[var(--color-success)]' :
            percentage >= 70 ? 'bg-[var(--color-warning)]' :
            'bg-[var(--color-danger)]'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="w-16 h-16 mb-4 rounded-full bg-[var(--color-surface-premium)] flex items-center justify-center text-[var(--color-text-muted)]">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface TabsProps {
  tabs: { id: string; label: string; count?: number }[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex items-center gap-1 border-b border-[var(--color-border)]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === tab.id
              ? 'border-[var(--color-accent)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              'ml-2 px-2 py-0.5 text-xs rounded-full',
              activeTab === tab.id
                ? 'bg-[var(--color-accent)] text-[var(--color-primary)]'
                : 'bg-gray-100 text-[var(--color-text-muted)]'
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

interface TabPanelProps {
  children: React.ReactNode;
  isActive: boolean;
}

export function TabPanel({ children, isActive }: TabPanelProps) {
  if (!isActive) return null;
  return <div className="animate-fade-in">{children}</div>;
}