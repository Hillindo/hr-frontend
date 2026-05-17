'use client';

import { PageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { SummaryCard } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import {
  CheckCircle, AlertTriangle, Users, Heart, FileText, UserCheck, FileSignature,
  RefreshCw, Download, Plus, CalendarClock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useHrDashboard } from '@/features/admin/hooks/useAdmin';
import { useApprovalInbox } from '@/features/ess/hooks/useMyApprovals';
import { toFrontendStatus } from '@/features/ess/utils/request-status';

export default function DashboardPage() {
  const router = useRouter();
  const { data: dashboardData, isLoading: dashboardLoading } = useHrDashboard();
  const { data: approvalData } = useApprovalInbox({ page: 1, pageSize: 5 });

  const dashboard = dashboardData?.data;
  const pendingApprovals = (approvalData?.data ?? []).filter((r) => r.status === 'PENDING' || r.status === 'NEEDS_REVISION');

  const recentIssues = dashboard?.recentAttendanceIssues ?? [];
  const recentDocs = dashboard?.recentExpiringDocuments ?? [];

  const stats = [
    {
      title: 'Pending Approvals',
      value: dashboard?.pendingApprovals ?? 0,
      subtext: dashboard?.pendingApprovalsUrgent ? `${dashboard.pendingApprovalsUrgent} urgent since yesterday` : 'No urgent items',
      ctaLabel: 'View inbox',
      icon: CheckCircle,
      urgent: (dashboard?.pendingApprovalsUrgent ?? 0) > 0,
    },
    {
      title: 'Attendance Issues Today',
      value: dashboard?.attendanceIssuesToday ?? 0,
      subtext: 'Late, missing check-out, absent',
      ctaLabel: 'Review attendance',
      icon: AlertTriangle,
    },
    {
      title: 'Employees On Leave',
      value: dashboard?.employeesOnLeaveToday ?? 0,
      subtext: 'On approved leave today',
      ctaLabel: 'View leave',
      icon: Heart,
    },
    {
      title: 'Documents Near Expiry',
      value: dashboard?.documentsNearExpiry ?? 0,
      subtext: 'Contracts and IDs expiring soon',
      ctaLabel: 'Review documents',
      icon: FileText,
    },
    {
      title: 'Incomplete Profiles',
      value: dashboard?.incompleteProfiles ?? 0,
      subtext: 'Missing tax, BPJS, or contact info',
      ctaLabel: 'Review employees',
      icon: UserCheck,
    },
    {
      title: 'Contracts Near End',
      value: dashboard?.contractsNearEnd ?? 0,
      subtext: 'Within next 30 days',
      ctaLabel: 'View contracts',
      icon: FileSignature,
      onClick: () => router.push('/employees'),
    },
  ];

  const approvalColumns = [
    { key: 'requesterName', header: 'Requester', sortable: true },
    { key: 'summary', header: 'Summary', sortable: false },
    {
      key: 'requestDate',
      header: 'Submitted',
      sortable: true,
      render: (row: typeof pendingApprovals[0]) => formatDate(row.requestDate),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row: typeof pendingApprovals[0]) => <StatusBadge status={toFrontendStatus(row.status)} />,
    },
  ];

  const issueColumns = [
    { key: 'employeeName', header: 'Employee', sortable: true },
    { key: 'departmentName', header: 'Department', sortable: true },
    { key: 'status', header: 'Issue', sortable: true, render: (row: typeof recentIssues[0]) => <StatusBadge status={row.status} /> },
    { key: 'date', header: 'Date', sortable: true, render: (row: typeof recentIssues[0]) => formatDate(row.date) },
  ];

  const docColumns = [
    { key: 'employeeName', header: 'Employee', sortable: true },
    { key: 'documentCategoryName', header: 'Document', sortable: true },
    { key: 'expiryDate', header: 'Expiry Date', sortable: true, render: (row: typeof recentDocs[0]) => row.expiryDate ? formatDate(row.expiryDate) : '-' },
    { key: 'status', header: 'Status', sortable: true, render: (row: typeof recentDocs[0]) => <StatusBadge status={row.status} /> },
  ];

  if (dashboardLoading) {
    return (
      <PageWrapper title="Dashboard" subtitle="Monitor HR operations, approvals, and workforce exceptions">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Dashboard"
      subtitle="Monitor HR operations, approvals, and workforce exceptions"
      actions={
        <>
          <Button variant="secondary" icon={Download}>Export Summary</Button>
          <Button variant="secondary" icon={RefreshCw}>Refresh</Button>
        </>
      }
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {stats.map((stat, i) => (
          <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
            <SummaryCard
              title={stat.title}
              value={String(stat.value)}
              subtext={stat.subtext}
              ctaLabel={stat.ctaLabel}
              icon={stat.icon}
              urgent={stat.urgent}
              onClick={stat.onClick || (() => {
                if (stat.title === 'Pending Approvals') router.push('/approvals');
                else if (stat.title === 'Attendance Issues Today') router.push('/attendance');
                else if (stat.title === 'Employees On Leave') router.push('/leave');
                else if (stat.title === 'Documents Near Expiry') router.push('/documents');
                else if (stat.title === 'Incomplete Profiles') router.push('/employees');
              })}
            />
          </div>
        ))}
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pending Approvals */}
        <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm">
          <div className="p-5 border-b border-[var(--color-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-warning-bg)] flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-[var(--color-warning)]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Pending Approvals</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">{pendingApprovals.length} items need your attention</p>
                </div>
              </div>
              <button onClick={() => router.push('/approvals')} className="text-sm text-[var(--color-accent)] font-medium hover:underline">
                View all <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>
          <div className="p-5">
            {pendingApprovals.length > 0 ? (
              <DataTable columns={approvalColumns} data={pendingApprovals} onRowClick={(row) => router.push(`/approvals/${row.id}`)} />
            ) : (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-8">No pending approvals</p>
            )}
          </div>
        </div>

        {/* Attendance Alerts */}
        <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm">
          <div className="p-5 border-b border-[var(--color-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-danger-bg)] flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[var(--color-danger)]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Attendance Alerts</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">{recentIssues.length} issues found today</p>
                </div>
              </div>
              <button onClick={() => router.push('/attendance')} className="text-sm text-[var(--color-accent)] font-medium hover:underline">
                View all <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>
          <div className="p-5">
            {recentIssues.length > 0 ? (
              <DataTable columns={issueColumns} data={recentIssues} onRowClick={(row) => router.push(`/attendance?date=${row.date}`)} />
            ) : (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-8">No attendance issues today</p>
            )}
          </div>
        </div>
      </div>

      {/* Expiring Documents + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expiring Documents */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[var(--color-border)] shadow-sm">
          <div className="p-5 border-b border-[var(--color-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-warning-bg)] flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[var(--color-warning)]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Expiring Documents</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">Documents that need attention</p>
                </div>
              </div>
              <button onClick={() => router.push('/documents?tab=expiring')} className="text-sm text-[var(--color-accent)] font-medium hover:underline">
                View all <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>
          <div className="p-5">
            {recentDocs.length > 0 ? (
              <DataTable columns={docColumns} data={recentDocs} onRowClick={(row) => router.push(`/employees/${row.employeeId}?tab=documents`)} />
            ) : (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-8">No expiring documents</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm">
          <div className="p-5 border-b border-[var(--color-border)]">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Quick Actions</h3>
          </div>
          <div className="p-5 space-y-3">
            <Button variant="secondary" icon={Plus} className="w-full justify-start" onClick={() => router.push('/employees/new')}>Add Employee</Button>
            <Button variant="secondary" icon={FileText} className="w-full justify-start" onClick={() => router.push('/documents?upload=true')}>Upload Document</Button>
            <Button variant="secondary" icon={CalendarClock} className="w-full justify-start" onClick={() => router.push('/attendance?import=true')}>Import Attendance</Button>
            <Button variant="secondary" icon={Users} className="w-full justify-start" onClick={() => router.push('/payroll')}>Review Payroll Support</Button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}