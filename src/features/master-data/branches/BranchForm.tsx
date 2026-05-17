'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BranchResponse, CreateBranchPayload, UpdateBranchPayload, CompanyResponse } from '@/lib/api/master-data';

interface BranchFormProps {
  branch?: BranchResponse | null;
  companies: CompanyResponse[];
  companiesLoading?: boolean;
  onSubmit: (data: CreateBranchPayload) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isPending?: boolean;
}

export function BranchForm({
  branch,
  companies,
  companiesLoading,
  onSubmit,
  onCancel,
  isLoading,
  isPending,
}: BranchFormProps) {
  const isEdit = !!branch;

  // Reset company-related fields when company changes (handled by parent via key)
  useEffect(() => {
    // Parent should handle reset via key prop on this component
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const payload: CreateBranchPayload = {
      companyId: formData.get('companyId') as string,
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      description: (formData.get('description') as string) || undefined,
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
          defaultValue={branch?.companyId || ''}
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

      {/* Branch Name */}
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-primary)]">
          Branch Name <span className="text-[var(--color-danger)]">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={branch?.name}
          disabled={isLoading || isPending}
          className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Enter branch name"
        />
      </div>

      {/* Branch Code */}
      <div className="space-y-2">
        <label htmlFor="code" className="block text-sm font-medium text-[var(--color-text-primary)]">
          Branch Code <span className="text-[var(--color-danger)]">*</span>
        </label>
        <input
          type="text"
          id="code"
          name="code"
          required
          defaultValue={branch?.code}
          disabled={isLoading || isPending}
          className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="e.g., BRANCH001"
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
          defaultValue={branch?.description ?? ''}
          disabled={isLoading || isPending}
          className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed resize-none"
          placeholder="Enter branch description"
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
          {isEdit ? 'Update Branch' : 'Create Branch'}
        </Button>
      </div>
    </form>
  );
}
