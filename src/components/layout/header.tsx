'use client';

import { cn } from '@/lib/utils';
import { Bell, Search, RefreshCw, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useTransition } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { getUserDisplayName, getUserInitials, getUserRoleLabel } from '@/lib/auth/user-display';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onMenuClick?: () => void;
}

export function Header({ title, subtitle, actions, onMenuClick }: HeaderProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [isInvalidating, setIsInvalidating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const isRefreshing = isInvalidating || isPending;
  const displayName = getUserDisplayName(user);
  const roleLabel = getUserRoleLabel(user);
  const initials = getUserInitials(user);

  const handleRefresh = async () => {
    setIsInvalidating(true);
    try {
      await queryClient.invalidateQueries({ refetchType: 'active' });
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setIsInvalidating(false);
    }
  };

  return (
    <header className="h-[72px] bg-white border-b border-[var(--color-border)] flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle - shown on tablet/mobile */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">{title}</h1>
          {subtitle && (
            <p className="text-sm text-[var(--color-text-muted)]">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search Toggle */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <Search className="w-5 h-5 text-[var(--color-text-muted)]" />
        </button>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-wait"
          aria-label="Refresh page data"
          title="Refresh page data"
        >
          <RefreshCw className={cn('w-5 h-5 text-[var(--color-text-muted)]', isRefreshing && 'animate-spin')} />
        </button>

        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-[var(--color-text-muted)]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-danger)] rounded-full" />
        </button>

        <div className="hidden md:flex items-center gap-3 pl-3 border-l border-[var(--color-border)]">
          <div className="text-right">
            <p className="text-sm font-medium text-[var(--color-text-primary)] max-w-[220px] truncate">{displayName}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{roleLabel}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-[var(--color-primary)] text-xs font-semibold">
            {initials}
          </div>
        </div>

        {/* Custom Actions */}
        {actions}
      </div>
    </header>
  );
}

// Page title with actions
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">{title}</h2>
        {subtitle && (
          <p className="text-sm text-[var(--color-text-muted)] mt-1">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">{actions}</div>
      )}
    </div>
  );
}
