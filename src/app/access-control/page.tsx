'use client';

import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { PageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { useAuth } from '@/lib/auth/auth-context';
import type {
  PlatformPermission,
  PlatformRole,
  PlatformUserMembership,
} from '@/lib/api/admin';
import {
  useCreatePlatformPermission,
  useCreatePlatformRole,
  useDeletePlatformPermission,
  useDeletePlatformRole,
  usePlatformPermissionCatalog,
  usePlatformPermissions,
  usePlatformRoles,
  usePlatformTenants,
  usePlatformUsers,
  useUpdatePlatformPermission,
  useUpdatePlatformRole,
  useUpdatePlatformUserRoles,
} from '@/features/admin/hooks/useAdmin';
import {
  Check,
  Edit2,
  Plus,
  Search,
  Shield,
  SlidersHorizontal,
  Trash2,
  Users,
  type LucideIcon,
} from 'lucide-react';

type TabKey = 'roles' | 'users';

type RoleFormState = {
  id?: string;
  code: string;
  name: string;
  description: string;
  permissionIds: string[];
  selectedPermissions: PlatformPermission[];
};

type PermissionFormState = {
  id?: string;
  code: string;
  name: string;
  module: string;
};

const inputClass = 'w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-accent)]';

const emptyRoleForm: RoleFormState = {
  code: '',
  name: '',
  description: '',
  permissionIds: [],
  selectedPermissions: [],
};

const emptyPermissionForm: PermissionFormState = {
  code: '',
  name: '',
  module: '',
};

export default function AccessControlPage() {
  const { isLoading: isAuthLoading, isPlatformAdmin, hasPermission } = useAuth();
  const canManageAccessControl = isPlatformAdmin || hasPermission('tenant.manage_roles');
  const [activeTab, setActiveTab] = useState<TabKey>('roles');
  const [tenantId, setTenantId] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [permissionSearch, setPermissionSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [roleForm, setRoleForm] = useState<RoleFormState | null>(null);
  const [permissionForm, setPermissionForm] = useState<PermissionFormState | null>(null);
  const [userAssignment, setUserAssignment] = useState<PlatformUserMembership | null>(null);
  const [assignmentRoleIds, setAssignmentRoleIds] = useState<string[]>([]);
  const [assignmentStatus, setAssignmentStatus] = useState('ACTIVE');

  const tenantsQuery = usePlatformTenants({ enabled: canManageAccessControl });
  const tenants = tenantsQuery.data?.data ?? [];
  const effectiveTenantId = tenantId || tenants[0]?.id || '';

  const permissionCatalogQuery = usePlatformPermissionCatalog({ enabled: canManageAccessControl });
  const permissionsQuery = usePlatformPermissions({
    page: 1,
    pageSize: 50,
    ...(permissionSearch ? { search: permissionSearch } : {}),
  }, { enabled: isPlatformAdmin });
  const rolesQuery = usePlatformRoles({
    tenantId: effectiveTenantId,
    page: 1,
    pageSize: 50,
    ...(roleSearch ? { search: roleSearch } : {}),
  }, { enabled: canManageAccessControl });
  const roleOptionsQuery = usePlatformRoles({
    tenantId: effectiveTenantId,
    page: 1,
    pageSize: 100,
  }, { enabled: canManageAccessControl });
  const usersQuery = usePlatformUsers({
    tenantId: effectiveTenantId,
    page: 1,
    pageSize: 50,
    ...(userSearch ? { search: userSearch } : {}),
  }, { enabled: canManageAccessControl });

  const createRole = useCreatePlatformRole();
  const updateRole = useUpdatePlatformRole();
  const deleteRole = useDeletePlatformRole();
  const createPermission = useCreatePlatformPermission();
  const updatePermission = useUpdatePlatformPermission();
  const deletePermission = useDeletePlatformPermission();
  const updateUserRoles = useUpdatePlatformUserRoles();

  const roles = rolesQuery.data?.data ?? [];
  const roleOptions = useMemo(() => roleOptionsQuery.data?.data ?? [], [roleOptionsQuery.data]);
  const users = usersQuery.data?.data ?? [];
  const permissions = permissionsQuery.data?.data ?? [];
  const catalog = permissionCatalogQuery.data?.data;
  const selectedTenant = tenants.find((tenant) => tenant.id === effectiveTenantId);

  const permissionModules = useMemo(() => catalog?.modules ?? [], [catalog]);
  const catalogPermissionIds = useMemo(() => {
    return new Set((catalog?.permissions ?? []).map((permission) => permission.id));
  }, [catalog]);
  const selectedPermissionsOutsideCatalog = useMemo(() => {
    if (!roleForm) return [];
    return roleForm.selectedPermissions.filter((permission) => !catalogPermissionIds.has(permission.id));
  }, [catalogPermissionIds, roleForm]);
  const assignmentRoleOptions = useMemo(() => {
    const options = new Map<string, { id: string; name: string; permissionsCount: number }>();

    for (const role of roleOptions) {
      options.set(role.id, {
        id: role.id,
        name: role.name,
        permissionsCount: role.permissions.length,
      });
    }

    for (const role of userAssignment?.roles ?? []) {
      if (!options.has(role.id)) {
        options.set(role.id, {
          id: role.id,
          name: role.name,
          permissionsCount: 0,
        });
      }
    }

    return Array.from(options.values());
  }, [roleOptions, userAssignment]);

  if (isAuthLoading) {
    return (
      <PageWrapper title="Access Control" subtitle="Loading access context">
        <div className="bg-white border border-[var(--color-border)] rounded-2xl">
          <LoadingState />
        </div>
      </PageWrapper>
    );
  }

  if (!canManageAccessControl) {
    return (
      <PageWrapper title="Access Control" subtitle="RBAC management access required">
        <div className="bg-white border border-[var(--color-border)] rounded-2xl p-8 text-center">
          <Shield className="w-10 h-10 mx-auto text-[var(--color-text-muted)] mb-3" />
          <p className="text-sm text-[var(--color-text-muted)]">
            This page is available for platform super admins or users with tenant role management permission.
          </p>
        </div>
      </PageWrapper>
    );
  }

  const togglePermission = (permissionId: string) => {
    if (!roleForm) return;
    const exists = roleForm.permissionIds.includes(permissionId);
    setRoleForm({
      ...roleForm,
      permissionIds: exists
        ? roleForm.permissionIds.filter((id) => id !== permissionId)
        : [...roleForm.permissionIds, permissionId],
    });
  };

  const openRoleForm = (role?: PlatformRole) => {
    if (role) {
      setRoleForm({
        id: role.id,
        code: role.code,
        name: role.name,
        description: role.description ?? '',
        permissionIds: role.permissionIds,
        selectedPermissions: role.permissions,
      });
    } else {
      setRoleForm(emptyRoleForm);
    }
  };

  const submitRole = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!roleForm || !effectiveTenantId) return;

    if (roleForm.id) {
      await updateRole.mutateAsync({
        id: roleForm.id,
        payload: {
          name: roleForm.name,
          description: roleForm.description,
          permissionIds: roleForm.permissionIds,
        },
      });
    } else {
      await createRole.mutateAsync({
        tenantId: effectiveTenantId,
        code: roleForm.code,
        name: roleForm.name,
        description: roleForm.description,
        permissionIds: roleForm.permissionIds,
      });
    }

    setRoleForm(null);
  };

  const openPermissionForm = (permission?: PlatformPermission) => {
    if (permission) {
      setPermissionForm({
        id: permission.id,
        code: permission.code,
        name: permission.name,
        module: permission.module,
      });
    } else {
      setPermissionForm(emptyPermissionForm);
    }
  };

  const submitPermission = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!permissionForm) return;

    if (permissionForm.id) {
      await updatePermission.mutateAsync({
        id: permissionForm.id,
        payload: {
          name: permissionForm.name,
          module: permissionForm.module,
        },
      });
    } else {
      await createPermission.mutateAsync({
        code: permissionForm.code,
        name: permissionForm.name,
        module: permissionForm.module,
      });
    }

    setPermissionForm(null);
  };

  const openUserAssignment = (user: PlatformUserMembership) => {
    setUserAssignment(user);
    setAssignmentRoleIds(user.roleIds);
    setAssignmentStatus(user.membershipStatus);
  };

  const submitUserAssignment = async () => {
    if (!userAssignment) return;
    await updateUserRoles.mutateAsync({
      membershipId: userAssignment.membershipId,
      payload: {
        roleIds: assignmentRoleIds,
        status: assignmentStatus,
      },
    });
    setUserAssignment(null);
  };

  return (
    <PageWrapper
      title="Access Control"
      subtitle="Manage company roles, permissions, and user role assignments"
      actions={activeTab === 'roles' ? <Button icon={Plus} onClick={() => openRoleForm()}>New Role</Button> : undefined}
    >
      <div className="space-y-6">
        <div className="bg-white border border-[var(--color-border)] rounded-2xl p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Company scope</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Changes apply to roles and users inside the selected company.
              </p>
            </div>
            <select
              value={effectiveTenantId}
              onChange={(event) => setTenantId(event.target.value)}
              disabled={!isPlatformAdmin || tenants.length <= 1}
              className="h-10 min-w-[260px] rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
            >
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryBox label="Selected Company" value={selectedTenant?.name ?? '-'} icon={Shield} />
          <SummaryBox label="Roles" value={rolesQuery.data?.meta.total ?? 0} icon={SlidersHorizontal} />
          <SummaryBox label="Users" value={usersQuery.data?.meta.total ?? 0} icon={Users} />
        </div>

        <div className="flex flex-wrap gap-2 border-b border-[var(--color-border)]">
          <TabButton active={activeTab === 'roles'} onClick={() => setActiveTab('roles')}>
            Roles & Permissions
          </TabButton>
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
            Users
          </TabButton>
        </div>

        {activeTab === 'roles' ? (
          <div className={isPlatformAdmin ? 'grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6' : 'grid grid-cols-1 gap-6'}>
            <section className="bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden">
              <PanelHeader
                title="Roles"
                subtitle="Create roles and assign permissions that unlock menus and actions."
                searchValue={roleSearch}
                onSearchChange={setRoleSearch}
                searchPlaceholder="Search roles..."
                action={<Button size="sm" icon={Plus} onClick={() => openRoleForm()}>Add Role</Button>}
              />
              {rolesQuery.isLoading ? <LoadingState /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-[var(--color-text-muted)]">
                      <tr>
                        <th className="px-4 py-3 font-medium">Role</th>
                        <th className="px-4 py-3 font-medium">Permissions</th>
                        <th className="px-4 py-3 font-medium">Users</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {roles.map((role) => (
                        <tr key={role.id}>
                          <td className="px-4 py-3 align-top">
                            <div className="font-medium text-[var(--color-text-primary)]">{role.name}</div>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="font-mono text-xs text-[var(--color-text-muted)]">{role.code}</span>
                              {role.isSystem && <Badge variant="info">System</Badge>}
                            </div>
                            {role.description && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{role.description}</p>}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-wrap gap-1.5 max-w-[360px]">
                              {role.permissions.slice(0, 6).map((permission) => (
                                <Badge key={permission.id}>{permission.menuLabel}</Badge>
                              ))}
                              {role.permissions.length > 6 && <Badge>+{role.permissions.length - 6}</Badge>}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">{role.assignedUsersCount}</td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex justify-end gap-2">
                              {(isPlatformAdmin || !role.isSystem) && (
                                <IconButton label="Edit role" icon={Edit2} onClick={() => openRoleForm(role)} />
                              )}
                              {!role.isSystem && (
                                <IconButton
                                  label="Delete role"
                                  icon={Trash2}
                                  danger
                                  onClick={() => {
                                    if (window.confirm(`Delete role ${role.name}?`)) {
                                      deleteRole.mutate(role.id);
                                    }
                                  }}
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {roles.length === 0 && <EmptyState text="No roles found for this company." />}
                </div>
              )}
            </section>

            {isPlatformAdmin && (
              <section className="bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden">
                <PanelHeader
                  title="Permissions"
                  subtitle="Each permission explains where access works in the application."
                  searchValue={permissionSearch}
                  onSearchChange={setPermissionSearch}
                  searchPlaceholder="Search permissions..."
                  action={<Button size="sm" variant="secondary" icon={Plus} onClick={() => openPermissionForm()}>Add</Button>}
                />
                {permissionsQuery.isLoading ? <LoadingState /> : (
                  <div className="divide-y divide-[var(--color-border)] max-h-[720px] overflow-y-auto">
                    {permissions.map((permission) => (
                      <div key={permission.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-[var(--color-text-primary)] truncate">{permission.name}</p>
                            <p className="mt-1 font-mono text-xs text-[var(--color-text-muted)]">{permission.code}</p>
                            <p className="mt-2 text-xs text-[var(--color-text-muted)]">{permission.explanation}</p>
                          </div>
                          <div className="flex gap-1">
                            <IconButton label="Edit permission" icon={Edit2} onClick={() => openPermissionForm(permission)} />
                            <IconButton
                              label="Delete permission"
                              icon={Trash2}
                              danger
                              onClick={() => {
                                if (window.confirm(`Delete permission ${permission.code}?`)) {
                                  deletePermission.mutate(permission.id);
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {permissions.length === 0 && <EmptyState text="No permissions found." />}
                  </div>
                )}
              </section>
            )}
          </div>
        ) : (
          <section className="bg-white border border-[var(--color-border)] rounded-2xl overflow-hidden">
            <PanelHeader
              title="Users"
              subtitle="Assign company roles and suspend or reactivate tenant memberships."
              searchValue={userSearch}
              onSearchChange={setUserSearch}
              searchPlaceholder="Search users by email..."
            />
            {usersQuery.isLoading ? <LoadingState /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-[var(--color-text-muted)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">User</th>
                      <th className="px-4 py-3 font-medium">Membership</th>
                      <th className="px-4 py-3 font-medium">Roles</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {users.map((user) => (
                      <tr key={user.membershipId}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-[var(--color-text-primary)]">{user.email}</div>
                          <div className="text-xs text-[var(--color-text-muted)]">User ID {user.userId}</div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={user.membershipStatus} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {user.roles.map((role) => <Badge key={role.id}>{role.name}</Badge>)}
                            {user.roles.length === 0 && <span className="text-[var(--color-text-muted)]">No role</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="secondary" icon={Edit2} onClick={() => openUserAssignment(user)}>
                            Manage
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && <EmptyState text="No users found for this company." />}
              </div>
            )}
          </section>
        )}
      </div>

      <Modal
        isOpen={!!roleForm}
        onClose={() => setRoleForm(null)}
        title={roleForm?.id ? 'Edit Role' : 'Create Role'}
        size="xl"
        footer={
          <ModalFooter>
            <Button variant="secondary" onClick={() => setRoleForm(null)}>Cancel</Button>
            <Button form="role-form" type="submit" icon={Check} isLoading={createRole.isPending || updateRole.isPending}>
              Save Role
            </Button>
          </ModalFooter>
        }
      >
        {roleForm && (
          <form id="role-form" onSubmit={submitRole} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Role code">
                <input
                  value={roleForm.code}
                  onChange={(event) => setRoleForm({ ...roleForm, code: event.target.value.toUpperCase() })}
                  disabled={!!roleForm.id}
                  required
                  placeholder="HR_RECRUITER"
                  className={inputClass}
                />
              </Field>
              <Field label="Role name">
                <input
                  value={roleForm.name}
                  onChange={(event) => setRoleForm({ ...roleForm, name: event.target.value })}
                  required
                  placeholder="HR Recruiter"
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Description">
              <textarea
                value={roleForm.description}
                onChange={(event) => setRoleForm({ ...roleForm, description: event.target.value })}
                className={`${inputClass} min-h-20`}
                placeholder="Short role purpose"
              />
            </Field>
            <div className="space-y-4">
              {permissionModules.map((module) => (
                <div key={module.key} className="border border-[var(--color-border)] rounded-xl p-4">
                  <p className="font-medium text-sm text-[var(--color-text-primary)]">{module.label}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                    {module.permissions.map((permission) => {
                      const checked = roleForm.permissionIds.includes(permission.id);
                      return (
                        <label key={permission.id} className="flex gap-3 rounded-lg border border-[var(--color-border)] p-3 cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePermission(permission.id)}
                            className="mt-1 h-4 w-4"
                          />
                          <span>
                            <span className="block text-sm font-medium text-[var(--color-text-primary)]">{permission.actionLabel}</span>
                            <span className="block text-xs text-[var(--color-text-muted)]">{permission.explanation}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
              {selectedPermissionsOutsideCatalog.length > 0 && (
                <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                  <p className="font-medium text-sm text-amber-900">Selected permissions outside current catalog</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                    {selectedPermissionsOutsideCatalog.map((permission) => {
                      const checked = roleForm.permissionIds.includes(permission.id);
                      return (
                        <label key={permission.id} className="flex gap-3 rounded-lg border border-amber-200 bg-white p-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePermission(permission.id)}
                            className="mt-1 h-4 w-4"
                          />
                          <span>
                            <span className="block text-sm font-medium text-[var(--color-text-primary)]">{permission.name}</span>
                            <span className="block text-xs text-[var(--color-text-muted)]">{permission.code}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={!!permissionForm}
        onClose={() => setPermissionForm(null)}
        title={permissionForm?.id ? 'Edit Permission' : 'Create Permission'}
        footer={
          <ModalFooter>
            <Button variant="secondary" onClick={() => setPermissionForm(null)}>Cancel</Button>
            <Button form="permission-form" type="submit" icon={Check} isLoading={createPermission.isPending || updatePermission.isPending}>
              Save Permission
            </Button>
          </ModalFooter>
        }
      >
        {permissionForm && (
          <form id="permission-form" onSubmit={submitPermission} className="space-y-4">
            <Field label="Permission code">
              <input
                value={permissionForm.code}
                onChange={(event) => setPermissionForm({ ...permissionForm, code: event.target.value.toLowerCase() })}
                disabled={!!permissionForm.id}
                required
                placeholder="recruitment.manage_tenant"
                className={inputClass}
              />
            </Field>
            <Field label="Name">
              <input
                value={permissionForm.name}
                onChange={(event) => setPermissionForm({ ...permissionForm, name: event.target.value })}
                required
                placeholder="Manage Recruitment"
                className={inputClass}
              />
            </Field>
            <Field label="Menu / module key">
              <input
                value={permissionForm.module}
                onChange={(event) => setPermissionForm({ ...permissionForm, module: event.target.value.toLowerCase() })}
                required
                placeholder="recruitment"
                className={inputClass}
              />
            </Field>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={!!userAssignment}
        onClose={() => setUserAssignment(null)}
        title="Manage User Access"
        footer={
          <ModalFooter>
            <Button variant="secondary" onClick={() => setUserAssignment(null)}>Cancel</Button>
            <Button icon={Check} onClick={submitUserAssignment} isLoading={updateUserRoles.isPending}>Save Access</Button>
          </ModalFooter>
        }
      >
        {userAssignment && (
          <div className="space-y-5">
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">{userAssignment.email}</p>
              <p className="text-sm text-[var(--color-text-muted)]">{userAssignment.tenantName}</p>
            </div>
            <Field label="Membership status">
              <select value={assignmentStatus} onChange={(event) => setAssignmentStatus(event.target.value)} className={inputClass}>
                <option value="ACTIVE">Active</option>
                <option value="INVITED">Invited</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="REMOVED">Removed</option>
              </select>
            </Field>
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Roles</p>
              {assignmentRoleOptions.map((role) => {
                const checked = assignmentRoleIds.includes(role.id);
                return (
                  <label key={role.id} className="flex items-start gap-3 border border-[var(--color-border)] rounded-xl p-3 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setAssignmentRoleIds(checked ? assignmentRoleIds.filter((id) => id !== role.id) : [...assignmentRoleIds, role.id])}
                      className="mt-1 h-4 w-4"
                    />
                      <span>
                        <span className="block text-sm font-medium text-[var(--color-text-primary)]">{role.name}</span>
                      <span className="block text-xs text-[var(--color-text-muted)]">{role.permissionsCount} permissions</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}

function SummaryBox({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-2xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-[var(--color-primary)]">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
        <p className="font-semibold text-[var(--color-text-primary)] truncate">{value}</p>
      </div>
    </div>
  );
}

function TabButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium border-b-2 ${active ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
    >
      {children}
    </button>
  );
}

function PanelHeader({
  title,
  subtitle,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  action,
}: {
  title: string;
  subtitle: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  action?: ReactNode;
}) {
  return (
    <div className="p-4 border-b border-[var(--color-border)] flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
      <div>
        <h2 className="font-semibold text-[var(--color-text-primary)]">{title}</h2>
        <p className="text-sm text-[var(--color-text-muted)]">{subtitle}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 w-full sm:w-64 rounded-xl border border-[var(--color-border)] pl-9 pr-3 text-sm"
          />
        </div>
        {action}
      </div>
    </div>
  );
}

function IconButton({ label, icon: Icon, onClick, danger = false }: { label: string; icon: LucideIcon; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`p-2 rounded-lg transition-colors ${danger ? 'text-red-600 hover:bg-red-50' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-gray-100'}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-[var(--color-text-primary)]">{label}</span>
      {children}
    </label>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]" />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">{text}</div>;
}
