'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ManagerSidebar } from './manager-sidebar';
import { Header } from './header';
import { useSidebarCollapseState } from './use-sidebar-collapse';

interface ManagerAppShellProps {
  children: React.ReactNode;
}

export function ManagerAppShell({ children }: ManagerAppShellProps) {
  return <div className="min-h-screen bg-[var(--color-bg)]">{children}</div>;
}

interface ManagerPageWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function ManagerPageWrapper({ children, title, subtitle, actions }: ManagerPageWrapperProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useSidebarCollapseState('hr-sidebar-collapsed:manager');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <ManagerSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div
        className={cn(
          'min-h-screen flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
        )}
      >
        <Header
          title={title}
          subtitle={subtitle}
          actions={actions}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        <div className="flex-1 p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
