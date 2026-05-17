'use client';

import { useState, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { PageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Pagination, PageSizeSelector } from '@/components/ui/pagination';
import { LeaveTypesTable } from './LeaveTypesTable';
import { LeaveTypeModal } from './LeaveTypeModal';
import { useLeaveTypesQuery, useLeaveTypeMutation, useToggleLeaveTypeStatusMutation } from './leave-types.hooks';
import { LeaveTypeResponse, CreateLeaveTypePayload, UpdateLeaveTypePayload } from '@/lib/api/master-data';
import { Plus, Search } from 'lucide-react';
import type { ListQueryParams } from '@/lib/types/api';

export default function LeaveTypesPage() {
  // Query params state
  const [queryParams, setQueryParams] = useState<ListQueryParams>({
    page: 1,
    pageSize: 10,
    search: '',
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveTypeResponse | null>(null);

  // Fetch leave types data
  const { data, isLoading, isError, error } = useLeaveTypesQuery(queryParams);

  // Mutations
  const { create, update } = useLeaveTypeMutation({
    onSuccess: () => {
      setIsModalOpen(false);
      setSelectedLeaveType(null);
    },
  });

  const toggleStatus = useToggleLeaveTypeStatusMutation({
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

  const handleAddLeaveType = () => {
    setSelectedLeaveType(null);
    setIsModalOpen(true);
  };

  const handleEditLeaveType = (leaveType: LeaveTypeResponse) => {
    setSelectedLeaveType(leaveType);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLeaveType(null);
  };

  const handleSubmitForm = (payload: CreateLeaveTypePayload) => {
    if (selectedLeaveType) {
      // Update existing leave type
      update.mutate({ id: selectedLeaveType.id, payload: payload as UpdateLeaveTypePayload });
    } else {
      // Create new leave type
      create.mutate(payload);
    }
  };

  const handleToggleStatus = (leaveType: LeaveTypeResponse) => {
    toggleStatus.mutate({
      id: leaveType.id,
      status: leaveType.status === 'ACTIVE' ? 'INACTIVE' as const : 'ACTIVE' as const,
    });
  };

  // Extract data and meta
  const leaveTypes = data?.data ?? [];
  const meta = data?.meta;

  return (
    <PageWrapper
      title="Leave Types"
      subtitle="Manage employee leave types master data"
      actions={
        <Button icon={Plus} onClick={handleAddLeaveType}>
          Add Leave Type
        </Button>
      }
    >
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search leave types..."
            value={queryParams.search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="mb-6 p-4 rounded-xl border border-[var(--color-danger)] bg-red-50 text-[var(--color-danger)]">
          <p className="font-medium">Error loading leave types</p>
          <p className="text-sm">{(error as Error)?.message || 'An unexpected error occurred'}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
        <LeaveTypesTable
          data={leaveTypes}
          loading={isLoading}
          onEdit={handleEditLeaveType}
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
      <LeaveTypeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        leaveType={selectedLeaveType}
        onSubmit={handleSubmitForm}
        isPending={create.isPending || update.isPending}
      />
    </PageWrapper>
  );
}