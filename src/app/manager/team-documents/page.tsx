'use client';

import { useMemo, useState } from 'react';
import { ManagerPageWrapper } from '@/components/layout';
import { Card, SummaryCard } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { FilterBar, FilterInput, FilterSelect } from '@/components/ui/filter-bar';
import { StatusBadge } from '@/components/ui/badge';
import { Tabs, TabPanel } from '@/components/ui/common';
import { formatDate } from '@/lib/utils';
import { useDocumentsList, useExpiringDocuments, useMissingDocuments } from '@/features/admin/hooks/useAdmin';
import { AlertTriangle, CheckCircle, FileQuestion, FileText } from 'lucide-react';

export default function TeamDocumentsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const listParams = useMemo(
    () => ({
      pageSize: 100,
      ...(search ? { search } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    }),
    [search, statusFilter],
  );

  const { data: documentsData, isLoading: documentsLoading } = useDocumentsList(listParams);
  const { data: expiringData, isLoading: expiringLoading } = useExpiringDocuments({ pageSize: 100 });
  const { data: missingData, isLoading: missingLoading } = useMissingDocuments({ pageSize: 100 });

  const documents = documentsData?.data ?? [];
  const expiringDocuments = expiringData?.data ?? [];
  const missingDocuments = missingData?.data ?? [];

  const filteredMissingDocuments = missingDocuments.filter((doc) => {
    const value = `${doc.employeeName} ${doc.employeeCode} ${doc.missingCategoryName}`.toLowerCase();
    return !search || value.includes(search.toLowerCase());
  });

  const validCount = documents.filter((doc) => doc.status === 'VALID').length;
  const expiredCount = documents.filter((doc) => doc.status === 'EXPIRED').length;

  const tabs = [
    { id: 'all', label: 'All Documents', count: documents.length },
    { id: 'expiring', label: 'Expiring Soon', count: expiringDocuments.length },
    { id: 'missing', label: 'Missing', count: filteredMissingDocuments.length },
  ];

  const employeeCell = (row: { employeeName: string; employeeCode: string }) => (
    <div>
      <p className="font-medium text-[var(--color-text-primary)]">{row.employeeName}</p>
      <p className="text-xs text-[var(--color-text-muted)]">{row.employeeCode}</p>
    </div>
  );

  const documentColumns = [
    { key: 'employeeName', header: 'Employee', render: employeeCell },
    { key: 'departmentName', header: 'Department' },
    { key: 'documentCategoryName', header: 'Document Type' },
    { key: 'fileName', header: 'File Name' },
    {
      key: 'uploadedAt',
      header: 'Uploaded',
      render: (row: typeof documents[0]) => row.uploadedAt ? formatDate(row.uploadedAt) : '-',
    },
    {
      key: 'expiryDate',
      header: 'Expiry',
      render: (row: typeof documents[0]) => row.expiryDate ? formatDate(row.expiryDate) : '-',
    },
    { key: 'status', header: 'Status', render: (row: typeof documents[0]) => <StatusBadge status={row.status} /> },
  ];

  const expiringColumns = [
    { key: 'employeeName', header: 'Employee', render: employeeCell },
    { key: 'departmentName', header: 'Department' },
    { key: 'documentCategoryName', header: 'Document Type' },
    {
      key: 'expiryDate',
      header: 'Expiry',
      render: (row: typeof expiringDocuments[0]) => row.expiryDate ? formatDate(row.expiryDate) : '-',
    },
    { key: 'status', header: 'Status', render: (row: typeof expiringDocuments[0]) => <StatusBadge status={row.status} /> },
  ];

  const missingColumns = [
    { key: 'employeeName', header: 'Employee', render: employeeCell },
    { key: 'departmentName', header: 'Department' },
    { key: 'missingCategoryName', header: 'Missing Document' },
    {
      key: 'isMandatory',
      header: 'Required',
      render: () => (
        <span className="px-2 py-1 bg-[var(--color-danger-bg)] text-[var(--color-danger)] text-xs rounded-full">
          Required
        </span>
      ),
    },
  ];

  return (
    <ManagerPageWrapper
      title="Team Documents"
      subtitle="Review documents for your direct reports"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <SummaryCard title="Valid" value={validCount} subtext="Uploaded and current" icon={CheckCircle} accent />
        <SummaryCard title="Expiring Soon" value={expiringDocuments.length} subtext="Needs renewal soon" icon={AlertTriangle} />
        <SummaryCard title="Expired" value={expiredCount} subtext="Past expiry date" icon={FileText} urgent={expiredCount > 0} />
        <SummaryCard title="Missing" value={filteredMissingDocuments.length} subtext="Mandatory documents" icon={FileQuestion} urgent={filteredMissingDocuments.length > 0} />
      </div>

      <FilterBar className="mb-6">
        <FilterInput placeholder="Search team documents..." value={search} onChange={setSearch} className="w-full sm:w-auto" />
        <FilterSelect
          placeholder="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'VALID', label: 'Valid' },
            { value: 'NEAR_EXPIRY', label: 'Near Expiry' },
            { value: 'EXPIRED', label: 'Expired' },
          ]}
          className="w-full sm:w-44"
        />
      </FilterBar>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        <TabPanel isActive={activeTab === 'all'}>
          <Card className="overflow-hidden">
            <DataTable
              columns={documentColumns}
              data={documents}
              loading={documentsLoading}
              emptyText="No team documents found"
            />
          </Card>
        </TabPanel>

        <TabPanel isActive={activeTab === 'expiring'}>
          <Card className="overflow-hidden">
            <DataTable
              columns={expiringColumns}
              data={expiringDocuments}
              loading={expiringLoading}
              emptyText="No team documents expiring soon"
            />
          </Card>
        </TabPanel>

        <TabPanel isActive={activeTab === 'missing'}>
          <Card className="overflow-hidden">
            <DataTable
              columns={missingColumns}
              data={filteredMissingDocuments}
              loading={missingLoading}
              emptyText="No missing required documents"
            />
          </Card>
        </TabPanel>
      </div>
    </ManagerPageWrapper>
  );
}
