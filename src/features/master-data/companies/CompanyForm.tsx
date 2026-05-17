'use client';

import { Button } from '@/components/ui/button';
import { CompanyResponse, CreateCompanyPayload, UpdateCompanyPayload } from '@/lib/api/master-data';

interface CompanyFormProps {
  company?: CompanyResponse | null;
  onSubmit: (data: CreateCompanyPayload) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isPending?: boolean;
}

export function CompanyForm({ company, onSubmit, onCancel, isLoading, isPending }: CompanyFormProps) {
  const isEdit = !!company;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const payload: CreateCompanyPayload = {
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      description: (formData.get('description') as string) || undefined,
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Company Name */}
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-primary)]">
          Company Name <span className="text-[var(--color-danger)]">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={company?.name}
          disabled={isLoading || isPending}
          className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Enter company name"
        />
      </div>

      {/* Company Code */}
      <div className="space-y-2">
        <label htmlFor="code" className="block text-sm font-medium text-[var(--color-text-primary)]">
          Company Code <span className="text-[var(--color-danger)]">*</span>
        </label>
        <input
          type="text"
          id="code"
          name="code"
          required
          defaultValue={company?.code}
          disabled={isLoading || isPending}
          className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="e.g., COMP001"
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
          defaultValue={company?.description ?? ''}
          disabled={isLoading || isPending}
          rows={3}
          className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed resize-none"
          placeholder="Enter company description"
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
          {isEdit ? 'Update Company' : 'Create Company'}
        </Button>
      </div>
    </form>
  );
}