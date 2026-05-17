import {
  LayoutDashboard,
  Users,
  CalendarClock,
  Heart,
  CheckCircle,
  FileText,
  Wallet,
  Settings,
  Home,
  User,
  ClipboardList,
  Bell,
  Calendar,
  Shield,
  DollarSign,
  Receipt,
  AlertTriangle,
  Building2,
  Network,
  Briefcase,
  MapPin,
  Clock,
  TreePine,
  FolderArchive,
  type LucideIcon,
} from 'lucide-react';

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  permissions: string[];
  platformAdminOnly?: boolean;
}

export interface MenuGroup {
  id: string;
  label: string;
  items: MenuItem[];
}

export const adminMenuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    permissions: ['dashboard.read_tenant', 'dashboard.read_team'],
  },
  {
    id: 'employees',
    label: 'All Employees',
    icon: Users,
    href: '/employees',
    permissions: ['employees.read_tenant', 'employees.read_team'],
  },
  {
    id: 'attendance',
    label: 'All Attendance',
    icon: CalendarClock,
    href: '/attendance',
    permissions: ['attendance.read_tenant', 'attendance.read_team'],
  },
  {
    id: 'leave',
    label: 'All Leave',
    icon: Heart,
    href: '/leave',
    permissions: ['leave.read_tenant', 'leave.read_team'],
  },
  {
    id: 'approvals',
    label: 'All Approvals',
    icon: CheckCircle,
    href: '/approvals',
    permissions: ['approvals.read_tenant', 'approvals.read_team'],
  },
  {
    id: 'documents',
    label: 'All Documents',
    icon: FileText,
    href: '/documents',
    permissions: ['documents.read_tenant'],
  },
  {
    id: 'payroll',
    label: 'Payroll Runs',
    icon: Wallet,
    href: '/payroll',
    permissions: ['payroll_support.read_tenant'],
  },
  {
    id: 'payroll-anomalies',
    label: 'Payroll Anomalies',
    icon: AlertTriangle,
    href: '/payroll/anomalies',
    permissions: ['payroll_support.read_tenant'],
  },
  {
    id: 'payroll-preview',
    label: 'Payroll Preview',
    icon: Receipt,
    href: '/payroll/preview',
    permissions: ['payroll_support.read_tenant'],
  },
  {
    id: 'salary-groups',
    label: 'Salary Groups',
    icon: DollarSign,
    href: '/payroll/salary-groups',
    permissions: ['payroll_config.read_tenant'],
  },
  {
    id: 'deduction-types',
    label: 'Deductions',
    icon: Receipt,
    href: '/payroll/deduction-types',
    permissions: ['payroll_config.read_tenant'],
  },
  {
    id: 'master-data-companies',
    label: 'Companies',
    icon: Building2,
    href: '/master-data/companies',
    permissions: ['master_data.read_company'],
  },
  {
    id: 'master-data-branches',
    label: 'Branches',
    icon: Network,
    href: '/master-data/branches',
    permissions: ['master_data.read_branch'],
  },
  {
    id: 'master-data-divisions',
    label: 'Divisions',
    icon: TreePine,
    href: '/master-data/divisions',
    permissions: ['master_data.read_division'],
  },
  {
    id: 'master-data-departments',
    label: 'Departments',
    icon: Briefcase,
    href: '/master-data/departments',
    permissions: ['master_data.read_department'],
  },
  {
    id: 'master-data-positions',
    label: 'Positions',
    icon: MapPin,
    href: '/master-data/positions',
    permissions: ['master_data.read_position'],
  },
  {
    id: 'master-data-shifts',
    label: 'Shifts',
    icon: Clock,
    href: '/master-data/shifts',
    permissions: ['master_data.read_shift'],
  },
  {
    id: 'master-data-leave-types',
    label: 'Leave Types',
    icon: Calendar,
    href: '/master-data/leave-types',
    permissions: ['master_data.read_leave_type'],
  },
  {
    id: 'master-data-document-categories',
    label: 'Doc Categories',
    icon: FolderArchive,
    href: '/master-data/document-categories',
    permissions: ['master_data.read_document_category'],
  },
  {
    id: 'access-control',
    label: 'Access Control',
    icon: Shield,
    href: '/access-control',
    permissions: ['tenant.manage_roles'],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    href: '/notifications',
    permissions: ['notifications.read_self', 'notifications.manage_tenant'],
  },
];

