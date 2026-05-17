'use client';

import { Modal } from '@/components/ui/modal';
import { DocumentCategoryForm } from './DocumentCategoryForm';
import { DocumentCategoryResponse, CreateDocumentCategoryPayload } from '@/lib/api/master-data';

interface DocumentCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: DocumentCategoryResponse | null;
  onSubmit: (data: CreateDocumentCategoryPayload) => void;
  isPending?: boolean;
}

export function DocumentCategoryModal({ isOpen, onClose, category, onSubmit, isPending }: DocumentCategoryModalProps) {
  const isEdit = !!category;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Document Category' : 'Add Document Category'}
      size="md"
    >
      <DocumentCategoryForm
        category={category}
        onSubmit={onSubmit}
        onCancel={onClose}
        isPending={isPending}
      />
    </Modal>
  );
}