/**
 * Hooks for employee attendance data
 */
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '@/lib/api/ess';
import { essKeys } from '@/lib/query/keys';
import type { ListQueryParams } from '@/lib/types/api';

export function useMyAttendanceToday() {
  return useQuery({
    queryKey: essKeys.attendance.today(),
    queryFn: () => attendanceApi.getToday(),
  });
}

export function useMyAttendanceHistory(params: ListQueryParams = {}) {
  return useQuery({
    queryKey: essKeys.attendance.history(params),
    queryFn: () => attendanceApi.getHistory(params),
  });
}

export function useMyAttendanceCorrections(params: ListQueryParams = {}) {
  return useQuery({
    queryKey: essKeys.attendance.corrections(params),
    queryFn: () => attendanceApi.getCorrections(params),
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceApi.checkIn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: essKeys.attendance.today() });
      queryClient.invalidateQueries({ queryKey: essKeys.home() });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceApi.checkOut(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: essKeys.attendance.today() });
      queryClient.invalidateQueries({ queryKey: essKeys.home() });
    },
  });
}

export function useRequestAttendanceCorrection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.requestCorrection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ess', 'attendance', 'corrections'] });
      queryClient.invalidateQueries({ queryKey: ['ess', 'requests'] });
      queryClient.invalidateQueries({ queryKey: essKeys.home() });
    },
  });
}
