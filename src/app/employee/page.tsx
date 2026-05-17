'use client';

import { EmployeePageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/common';
import { formatDate, formatTime } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Heart, FileText, Clock, CheckCircle, AlertTriangle, LogOut } from 'lucide-react';
import { useCheckIn, useCheckOut, useHomeData } from '@/features/ess/api';

export default function EmployeeHomePage() {
  const router = useRouter();
  const { data: homeData, isLoading, isError } = useHomeData();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const dashboard = homeData?.data;
  const profile = dashboard?.profile;
  const attendanceToday = dashboard?.attendanceToday;
  const leaveBalance = dashboard?.leaveBalance;
  const pendingRequestsCount = dashboard?.pendingRequestsCount ?? 0;
  const unreadNotificationsCount = dashboard?.unreadNotificationsCount ?? 0;
  const expiringDocuments = dashboard?.expiringDocuments ?? [];
  const isCheckingIn = checkInMutation.isPending;
  const isCheckingOut = checkOutMutation.isPending;

  // Loading state
  if (isLoading) {
    return (
      <EmployeePageWrapper title="Home">
        <div className="flex items-center justify-center h-64">
          <p className="text-[var(--color-text-muted)]">Loading...</p>
        </div>
      </EmployeePageWrapper>
    );
  }

  // Error state
  if (isError || !dashboard) {
    return (
      <EmployeePageWrapper title="Home">
        <div className="flex items-center justify-center h-64">
          <p className="text-[var(--color-text-muted)]">Failed to load home data. Please try again.</p>
        </div>
      </EmployeePageWrapper>
    );
  }

  return (
    <EmployeePageWrapper title="Home">
      {/* Welcome Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          Welcome{profile?.preferredName || profile?.fullName ? `, ${profile.preferredName || profile.fullName}` : ''}!
        </h2>
        <p className="text-[var(--color-text-muted)] mt-1">
          {[profile?.position, profile?.department].filter(Boolean).join(' - ') || 'Employee self service'}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Button
          variant="accent"
          icon={Clock}
          className="h-auto py-4 justify-center"
          onClick={() => router.push('/employee/my-attendance')}
        >
          Check In / Out
        </Button>
        <Button
          variant="secondary"
          icon={Heart}
          className="h-auto py-4 justify-center"
          onClick={() => router.push('/employee/my-leave')}
        >
          Submit Leave Request
        </Button>
        <Button
          variant="secondary"
          icon={FileText}
          className="h-auto py-4 justify-center"
          onClick={() => router.push('/employee/my-documents')}
        >
          View Documents
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today attendance */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Today&apos;s Attendance</h3>
            <span className="text-sm text-[var(--color-text-muted)]">{formatDate(new Date().toISOString())}</span>
          </div>
          {attendanceToday?.checkedIn ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-text-muted)]">Check In</p>
                  <p className="text-xl font-semibold">
                    {attendanceToday.checkInTime ? formatTime(attendanceToday.checkInTime) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-muted)]">Check Out</p>
                  <p className="text-xl font-semibold">
                    {attendanceToday.checkOutTime ? formatTime(attendanceToday.checkOutTime) : '-'}
                  </p>
                </div>
                <StatusBadge status={attendanceToday.status || 'UNKNOWN'} />
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  variant="secondary"
                  icon={LogOut}
                  onClick={() => checkOutMutation.mutate()}
                  disabled={attendanceToday.checkedOut || isCheckingOut}
                  isLoading={isCheckingOut}
                >
                  {attendanceToday.checkedOut ? 'Already Checked Out' : 'Check Out Now'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[var(--color-text-muted)]">No attendance record for today</p>
              <Button
                className="mt-4"
                onClick={() => checkInMutation.mutate()}
                disabled={isCheckingIn}
                isLoading={isCheckingIn}
              >
                Check In Now
              </Button>
            </div>
          )}
        </Card>

        {/* Leave Balance */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Leave Balance</h3>
            <button
              onClick={() => router.push('/employee/my-leave')}
              className="text-sm text-[var(--color-accent)] font-medium hover:underline"
            >
              View all <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
          {leaveBalance ? (
            <div className="space-y-4">
              <div key={leaveBalance.leaveType}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{leaveBalance.leaveType}</span>
                  <span className="text-sm text-[var(--color-text-muted)]">
                    {leaveBalance.remaining} / {leaveBalance.allocated} days
                  </span>
                </div>
                <ProgressBar value={leaveBalance.remaining} max={leaveBalance.allocated} size="sm" showPercentage={false} />
              </div>
            </div>
          ) : (
            <p className="text-[var(--color-text-muted)] text-center py-4">No leave balance available</p>
          )}
        </Card>

        {/* Pending Requests */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">My Requests</h3>
            <button
              onClick={() => router.push('/employee/my-requests')}
              className="text-sm text-[var(--color-accent)] font-medium hover:underline"
            >
              View all <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
          <div className="space-y-3">
            {pendingRequestsCount > 0 ? (
              <div className="flex items-center justify-between p-3 bg-[var(--color-bg)] rounded-xl">
                <p className="font-medium text-[var(--color-text-primary)]">Pending Requests</p>
                <span className="text-lg font-semibold text-[var(--color-warning)]">{pendingRequestsCount}</span>
              </div>
            ) : (
              <p className="text-[var(--color-text-muted)] text-center py-4">No pending requests</p>
            )}
          </div>
        </Card>

        {/* Document Alerts */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Documents</h3>
            <button
              onClick={() => router.push('/employee/my-documents')}
              className="text-sm text-[var(--color-accent)] font-medium hover:underline"
            >
              View all <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
          {expiringDocuments.length > 0 ? (
            <div className="p-3 bg-[var(--color-warning-bg)] rounded-xl">
              <div className="flex items-center gap-2 text-[var(--color-warning)]">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">{expiringDocuments.length} document(s) need attention</span>
              </div>
              <ul className="mt-2 text-sm space-y-1">
                {expiringDocuments.map((doc) => (
                  <li key={doc.documentId} className="text-[var(--color-text-secondary)]">
                    &bull; {doc.documentName}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="w-8 h-8 text-[var(--color-success)] mx-auto mb-2" />
              <p className="text-[var(--color-text-muted)]">All documents are valid</p>
            </div>
          )}
        </Card>
      </div>

      {/* Notifications Count */}
      {unreadNotificationsCount > 0 && (
        <Card className="p-6 mt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--color-accent)] rounded-full">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">You have {unreadNotificationsCount} unread notification(s)</p>
              <button
                onClick={() => router.push('/employee/my-profile')}
                className="text-sm text-[var(--color-accent)] font-medium hover:underline"
              >
                View notifications <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>
        </Card>
      )}
    </EmployeePageWrapper>
  );
}
