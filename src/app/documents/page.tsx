'use client';

import { useState } from 'react';
import { PageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { FilterBar, FilterInput, FilterSelect } from '@/components/ui/filter-bar';
import { StatusBadge } from '@/components/ui/badge';
import { Tabs, TabPanel } from '@/components/ui/common';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Download, Upload, Eye, AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import { useDocumentsList, useExpiringDocuments, useMissingDocuments, useDocumentCategories } from '@/features/admin/hooks/useAdmin';

export default function DocumentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: allDocsData, isLoading: docsLoading } = useDocumentsList({ pageSize: 200, ...(statusFilter ? { status: statusFilter } : {}), ...(search ? { search } : {}) });
  const { data: expiringData } = useExpiringDocuments({ pageSize: 100 });
  const { data: missingData } = useMissingDocuments({ pageSize: 100 });
  const { data: categoriesData } = useDocumentCategories();

  const documents = allDocsData?.data ?? [];
  const expiringDocs = expiringData?.data ?? [];
  const missingDocs = missingData?.data ?? [];
  const categories = categoriesData?.data ?? [];

  const validCount = documents.filter((d) => d.status === 'VALID' || d.status === 'valid').length;
  const nearExpiryCount = expiringDocs.length;
  const expiredCount = documents.filter((d) => d.status === 'EXPIRED' || d.status === 'expired').length;
  const missingCount = missingDocs.length;

  const filteredDocuments = documents.filter((doc) => {
    if (search && !doc.employeeName.toLowerCase().includes(search.toLowerCase()) && !(doc.fileName ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter && doc.documentCategoryId !== typeFilter) return false;
    if (statusFilter && doc.status !== statusFilter) return false;
    if (activeTab === 'expiring' && doc.status !== 'NEAR_EXPIRY' && doc.status !== 'EXPIRED' && doc.status !== 'near_expiry' && doc.status !== 'expired') return false;
    if (activeTab === 'missing') return false;
    return true;
  });

  const columns = [
    {
      key: 'employeeName', header: 'Employee', sortable: true,
      render: (row: typeof documents[0]) => (
        <div>
          <p className="font-medium text-[var(--color-text-primary)]">{row.employeeName}</p>
          <p className="text-xs text-[var(--color-text-muted)]">{row.employeeCode}</p>
        </div>
      ),
    },
    { key: 'departmentName', header: 'Department', sortable: true },
    { key: 'documentCategoryName', header: 'Document Type', sortable: true },
    {
      key: 'fileName', header: 'File Name',
      render: (row: typeof documents[0]) => row.fileName || <span className="text-[var(--color-text-muted)] italic">Not uploaded</span>,
    },
    {
      key: 'uploadedAt', header: 'Uploaded', sortable: true,
      render: (row: typeof documents[0]) => row.uploadedAt ? formatDate(row.uploadedAt) : '-',
    },
    {
      key: 'expiryDate', header: 'Expiry Date', sortable: true,
      render: (row: typeof documents[0]) => row.expiryDate ? formatDate(row.expiryDate) : '-',
    },
    {
      key: 'status', header: 'Status', sortable: true,
      render: (row: typeof documents[0]) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions', header: '', width: 'w-24',
      render: (row: typeof documents[0]) => (
        <button onClick={(e) => { e.stopPropagation(); router.push(`/employees/${row.employeeId}?tab=documents`); }}
          className="px-3 py-1 text-xs font-medium text-[var(--color-info)] hover:bg-[var(--color-info-bg)] rounded-lg transition-colors">View</button>
      ),
    },
  ];

  const missingColumns = [
    { key: 'employeeName', header: 'Employee', sortable: true },
    { key: 'employeeCode', header: 'Code' },
    { key: 'departmentName', header: 'Department' },
    { key: 'missingCategoryName', header: 'Missing Document', sortable: true },
    {
      key: 'isMandatory', header: 'Required',
      render: (row: typeof missingDocs[0]) => row.isMandatory ? <span className="px-2 py-1 bg-[var(--color-danger-bg)] text-[var(--color-danger)] text-xs rounded-full">Required</span> : <span className="text-[var(--color-text-muted)]">Optional</span>,
    },
    {
      key: 'actions', header: '', width: 'w-24',
      render: (row: typeof missingDocs[0]) => (
        <button onClick={() => router.push(`/employees/${row.employeeId}?tab=documents`)}
          className="px-3 py-1 text-xs font-medium text-[var(--color-info)] hover:bg-[var(--color-info-bg)] rounded-lg transition-colors">View</button>
      ),
    },
  ];

  const categoriesColumns = [
    { key: 'code', header: 'Code', render: (row: typeof categories[0]) => <span className="font-mono text-sm text-[var(--color-text-muted)]">{row.code}</span> },
    { key: 'name', header: 'Category Name', sortable: true },
    { key: 'requiresExpiry', header: 'Requires Expiry', render: (row: typeof categories[0]) => row.requiresExpiry ? <span className="text-[var(--color-success)]">Yes</span> : <span className="text-[var(--color-text-muted)]">No</span> },
    { key: 'isMandatory', header: 'Mandatory', render: (row: typeof categories[0]) => row.isMandatory ? <span className="px-2 py-1 bg-[var(--color-danger-bg)] text-[var(--color-danger)] text-xs rounded-full">Required</span> : <span className="text-[var(--color-text-muted)]">Optional</span> },
    { key: 'isActive', header: 'Status', render: (row: typeof categories[0]) => row.isActive ? <span className="px-2 py-1 bg-[var(--color-success-bg)] text-[var(--color-success)] text-xs rounded-full">Active</span> : <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">Inactive</span> },
  ];

  const tabs = [
    { id: 'all', label: 'All Documents', count: documents.length },
    { id: 'expiring', label: 'Expiring Soon', count: nearExpiryCount + expiredCount },
    { id: 'missing', label: 'Missing', count: missingCount },
    { id: 'categories', label: 'Categories', count: categories.length },
  ];

  return (
    <PageWrapper
      title="Documents"
      subtitle="Track employee documents, validity, and expiry"
      actions={
        <>
          <Button variant="secondary" icon={Download}>Export</Button>
          <Button variant="secondary" icon={Upload} onClick={() => router.push('/documents?upload=true')}>Upload Document</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setActiveTab('expiring'); setStatusFilter('NEAR_EXPIRY'); }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-warning-bg)] flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-[var(--color-warning)]" /></div>
            <div><p className="text-2xl font-bold text-[var(--color-warning)]">{nearExpiryCount}</p><p className="text-sm text-[var(--color-text-muted)]">Expiring in 30 days</p></div>
          </div>
        </Card>
        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setActiveTab('expiring'); setStatusFilter('EXPIRED'); }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-danger-bg)] flex items-center justify-center"><FileText className="w-5 h-5 text-[var(--color-danger)]" /></div>
            <div><p className="text-2xl font-bold text-[var(--color-danger)]">{expiredCount}</p><p className="text-sm text-[var(--color-text-muted)]">Already expired</p></div>
          </div>
        </Card>
        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('missing')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-danger-bg)] flex items-center justify-center"><CheckCircle className="w-5 h-5 text-[var(--color-danger)]" /></div>
            <div><p className="text-2xl font-bold text-[var(--color-danger)]">{missingCount}</p><p className="text-sm text-[var(--color-text-muted)]">Missing documents</p></div>
          </div>
        </Card>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={(tab) => { setActiveTab(tab); setStatusFilter(''); }} />

      <div className="mt-6">
        <TabPanel isActive={activeTab === 'all' || activeTab === 'expiring'}>
          <FilterBar className="mb-6">
            <FilterInput placeholder="Search employee or document..." value={search} onChange={setSearch} />
            <FilterSelect placeholder="Document Type" value={typeFilter} onChange={setTypeFilter}
              options={categories.map((c) => ({ value: c.id, label: c.name }))} />
            <FilterSelect placeholder="Status" value={statusFilter} onChange={setStatusFilter}
              options={[{ value: 'VALID', label: 'Valid' }, { value: 'NEAR_EXPIRY', label: 'Near Expiry' }, { value: 'EXPIRED', label: 'Expired' }, { value: 'MISSING', label: 'Missing' }]} />
          </FilterBar>
          <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
            {docsLoading ? (
              <div className="flex items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]" /></div>
            ) : (
              <DataTable columns={columns} data={filteredDocuments} onRowClick={(row) => router.push(`/employees/${row.employeeId}?tab=documents`)} />
            )}
          </div>
        </TabPanel>

        <TabPanel isActive={activeTab === 'missing'}>
          <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
            <DataTable columns={missingColumns} data={missingDocs} emptyText="No missing documents" />
          </div>
        </TabPanel>

        <TabPanel isActive={activeTab === 'categories'}>
          <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
            <DataTable columns={categoriesColumns} data={categories} emptyText="No categories found" />
          </div>
        </TabPanel>
      </div>
    </PageWrapper>
  );
}
