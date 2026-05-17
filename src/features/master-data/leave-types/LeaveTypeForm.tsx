'use client';

import { Button } from '@/components/ui/button';
import { LeaveTypeResponse, CreateLeaveTypePayload } from '@/lib/api/master-data';

interface LeaveTypeFormProps {
  leaveType?: LeaveTypeResponse | null;
  onSubmit: (data: CreateLeaveTypePayload) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isPending?: boolean;
}

export function LeaveTypeForm({ leaveType, onSubmit, onCancel, isLoading, isPending }: LeaveTypeFormProps) {
  const isEdit = !!leaveType;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const payload: CreateLeaveTypePayload = {
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      deductBalance: formData.get('deductBalance') === 'true',
      requiresAttachment: formData.get('requiresAttachment') === 'true',
      maxDaysPerRequest: formData.get('maxDaysPerRequest') ? parseInt(formData.get('maxDaysPerRequest') as string, 10) : undefined,
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Leave Type Name */}
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-primary)]">
          Leave Type Name <span className="text-[var(--color-danger)]">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={leaveType?.name}
          disabled={isLoading || isPending}
          className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="e.g., Annual Leave"
        />
      </div>

      {/* Leave Type Code */}
      <div className="space-y-2">
        <label htmlFor="code" className="block text-sm font-medium text-[var(--color-text-primary)]">
          Leave Type Code <span className="text-[var(--color-danger)]">*</span>
        </label>
        <input
          type="text"
          id="code"
          name="code"
          required
          defaultValue={leaveType?.code}
          disabled={isLoading || isPending}
          className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="e.g., AL"
        />
      </div>

      {/* Max Days Per Request */}
      <div className="space-y-2">
        <label htmlFor="maxDaysPerRequest" className="block text-sm font-medium text-[var(--color-text-primary)]">
          Max Days Per Request
        </label>
        <input
          type="number"
          id="maxDaysPerRequest"
          name="maxDaysPerRequest"
          min="1"
          max="365"
          defaultValue={leaveType?.maxDaysPerRequest ?? ''}
          disabled={isLoading || isPending}
          className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="e.g., 5"
        />
      </div>

      {/* Deduct Balance */}
      <div className="space-y-2">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            id="deductBalance"
            name="deductBalance"
            value="true"
            defaultChecked={leaveType?.deductBalance ?? false}
            disabled={isLoading || isPending}
            className="w-5 h-5 rounded border border-[var(--color-border)] text-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]"
          />
          <span className="text-sm font-medium text-[var(--color-text-primary)]">Deducts Balance</span>
        </label>
        <p className="text-xs text-[var(--color-text-muted)] pl-8">Checked means this leave type deducts from employee leave balance</p>
      </div>

      {/* Requires Attachment */}
      <div className="space-y-2">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            id="requiresAttachment"
            name="requiresAttachment"
            value="true"
            defaultChecked={leaveType?.requiresAttachment ?? false}
            disabled={isLoading || isPending}
            className="w-5 h-5 rounded border border-[var(--color-border)] text-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]"
          />
          <span className="text-sm font-medium text-[var(--color-text-primary)]">Requires Attachment</span>
        </label>
        <p className="text-xs text-[var(--color-text-muted)] pl-8">Checked means employees must attach a document when requesting this leave</p>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading || isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isPending}
          disabled={isLoading || isPending}
        >
          {isEdit ? 'Update Leave Type' : 'Create Leave Type'}
        </Button>
      </div>
    </form>
  );
}
