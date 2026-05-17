'use client';

import { Modal } from '@/components/ui/modal';
import { DivisionForm } from './DivisionForm';
import { DivisionResponse, CreateDivisionPayload, CompanyResponse } from '@/lib/api/master-data';

interface DivisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  division?: DivisionResponse | null;
  companies: CompanyResponse[];
  companiesLoading?: boolean;
  onSubmit: (data: CreateDivisionPayload) => void;
  isPending?: boolean;
}

export function DivisionModal({
  isOpen,
  onClose,
  division,
  companies,
  companiesLoading,
  onSubmit,
  isPending,
}: DivisionModalProps) {
  const isEdit = !!division;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Division' : 'Add Division'}
      size="md"
    >
      <DivisionForm
        key={division?.id || 'new'}
        division={division}
        companies={companies}
        companiesLoading={companiesLoading}
        onSubmit={onSubmit}
        onCancel={onClose}
        isPending={isPending}
      />
    </Modal>
  );
}