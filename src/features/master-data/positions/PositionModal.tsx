'use client';

import { Modal } from '@/components/ui/modal';
import { PositionForm } from './PositionForm';
import { PositionResponse, CreatePositionPayload } from '@/lib/api/master-data';

interface PositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  position?: PositionResponse | null;
  onSubmit: (data: CreatePositionPayload) => void;
  isPending?: boolean;
}

export function PositionModal({ isOpen, onClose, position, onSubmit, isPending }: PositionModalProps) {
  const isEdit = !!position;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Position' : 'Add Position'}
      size="md"
    >
      <PositionForm
        position={position}
        onSubmit={onSubmit}
        onCancel={onClose}
        isPending={isPending}
      />
    </Modal>
  );
}