'use client';

import { EmployeePageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Tabs, TabPanel } from '@/components/ui/common';
import { Pagination } from '@/components/ui/pagination';
import {
  useMyAttendanceToday,
  useMyAttendanceHistory,
  useMyAttendanceCorrections,
  useCheckIn,
  useCheckOut,
  useRequestAttendanceCorrection,
} from '@/features/ess/api';
import { formatDate, formatTime } from '@/lib/utils';
import { useState } from 'react';
import { Clock, CheckCircle, AlertTriangle, Calendar, Check, LogOut } from 'lucide-react';

function mapStatus(status: string): string {
  return status?.toUpperCase() || 'UNKNOWN';
}

function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'present':
      return 'bg-[var(--color-success)]';
    case 'late':
      return 'bg-[var(--color-warning)]';
    case 'absent':
      return 'bg-[var(--color-danger)]';
    case 'on_leave':
      return 'bg-[var(--color-info)]';
    default:
      return 'bg-gray-400';
  }
}

export default function MyAttendancePage() {
  const [activeTab, setActiveTab] = useState('today');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize] = useState(10);
  const [correctionStatus, setCorrectionStatus] = useState<string>('');
  const [correctionPage, setCorrectionPage] = useState(1);
  const [correctionPageSize] = useState(10);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({
    date: '',
    requestedCheckIn: '',
    requestedCheckOut: '',
    reason: '',
  });
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  const { data: todayData, isLoading: todayLoading } = useMyAttendanceToday();
  const {
    data: historyData,
    isLoading: historyLoading,
  } = useMyAttendanceHistory({ page: historyPage, pageSize: historyPageSize });
  const {
    data: correctionsData,
    isLoading: correctionsLoading,
  } = useMyAttendanceCorrections({
    page: correctionPage,
    pageSize: correctionPageSize,
    status: correctionStatus || undefined,
  });

  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();
  const requestCorrectionMutation = useRequestAttendanceCorrection();

  const todayAttendance = todayData?.data;
  const hasCheckedIn = !!todayAttendance?.checkIn;
  const hasCheckedOut = !!todayAttendance?.checkOut;

  const historyItems = historyData?.data || [];
  const historyMeta = historyData?.meta;
  const presentDays = historyItems.filter(
    (a) => a.status === 'PRESENT' || a.status === 'LATE'
  ).length;
  const lateDays = historyItems.filter((a) => a.status === 'LATE').length;
  const absentDays = historyItems.filter((a) => a.status === 'ABSENT').length;
  const onLeaveDays = historyItems.filter((a) => a.status === 'ON_LEAVE').length;

  const correctionItems = correctionsData?.data || [];
  const correctionMeta = correctionsData?.meta;

  const handleCheckIn = () => {
    checkInMutation.mutate(undefined, {});
  };

  const handleCheckOut = () => {
    checkOutMutation.mutate(undefined, {});
  };

  const handleSubmitCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionForm.date || !correctionForm.reason) return;
    setCorrectionError(null);

    requestCorrectionMutation.mutate(
      {
        attendanceId: todayAttendance?.id || '',
        date: correctionForm.date,
        requestedCheckIn: correctionForm.requestedCheckIn || undefined,
        requestedCheckOut: correctionForm.requestedCheckOut || undefined,
        reason: correctionForm.reason,
      },
      {
        onSuccess: () => {
          setShowCorrectionForm(false);
          setCorrectionForm({ date: '', requestedCheckIn: '', requestedCheckOut: '', reason: '' });
          setCorrectionError(null);
        },
        onError: (error: any) => {
          setCorrectionError(error?.message || 'Failed to submit correction request');
        },
      }
    );
  };

  const tabs = [
    { id: 'today', label: 'Today' },
    { id: 'history', label: 'Attendance History' },
    { id: 'corrections', label: 'Correction Requests' },
  ];

  const isCheckingIn = checkInMutation.isPending;
  const isCheckingOut = checkOutMutation.isPending;
  const isRequestingCorrection = requestCorrectionMutation.isPending;

  return (
    <EmployeePageWrapper
      title="My Attendance"
      subtitle="Track your daily attendance and requests"
    >
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-[var(--color-bg)] rounded-xl">
            <CheckCircle className="w-6 h-6 text-[var(--color-success)] mx-auto mb-2" />
            <p className="text-2xl font-bold">{presentDays}</p>
            <p className="text-sm text-[var(--color-text-muted)]">Days Present</p>
          </div>
          <div className="text-center p-4 bg-[var(--color-bg)] rounded-xl">
            <AlertTriangle className="w-6 h-6 text-[var(--color-warning)] mx-auto mb-2" />
            <p className="text-2xl font-bold">{lateDays}</p>
            <p className="text-sm text-[var(--color-text-muted)]">Late Days</p>
          </div>
          <div className="text-center p-4 bg-[var(--color-bg)] rounded-xl">
            <Calendar className="w-6 h-6 text-[var(--color-danger)] mx-auto mb-2" />
            <p className="text-2xl font-bold">{absentDays}</p>
            <p className="text-sm text-[var(--color-text-muted)]">Absent Days</p>
          </div>
          <div className="text-center p-4 bg-[var(--color-bg)] rounded-xl">
            <Clock className="w-6 h-6 text-[var(--color-info)] mx-auto mb-2" />
            <p className="text-2xl font-bold">{onLeaveDays}</p>
            <p className="text-sm text-[var(--color-text-muted)]">On Leave</p>
          </div>
        </div>
      </Card>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        <TabPanel isActive={activeTab === 'today'}>
          <Card className="p-6">
            {todayLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : todayAttendance ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-[var(--color-bg)] rounded-xl">
                  <div>
                    <p className="text-sm text-[var(--color-text-muted)]">Shift</p>
                    <p className="font-semibold text-[var(--color-text-primary)]">
                      {todayAttendance.shiftName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[var(--color-text-muted)]">Work Hours</p>
                    <p className="font-semibold text-[var(--color-text-primary)]">
                      {todayAttendance.shiftStartTime} - {todayAttendance.shiftEndTime}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[var(--color-bg)] rounded-xl">
                    <p className="text-sm text-[var(--color-text-muted)] mb-1">Check In</p>
                    <p className="text-xl font-bold text-[var(--color-text-primary)]">
                      {todayAttendance.checkIn ? formatTime(todayAttendance.checkIn) : '--:--'}
                    </p>
                  </div>
                  <div className="p-4 bg-[var(--color-bg)] rounded-xl">
                    <p className="text-sm text-[var(--color-text-muted)] mb-1">Check Out</p>
                    <p className="text-xl font-bold text-[var(--color-text-primary)]">
                      {todayAttendance.checkOut ? formatTime(todayAttendance.checkOut) : '--:--'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor(todayAttendance.status)}`} />
                    <StatusBadge status={mapStatus(todayAttendance.status)} />
                  </div>
                  {todayAttendance.workDurationMinutes && (
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Work Duration: {Math.floor(todayAttendance.workDurationMinutes / 60)}h{' '}
                      {todayAttendance.workDurationMinutes % 60}m
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleCheckIn}
                    disabled={hasCheckedIn || isCheckingIn}
                    isLoading={isCheckingIn}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4" />
                    {hasCheckedIn ? 'Already Checked In' : 'Check In'}
                  </Button>
                  <Button
                    onClick={handleCheckOut}
                    disabled={!hasCheckedIn || hasCheckedOut || isCheckingOut}
                    isLoading={isCheckingOut}
                    variant="secondary"
                    className="flex-1"
                  >
                    <LogOut className="w-4 h-4" />
                    {hasCheckedOut ? 'Already Checked Out' : 'Check Out'}
                  </Button>
                </div>

                <div className="pt-4 border-t text-center">
                  <button
                    onClick={() => setShowCorrectionForm(!showCorrectionForm)}
                    className="text-sm text-[var(--color-primary)] hover:underline"
                  >
                    Request Attendance Correction
                  </button>
                </div>

                {showCorrectionForm && (
                  <form onSubmit={handleSubmitCorrection} className="p-4 bg-[var(--color-bg)] rounded-xl space-y-4">
                    <h4 className="font-semibold">Request Correction</h4>
                    {correctionError && (
                      <div className="p-3 bg-[var(--color-danger-bg)] border border-[var(--color-danger)] rounded-lg">
                        <p className="text-sm text-[var(--color-danger)]">{correctionError}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-[var(--color-text-primary)]">Date</label>
                        <input
                          type="date"
                          value={correctionForm.date}
                          onChange={(e) => setCorrectionForm({ ...correctionForm, date: e.target.value })}
                          required
                          className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-[var(--color-text-primary)]">Requested Check In (optional)</label>
                        <input
                          type="time"
                          value={correctionForm.requestedCheckIn}
                          onChange={(e) => setCorrectionForm({ ...correctionForm, requestedCheckIn: e.target.value })}
                          className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-[var(--color-text-primary)]">Requested Check Out (optional)</label>
                        <input
                          type="time"
                          value={correctionForm.requestedCheckOut}
                          onChange={(e) => setCorrectionForm({ ...correctionForm, requestedCheckOut: e.target.value })}
                          className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-[var(--color-text-primary)]">Reason</label>
                      <input
                        type="text"
                        placeholder="Explain why you need correction"
                        value={correctionForm.reason}
                        onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                        required
                        className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        isLoading={isRequestingCorrection}
                        size="sm"
                        disabled={!correctionForm.date || !correctionForm.reason}
                      >
                        Submit Request
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setShowCorrectionForm(false);
                          setCorrectionError(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-[var(--color-text-muted)]">No attendance record for today</p>
              </div>
            )}
          </Card>
        </TabPanel>

        <TabPanel isActive={activeTab === 'history'}>
          <Card className="overflow-hidden">
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : historyItems.length > 0 ? (
              <>
                <div className="divide-y divide-[var(--color-border)]">
                  {historyItems.map((record) => (
                    <div
                      key={record.id}
                      className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(record.status)}`} />
                        <div>
                          <p className="font-medium text-[var(--color-text-primary)]">
                            {formatDate(record.date)}
                          </p>
                          <p className="text-sm text-[var(--color-text-muted)]">
                            {record.checkIn && `Check-in: ${formatTime(record.checkIn)}`}
                            {record.checkOut && ` - Check-out: ${formatTime(record.checkOut)}`}
                            {!record.checkIn && !record.checkOut && 'No record'}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={mapStatus(record.status)} />
                    </div>
                  ))}
                </div>
                {historyMeta && (
                  <div className="p-4 border-t">
                    <Pagination
                      currentPage={historyPage}
                      totalPages={Math.ceil(historyMeta.total / historyPageSize)}
                      onPageChange={setHistoryPage}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center text-[var(--color-text-muted)]">
                No attendance records found
              </div>
            )}
          </Card>
        </TabPanel>

        <TabPanel isActive={activeTab === 'corrections'}>
          <Card className="p-6">
            <div className="flex gap-2 mb-6">
              <Button
                size="sm"
                variant={correctionStatus === '' ? 'primary' : 'secondary'}
                onClick={() => {
                  setCorrectionStatus('');
                  setCorrectionPage(1);
                }}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={correctionStatus === 'PENDING' ? 'primary' : 'secondary'}
                onClick={() => {
                  setCorrectionStatus('PENDING');
                  setCorrectionPage(1);
                }}
              >
                Pending
              </Button>
              <Button
                size="sm"
                variant={correctionStatus === 'APPROVED' ? 'primary' : 'secondary'}
                onClick={() => {
                  setCorrectionStatus('APPROVED');
                  setCorrectionPage(1);
                }}
              >
                Approved
              </Button>
              <Button
                size="sm"
                variant={correctionStatus === 'REJECTED' ? 'primary' : 'secondary'}
                onClick={() => {
                  setCorrectionStatus('REJECTED');
                  setCorrectionPage(1);
                }}
              >
                Rejected
              </Button>
            </div>

            {correctionsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : correctionItems.length > 0 ? (
              <>
                <div className="space-y-4">
                  {correctionItems.map((correction) => (
                    <div
                      key={correction.id}
                      className="p-4 bg-[var(--color-bg)] rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-[var(--color-text-primary)]">
                          {formatDate(correction.date)}
                        </span>
                        <StatusBadge status={mapStatus(correction.status)} />
                      </div>
                      <div className="text-sm text-[var(--color-text-muted)] space-y-1">
                        {correction.originalCheckIn && correction.originalCheckOut && (
                          <p>
                            Original: {formatTime(correction.originalCheckIn)} -{' '}
                            {formatTime(correction.originalCheckOut)}
                          </p>
                        )}
                        {correction.requestedCheckIn && correction.requestedCheckOut && (
                          <p>
                            Requested: {formatTime(correction.requestedCheckIn)} -{' '}
                            {formatTime(correction.requestedCheckOut)}
                          </p>
                        )}
                        <p className="mt-2 text-[var(--color-text-secondary)]">
                          Reason: {correction.reason}
                        </p>
                        {correction.approvedBy && (
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {correction.status === 'APPROVED' ? 'Approved' : 'Reviewed'} by{' '}
                            {correction.approvedBy} on {formatDate(correction.approvedAt || '')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {correctionMeta && (
                  <div className="mt-4">
                    <Pagination
                      currentPage={correctionPage}
                      totalPages={Math.ceil(correctionMeta.total / correctionPageSize)}
                      onPageChange={setCorrectionPage}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center">
                <Clock className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  No Correction Requests
                </h3>
                <p className="text-[var(--color-text-muted)] mt-1">
                  If you need to correct your attendance, please contact HR
                </p>
              </div>
            )}
          </Card>
        </TabPanel>
      </div>
    </EmployeePageWrapper>
  );
}
