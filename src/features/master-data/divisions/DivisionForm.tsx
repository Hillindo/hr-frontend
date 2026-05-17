'use client';

import { Button } from '@/components/ui/button';
import { DivisionResponse, CreateDivisionPayload, CompanyResponse } from '@/lib/api/master-data';

interface DivisionFormProps {
  division?: DivisionResponse | null;
  companies: CompanyResponse[];
  companiesLoading?: boolean;
  onSubmit: (data: CreateDivisionPayload) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isPending?: boolean;
}

export function DivisionForm({
  division,
  companies,
  companiesLoading,
  onSubmit,
  onCancel,
  isLoading,
  isPending,
}: DivisionFormProps) {
  const isEdit = !!division;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const payload: CreateDivisionPayload = {
      companyId: formData.get('companyId') as string,
      name: formData.get('name') as string,
      code: formData.get('code') as string,
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Company Selector */}
      <div className="space-y-2">
        <label htmlFor="companyId" className="block text-sm font-medium text-[var(--color-text-primary)]">
          Company <span className="text-[var(--color-danger)]">*</span>
        </label>
        <select
          id="companyId"
          name="companyId"
          required
          defaultValue={division?.companyId || ''}
          disabled={isLoading || isPending || companiesLoading}
          className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="" disabled>
            {companiesLoading ? 'Loading companies...' : 'Select a company'}
          </option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      {/* Division Name */}
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-primary)]">
          Division Name <span className="text-[var(--color-danger)]">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={division?.name}
          disabled={isLoading || isPending}
          className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Enter division name"
        />
      </div>

      {/* Division Code */}
      <div className="space-y-2">
        <label htmlFor="code" className="block text-sm font-medium text-[var(--color-text-primary)]">
          Division Code <span className="text-[var(--color-danger)]">*</span>
        </label>
        <input
          type="text"
          id="code"
          name="code"
          required
          defaultValue={division?.code}
          disabled={isLoading || isPending}
          className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="e.g., DIV001"
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
          defaultValue={division?.description ?? ''}
          disabled={isLoading || isPending}
          className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed resize-none"
          placeholder="Enter division description"
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
          {isEdit ? 'Update Division' : 'Create Division'}
        </Button>
      </div>
    </form>
  );
}