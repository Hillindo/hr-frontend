'use client';

import { useState, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { PageWrapper } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Pagination, PageSizeSelector } from '@/components/ui/pagination';
import { DocumentCategoriesTable } from './DocumentCategoriesTable';
import { DocumentCategoryModal } from './DocumentCategoryModal';
import { useDocumentCategoriesQuery, useDocumentCategoryMutation, useToggleDocumentCategoryStatusMutation } from './document-categories.hooks';
import { DocumentCategoryResponse, CreateDocumentCategoryPayload, UpdateDocumentCategoryPayload } from '@/lib/api/master-data';
import { Plus, Search } from 'lucide-react';
import type { ListQueryParams } from '@/lib/types/api';

export default function DocumentCategoriesPage() {
  // Query params state
  const [queryParams, setQueryParams] = useState<ListQueryParams>({
    page: 1,
    pageSize: 10,
    search: '',
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategoryResponse | null>(null);

  // Fetch document categories data
  const { data, isLoading, isError, error } = useDocumentCategoriesQuery(queryParams);

  // Mutations
  const { create, update } = useDocumentCategoryMutation({
    onSuccess: () => {
      setIsModalOpen(false);
      setSelectedCategory(null);
    },
  });

  const toggleStatus = useToggleDocumentCategoryStatusMutation({
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

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: DocumentCategoryResponse) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
  };

  const handleSubmitForm = (payload: CreateDocumentCategoryPayload) => {
    if (selectedCategory) {
      // Update existing category
      update.mutate({ id: selectedCategory.id, payload: payload as UpdateDocumentCategoryPayload });
    } else {
      // Create new category
      create.mutate(payload);
    }
  };

  const handleToggleStatus = (category: DocumentCategoryResponse) => {
    toggleStatus.mutate({
      id: category.id,
      isActive: category.isActive ? 'INACTIVE' as const : 'ACTIVE' as const,
    });
  };

  // Extract data and meta
  const categories = data?.data ?? [];
  const meta = data?.meta;

  return (
    <PageWrapper
      title="Document Categories"
      subtitle="Manage document categories for employee onboarding"
      actions={
        <Button icon={Plus} onClick={handleAddCategory}>
          Add Category
        </Button>
      }
    >
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search document categories..."
            value={queryParams.search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="mb-6 p-4 rounded-xl border border-[var(--color-danger)] bg-red-50 text-[var(--color-danger)]">
          <p className="font-medium">Error loading document categories</p>
          <p className="text-sm">{(error as Error)?.message || 'An unexpected error occurred'}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
        <DocumentCategoriesTable
          data={categories}
          loading={isLoading}
          onEdit={handleEditCategory}
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
      <DocumentCategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        category={selectedCategory}
        onSubmit={handleSubmitForm}
        isPending={create.isPending || update.isPending}
      />
    </PageWrapper>
  );
}