export const managerMenuItems: MenuItem[] = [
  {
    id: 'manager-dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/manager/dashboard',
    permissions: ['dashboard.read_team'],
  },
  {
    id: 'manager-approvals',
    label: 'Approvals',
    icon: CheckCircle,
    href: '/manager/approvals',
    permissions: ['approvals.read_team', 'approvals.act_team'],
  },
  {
    id: 'manager-team-attendance',
    label: 'Team Attendance',
    icon: CalendarClock,
    href: '/manager/team-attendance',
    permissions: ['attendance.read_team'],
  },
  {
    id: 'manager-team-leave',
    label: 'Team Leave',
    icon: Heart,
    href: '/manager/team-leave',
    permissions: ['leave.read_team', 'leave.approve_team'],
  },
  {
    id: 'manager-team-documents',
    label: 'Team Documents',
    icon: FileText,
    href: '/manager/team-documents',
    permissions: ['documents.read_team'],
  },
  {
    id: 'manager-schedules',
    label: 'Schedules',
    icon: Calendar,
    href: '/manager/schedules',
    permissions: ['master_data.read_shift'],
  },
  {
    id: 'manager-team-overview',
    label: 'Team Overview',
    icon: Users,
    href: '/manager/team-overview',
    permissions: ['employees.read_team'],
  },
];

export const employeeMenuItems: MenuItem[] = [
  {
    id: 'employee-home',
    label: 'Home',
    icon: Home,
    href: '/employee',
    permissions: ['ess.read'],
  },
  {
    id: 'employee-attendance',
    label: 'My Attendance',
    icon: CalendarClock,
    href: '/employee/my-attendance',
    permissions: ['attendance.read_self', 'attendance.checkin_self'],
  },
  {
    id: 'employee-leave',
    label: 'My Leave',
    icon: Heart,
    href: '/employee/my-leave',
    permissions: ['leave.read_self', 'leave.request_self'],
  },
  {
    id: 'employee-requests',
    label: 'My Requests',
    icon: ClipboardList,
    href: '/employee/my-requests',
    permissions: ['ess.read'],
  },
  {
    id: 'employee-profile',
    label: 'My Profile',
    icon: User,
    href: '/employee/my-profile',
    permissions: ['employees.read_self'],
  },
  {
    id: 'employee-documents',
    label: 'My Documents',
    icon: FileText,
    href: '/employee/my-documents',
    permissions: ['documents.read_self', 'documents.upload_self'],
  },
];

export const settingsMenuItem: MenuItem = {
  id: 'settings',
  label: 'Settings',
  icon: Settings,
  href: '/settings',
  permissions: [],
};

export const adminMenuGroups: MenuGroup[] = [
  {
    id: 'main',
    label: '',
    items: adminMenuItems.filter((item) =>
      !['master-data-companies', 'master-data-branches', 'master-data-divisions', 'master-data-departments', 'master-data-positions', 'master-data-shifts', 'master-data-leave-types', 'master-data-document-categories'].includes(item.id)
    ),
  },
  {
    id: 'master-data',
    label: 'Master Data',
    items: adminMenuItems.filter((item) =>
      ['master-data-companies', 'master-data-branches', 'master-data-divisions', 'master-data-departments', 'master-data-positions', 'master-data-shifts', 'master-data-leave-types', 'master-data-document-categories'].includes(item.id)
    ),
  },
];

export interface RoutePermission {
  path: string;
  permissions: string[];
  platformAdminOnly?: boolean;
}

