export interface UserDisplaySource {
  email?: string | null;
  isPlatformAdmin?: boolean;
  roleCodes?: string[] | null;
}

export function getUserDisplayName(user?: UserDisplaySource | null) {
  return user?.email ?? 'Signed in user';
}

export function getUserRoleLabel(user?: UserDisplaySource | null) {
  if (user?.isPlatformAdmin) return 'Super Admin';

  const roleCode = user?.roleCodes?.[0];
  if (!roleCode) return 'User';

  return roleCode
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function getUserInitials(user?: UserDisplaySource | null) {
  const email = user?.email?.trim();
  if (!email) return 'U';

  const localPart = email.split('@')[0] || email;
  const parts = localPart.split(/[._\-\s]+/).filter(Boolean);
  const source = parts.length >= 2 ? [parts[0], parts[1]] : [localPart.slice(0, 1), localPart.slice(1, 2)];

  return source
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';
}
