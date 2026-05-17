'use client';

import { Button } from '@/components/ui/button';
import { DepartmentResponse, CreateDepartmentPayload, DivisionResponse } from '@/lib/api/master-data';

interface DepartmentFormProps {
  department?: DepartmentResponse | null;
  divisions: DivisionResponse[];
  divisionsLoading?: boolean;
  selectedCompanyId?: string;
  onSubmit: (data: CreateDepartmentPayload) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isPending?: boolean;
}

export function DepartmentForm({
  department,
  divisions,
  divisionsLoading,
  selectedCompanyId,
  onSubmit,
  onCancel,
  isLoading,
  isPending,
}: DepartmentFormProps) {
  const isEdit = !!department;

  // Filter divisions by selected company if in create mode
  const availableDivisions = selectedCompanyId
    ? divisions.filter((d) => d.companyId === selectedCompanyId)
    : divisions;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const description = formData.get('description') as string;
    const payload: CreateDepartmentPayload = {
      divisionId: formData.get('divisionId') as string,
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      ...(description.trim() && { description: description.trim() }),
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Division Selector */}
      <div className="space-y-2">
        <label htmlFor="divisionId" className="block text-sm font-medium text-[var(--color-text-primary)]">
          Division <span className="text-[var(--color-danger)]">*</span>
        </label>
        <select
          id="divisionId"
          name="divisionId"
          required
          defaultValue={department?.divisionId || ''}
          disabled={isLoading || isPending || divisionsLoading}
          className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="" disabled>
            {divisionsLoading ? 'Loading divisions...' : 'Select a division'}
          </option>
          {availableDivisions.map((division) => (
            <option key={division.id} value={division.id}>
              {division.name}
            </option>
          ))}
        </select>
      </div>

      {/* Department Name */}
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-primary)]">
          Department Name <span className="text-[var(--color-danger)]">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={department?.name}
          disabled={isLoading || isPending}
          className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Enter department name"
        />
      </div>

      {/* Department Code */}
      <div className="space-y-2">
        <label htmlFor="code" className="block text-sm font-medium text-[var(--color-text-primary)]">
          Department Code <span className="text-[var(--color-danger)]">*</span>
        </label>
        <input
          type="text"
          id="code"
          name="code"
          required
          defaultValue={department?.code}
          disabled={isLoading || isPending}
          className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="e.g., DEPT001"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium text-[var(--color-text-primary)]">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={department?.description ?? ''}
          disabled={isLoading || isPending}
          className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed resize-none"
          placeholder="Enter department description (optional)"
        />
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
          {isEdit ? 'Update Department' : 'Create Department'}
        </Button>
      </div>
    </form>
  );
}