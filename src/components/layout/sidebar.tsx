'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Settings,
  ChevronLeft,
  LogOut,
  X,
} from 'lucide-react';
import { useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { getUserDisplayName, getUserInitials, getUserRoleLabel } from '@/lib/auth/user-display';
import { adminMenuGroups, settingsMenuItem, type MenuItem } from '@/lib/auth/menu-config';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

function isItemVisible(item: MenuItem, isPlatformAdmin: boolean, hasAnyPermission: (...p: string[]) => boolean): boolean {
  if (item.platformAdminOnly) {
    return isPlatformAdmin;
  }
  if (item.permissions.length === 0) {
    return true;
  }
  return hasAnyPermission(...item.permissions);
}

export function Sidebar({ collapsed = false, onToggle, isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout, isPlatformAdmin, user, hasAnyPermission } = useAuth();

  const visibleGroups = useMemo(() => {
    return adminMenuGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          isItemVisible(item, isPlatformAdmin, hasAnyPermission)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [isPlatformAdmin, hasAnyPermission]);

  const showSettings = true;

  const profileName = getUserDisplayName(user);
  const profileRole = getUserRoleLabel(user);
  const profileInitials = getUserInitials(user);

  const isActive = (href: string) => {
    if (href === '/employee' || href === '/dashboard') {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen && onMobileClose) {
        onMobileClose();
      }
    },
    [isMobileOpen, onMobileClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  const renderNavItems = (isMobile = false) => (
    <>
      <nav className={cn('flex-1 py-4 overflow-y-auto', isMobile ? 'px-4' : 'px-3', 'space-y-1')}>
        {visibleGroups.map((group) => (
          <div key={group.id}>
            {group.label && (!collapsed || isMobile) && (
              <div className={cn('px-3 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider')}>
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => isMobile && onMobileClose?.()}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                    active
                      ? 'bg-[var(--color-secondary)] text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  )}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--color-accent)] rounded-r-full" />
                  )}
                  <item.icon className={cn('w-5 h-5 flex-shrink-0', active ? 'text-white' : 'text-white/60 group-hover:text-white')} />
                  {(!collapsed || isMobile) && (
                    <span className={cn('text-sm font-medium', active && 'text-white')}>
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className={cn('py-4', isMobile ? 'px-4' : 'px-3', 'border-t border-white/10 space-y-1')}>
        {showSettings && (
          <Link
            href={settingsMenuItem.href}
            onClick={() => isMobile && onMobileClose?.()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 group"
          >
            <Settings className="w-5 h-5 flex-shrink-0 text-white/60 group-hover:text-white" />
            {(!collapsed || isMobile) && (
              <span className="text-sm font-medium">{settingsMenuItem.label}</span>
            )}
          </Link>
        )}

        <div className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 mt-2', collapsed && !isMobile && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-[var(--color-primary)] text-xs font-semibold flex-shrink-0">
            {profileInitials}
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{profileName}</p>
              <p className="text-xs text-white/60 truncate">{profileRole}</p>
            </div>
          )}
        </div>

        <button onClick={() => logout()} className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 group')}>
          <LogOut className="w-5 h-5 flex-shrink-0 text-white/60 group-hover:text-white" />
          {(!collapsed || isMobile) && (
            <span className="text-sm font-medium">Sign Out</span>
          )}
        </button>
      </div>
    </>
  );

  const desktopSidebar = (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-[var(--color-primary)] flex flex-col transition-all duration-300 z-50',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      <div className="h-[72px] flex items-center px-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)] flex items-center justify-center">
            <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-white font-semibold text-lg leading-tight">HR System</h1>
              <p className="text-white/60 text-xs">PT Hillga Indonesia</p>
            </div>
          )}
        </div>
      </div>

      {renderNavItems(false)}

      <button
        onClick={onToggle}
        className="absolute -right-3 top-[88px] w-6 h-6 bg-[var(--color-primary)] border-2 border-white rounded-full flex items-center justify-center text-white hover:bg-[var(--color-secondary)] transition-colors shadow-lg"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
      </button>
    </aside>
  );

  const mobileDrawer = (
    <div className="lg:hidden">
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-[var(--color-primary)] flex flex-col z-50 transition-transform duration-300',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-[72px] flex items-center justify-between px-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)] flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg leading-tight">HR System</h1>
              <p className="text-white/60 text-xs">PT Hillga Indonesia</p>
            </div>
          </div>
          <button
            onClick={onMobileClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {renderNavItems(true)}
      </aside>
    </div>
  );

  return (
    <>
      <div className="hidden lg:block">
        {desktopSidebar}
      </div>
      {mobileDrawer}
    </>
  );
}