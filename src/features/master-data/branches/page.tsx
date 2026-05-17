'use client';

import { useState, useCallback, useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { PageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Pagination, PageSizeSelector } from '@/components/ui/pagination';
import { BranchesTable } from './BranchesTable';
import { BranchModal } from './BranchModal';
import { useBranchesQuery, useBranchMutation, useToggleBranchStatusMutation } from './branches.hooks';
import { useCompaniesQuery } from '@/features/master-data/companies/companies.hooks';
import { BranchResponse, CreateBranchPayload, UpdateBranchPayload } from '@/lib/api/master-data';
import { Plus, Search } from 'lucide-react';
import type { ListQueryParams } from '@/lib/types/api';

export default function BranchesPage() {
  // Query params state
  const [queryParams, setQueryParams] = useState<ListQueryParams & { companyId?: string }>({
    page: 1,
    pageSize: 10,
    search: '',
  });

  // Company filter state - when company changes, reset branch selection
  const [companyFilter, setCompanyFilter] = useState<string>('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<BranchResponse | null>(null);

  // Fetch branches data with companyId filter
  const { data, isLoading, isError, error } = useBranchesQuery(queryParams);

  // Fetch companies for dropdown
  const {
    data: companiesData,
    isLoading: companiesLoading,
  } = useCompaniesQuery({ pageSize: 100 }); // Get all companies for selector

  // Mutations
  const { create, update } = useBranchMutation({
    onSuccess: () => {
      setIsModalOpen(false);
      setSelectedBranch(null);
    },
  });

  const toggleStatus = useToggleBranchStatusMutation({
    onSuccess: () => {
      // Optional: show success toast
    },
  });

  // Handlers
  const handleSearch = useDebouncedCallback((value: string) => {
    setQueryParams((prev) => ({ ...prev, search: value, page: 1 }));
  }, 300);

  const handlePageChange = useCallback((page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setQueryParams((prev) => ({ ...prev, pageSize, page: 1 }));
  }, []);

  // When company filter changes, reset pagination and clear selected branch
  const handleCompanyFilterChange = useCallback((companyId: string) => {
    setCompanyFilter(companyId);
    setQueryParams((prev) => ({ ...prev, companyId: companyId || undefined, page: 1 }));
    setSelectedBranch(null);
  }, []);

  const handleAddBranch = () => {
    setSelectedBranch(null);
    setIsModalOpen(true);
  };

  const handleEditBranch = (branch: BranchResponse) => {
    setSelectedBranch(branch);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBranch(null);
  };

  const handleSubmitForm = (payload: CreateBranchPayload) => {
    if (selectedBranch) {
      update.mutate({ id: selectedBranch.id, payload: payload as UpdateBranchPayload });
    } else {
      create.mutate(payload);
    }
  };

  const handleToggleStatus = (branch: BranchResponse) => {
    toggleStatus.mutate({
      id: branch.id,
      status: branch.status === 'ACTIVE' ? 'INACTIVE' as const : 'ACTIVE' as const,
    });
  };

  // Extract data and meta
  const branches = data?.data ?? [];
  const meta = data?.meta;
  const companies = companiesData?.data ?? [];

  // Memoize company options
  const companyOptions = useMemo(() => companies, [companies]);

  return (
    <PageWrapper
      title="Branches"
      subtitle="Manage branch master data"
      actions={
        <Button icon={Plus} onClick={handleAddBranch}>
          Add Branch
        </Button>
      }
    >
      {/* Search Bar and Company Filter */}
      <div className="mb-6 flex gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search branches..."
            value={queryParams.search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>
        <select
          value={companyFilter}
          onChange={(e) => handleCompanyFilterChange(e.target.value)}
          disabled={companiesLoading}
          className="h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
        >
          <option value="">All Companies</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      {/* Error State */}
      {isError && (
        <div className="mb-6 p-4 rounded-xl border border-[var(--color-danger)] bg-red-50 text-[var(--color-danger)]">
          <p className="font-medium">Error loading branches</p>
          <p className="text-sm">{(error as Error)?.message || 'An unexpected error occurred'}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
        <BranchesTable
          data={branches}
          loading={isLoading}
          onEdit={handleEditBranch}
          onToggleStatus={handleToggleStatus}
        />

        {/* Pagination */}
        {meta && (
          <div className="px-4 py-3 border-t border-[var(--color-border)] flex items-center justify-between">
            <PageSizeSelector
              pageSize={queryParams.pageSize ?? 10}
              onPageSizeChange={handlePageSizeChange}
            />
            <Pagination
              currentPage={meta.page}
              totalPages={meta.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {/* Modal */}
      <BranchModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        branch={selectedBranch}
        companies={companyOptions}
        companiesLoading={companiesLoading}
        onSubmit={handleSubmitForm}
        isPending={create.isPending || update.isPending}
      />
    </PageWrapper>
  );
}
