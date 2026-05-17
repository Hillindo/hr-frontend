'use client';

import { useMemo, useState, useCallback } from 'react';
import { EmployeePageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FilterBar, FilterSelect } from '@/components/ui/filter-bar';
import { FileUpload, type UploadFile } from '@/components/ui/file-upload';
import { useMyDocuments, useUploadDocument, useDocumentCategories } from '@/features/ess/hooks/useMyDocuments';
import { useAuth } from '@/lib/auth/auth-context';
import { formatDate } from '@/lib/utils';
import { FileText, Upload, CheckCircle, AlertTriangle, XCircle, FileQuestion, X, Download } from 'lucide-react';

const statusMap: Record<string, string> = {
  VALID: 'VALID',
  NEAR_EXPIRY: 'NEAR EXPIRY',
  EXPIRED: 'EXPIRED',
  MISSING: 'MISSING',
};

type StatusFilter = 'ALL' | 'VALID' | 'NEAR_EXPIRY' | 'EXPIRED' | 'MISSING';

const statusFilterOptions = [
  { value: 'ALL', label: 'All Documents' },
  { value: 'VALID', label: 'Valid' },
  { value: 'NEAR_EXPIRY', label: 'Expiring Soon' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'MISSING', label: 'Missing' },
];

export default function MyDocumentsPage() {
  const { isPlatformAdmin, hasAnyPermission } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [page, setPage] = useState(1);

  const documentQueryParams = useMemo(
    () => ({
      page,
      pageSize: 20,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
    }),
    [page, statusFilter],
  );

  const { data, isLoading } = useMyDocuments(documentQueryParams);
  const { data: missingData, isLoading: isMissingLoading } = useMyDocuments({
    page: 1,
    pageSize: 20,
    status: 'MISSING',
  });
  const { data: categoriesData, isLoading: categoriesLoading } = useDocumentCategories();
  const uploadMutation = useUploadDocument();

  const categories = categoriesData?.data || [];
  const canUpload = isPlatformAdmin || hasAnyPermission('documents.upload_self');

  const stats = data?.summary
    ? {
        valid: data.summary.valid,
        expiring: data.summary.nearExpiry,
        expired: data.summary.expired,
        missing: data.summary.missing,
      }
    : { valid: 0, expiring: 0, expired: 0, missing: 0 };

  const documents = data?.data || [];
  const missingDocuments = statusFilter === 'MISSING' ? documents : missingData?.data || [];
  const meta = data?.meta;
  const hasMissingDocuments = stats.missing > 0 && missingDocuments.length > 0;

  if (isLoading) {
    return (
      <EmployeePageWrapper
        title="My Documents"
        subtitle="View your uploaded documents and their status"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]" />
        </div>
      </EmployeePageWrapper>
    );
  }

  return (
    <EmployeePageWrapper
      title="My Documents"
      subtitle="View your uploaded documents and their status"
      actions={
        canUpload ? (
          <Button variant="secondary" icon={Upload} onClick={() => setShowUploadModal(true)}>
            Upload Document
          </Button>
        ) : null
      }
    >
      {showUploadModal && (
        <UploadDocumentModal
          categories={categories.map((c) => ({ id: c.id, name: c.name, requiresExpiry: c.requiresExpiry }))}
          onUpload={(file, documentCategoryId, issuedAt, expiryDate) => {
            uploadMutation.mutate(
              { file, documentCategoryId, issuedAt, expiryDate },
              { onSuccess: () => setShowUploadModal(false) },
            );
          }}
          onClose={() => setShowUploadModal(false)}
          isUploading={uploadMutation.isPending}
          isLoadingCategories={categoriesLoading}
          error={uploadMutation.error?.message}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            setStatusFilter('VALID');
            setPage(1);
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-success-bg)] flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-[var(--color-success)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-success)]">{stats.valid}</p>
              <p className="text-sm text-[var(--color-text-muted)]">Valid Documents</p>
            </div>
          </div>
        </Card>
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            setStatusFilter('NEAR_EXPIRY');
            setPage(1);
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-warning-bg)] flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[var(--color-warning)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-warning)]">{stats.expiring}</p>
              <p className="text-sm text-[var(--color-text-muted)]">Expiring Soon</p>
            </div>
          </div>
        </Card>
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            setStatusFilter('EXPIRED');
            setPage(1);
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-danger-bg)] flex items-center justify-center">
              <XCircle className="w-5 h-5 text-[var(--color-danger)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-danger)]">{stats.expired}</p>
              <p className="text-sm text-[var(--color-text-muted)]">Expired</p>
            </div>
          </div>
        </Card>
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            setStatusFilter('MISSING');
            setPage(1);
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-bg)] flex items-center justify-center">
              <FileQuestion className="w-5 h-5 text-[var(--color-text-muted)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-text-muted)]">{stats.missing}</p>
              <p className="text-sm text-[var(--color-text-muted)]">Missing</p>
            </div>
          </div>
        </Card>
      </div>

      <FilterBar className="mb-4">
        <FilterSelect
          placeholder="Filter by status"
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter((v || 'ALL') as StatusFilter);
            setPage(1);
          }}
          options={statusFilterOptions}
          className="w-full sm:w-48"
        />
      </FilterBar>

      {statusFilter === 'ALL' && hasMissingDocuments && (
        <Card className="mb-4 p-4 border-[var(--color-warning)]/40 bg-[var(--color-warning-bg)]/30">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-3">
              <div className="mt-0.5 w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                <FileQuestion className="w-5 h-5 text-[var(--color-warning)]" />
              </div>
              <div>
                <p className="font-medium text-[var(--color-text-primary)]">
                  {stats.missing} required document{stats.missing === 1 ? '' : 's'} missing
                </p>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  Upload the missing requirement{stats.missing === 1 ? '' : 's'} to complete your document record.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {missingDocuments.slice(0, 4).map((doc) => (
                    <span
                      key={doc.id}
                      className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                    >
                      {doc.documentCategoryName}
                    </span>
                  ))}
                  {stats.missing > 4 && (
                    <span className="text-xs text-[var(--color-text-muted)] self-center">
                      +{stats.missing - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 md:flex-shrink-0">
              <Button
                variant="secondary"
                onClick={() => {
                  setStatusFilter('MISSING');
                  setPage(1);
                }}
              >
                View Missing
              </Button>
              {canUpload && (
                <Button icon={Upload} onClick={() => setShowUploadModal(true)}>
                  Upload
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        {documents.length === 0 && !(statusFilter === 'ALL' && hasMissingDocuments) ? (
          <div className="p-8 text-center">
            {statusFilter === 'MISSING' ? (
              <FileQuestion className="w-12 h-12 text-[var(--color-success)] mx-auto mb-4" />
            ) : (
              <FileText className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
            )}
            <p className="font-medium text-[var(--color-text-primary)]">
              {getEmptyStateTitle(statusFilter)}
            </p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              {getEmptyStateDescription(statusFilter)}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {(statusFilter === 'ALL' && documents.length === 0 ? missingDocuments : documents).map((doc) => {
              const normalizedStatus = doc.status.toUpperCase();
              const badgeStatus = statusMap[normalizedStatus] || normalizedStatus;
              const isValid = normalizedStatus === 'VALID';
              const isNearExpiry = normalizedStatus === 'NEAR_EXPIRY';
              const isExpired = normalizedStatus === 'EXPIRED';
              const isMissing = normalizedStatus === 'MISSING';
              return (
                <div
                  key={doc.id}
                  className="p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isValid
                          ? 'bg-[var(--color-success-bg)]'
                          : isNearExpiry
                          ? 'bg-[var(--color-warning-bg)]'
                          : isExpired
                          ? 'bg-[var(--color-danger-bg)]'
                          : 'bg-[var(--color-bg)]'
                      }`}
                    >
                      {isMissing ? (
                        <FileQuestion className="w-5 h-5 text-[var(--color-text-muted)]" />
                      ) : (
                        <FileText
                        className={`w-5 h-5 ${
                          isValid
                            ? 'text-[var(--color-success)]'
                            : isNearExpiry
                            ? 'text-[var(--color-warning)]'
                            : isExpired
                            ? 'text-[var(--color-danger)]'
                            : 'text-[var(--color-text-muted)]'
                        }`}
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--color-text-primary)]">
                        {doc.documentCategoryName}
                      </p>
                      <p className="text-sm text-[var(--color-text-muted)]">
                        {isMissing ? (
                          'Required document not uploaded'
                        ) : doc.fileUrl ? (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[var(--color-accent)] hover:underline"
                          >
                            <Download className="w-3 h-3" />
                            {doc.fileName || 'View document'}
                          </a>
                        ) : (
                          'No file uploaded'
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:justify-end md:gap-4">
                    <div className="text-left sm:text-right">
                      {doc.uploadedAt && (
                        <p className="text-sm text-[var(--color-text-muted)]">
                          Uploaded: {formatDate(doc.uploadedAt)}
                        </p>
                      )}
                      {doc.expiryDate && (
                        <p className="text-sm text-[var(--color-text-muted)]">
                          Expires: {formatDate(doc.expiryDate)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={isValid ? 'success' : isNearExpiry ? 'warning' : isExpired || isMissing ? 'danger' : 'neutral'}>
                        {badgeStatus}
                      </Badge>
                      {isMissing && canUpload && (
                        <Button size="sm" variant="secondary" icon={Upload} onClick={() => setShowUploadModal(true)}>
                          Upload
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-[var(--color-text-muted)]">
          <span>
            Page {meta.page} of {meta.totalPages} ({meta.total} documents)
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={!meta.hasPrev || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => setPage((current) => current + 1)}
              disabled={!meta.hasNext || isLoading || isMissingLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </EmployeePageWrapper>
  );
}

interface UploadDocumentModalProps {
  categories: Array<{ id: string; name: string; requiresExpiry: boolean }>;
  onUpload: (file: File, documentCategoryId: string, issuedAt?: string, expiryDate?: string) => void;
  onClose: () => void;
  isUploading: boolean;
  isLoadingCategories: boolean;
  error?: string;
}

function getEmptyStateTitle(status: StatusFilter): string {
  switch (status) {
    case 'VALID':
      return 'No valid documents';
    case 'NEAR_EXPIRY':
      return 'No documents expiring soon';
    case 'EXPIRED':
      return 'No expired documents';
    case 'MISSING':
      return 'No missing required documents';
    default:
      return 'No uploaded documents';
  }
}

function getEmptyStateDescription(status: StatusFilter): string {
  switch (status) {
    case 'VALID':
      return 'Uploaded documents that are still valid will appear here.';
    case 'NEAR_EXPIRY':
      return 'Documents close to expiry will appear here before they need renewal.';
    case 'EXPIRED':
      return 'Expired documents will appear here when renewal is required.';
    case 'MISSING':
      return 'All mandatory document categories have an uploaded file.';
    default:
      return 'Upload your first document or check the missing filter for required items.';
  }
}

function UploadDocumentModal({
  categories,
  onUpload,
  onClose,
  isUploading,
  isLoadingCategories,
  error,
}: UploadDocumentModalProps) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [localError, setLocalError] = useState('');

  const selectedCategoryInfo = categories.find((c) => c.id === selectedCategory);
  const requiresExpiry = selectedCategoryInfo?.requiresExpiry;
  const cannotSubmit =
    !selectedFile || !selectedCategory || (!!requiresExpiry && !expiryDate) || isUploading || isLoadingCategories;

  const handleFileChange = useCallback((files: UploadFile[]) => {
    if (files.length > 0 && files[0].status !== 'error') {
      setSelectedFile(files[0].file);
      setUploadFiles(files);
      setLocalError('');
      return;
    }

    setSelectedFile(null);
    setUploadFiles(files);
  }, []);

  const handleSubmit = () => {
    if (!selectedFile || !selectedCategory) {
      setLocalError('Select a document category and file before uploading.');
      return;
    }
    if (requiresExpiry && !expiryDate) {
      setLocalError('Expiry date is required for this document category.');
      return;
    }
    setLocalError('');
    onUpload(selectedFile, selectedCategory, issuedAt || undefined, expiryDate || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-[var(--color-bg)] rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Upload Document</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-200 transition-colors text-[var(--color-text-muted)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              Document Category *
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setLocalError('');
              }}
              disabled={isLoadingCategories}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            >
              <option value="">
                {isLoadingCategories ? 'Loading categories...' : 'Select a category'}
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {requiresExpiry && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                Expiry Date *
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              Issue Date (optional)
            </label>
            <input
              type="date"
              value={issuedAt}
              onChange={(e) => setIssuedAt(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>

          <FileUpload
            value={uploadFiles}
            onChange={handleFileChange}
            maxFiles={1}
            maxSizeMB={5}
            label="Document File"
            helperText="Accepted: PDF, JPG, PNG, DOC, DOCX (max 5MB)"
          />

          {error && (
            <div className="text-sm text-[var(--color-danger)]">{error}</div>
          )}

          {localError && (
            <div className="text-sm text-[var(--color-danger)]">{localError}</div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isUploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={cannotSubmit}
              className="flex-1"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
