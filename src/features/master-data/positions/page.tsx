'use client';

import { useState, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { PageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Pagination, PageSizeSelector } from '@/components/ui/pagination';
import { PositionsTable } from './PositionsTable';
import { PositionModal } from './PositionModal';
import { usePositionsQuery, usePositionMutation, useTogglePositionStatusMutation } from './positions.hooks';
import { PositionResponse, CreatePositionPayload, UpdatePositionPayload } from '@/lib/api/master-data';
import { Plus, Search } from 'lucide-react';
import type { ListQueryParams } from '@/lib/types/api';

export default function PositionsPage() {
  // Query params state
  const [queryParams, setQueryParams] = useState<ListQueryParams>({
    page: 1,
    pageSize: 10,
    search: '',
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<PositionResponse | null>(null);

  // Fetch positions data
  const { data, isLoading, isError, error } = usePositionsQuery(queryParams);

  // Mutations
  const { create, update } = usePositionMutation({
    onSuccess: () => {
      setIsModalOpen(false);
      setSelectedPosition(null);
    },
  });

  const toggleStatus = useTogglePositionStatusMutation({
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

  const handleAddPosition = () => {
    setSelectedPosition(null);
    setIsModalOpen(true);
  };

  const handleEditPosition = (position: PositionResponse) => {
    setSelectedPosition(position);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPosition(null);
  };

  const handleSubmitForm = (payload: CreatePositionPayload) => {
    if (selectedPosition) {
      update.mutate({ id: selectedPosition.id, payload: payload as UpdatePositionPayload });
    } else {
      create.mutate(payload);
    }
  };

  const handleToggleStatus = (position: PositionResponse) => {
    toggleStatus.mutate({
      id: position.id,
      status: position.status === 'ACTIVE' ? 'INACTIVE' as const : 'ACTIVE' as const,
    });
  };

  // Extract data and meta
  const positions = data?.data ?? [];
  const meta = data?.meta;

  return (
    <PageWrapper
      title="Positions"
      subtitle="Manage position master data"
      actions={
        <Button icon={Plus} onClick={handleAddPosition}>
          Add Position
        </Button>
      }
    >
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search positions..."
            value={queryParams.search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="mb-6 p-4 rounded-xl border border-[var(--color-danger)] bg-red-50 text-[var(--color-danger)]">
          <p className="font-medium">Error loading positions</p>
          <p className="text-sm">{(error as Error)?.message || 'An unexpected error occurred'}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
        <PositionsTable
          data={positions}
          loading={isLoading}
          onEdit={handleEditPosition}
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
      <PositionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        position={selectedPosition}
        onSubmit={handleSubmitForm}
        isPending={create.isPending || update.isPending}
      />
    </PageWrapper>
  );
}