export const routePermissions: RoutePermission[] = [
  { path: '/dashboard', permissions: ['dashboard.read_tenant', 'dashboard.read_team'] },
  { path: '/employees', permissions: ['employees.read_tenant', 'employees.read_team'] },
  { path: '/attendance', permissions: ['attendance.read_tenant', 'attendance.read_team'] },
  { path: '/leave', permissions: ['leave.read_tenant', 'leave.read_team'] },
  { path: '/approvals', permissions: ['approvals.read_tenant', 'approvals.read_team'] },
  { path: '/documents', permissions: ['documents.read_tenant'] },
  { path: '/payroll', permissions: ['payroll_support.read_tenant'] },
  { path: '/payroll/anomalies', permissions: ['payroll_support.read_tenant'] },
  { path: '/payroll/preview', permissions: ['payroll_support.read_tenant'] },
  { path: '/payroll/salary-groups', permissions: ['payroll_config.read_tenant'] },
  { path: '/payroll/deduction-types', permissions: ['payroll_config.read_tenant'] },
  { path: '/master-data/companies', permissions: ['master_data.read_company'] },
  { path: '/master-data/branches', permissions: ['master_data.read_branch'] },
  { path: '/master-data/divisions', permissions: ['master_data.read_division'] },
  { path: '/master-data/departments', permissions: ['master_data.read_department'] },
  { path: '/master-data/positions', permissions: ['master_data.read_position'] },
  { path: '/master-data/shifts', permissions: ['master_data.read_shift'] },
  { path: '/master-data/leave-types', permissions: ['master_data.read_leave_type'] },
  { path: '/master-data/document-categories', permissions: ['master_data.read_document_category'] },
  { path: '/notifications', permissions: ['notifications.read_self', 'notifications.manage_tenant'] },
  { path: '/access-control', permissions: ['tenant.manage_roles'] },
  { path: '/settings', permissions: [] },
  { path: '/manager/dashboard', permissions: ['dashboard.read_team'] },
  { path: '/manager/approvals', permissions: ['approvals.read_team', 'approvals.act_team'] },
  { path: '/manager/team-attendance', permissions: ['attendance.read_team'] },
  { path: '/manager/team-leave', permissions: ['leave.read_team', 'leave.approve_team'] },
  { path: '/manager/team-documents', permissions: ['documents.read_team'] },
  { path: '/manager/schedules', permissions: ['master_data.read_shift'] },
  { path: '/manager/team-overview', permissions: ['employees.read_team'] },
  { path: '/employee', permissions: ['ess.read'] },
  { path: '/employee/my-attendance', permissions: ['attendance.read_self', 'attendance.checkin_self'] },
  { path: '/employee/my-leave', permissions: ['leave.read_self', 'leave.request_self'] },
  { path: '/employee/my-requests', permissions: ['ess.read'] },
  { path: '/employee/my-profile', permissions: ['employees.read_self'] },
  { path: '/employee/my-documents', permissions: ['documents.read_self', 'documents.upload_self'] },
];

export function getDefaultRoute(
  isPlatformAdmin: boolean,
  permissionCodes: string[] | undefined,
  roleCodes?: string[],
): string {
  if (isPlatformAdmin) return '/dashboard';

  const perms = permissionCodes ?? [];
  const roles = roleCodes ?? [];

  if (roles.includes('TENANT_OWNER') || roles.includes('HR_ADMIN')) return '/dashboard';
  if (roles.includes('MANAGER')) return '/manager/dashboard';
  if (roles.includes('EMPLOYEE')) return '/employee';

  const adminPerms = [
    'dashboard.read_tenant', 'employees.read_tenant', 'attendance.read_tenant',
    'leave.read_tenant', 'approvals.read_tenant', 'documents.read_tenant',
    'payroll_support.read_tenant', 'payroll_config.read_tenant',
    'master_data.read_company', 'master_data.read_branch', 'master_data.read_division',
    'master_data.read_department', 'master_data.read_position', 'master_data.read_shift',
    'master_data.read_leave_type', 'master_data.read_document_category',
    'notifications.manage_tenant',
  ];
  const hasAdminAccess = adminPerms.some((p) => perms.includes(p));
  if (hasAdminAccess) return '/dashboard';

  if (perms.includes('tenant.manage_roles')) return '/access-control';

  const managerPerms = [
    'dashboard.read_team', 'employees.read_team', 'attendance.read_team',
    'leave.read_team', 'approvals.read_team', 'approvals.act_team',
    'leave.approve_team', 'documents.read_team',
  ];
  const hasManagerAccess = managerPerms.some((p) => perms.includes(p));
  if (hasManagerAccess) return '/manager/dashboard';

  const selfPerms = [
    'ess.read', 'attendance.read_self', 'attendance.checkin_self',
    'leave.read_self', 'leave.request_self', 'documents.read_self',
    'documents.upload_self', 'employees.read_self',
  ];
  if (selfPerms.some((p) => perms.includes(p))) return '/employee';

  return '/login';
}
