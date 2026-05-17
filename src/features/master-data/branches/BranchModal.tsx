'use client';

import { Modal } from '@/components/ui/modal';
import { BranchForm } from './BranchForm';
import { BranchResponse, CreateBranchPayload, CompanyResponse } from '@/lib/api/master-data';

interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch?: BranchResponse | null;
  companies: CompanyResponse[];
  companiesLoading?: boolean;
  onSubmit: (data: CreateBranchPayload) => void;
  isPending?: boolean;
}

export function BranchModal({
  isOpen,
  onClose,
  branch,
  companies,
  companiesLoading,
  onSubmit,
  isPending,
}: BranchModalProps) {
  const isEdit = !!branch;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Branch' : 'Add Branch'}
      size="md"
    >
      <BranchForm
        key={branch?.id || 'new'}
        branch={branch}
        companies={companies}
        companiesLoading={companiesLoading}
        onSubmit={onSubmit}
        onCancel={onClose}
        isPending={isPending}
      />
    </Modal>
  );
}
