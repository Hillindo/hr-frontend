'use client';

import { Modal, ModalFooter } from '@/components/ui/modal';
import { ShiftForm } from './ShiftForm';
import { ShiftResponse, CreateShiftPayload } from '@/lib/api/master-data';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift?: ShiftResponse | null;
  onSubmit: (data: CreateShiftPayload) => void;
  isPending?: boolean;
}

export function ShiftModal({ isOpen, onClose, shift, onSubmit, isPending }: ShiftModalProps) {
  const isEdit = !!shift;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Shift' : 'Add Shift'}
      size="md"
    >
      <ShiftForm
        shift={shift}
        onSubmit={onSubmit}
        onCancel={onClose}
        isPending={isPending}
      />
    </Modal>
  );
}