'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { getDefaultRoute } from '@/lib/auth/menu-config';

const PUBLIC_PATHS = ['/login'];

export function RouteGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, isPlatformAdmin, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

    if (!isAuthenticated && !isPublic) {
      router.replace('/login');
      return;
    }

    if (isAuthenticated && isPublic) {
      const defaultRoute = getDefaultRoute(isPlatformAdmin, user?.permissionCodes, user?.roleCodes);
      router.replace(defaultRoute);
    }
  }, [isAuthenticated, isLoading, pathname, router, isPlatformAdmin, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    );
  }

  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  if (!isAuthenticated && !isPublic) {
    return null;
  }

  return <>{children}</>;
}
