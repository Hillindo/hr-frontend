'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { essApi, documentsApi } from '@/lib/api/ess';
import { essKeys } from '@/lib/query/keys';
import type { ListQueryParams } from '@/lib/types/api';

export function useMyDocuments(params: ListQueryParams = {}) {
  return useQuery({
    queryKey: essKeys.documents.me(params),
    queryFn: () => essApi.getMyDocuments(params),
  });
}

export function useMyMissingDocuments(params: ListQueryParams = {}) {
  return useQuery({
    queryKey: essKeys.documents.missing(params),
    queryFn: () => documentsApi.getMyMissing(params),
  });
}

export function useMyExpiringDocuments(params: ListQueryParams = {}) {
  return useQuery({
    queryKey: essKeys.documents.expiring(params),
    queryFn: () => documentsApi.getMyExpiring(params),
  });
}

export function useDocumentCategories() {
  return useQuery({
    queryKey: ['ess', 'documents', 'categories'] as const,
    queryFn: () => documentsApi.getCategories(),
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { file: File; documentCategoryId: string; issuedAt?: string; expiryDate?: string }) =>
      documentsApi.uploadMyDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ess', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['ess', 'home'] });
    },
  });
}