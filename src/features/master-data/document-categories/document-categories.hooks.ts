'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentCategoriesApi, CreateDocumentCategoryPayload, UpdateDocumentCategoryPayload, DocumentCategoryListParams } from '@/lib/api/master-data';
import { queryKeys } from '@/lib/query/keys';
import type { ListQueryParams, RecordStatus } from '@/lib/types/api';

export function useDocumentCategoriesQuery(params: ListQueryParams & { isMandatory?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.masterData.documentCategories.list(params),
    queryFn: () => documentCategoriesApi.getList(params),
  });
}

export function useDocumentCategoryQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.masterData.documentCategories.detail(id),
    queryFn: () => documentCategoriesApi.getDetail(id),
    enabled: !!id,
  });
}

export function useDocumentCategoryMutation(options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: CreateDocumentCategoryPayload) => documentCategoriesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.documentCategories.all() });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDocumentCategoryPayload }) =>
      documentCategoriesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.documentCategories.all() });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });

  return {
    create: createMutation,
    update: updateMutation,
  };
}

export function useToggleDocumentCategoryStatusMutation(options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: RecordStatus }) =>
      documentCategoriesApi.toggleStatus(id, { isActive }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.documentCategories.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.documentCategories.detail(variables.id) });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}