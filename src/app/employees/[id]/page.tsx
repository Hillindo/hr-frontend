'use client';

import { useState, use, useCallback, useMemo } from 'react';
import { PageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Avatar, InfoRow, ProgressBar, Tabs, TabPanel, EmptyState } from '@/components/ui/common';
import { Modal } from '@/components/ui/modal';
import { useEmployeeDetail, useDocumentCategories } from '@/features/admin/hooks/useAdmin';
import { useUploadEmployeeDocument } from '@/features/admin/hooks/useAdmin';
import { attendanceAdminApi, leaveAdminApi, documentsAdminApi, auditApi } from '@/lib/api/admin';
import { formatDate } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminKeys } from '@/lib/query/keys';
import {
  ArrowLeft,
  Edit,
  Upload,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Users,
  MoreHorizontal,
  History,
  Printer,
  User,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  FileDown,
} from 'lucide-react';
import type { EmergencyContactItem } from '@/lib/api/admin';

const employmentTypeLabels: Record<string, string> = {
  PERMANENT: 'Full Time / Permanent',
  CONTRACT: 'Contract',
  PART_TIME: 'Part Time',
  INTERN: 'Internship',
  FREELANCE: 'Freelance',
};

function formatEmploymentType(type: string): string {
  return employmentTypeLabels[type] || type;
}

const MISSING_FIELD_LABELS: Record<string, string> = {
  'employee.nik': 'NIK',
  'employee.npwp': 'NPWP',
  'employee.birthDate': 'Birth Date',
  'employee.email': 'Email',
  'employee.phone': 'Phone',
  'profile.address': 'Address',
  'profile.city': 'City',
  'profile.religion': 'Religion',
  'profile.bloodType': 'Blood Type',
  'profile.nationality': 'Nationality',
  'emergencyContact': 'Emergency Contact',
  'profile.photo': 'Photo',
};

function formatMissingField(field: string): string {
  return MISSING_FIELD_LABELS[field] || field.replace(/^(employee|profile)\./, '').replace(/([A-Z])/g, ' $1').trim();
}

function formatTime(isoString?: string | null): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return '-';
  }
}

function EmergencyContactCard({ contact }: { contact: EmergencyContactItem }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-[var(--color-border)]">
      <div className="w-8 h-8 rounded-full bg-[var(--color-accent-bg)] flex items-center justify-center flex-shrink-0">
        <User className="w-4 h-4 text-[var(--color-accent)]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">{contact.name}</p>
          {contact.isPrimary && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-[var(--color-accent-bg)] text-[var(--color-accent)] rounded">
              Primary
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">{contact.relationship}</p>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
            <Phone className="w-3 h-3" />
            {contact.phone}
          </div>
          {contact.address && (
            <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
              <MapPin className="w-3 h-3" />
              {contact.address}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AttendanceTab({ employeeId }: { employeeId: string }) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['employee', 'attendance', employeeId, cursor, startDate, endDate],
    queryFn: () => attendanceAdminApi.getList({ employeeId, limit: 10, cursor, startDate, endDate }),
    enabled: !!employeeId,
  });

  const records = data?.data ?? [];
  const hasNext = data?.meta?.hasNext ?? false;
  const nextCursor = data?.meta?.nextCursor;

  if (isLoading) {
    return <Card className="p-6"><p className="text-[var(--color-text-muted)] text-center py-8">Loading attendance...</p></Card>;
  }

  if (isError) {
    return <Card className="p-6"><p className="text-[var(--color-danger)] text-center py-8">Failed to load attendance data</p></Card>;
  }

  if (!records.length) {
    return (
      <Card className="p-6">
        <EmptyState
          icon={<Clock className="w-10 h-10" />}
          title="No Attendance Records"
          description="No attendance history found for this employee in the selected date range."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Attendance History</h3>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCursor(undefined); }}
              className="px-2 py-1 text-sm border border-[var(--color-border)] rounded-lg bg-white"
            />
            <span className="text-sm text-[var(--color-text-muted)]">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCursor(undefined); }}
              className="px-2 py-1 text-sm border border-[var(--color-border)] rounded-lg bg-white"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left py-2 px-3 text-[var(--color-text-muted)] font-medium">Date</th>
                <th className="text-left py-2 px-3 text-[var(--color-text-muted)] font-medium">Check In</th>
                <th className="text-left py-2 px-3 text-[var(--color-text-muted)] font-medium">Check Out</th>
                <th className="text-left py-2 px-3 text-[var(--color-text-muted)] font-medium">Status</th>
                <th className="text-left py-2 px-3 text-[var(--color-text-muted)] font-medium">Late (min)</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-gray-50">
                  <td className="py-2 px-3">{formatDate(r.workDate)}</td>
                  <td className="py-2 px-3">{formatTime(r.checkInAt)}</td>
                  <td className="py-2 px-3">{formatTime(r.checkOutAt)}</td>
                  <td className="py-2 px-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="py-2 px-3">{r.lateMinutes > 0 ? r.lateMinutes : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setCursor(undefined)}
            disabled={!cursor}
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-[var(--color-border)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            First page
          </button>
          <button
            onClick={() => setCursor(nextCursor ?? undefined)}
            disabled={!hasNext}
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-[var(--color-border)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </Card>
    </div>
  );
}

