'use client';

import { useState, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { PageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Pagination, PageSizeSelector } from '@/components/ui/pagination';
import { ShiftsTable } from './ShiftsTable';
import { ShiftModal } from './ShiftModal';
import { useShiftsQuery, useShiftMutation, useToggleShiftStatusMutation } from './shifts.hooks';
import { ShiftResponse, CreateShiftPayload, UpdateShiftPayload } from '@/lib/api/master-data';
import { Plus, Search } from 'lucide-react';
import type { ListQueryParams } from '@/lib/types/api';

export default function ShiftsPage() {
  // Query params state - includes isActive filter
  const [queryParams, setQueryParams] = useState<ListQueryParams & { isActive?: string }>({
    page: 1,
    pageSize: 10,
    search: '',
    isActive: undefined,
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<ShiftResponse | null>(null);

  // Filter state for isActive dropdown
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch shifts data
  const { data, isLoading, isError, error } = useShiftsQuery(queryParams);

  // Mutations
  const { create, update } = useShiftMutation({
    onSuccess: () => {
      setIsModalOpen(false);
      setSelectedShift(null);
    },
  });

  const toggleStatus = useToggleShiftStatusMutation({
    onSuccess: () => {
      // Optional: show success toast
    },
  });

  // Handlers
  const handleSearch = useDebouncedCallback((value: string) => {
    setQueryParams((prev) => ({ ...prev, search: value, page: 1 }));
  }, 300);

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
    const newIsActive = value === 'all' ? undefined : value === 'active' ? 'true' : 'false';
    setQueryParams((prev) => ({ ...prev, isActive: newIsActive, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setQueryParams((prev) => ({ ...prev, pageSize, page: 1 }));
  }, []);

  const handleAddShift = () => {
    setSelectedShift(null);
    setIsModalOpen(true);
  };

  const handleEditShift = (shift: ShiftResponse) => {
    setSelectedShift(shift);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedShift(null);
  };

  const handleSubmitForm = (payload: CreateShiftPayload) => {
    if (selectedShift) {
      // Update existing shift
      update.mutate({ id: selectedShift.id, payload: payload as UpdateShiftPayload });
    } else {
      // Create new shift
      create.mutate(payload);
    }
  };

  const handleToggleStatus = (shift: ShiftResponse) => {
    toggleStatus.mutate({
      id: shift.id,
      isActive: shift.isActive ? 'INACTIVE' as const : 'ACTIVE' as const,
    });
  };

  // Extract data and meta
  const shifts = data?.data ?? [];
  const meta = data?.meta;

  return (
    <PageWrapper
      title="Shifts"
      subtitle="Manage shift master data"
      actions={
        <Button icon={Plus} onClick={handleAddShift}>
          Add Shift
        </Button>
      }
    >
      {/* Search Bar and Filters Row */}
      <div className="mb-6 flex gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search shifts..."
            value={queryParams.search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>

        {/* Status Filter */}
        <div className="w-40">
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="mb-6 p-4 rounded-xl border border-[var(--color-danger)] bg-red-50 text-[var(--color-danger)]">
          <p className="font-medium">Error loading shifts</p>
          <p className="text-sm">{(error as Error)?.message || 'An unexpected error occurred'}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
        <ShiftsTable
          data={shifts}
          loading={isLoading}
          onEdit={handleEditShift}
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
      <ShiftModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        shift={selectedShift}
        onSubmit={handleSubmitForm}
        isPending={create.isPending || update.isPending}
      />
    </PageWrapper>
  );
}