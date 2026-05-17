'use client';

import { useState, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { PageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Pagination, PageSizeSelector } from '@/components/ui/pagination';
import { CompaniesTable } from './CompaniesTable';
import { CompanyModal } from './CompanyModal';
import { useCompaniesQuery, useCompanyMutation, useToggleCompanyStatusMutation } from './companies.hooks';
import { CompanyResponse, CreateCompanyPayload, UpdateCompanyPayload } from '@/lib/api/master-data';
import { Plus, Search } from 'lucide-react';
import type { ListQueryParams } from '@/lib/types/api';

export default function CompaniesPage() {
  // Query params state
  const [queryParams, setQueryParams] = useState<ListQueryParams>({
    page: 1,
    pageSize: 10,
    search: '',
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyResponse | null>(null);

  // Fetch companies data
  const { data, isLoading, isError, error } = useCompaniesQuery(queryParams);

  // Mutations
  const { create, update } = useCompanyMutation({
    onSuccess: () => {
      setIsModalOpen(false);
      setSelectedCompany(null);
    },
  });

  const toggleStatus = useToggleCompanyStatusMutation({
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

  const handleAddCompany = () => {
    setSelectedCompany(null);
    setIsModalOpen(true);
  };

  const handleEditCompany = (company: CompanyResponse) => {
    setSelectedCompany(company);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCompany(null);
  };

  const handleSubmitForm = (payload: CreateCompanyPayload) => {
    if (selectedCompany) {
      // Update existing company
      update.mutate({ id: selectedCompany.id, payload: payload as UpdateCompanyPayload });
    } else {
      // Create new company
      create.mutate(payload);
    }
  };

  const handleToggleStatus = (company: CompanyResponse) => {
    toggleStatus.mutate({
      id: company.id,
      status: company.status === 'ACTIVE' ? 'INACTIVE' as const : 'ACTIVE' as const,
    });
  };

  // Extract data and meta
  const companies = data?.data ?? [];
  const meta = data?.meta;

  return (
    <PageWrapper
      title="Companies"
      subtitle="Manage company master data"
      actions={
        <Button icon={Plus} onClick={handleAddCompany}>
          Add Company
        </Button>
      }
    >
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search companies..."
            value={queryParams.search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="mb-6 p-4 rounded-xl border border-[var(--color-danger)] bg-red-50 text-[var(--color-danger)]">
          <p className="font-medium">Error loading companies</p>
          <p className="text-sm">{(error as Error)?.message || 'An unexpected error occurred'}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
        <CompaniesTable
          data={companies}
          loading={isLoading}
          onEdit={handleEditCompany}
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
      <CompanyModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        company={selectedCompany}
        onSubmit={handleSubmitForm}
        isPending={create.isPending || update.isPending}
      />
    </PageWrapper>
  );
}