function LeaveTab({ employeeId }: { employeeId: string }) {
  const { data: balancesData, isLoading: balancesLoading } = useQuery({
    queryKey: ['employee', 'leaveBalances', employeeId],
    queryFn: () => leaveAdminApi.getTenantBalances({ employeeId }),
    enabled: !!employeeId,
  });

  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['employee', 'leaveRequests', employeeId],
    queryFn: () => leaveAdminApi.getTenantRequests({ employeeId, pageSize: 20 }),
    enabled: !!employeeId,
  });

  const balances = balancesData?.data ?? [];
  const requests = requestsData?.data ?? [];

  if (balancesLoading && requestsLoading) {
    return <Card className="p-6"><p className="text-[var(--color-text-muted)] text-center py-8">Loading leave data...</p></Card>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Leave Balance</h3>
        {balances.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-10 h-10" />}
            title="No Leave Balances"
            description="No leave balance records found for this employee."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left py-2 px-3 text-[var(--color-text-muted)] font-medium">Leave Type</th>
                  <th className="text-right py-2 px-3 text-[var(--color-text-muted)] font-medium">Allocated</th>
                  <th className="text-right py-2 px-3 text-[var(--color-text-muted)] font-medium">Used</th>
                  <th className="text-right py-2 px-3 text-[var(--color-text-muted)] font-medium">Pending</th>
                  <th className="text-right py-2 px-3 text-[var(--color-text-muted)] font-medium">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((b) => (
                  <tr key={b.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">{b.leaveTypeName}</td>
                    <td className="py-2 px-3 text-right">{b.allocated}</td>
                    <td className="py-2 px-3 text-right">{b.used}</td>
                    <td className="py-2 px-3 text-right">{b.pending}</td>
                    <td className="py-2 px-3 text-right font-medium">{b.remaining}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Leave Requests</h3>
        {requests.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-10 h-10" />}
            title="No Leave Requests"
            description="No leave requests found for this employee."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left py-2 px-3 text-[var(--color-text-muted)] font-medium">Type</th>
                  <th className="text-left py-2 px-3 text-[var(--color-text-muted)] font-medium">Start</th>
                  <th className="text-left py-2 px-3 text-[var(--color-text-muted)] font-medium">End</th>
                  <th className="text-right py-2 px-3 text-[var(--color-text-muted)] font-medium">Days</th>
                  <th className="text-left py-2 px-3 text-[var(--color-text-muted)] font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">{r.leaveTypeName}</td>
                    <td className="py-2 px-3">{formatDate(r.startDate)}</td>
                    <td className="py-2 px-3">{formatDate(r.endDate)}</td>
                    <td className="py-2 px-3 text-right">{r.daysCount}</td>
                    <td className="py-2 px-3"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function DocumentUploadModal({
  isOpen,
  onClose,
  employeeId,
}: {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
}) {
  const [categoryId, setCategoryId] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const uploadMutation = useUploadEmployeeDocument();
  const { data: categoriesData } = useDocumentCategories();
  const categories = categoriesData?.data ?? [];
  const queryClient = useQueryClient();

  const handleSubmit = useCallback(async () => {
    if (!file || !categoryId) {
      setError('Please select a file and document category.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }
    setError('');
    try {
      await uploadMutation.mutateAsync({
        file,
        employeeId,
        documentCategoryId: categoryId,
        issuedAt: issuedAt || undefined,
        expiryDate: expiryDate || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'documents', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'employeeDocuments', 'list'] });
      setCategoryId('');
      setIssuedAt('');
      setExpiryDate('');
      setFile(null);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
    }
  }, [file, categoryId, employeeId, issuedAt, expiryDate, uploadMutation, queryClient, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Document"
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={uploadMutation.isPending || !file || !categoryId}
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
        )}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Document Category *</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
          >
            <option value="">Select category...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">File *</label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[var(--color-accent-bg)] file:text-[var(--color-accent)] hover:file:bg-[var(--color-accent-bg)]"
          />
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Max 5MB. Accepted: PDF, JPG, PNG, DOC, DOCX</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Issue Date</label>
            <input
              type="date"
              value={issuedAt}
              onChange={(e) => setIssuedAt(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Expiry Date</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

function DocumentsTab({ employeeId }: { employeeId: string }) {
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: adminKeys.documents.list({ employeeId }),
    queryFn: () => documentsAdminApi.getList({ employeeId, pageSize: 50 }),
    enabled: !!employeeId,
  });

  const documents = data?.data ?? [];

  if (isLoading) {
    return <Card className="p-6"><p className="text-[var(--color-text-muted)] text-center py-8">Loading documents...</p></Card>;
  }

  if (isError) {
    return <Card className="p-6"><p className="text-[var(--color-danger)] text-center py-8">Failed to load documents</p></Card>;
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Documents</h3>
          <Button variant="secondary" size="sm" icon={Upload} onClick={() => setUploadOpen(true)}>
            Upload Document
          </Button>
        </div>
        {documents.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-10 h-10" />}
            title="No Documents"
            description="No documents found for this employee. Upload a document to get started."
            action={
              <Button variant="secondary" size="sm" icon={Upload} onClick={() => setUploadOpen(true)}>
                Upload Document
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left py-2 px-3 text-[var(--color-text-muted)] font-medium">Category</th>
                  <th className="text-left py-2 px-3 text-[var(--color-text-muted)] font-medium">File Name</th>
                  <th className="text-left py-2 px-3 text-[var(--color-text-muted)] font-medium">Uploaded</th>
                  <th className="text-left py-2 px-3 text-[var(--color-text-muted)] font-medium">Expiry</th>
                  <th className="text-left py-2 px-3 text-[var(--color-text-muted)] font-medium">Status</th>
                  <th className="text-left py-2 px-3 text-[var(--color-text-muted)] font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">{doc.documentCategoryName}</td>
                    <td className="py-2 px-3">{doc.fileName}</td>
                    <td className="py-2 px-3">{formatDate(doc.uploadedAt)}</td>
                    <td className="py-2 px-3">{doc.expiryDate ? formatDate(doc.expiryDate) : '-'}</td>
                    <td className="py-2 px-3"><StatusBadge status={doc.status} /></td>
                    <td className="py-2 px-3">
                      {doc.fileUrl && (
                        <a
                          href={`/api/v1/documents/${doc.id}/download`}
                          className="text-[var(--color-accent)] hover:underline text-sm"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Download
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <DocumentUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        employeeId={employeeId}
      />
    </>
  );
}

function AuditTrailTab({ employeeId }: { employeeId: string }) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const { data, isLoading, isError } = useQuery({
    queryKey: adminKeys.audit.entityLogs('EMPLOYEE', employeeId, { cursor, limit: 20 }),
    queryFn: () => auditApi.getEntityLogs('EMPLOYEE', employeeId, { cursor, limit: 20 }),
    enabled: !!employeeId,
  });

  const logs = useMemo(() => data?.data ?? [], [data?.data]);
  const hasNext = data?.meta?.hasNext ?? false;
  const nextCursor = data?.meta?.nextCursor ?? null;

  const handleExport = useCallback(() => {
    if (!logs.length) return;
    const headers = ['Timestamp', 'Action', 'Actor', 'Summary', 'IP Address'];
    const rows = logs.map((log) => [
      log.createdAt,
      log.action,
      log.actorEmail ?? '-',
      log.summary ?? '-',
      log.ipAddress ?? '-',
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-trail-employee-${employeeId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [logs, employeeId]);

  if (isLoading) {
    return <Card className="p-6"><p className="text-[var(--color-text-muted)] text-center py-8">Loading audit trail...</p></Card>;
  }

  if (isError) {
    return <Card className="p-6"><p className="text-[var(--color-danger)] text-center py-8">Failed to load audit trail</p></Card>;
  }

  if (!logs.length) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Audit Trail</h3>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Complete history of all changes made to this employee record
            </p>
          </div>
        </div>
        <EmptyState
          icon={<History className="w-10 h-10" />}
          title="No Audit Records"
          description="No audit trail records found for this employee."
        />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Audit Trail</h3>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Complete history of all changes made to this employee record
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={FileDown} onClick={handleExport}>
          Export Log
        </Button>
      </div>
      <div className="space-y-0">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-3 py-3 border-b border-[var(--color-border)] last:border-0">
            <div className="w-8 h-8 rounded-full bg-[var(--color-accent-bg)] flex items-center justify-center flex-shrink-0 mt-0.5">
              {log.action === 'CREATED' ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : log.action === 'UPDATED' ? (
                <Edit className="w-4 h-4 text-blue-600" />
              ) : log.action === 'DELETED' ? (
                <XCircle className="w-4 h-4 text-red-600" />
              ) : (
                <History className="w-4 h-4 text-[var(--color-accent)]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {log.summary || `${log.action} ${log.entityType}`}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {log.actorEmail ?? 'System'} &middot; {new Date(log.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
      {hasNext && (
        <div className="flex justify-center mt-4">
          <Button variant="secondary" size="sm" onClick={() => setCursor(nextCursor ?? undefined)}>
            Load More <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </Card>
  );
}

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab = tabParam && ['overview', 'employment', 'attendance', 'leave', 'documents', 'audit-trail'].includes(tabParam)
    ? tabParam
    : 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const { data: employeeData, isLoading, isError } = useEmployeeDetail(id);
  const employee = employeeData?.data;

  if (isLoading) {
    return (
      <PageWrapper title="Loading...">
        <div className="flex items-center justify-center py-16">
          <p className="text-[var(--color-text-muted)]">Loading employee details...</p>
        </div>
      </PageWrapper>
    );
  }

  if (isError || !employee) {
    return (
      <PageWrapper title="Employee Not Found">
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-[var(--color-text-muted)]">Employee not found</p>
          <Button variant="secondary" onClick={() => router.push('/employees')} className="mt-4">
            Back to Employees
          </Button>
        </div>
      </PageWrapper>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'employment', label: 'Employment' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'leave', label: 'Leave' },
    { id: 'documents', label: 'Documents' },
    { id: 'audit-trail', label: 'Audit Trail' },
  ];

  const emergencyContacts: EmergencyContactItem[] = employee.emergencyContacts ?? [];
  const missingFields: string[] = employee.missingFields ?? [];

  const profileCompleteness = employee.profileCompleteness ?? 0;

  return (
    <PageWrapper
      title="Employee Detail"
      actions={
        <>
          <Button variant="secondary" icon={Upload} onClick={() => setActiveTab('documents')}>
            Upload Document
          </Button>
          <Button variant="secondary" icon={Edit} onClick={() => router.push(`/employees/${id}/edit`)}>
            Edit Employee
          </Button>
          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {moreMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMoreMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-[var(--color-border)] shadow-lg py-1 w-48 z-50">
                  <button
                    onClick={() => { setMoreMenuOpen(false); router.push(`/employees/${id}/edit`); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-gray-100 transition-colors"
                  >
                    <History className="mr-2 h-4 w-4" />
                    View History
                  </button>
                  <button
                    onClick={() => { setMoreMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-gray-100 transition-colors"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Profile
                  </button>
                  <button
                    onClick={() => { setMoreMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-gray-100 transition-colors"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print Profile
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      }
    >
      <button
        onClick={() => router.push('/employees')}
        className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Employees
      </button>

      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <Avatar name={employee.fullName} size="xl" />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">{employee.fullName}</h2>
                <p className="text-[var(--color-text-muted)]">
                  {employee.positionName} • {employee.departmentName}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <StatusBadge status={employee.employmentStatus} />
                  <span className="text-sm text-[var(--color-text-muted)]">
                    {employee.employeeCode}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-[var(--color-text-muted)]">Profile Completeness</p>
                <p className={`text-lg font-semibold ${profileCompleteness >= 90 ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}`}>
                  {profileCompleteness}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <InfoRow icon={Building} label="Branch" value={employee.branchName || '-'} />
              <InfoRow icon={Users} label="Division" value={employee.divisionName || '-'} />
              <InfoRow icon={Calendar} label="Join Date" value={formatDate(employee.joinDate || '')} />
              {employee.managerName && (
                <InfoRow icon={Users} label="Manager" value={employee.managerName} />
              )}
            </div>
          </div>
        </div>
      </Card>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        <TabPanel isActive={activeTab === 'overview'}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Full Name</p>
                    <p className="text-sm font-medium">{employee.fullName}</p>
                  </div>
                  {employee.preferredName && (
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)]">Preferred Name</p>
                      <p className="text-sm font-medium">{employee.preferredName}</p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow icon={Mail} label="Email" value={employee.email || '-'} />
                  <InfoRow icon={Phone} label="Phone" value={employee.phone || '-'} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Gender</p>
                    <p className="text-sm font-medium">{employee.gender || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Birth Date</p>
                    <p className="text-sm font-medium">{employee.birthDate ? formatDate(employee.birthDate) : '-'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">NIK</p>
                    <p className="text-sm font-medium font-mono">{employee.nik || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">NPWP</p>
                    <p className="text-sm font-medium font-mono">{employee.npwp || '-'}</p>
                  </div>
                </div>
                {employee.maritalStatus && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)]">Marital Status</p>
                      <p className="text-sm font-medium">{employee.maritalStatus}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)]">Dependents</p>
                      <p className="text-sm font-medium">{employee.dependentsCount ?? 0}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Employment Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow icon={Building} label="Branch" value={employee.branchName || '-'} />
                  <InfoRow icon={Building} label="Company" value={employee.companyName || '-'} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow icon={Users} label="Division" value={employee.divisionName || '-'} />
                  <InfoRow icon={Users} label="Department" value={employee.departmentName || '-'} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Position</p>
                    <p className="text-sm font-medium">{employee.positionName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Employment Type</p>
                    <p className="text-sm font-medium">{formatEmploymentType(employee.employmentType)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow icon={Calendar} label="Join Date" value={formatDate(employee.joinDate || '')} />
                  {employee.endDate && (
                    <InfoRow icon={Calendar} label="End Date" value={formatDate(employee.endDate)} />
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Contact & Address</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Address</p>
                  <p className="text-sm font-medium">{employee.address || '-'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">City</p>
                    <p className="text-sm font-medium">{employee.city || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Province</p>
                    <p className="text-sm font-medium">{employee.province || '-'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Postal Code</p>
                    <p className="text-sm font-medium">{employee.postalCode || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Nationality</p>
                    <p className="text-sm font-medium">{employee.nationality || 'Indonesia'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Religion</p>
                    <p className="text-sm font-medium">{employee.religion || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Blood Type</p>
                    <p className="text-sm font-medium">{employee.bloodType || '-'}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Emergency Contact</h3>
              {emergencyContacts.length > 0 ? (
                <div className="space-y-3">
                  {emergencyContacts.map((contact) => (
                    <EmergencyContactCard key={contact.id} contact={contact} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Phone className="w-10 h-10 text-[var(--color-text-muted)] mb-3" />
                  <p className="text-[var(--color-text-muted)] text-center">No emergency contact on file</p>
                </div>
              )}
            </Card>

            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Profile Completeness</h3>
                {profileCompleteness < 100 && (
                  <Button variant="secondary" size="sm" icon={Edit} onClick={() => router.push(`/employees/${id}/edit`)}>
                    Complete Missing
                  </Button>
                )}
              </div>
              <ProgressBar value={profileCompleteness} label="Profile Progress" />
              {missingFields.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-[var(--color-text-muted)] mb-2">Missing fields:</p>
                  <div className="flex flex-wrap gap-2">
                    {missingFields.map((field) => (
                      <span
                        key={field}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {formatMissingField(field)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </TabPanel>

        <TabPanel isActive={activeTab === 'employment'}>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Employment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoRow icon={Building} label="Branch" value={employee.branchName || '-'} />
              <InfoRow icon={Building} label="Company" value={employee.companyName || '-'} />
              <InfoRow icon={Users} label="Division" value={employee.divisionName || '-'} />
              <InfoRow icon={Users} label="Department" value={employee.departmentName || '-'} />
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Position</p>
                <p className="text-sm font-medium">{employee.positionName || '-'}</p>
              </div>
              {employee.managerName && (
                <InfoRow icon={Users} label="Manager" value={employee.managerName} />
              )}
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Employment Type</p>
                <p className="text-sm font-medium">{formatEmploymentType(employee.employmentType)}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Employment Status</p>
                <StatusBadge status={employee.employmentStatus} />
              </div>
              <InfoRow icon={Calendar} label="Join Date" value={formatDate(employee.joinDate || '')} />
              {employee.endDate && (
                <InfoRow icon={Calendar} label="End Date" value={formatDate(employee.endDate)} />
              )}
            </div>
          </Card>
        </TabPanel>

        <TabPanel isActive={activeTab === 'attendance'}>
          <AttendanceTab employeeId={id} />
        </TabPanel>

        <TabPanel isActive={activeTab === 'leave'}>
          <LeaveTab employeeId={id} />
        </TabPanel>

        <TabPanel isActive={activeTab === 'documents'}>
          <DocumentsTab employeeId={id} />
        </TabPanel>

        <TabPanel isActive={activeTab === 'audit-trail'}>
          <AuditTrailTab employeeId={id} />
        </TabPanel>
      </div>
    </PageWrapper>
  );
}
