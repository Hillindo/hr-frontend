'use client';

import { useState } from 'react';
import { ManagerPageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { SummaryCard } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  AlertTriangle,
  Users,
  CalendarClock,
  ClipboardList,
  RefreshCw,
} from 'lucide-react';
import { useManagerDashboard } from '@/features/admin/hooks/useAdmin';
import { useApprovalInbox } from '@/features/ess/hooks/useMyApprovals';
import { toFrontendStatus } from '@/features/ess/utils/request-status';

export default function ManagerDashboardPage() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: dashboardData, isLoading: dashboardLoading } = useManagerDashboard();
  const { data: approvalData, isLoading: approvalsLoading } = useApprovalInbox({ page: 1, pageSize: 5 });

  const dashboard = dashboardData?.data;
  const pendingApprovals = (approvalData?.data ?? []).filter((r) => r.status === 'PENDING' || r.status === 'NEEDS_REVISION');

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  const approvalColumns = [
    {
      key: 'requestType',
      header: 'Type',
      render: (row: typeof pendingApprovals[0]) => {
        const typeLabels: Record<string, string> = {
          LEAVE_REQUEST: 'Leave',
          ATTENDANCE_CORRECTION: 'Attendance',
        };
        return (
          <span className="px-2 py-1 bg-[var(--color-bg)] rounded-lg text-xs font-medium">
            {typeLabels[row.requestType] || row.requestType}
          </span>
        );
      },
    },
    {
      key: 'requesterName',
      header: 'Requester',
      render: (row: typeof pendingApprovals[0]) => (
        <span className="whitespace-nowrap">{row.requesterName}</span>
      ),
    },
    {
      key: 'requestDate',
      header: 'Submitted',
      render: (row: typeof pendingApprovals[0]) => (
        <span className="whitespace-nowrap font-mono text-[13px]">{formatDate(row.requestDate)}</span>
      ),
    },
    {
      key: 'summary',
      header: 'Summary',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: typeof pendingApprovals[0]) => <StatusBadge status={toFrontendStatus(row.status)} />,
    },
  ];

  const teamAlerts = dashboard?.teamAlerts ?? [];

  const issueTypeColors: Record<string, string> = {
    LATE: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
    ABSENT: 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]',
    PENDING_LEAVE: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
  };

  const issueTypeLabels: Record<string, string> = {
    LATE: 'Late',
    ABSENT: 'Absent',
    PENDING_LEAVE: 'Pending Leave',
  };

  const stats = [
    {
      title: 'Pending Approvals',
      value: dashboard?.pendingApprovals ?? 0,
      subtext: dashboard?.pendingApprovalsUrgent ? `${dashboard.pendingApprovalsUrgent} urgent` : 'No urgent items',
      ctaLabel: 'Review now',
      icon: CheckCircle,
      urgent: (dashboard?.pendingApprovalsUrgent ?? 0) > 0,
      onClick: () => router.push('/manager/approvals'),
    },
    {
      title: 'Team On Leave Today',
      value: dashboard?.teamOnLeaveToday ?? 0,
      subtext: 'Today',
      ctaLabel: 'View details',
      icon: CalendarClock,
      onClick: () => router.push('/manager/team-leave'),
    },
    {
      title: 'Team Attendance Issues',
      value: dashboard?.teamAttendanceIssues ?? 0,
      subtext: 'Late and missing check-outs',
      ctaLabel: 'Review',
      icon: AlertTriangle,
      urgent: (dashboard?.teamAttendanceIssues ?? 0) > 0,
      onClick: () => router.push('/manager/team-attendance'),
    },
    {
      title: 'Team Headcount',
      value: dashboard?.teamHeadcount ?? 0,
      subtext: `${dashboard?.presentToday ?? 0} present today`,
      ctaLabel: 'View team',
      icon: Users,
      onClick: () => router.push('/manager/team-overview'),
    },
  ];

  if (dashboardLoading && approvalsLoading) {
    return (
      <ManagerPageWrapper title="Manager Dashboard" subtitle="Monitor your team">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]" />
        </div>
      </ManagerPageWrapper>
    );
  }

  return (
    <ManagerPageWrapper
      title="Manager Dashboard"
      subtitle="Monitor your team's attendance, leave, and pending approvals"
      actions={
        <Button variant="secondary" icon={RefreshCw} onClick={handleRefresh}>
          Refresh
        </Button>
      }
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, i) => (
          <div key={i}>
            <SummaryCard
              title={stat.title}
              value={String(stat.value)}
              subtext={stat.subtext}
              ctaLabel={stat.ctaLabel}
              icon={stat.icon}
              urgent={stat.urgent}
              onClick={stat.onClick}
            />
          </div>
        ))}
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pending Approvals */}
        <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm">
          <div className="p-4 border-b border-[var(--color-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[var(--color-warning-bg)] flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-[var(--color-warning)]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Pending Approvals</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">{pendingApprovals.length} items need your attention</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/manager/approvals')}
                className="text-xs text-[var(--color-accent)] font-medium hover:underline"
              >
                View all <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>
          <div className="p-4">
            {pendingApprovals.length > 0 ? (
              <DataTable
                columns={approvalColumns}
                data={pendingApprovals}
                onRowClick={() => router.push('/manager/approvals')}
              />
            ) : (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-8">No pending approvals</p>
            )}
          </div>
        </div>

        {/* Team Alerts */}
        <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm">
          <div className="p-4 border-b border-[var(--color-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[var(--color-danger-bg)] flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-[var(--color-danger)]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Team Alerts</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">{teamAlerts.length} issues need attention</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/manager/team-attendance')}
                className="text-xs text-[var(--color-accent)] font-medium hover:underline"
              >
                View all <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {teamAlerts.length > 0 ? teamAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-[var(--color-bg)] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-semibold">
                    {alert.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{alert.employeeName}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${issueTypeColors[alert.issueType] || 'bg-gray-100 text-gray-600'}`}>
                      {issueTypeLabels[alert.issueType] || alert.issueType}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => {
                    if (alert.issueType === 'PENDING_LEAVE') {
                      router.push('/manager/approvals');
                    } else {
                      router.push('/manager/team-attendance');
                    }
                  }}
                >
                  {alert.quickAction}
                </Button>
              </div>
            )) : (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-8">No team alerts</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Quick Actions</h3>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <Button variant="secondary" size="sm" icon={CheckCircle} onClick={() => router.push('/manager/approvals')}>
            Review Approvals
          </Button>
          <Button variant="secondary" size="sm" icon={Users} onClick={() => router.push('/manager/team-attendance')}>
            View Team Attendance
          </Button>
          <Button variant="secondary" size="sm" icon={CalendarClock} onClick={() => router.push('/manager/team-leave')}>
            View Team Leave
          </Button>
        </div>
      </div>
    </ManagerPageWrapper>
  );
}