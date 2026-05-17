'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, accent = false, hover = false, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-[var(--color-border)] shadow-sm',
        accent && 'card-accent',
        hover && 'transition-all duration-200 hover:shadow-md cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function CardHeader({ children, className, action }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between p-6 pb-4', className)}>
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={cn('text-lg font-semibold text-[var(--color-text-primary)]', className)}>
      {children}
    </h3>
  );
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <p className={cn('text-sm text-[var(--color-text-muted)] mt-1', className)}>
      {children}
    </p>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn('p-6 pt-0', className)}>{children}</div>;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('p-6 pt-4 border-t border-[var(--color-border)]', className)}>
      {children}
    </div>
  );
}

// Summary Card Component
interface SummaryCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  ctaLabel?: string;
  icon?: LucideIcon;
  urgent?: boolean;
  accent?: boolean;
  onClick?: () => void;
}

export function SummaryCard({ title, value, subtext, ctaLabel, icon: Icon, urgent, accent, onClick }: SummaryCardProps) {
  return (
    <Card accent hover={!!onClick} onClick={onClick} className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-muted)] font-medium">{title}</p>
          <p className={cn(
            'text-3xl font-bold mt-1',
            urgent ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-primary)]'
          )}>
            {value}
          </p>
          {subtext && (
            <p className="text-xs text-[var(--color-text-muted)] mt-1">{subtext}</p>
          )}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-premium)] flex items-center justify-center">
            <Icon className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
        )}
      </div>
      {ctaLabel && (
        <p className="text-sm text-[var(--color-accent)] font-medium mt-3 cursor-pointer hover:underline">
          {ctaLabel} <span aria-hidden="true">&rarr;</span>
        </p>
      )}
    </Card>
  );
}
