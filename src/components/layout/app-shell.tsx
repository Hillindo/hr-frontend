'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { useSidebarCollapseState } from './use-sidebar-collapse';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Desktop Sidebar - only render once */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          isMobileOpen={false}
          onMobileClose={() => {}}
        />
      </div>

      {/* Mobile Sidebar Drawer */}
      <Sidebar
        collapsed={false}
        onToggle={() => {}}
        isMobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
        )}
      >
        {children}
      </main>
    </div>
  );
}

// Page wrapper with standard layout
interface PageWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageWrapper({ children, title, subtitle, actions }: PageWrapperProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useSidebarCollapseState('hr-sidebar-collapsed:admin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          isMobileOpen={false}
          onMobileClose={() => {}}
        />
      </div>

      {/* Mobile Sidebar Drawer */}
      <Sidebar
        collapsed={false}
        onToggle={() => {}}
        isMobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content */}
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
        <div className="flex-1 p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
