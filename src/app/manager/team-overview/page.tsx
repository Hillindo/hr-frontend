'use client';

import { useState } from 'react';
import { ManagerPageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SummaryCard } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/common';
import { Download, Users, CalendarClock, AlertTriangle, UserCheck, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDirectReports, useTeamAttendanceSummary } from '@/features/admin/hooks/useAdmin';

export default function TeamOverviewPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const today = new Date().toISOString().split('T')[0];

  const { data: reportsData, isLoading: reportsLoading } = useDirectReports();
  const { data: summaryData } = useTeamAttendanceSummary({ date: today });

  const teamMembers = reportsData?.data ?? [];
  const summary = summaryData?.data;

  const filteredMembers = teamMembers.filter((member) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.fullName.toLowerCase().includes(query) ||
      (member.positionName ?? '').toLowerCase().includes(query) ||
      (member.departmentName ?? '').toLowerCase().includes(query)
    );
  });

  const totalTeam = teamMembers.length;
  const activeToday = summary?.present ?? 0;
  const onLeave = summary?.onLeave ?? 0;
  const attendanceIssues = (summary?.late ?? 0) + (summary?.absent ?? 0);

  const deptBreakdown = teamMembers.reduce<Record<string, number>>((acc, member) => {
    if (member.departmentName) {
      acc[member.departmentName] = (acc[member.departmentName] || 0) + 1;
    }
    return acc;
  }, {});

  const columns = [
    {
      key: 'employee',
      header: 'Employee',
      render: (row: typeof teamMembers[0]) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.fullName} size="md" />
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">{row.fullName}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{row.employeeCode}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'positionName',
      header: 'Position',
      render: (row: typeof teamMembers[0]) => (
        <span className="text-sm text-[var(--color-text-secondary)]">{row.positionName}</span>
      ),
    },
    {
      key: 'departmentName',
      header: 'Department',
      render: (row: typeof teamMembers[0]) => (
        <span className="text-sm text-[var(--color-text-secondary)]">{row.departmentName}</span>
      ),
    },
    {
      key: 'employmentStatus',
      header: 'Status',
      render: (row: typeof teamMembers[0]) => <StatusBadge status={row.employmentStatus} />,
    },
    {
      key: 'actions',
      header: '',
      width: 'w-24',
      render: (row: typeof teamMembers[0]) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/employees/${row.id}`);
          }}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-[var(--color-text-muted)]"
          title="View profile"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  if (reportsLoading) {
    return (
      <ManagerPageWrapper title="Team Overview" subtitle="Overview and status of your team members">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]" />
        </div>
      </ManagerPageWrapper>
    );
  }

  return (
    <ManagerPageWrapper
      title="Team Overview"
      subtitle="Overview and status of your team members"
      actions={
        <Button variant="secondary" icon={Download}>
          Export Team
        </Button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard title="Total Team" value={totalTeam} subtext="Team members" icon={Users} accent />
        <SummaryCard title="Active Today" value={activeToday} subtext="Present now" icon={UserCheck} />
        <SummaryCard title="On Leave" value={onLeave} subtext="Approved leave" icon={CalendarClock} />
        <SummaryCard title="Attendance Issues" value={attendanceIssues} subtext="Late or absent" icon={AlertTriangle} urgent={attendanceIssues > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Department Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(deptBreakdown).map(([dept, count]) => (
              <div key={dept} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
                  <span className="text-sm text-[var(--color-text-secondary)]">{dept}</span>
                </div>
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{count}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMembers.slice(0, 4).map((member) => (
            <Card key={member.id} className="p-4" hover onClick={() => router.push(`/employees/${member.id}`)}>
              <div className="flex items-start gap-3">
                <Avatar name={member.fullName} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--color-text-primary)] truncate">{member.fullName}</p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">{member.positionName}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{member.departmentName}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <p className="text-sm text-[var(--color-text-muted)]">
            Showing <span className="font-medium">{filteredMembers.length}</span> team members
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search team member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 px-3 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>
        </div>
        <DataTable
          columns={columns}
          data={filteredMembers}
          onRowClick={(row) => router.push(`/employees/${row.id}`)}
        />
      </Card>
    </ManagerPageWrapper>
  );
}