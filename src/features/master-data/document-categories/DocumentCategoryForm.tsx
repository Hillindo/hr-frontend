'use client';

import { Button } from '@/components/ui/button';
import { DocumentCategoryResponse, CreateDocumentCategoryPayload } from '@/lib/api/master-data';

interface DocumentCategoryFormProps {
  category?: DocumentCategoryResponse | null;
  onSubmit: (data: CreateDocumentCategoryPayload) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isPending?: boolean;
}

export function DocumentCategoryForm({ category, onSubmit, onCancel, isLoading, isPending }: DocumentCategoryFormProps) {
  const isEdit = !!category;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const payload: CreateDocumentCategoryPayload = {
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      description: formData.get('description') as string || undefined,
      isMandatory: formData.get('isMandatory') === 'on',
      requiresExpiry: formData.get('requiresExpiry') === 'on',
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Category Name */}
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-primary)]">
          Category Name <span className="text-[var(--color-danger)]">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={category?.name}
          disabled={isLoading || isPending}
          className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Enter category name"
        />
      </div>

      {/* Category Code */}
      <div className="space-y-2">
        <label htmlFor="code" className="block text-sm font-medium text-[var(--color-text-primary)]">
          Category Code <span className="text-[var(--color-danger)]">*</span>
        </label>
        <input
          type="text"
          id="code"
          name="code"
          required
          defaultValue={category?.code}
          disabled={isLoading || isPending}
          className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="e.g., DOC001"
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
          defaultValue={category?.description ?? ''}
          disabled={isLoading || isPending}
          className="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed resize-none"
          placeholder="Enter category description"
        />
      </div>

      {/* Is Mandatory */}
      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="isMandatory"
            id="isMandatory"
            defaultChecked={category?.isMandatory ?? false}
            disabled={isLoading || isPending}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-[var(--color-border)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-accent)] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent)] peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
        </label>
        <label htmlFor="isMandatory" className="text-sm font-medium text-[var(--color-text-primary)] cursor-pointer">
          Mandatory for employee onboarding
        </label>
      </div>

      {/* Requires Expiry */}
      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="requiresExpiry"
            id="requiresExpiry"
            defaultChecked={category?.requiresExpiry ?? false}
            disabled={isLoading || isPending}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-[var(--color-border)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-accent)] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent)] peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
        </label>
        <label htmlFor="requiresExpiry" className="text-sm font-medium text-[var(--color-text-primary)] cursor-pointer">
          Requires expiry date
        </label>
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
          {isEdit ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
}