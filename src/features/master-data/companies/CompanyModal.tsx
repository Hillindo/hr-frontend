'use client';

import { Modal, ModalFooter } from '@/components/ui/modal';
import { CompanyForm } from './CompanyForm';
import { CompanyResponse, CreateCompanyPayload } from '@/lib/api/master-data';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company?: CompanyResponse | null;
  onSubmit: (data: CreateCompanyPayload) => void;
  isPending?: boolean;
}

export function CompanyModal({ isOpen, onClose, company, onSubmit, isPending }: CompanyModalProps) {
  const isEdit = !!company;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Company' : 'Add Company'}
      size="md"
    >
      <CompanyForm
        company={company}
        onSubmit={onSubmit}
        onCancel={onClose}
        isPending={isPending}
      />
    </Modal>
  );
}