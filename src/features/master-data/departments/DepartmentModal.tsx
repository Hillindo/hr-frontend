'use client';

import { Modal } from '@/components/ui/modal';
import { DepartmentForm } from './DepartmentForm';
import { DepartmentResponse, CreateDepartmentPayload, DivisionResponse } from '@/lib/api/master-data';

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department?: DepartmentResponse | null;
  divisions: DivisionResponse[];
  divisionsLoading?: boolean;
  selectedCompanyId?: string;
  onSubmit: (data: CreateDepartmentPayload) => void;
  isPending?: boolean;
}

export function DepartmentModal({
  isOpen,
  onClose,
  department,
  divisions,
  divisionsLoading,
  selectedCompanyId,
  onSubmit,
  isPending,
}: DepartmentModalProps) {
  const isEdit = !!department;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Department' : 'Add Department'}
      size="md"
    >
      <DepartmentForm
        key={department?.id || 'new'}
        department={department}
        divisions={divisions}
        divisionsLoading={divisionsLoading}
        selectedCompanyId={selectedCompanyId}
        onSubmit={onSubmit}
        onCancel={onClose}
        isPending={isPending}
      />
    </Modal>
  );
}