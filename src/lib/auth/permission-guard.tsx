'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ReactNode, useMemo } from 'react';
import { routePermissions, getDefaultRoute } from '@/lib/auth/menu-config';

interface PermissionGuardProps {
  children: ReactNode;
}

const PUBLIC_PATHS = ['/login'];

function matchRoute(pathname: string, routePath: string): boolean {
  if (routePath === pathname) return true;
  if (pathname.startsWith(routePath + '/')) return true;
  return false;
}

const sortedRoutePermissions = [...routePermissions].sort((a, b) => b.path.length - a.path.length);

export function PermissionGuard({ children }: PermissionGuardProps) {
  const { isAuthenticated, isPlatformAdmin, user, hasAnyPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  const isAuthorized = useMemo(() => {
    if (isPublic) return true;
    if (!isAuthenticated) return false;

    const matchingRoute = sortedRoutePermissions.find((rp) => matchRoute(pathname, rp.path));

    if (!matchingRoute) return true;

    if (matchingRoute.platformAdminOnly) {
      return isPlatformAdmin;
    }

    if (matchingRoute.permissions.length === 0) return true;

    if (isPlatformAdmin) return true;

    return hasAnyPermission(...matchingRoute.permissions);
  }, [isAuthenticated, isPlatformAdmin, pathname, hasAnyPermission, isPublic]);

  useEffect(() => {
    if (!isAuthenticated) return;

    if (isAuthorized === false) {
      const defaultRoute = getDefaultRoute(isPlatformAdmin, user?.permissionCodes, user?.roleCodes);
      router.replace(defaultRoute);
    }
  }, [isAuthenticated, isAuthorized, isPlatformAdmin, user, router]);

  if (isPublic) return <>{children}</>;

  if (!isAuthenticated) return null;

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    );
  }

  return <>{children}</>;
}
