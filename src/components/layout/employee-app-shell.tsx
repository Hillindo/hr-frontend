'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import { EmployeeSidebar } from './employee-sidebar';
import { Header } from './header';
import { useSidebarCollapseState } from './use-sidebar-collapse';

interface EmployeeAppShellProps {
  children: React.ReactNode;
}

export function EmployeeAppShell({ children }: EmployeeAppShellProps) {
  return <div className="min-h-screen bg-[var(--color-bg)]">{children}</div>;
}

interface EmployeePageWrapperProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function EmployeePageWrapper({ children, title, subtitle, actions }: EmployeePageWrapperProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useSidebarCollapseState('hr-sidebar-collapsed:employee');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="hidden lg:block">
        <EmployeeSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          isMobileOpen={false}
          onMobileClose={() => {}}
        />
      </div>

      <EmployeeSidebar
        collapsed={false}
        onToggle={() => {}}
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
          title={title || ''}
          subtitle={subtitle}
          actions={actions}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        <div className="flex-1 p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
