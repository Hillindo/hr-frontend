'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { PageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Pagination, PageSizeSelector } from '@/components/ui/pagination';
import { DepartmentsTable } from './DepartmentsTable';
import { DepartmentModal } from './DepartmentModal';
import { useDepartmentsQuery, useDepartmentMutation, useToggleDepartmentStatusMutation } from './departments.hooks';
import { useDivisionsQuery } from '@/features/master-data/divisions/divisions.hooks';
import { useCompaniesQuery } from '@/features/master-data/companies/companies.hooks';
import { DepartmentResponse, CreateDepartmentPayload, UpdateDepartmentPayload } from '@/lib/api/master-data';
import { Plus, Search } from 'lucide-react';
import type { ListQueryParams } from '@/lib/types/api';

export default function DepartmentsPage() {
  // Query params state
  const [queryParams, setQueryParams] = useState<ListQueryParams & { divisionId?: string }>({
    page: 1,
    pageSize: 10,
    search: '',
  });

  // Filter states - company filter drives division filter
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [divisionFilter, setDivisionFilter] = useState<string>('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentResponse | null>(null);

  // Fetch departments data with divisionId filter
  const { data, isLoading, isError, error } = useDepartmentsQuery(queryParams);

  // Fetch companies for dropdown
  const {
    data: companiesData,
    isLoading: companiesLoading,
  } = useCompaniesQuery({ pageSize: 100 });

  // Fetch divisions - when company changes, divisions will be refetched with companyId filter
  const {
    data: divisionsData,
    isLoading: divisionsLoading,
  } = useDivisionsQuery({
    pageSize: 100,
    companyId: companyFilter || undefined,
  });

  // Mutations
  const { create, update } = useDepartmentMutation({
    onSuccess: () => {
      setIsModalOpen(false);
      setSelectedDepartment(null);
    },
  });

  const toggleStatus = useToggleDepartmentStatusMutation({
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

  // When company filter changes, reset division filter and pagination
  const handleCompanyFilterChange = useCallback((companyId: string) => {
    setCompanyFilter(companyId);
    setDivisionFilter(''); // Reset division when company changes
    setQueryParams((prev) => ({ ...prev, divisionId: undefined, page: 1 }));
    setSelectedDepartment(null);
  }, []);

  // When division filter changes, update query params
  const handleDivisionFilterChange = useCallback((divisionId: string) => {
    setDivisionFilter(divisionId);
    setQueryParams((prev) => ({ ...prev, divisionId: divisionId || undefined, page: 1 }));
  }, []);

  const handleAddDepartment = () => {
    setSelectedDepartment(null);
    setIsModalOpen(true);
  };

  const handleEditDepartment = (department: DepartmentResponse) => {
    setSelectedDepartment(department);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDepartment(null);
  };

  const handleSubmitForm = (payload: CreateDepartmentPayload) => {
    if (selectedDepartment) {
      update.mutate({ id: selectedDepartment.id, payload: payload as UpdateDepartmentPayload });
    } else {
      create.mutate(payload);
    }
  };

  const handleToggleStatus = (department: DepartmentResponse) => {
    toggleStatus.mutate({
      id: department.id,
      status: department.status === 'ACTIVE' ? 'INACTIVE' as const : 'ACTIVE' as const,
    });
  };

  // Extract data and meta
  const departments = data?.data ?? [];
  const meta = data?.meta;
  const companies = companiesData?.data ?? [];
  const divisions = divisionsData?.data ?? [];

  // Determine selected company ID for division dropdown
  // For edit mode, use the division's company; for create mode, use the filter
  const selectedCompanyId = useMemo(() => {
    if (selectedDepartment) {
      // Find company from division when editing
      const division = divisions.find((d) => d.id === selectedDepartment.divisionId);
      return division?.companyId;
    }
    return companyFilter || undefined;
  }, [selectedDepartment, divisions, companyFilter]);

  // Reset division selection when company changes (for create mode)
  useEffect(() => {
    if (!selectedDepartment && companyFilter !== divisionFilter) {
      // Intentionally only run in create mode
    }
  }, [companyFilter, selectedDepartment]);

  return (
    <PageWrapper
      title="Departments"
      subtitle="Manage department master data"
      actions={
        <Button icon={Plus} onClick={handleAddDepartment}>
          Add Department
        </Button>
      }
    >
      {/* Search Bar, Company and Division Filters */}
      <div className="mb-6 flex gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search departments..."
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
        <select
          value={divisionFilter}
          onChange={(e) => handleDivisionFilterChange(e.target.value)}
          disabled={divisionsLoading || !companyFilter}
          className="h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
        >
          <option value="">{companyFilter ? 'All Divisions' : 'Select Company First'}</option>
          {divisions.map((division) => (
            <option key={division.id} value={division.id}>
              {division.name}
            </option>
          ))}
        </select>
      </div>

      {/* Error State */}
      {isError && (
        <div className="mb-6 p-4 rounded-xl border border-[var(--color-danger)] bg-red-50 text-[var(--color-danger)]">
          <p className="font-medium">Error loading departments</p>
          <p className="text-sm">{(error as Error)?.message || 'An unexpected error occurred'}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
        <DepartmentsTable
          data={departments}
          loading={isLoading}
          onEdit={handleEditDepartment}
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
      <DepartmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        department={selectedDepartment}
        divisions={divisions}
        divisionsLoading={divisionsLoading}
        selectedCompanyId={selectedCompanyId}
        onSubmit={handleSubmitForm}
        isPending={create.isPending || update.isPending}
      />
    </PageWrapper>
  );
}