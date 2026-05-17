'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companiesApi, CreateCompanyPayload, UpdateCompanyPayload } from '@/lib/api/master-data';
import { queryKeys } from '@/lib/query/keys';
import type { ListQueryParams, RecordStatus } from '@/lib/types/api';

export function useCompaniesQuery(params: ListQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.masterData.companies.list(params),
    queryFn: () => companiesApi.getList(params),
  });
}

export function useCompanyQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.masterData.companies.detail(id),
    queryFn: () => companiesApi.getDetail(id),
    enabled: !!id,
  });
}

export function useCompanyMutation(options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: CreateCompanyPayload) => companiesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.companies.all() });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCompanyPayload }) =>
      companiesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.companies.all() });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });

  return {
    create: createMutation,
    update: updateMutation,
  };
}

export function useToggleCompanyStatusMutation(options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RecordStatus }) =>
      companiesApi.toggleStatus(id, { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.companies.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.masterData.companies.detail(variables.id) });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}