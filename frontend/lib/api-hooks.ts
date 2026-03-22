import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, apiClientFormData } from './api-client';
import {
  User, Aula, Schedule, AccessPermission, AccessEvent, AppRole, UserRole,
  KPIData, ReporteResumen, PaginatedResponse, OTPCode, Biometric,
} from './types';

// ── Users (/api/users/) ──────────────────────────────

export const useUsuarios = (filters?: Record<string, string>) => {
  return useQuery({
    queryKey: ['usuarios', filters],
    queryFn: async () => {
      return apiClient<PaginatedResponse<User>>('/users/', { method: 'GET' });
    },
  });
};

export const useUsuario = (id: string) => {
  return useQuery({
    queryKey: ['usuario', id],
    queryFn: async () => {
      return apiClient<User>(`/users/${id}/`);
    },
    enabled: !!id,
  });
};

export const useCreateUsuario = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<User>) => {
      return apiClient<User>('/users/', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });
};

export const useUpdateUsuario = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      return apiClient<User>(`/users/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });
};

export const useDeleteUsuario = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient<void>(`/users/${id}/`, { method: 'DELETE' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });
};

export const useEnrolarBiometria = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ usuarioId, imagenes }: { usuarioId: string; imagenes: File[] }) => {
      const formData = new FormData();
      formData.append('user', usuarioId);
      imagenes.forEach((img) => formData.append('images', img));
      return apiClientFormData<{ success: boolean; message: string }>(`/biometric/`, formData);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });
};

export const useBiometrics = (userId?: string) => {
  return useQuery({
    queryKey: ['biometrics', userId],
    queryFn: async () => {
      const url = userId ? `/biometric/?user=${userId}&is_active=true` : '/biometric/';
      return apiClient<PaginatedResponse<Biometric>>(url);
    },
    enabled: !!userId,
  });
};

export const useDeleteBiometric = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient<void>(`/biometric/${id}/`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometrics'] });
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
};

// ── Roles (/api/roles/) ──────────────────────────────

export const useRoles = () => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      return apiClient<PaginatedResponse<AppRole>>('/roles/');
    },
  });
};

export const useUserRoles = (userId?: string) => {
  return useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async () => {
      const url = userId ? `/roles/assignments/?user=${userId}` : '/roles/assignments/';
      return apiClient<PaginatedResponse<UserRole>>(url);
    },
    enabled: !!userId,
  });
};

export const useCreateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { user: string; role: string }) => {
      return apiClient<UserRole>('/roles/assignments/', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-roles'] }),
  });
};

export const useDeleteUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient<void>(`/roles/assignments/${id}/`, { method: 'DELETE' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-roles'] }),
  });
};

// ── Aulas (/api/access/aulas/) ───────────────────────

export const useAulas = () => {
  return useQuery({
    queryKey: ['aulas'],
    queryFn: async () => {
      return apiClient<PaginatedResponse<Aula>>('/access/aulas/');
    },
  });
};

export const useCreateAula = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Aula>) => {
      return apiClient<Aula>('/access/aulas/', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['aulas'] }),
  });
};

export const useUpdateAula = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Aula> }) => {
      return apiClient<Aula>(`/access/aulas/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['aulas'] }),
  });
};

export const useDeleteAula = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient<void>(`/access/aulas/${id}/`, { method: 'DELETE' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['aulas'] }),
  });
};

// ── Schedules / Horarios (/api/access/schedules/) ────

export const useHorarios = () => {
  return useQuery({
    queryKey: ['horarios'],
    queryFn: async () => {
      return apiClient<PaginatedResponse<Schedule>>('/access/schedules/');
    },
  });
};

export const useCreateHorario = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Schedule>) => {
      return apiClient<Schedule>('/access/schedules/', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['horarios'] }),
  });
};

export const useUpdateHorario = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Schedule> }) => {
      return apiClient<Schedule>(`/access/schedules/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['horarios'] }),
  });
};

export const useDeleteHorario = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient<void>(`/access/schedules/${id}/`, { method: 'DELETE' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['horarios'] }),
  });
};

// ── Permissions / Permisos (/api/access/permissions/) ─

export const usePermisos = (usuarioId?: string) => {
  return useQuery({
    queryKey: ['permisos', usuarioId],
    queryFn: async () => {
      const url = usuarioId ? `/access/permissions/?user=${usuarioId}` : '/access/permissions/';
      return apiClient<PaginatedResponse<AccessPermission>>(url);
    },
  });
};

export const useCreatePermiso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<AccessPermission>) => {
      return apiClient<AccessPermission>('/access/permissions/', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['permisos'] }),
  });
};

export const useUpdatePermiso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AccessPermission> }) => {
      return apiClient<AccessPermission>(`/access/permissions/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['permisos'] }),
  });
};

export const useDeletePermiso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient<void>(`/access/permissions/${id}/`, { method: 'DELETE' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['permisos'] }),
  });
};

// ── Validation (/api/access/validate/) ───────────────

export const useValidateAccess = () => {
  return useMutation({
    mutationFn: async (payload: { method: 'FACE' | 'PIN' | 'MANUAL', data: string, aula_id: string, device_id?: string }) => {
      return apiClient<any>('/access/validate/', { method: 'POST', body: JSON.stringify(payload) });
    },
  });
};

export const useEventos = (filters?: Record<string, string>) => {
  return useQuery({
    queryKey: ['eventos', filters],
    queryFn: async () => {
      const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
      return apiClient<PaginatedResponse<AccessEvent>>(`/access/events/${params}`);
    },
  });
};

// useAlertas: returns all AccessEvents (backend is the source of truth for significance)
export const useAlertas = () => {
  return useQuery({
    queryKey: ['alertas'],
    queryFn: async () => {
      return apiClient<PaginatedResponse<AccessEvent>>('/access/events/');
    },
  });
};

// ── KPI (/api/access/kpi/) ──────────────────────────

export const useKPIData = () => {
  return useQuery({
    queryKey: ['kpi'],
    queryFn: async () => {
      return apiClient<KPIData>('/access/kpi/');
    },
    refetchInterval: 30000,
  });
};

// ── Reports (/api/access/reports/summary/) ───────────

export const useReporte = (filters?: Record<string, string>) => {
  return useQuery({
    queryKey: ['reporte', filters],
    queryFn: async () => {
      return apiClient<ReporteResumen>('/access/reports/summary/');
    },
  });
};

// ── OTP / PIN (/api/users/pins/) ──────────────────────────

export const useCreatePinContingency = () => {
  return useMutation({
    mutationFn: async (data: { user: string; pin_hash: string; expires_at: string; is_active: boolean }) => {
      return apiClient<any>('/users/pins/', { method: 'POST', body: JSON.stringify(data) });
    },
  });
};

export const useGenerarOTP = () => {
  return useMutation({
    mutationFn: async () => {
      return apiClient<OTPCode>('/access/otps/generate/', { method: 'POST' });
    },
  });
};
