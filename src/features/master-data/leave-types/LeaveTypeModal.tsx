'use client';

import { Modal } from '@/components/ui/modal';
import { LeaveTypeForm } from './LeaveTypeForm';
import { LeaveTypeResponse, CreateLeaveTypePayload } from '@/lib/api/master-data';

interface LeaveTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveType?: LeaveTypeResponse | null;
  onSubmit: (data: CreateLeaveTypePayload) => void;
  isPending?: boolean;
}

export function LeaveTypeModal({ isOpen, onClose, leaveType, onSubmit, isPending }: LeaveTypeModalProps) {
  const isEdit = !!leaveType;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Leave Type' : 'Add Leave Type'}
      size="md"
    >
      <LeaveTypeForm
        leaveType={leaveType}
        onSubmit={onSubmit}
        onCancel={onClose}
        isPending={isPending}
      />
    </Modal>
  );
}