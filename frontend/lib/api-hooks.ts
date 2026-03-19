import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, apiClientFormData } from './api-client';
import { MockAPI } from './mock-data';
import {
  User, Aula, Schedule, AccessPermission, AccessEvent, AppRole, UserRole,
  KPIData, ReporteResumen, PaginatedResponse, OTPCode,
} from './types';

const MOCK_MODE = typeof process.env.NEXT_PUBLIC_MOCK_MODE === 'undefined'
  ? true
  : process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

// ── Users (/api/users/) ──────────────────────────────

export const useUsuarios = (filters?: Record<string, string>) => {
  return useQuery({
    queryKey: ['usuarios', filters],
    queryFn: async () => {
      if (MOCK_MODE) return MockAPI.getUsuarios(filters);
      return apiClient<PaginatedResponse<User>>('/users/', { method: 'GET' });
    },
  });
};

export const useUsuario = (id: string) => {
  return useQuery({
    queryKey: ['usuario', id],
    queryFn: async () => {
      if (MOCK_MODE) return MockAPI.getUsuario(id);
      return apiClient<User>(`/users/${id}/`);
    },
    enabled: !!id,
  });
};

export const useCreateUsuario = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<User>) => {
      if (MOCK_MODE) return MockAPI.createUsuario(data);
      return apiClient<User>('/users/', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });
};

export const useUpdateUsuario = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      if (MOCK_MODE) return MockAPI.updateUsuario(id, data);
      return apiClient<User>(`/users/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });
};

export const useDeleteUsuario = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (MOCK_MODE) return;
      return apiClient<void>(`/users/${id}/`, { method: 'DELETE' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });
};

export const useEnrolarBiometria = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ usuarioId, imagenes }: { usuarioId: string; imagenes: File[] }) => {
      if (MOCK_MODE) return MockAPI.enrolarBiometria(usuarioId, imagenes);
      const formData = new FormData();
      imagenes.forEach((img, index) => formData.append(`imagen_${index}`, img));
      return apiClientFormData<{ success: boolean; message: string }>(`/biometric/`, formData);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });
};

// ── Roles (/api/roles/) ──────────────────────────────

export const useRoles = () => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      if (MOCK_MODE) return { results: [] as AppRole[], count: 0, next: null, previous: null };
      return apiClient<PaginatedResponse<AppRole>>('/roles/');
    },
  });
};

export const useUserRoles = (userId?: string) => {
  return useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async () => {
      if (MOCK_MODE) return { results: [] as UserRole[], count: 0, next: null, previous: null };
      const url = userId ? `/roles/assignments/?user=${userId}` : '/roles/assignments/';
      return apiClient<PaginatedResponse<UserRole>>(url);
    },
    enabled: true,
  });
};

export const useCreateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { user: string; role: string }) => {
      if (MOCK_MODE) return;
      return apiClient<UserRole>('/roles/assignments/', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-roles'] }),
  });
};

export const useDeleteUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (MOCK_MODE) return;
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
      if (MOCK_MODE) return MockAPI.getAulas();
      return apiClient<PaginatedResponse<Aula>>('/access/aulas/');
    },
  });
};

export const useCreateAula = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Aula>) => {
      if (MOCK_MODE) return MockAPI.createAula(data);
      return apiClient<Aula>('/access/aulas/', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['aulas'] }),
  });
};

export const useUpdateAula = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Aula> }) => {
      if (MOCK_MODE) return data as Aula;
      return apiClient<Aula>(`/access/aulas/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['aulas'] }),
  });
};

export const useDeleteAula = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (MOCK_MODE) return;
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
      if (MOCK_MODE) return MockAPI.getHorarios();
      return apiClient<PaginatedResponse<Schedule>>('/access/schedules/');
    },
  });
};

export const useCreateHorario = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Schedule>) => {
      if (MOCK_MODE) return MockAPI.createHorario(data);
      return apiClient<Schedule>('/access/schedules/', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['horarios'] }),
  });
};

export const useUpdateHorario = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Schedule> }) => {
      if (MOCK_MODE) return data as Schedule;
      return apiClient<Schedule>(`/access/schedules/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['horarios'] }),
  });
};

export const useDeleteHorario = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (MOCK_MODE) return;
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
      if (MOCK_MODE) return MockAPI.getPermisos(usuarioId);
      const url = usuarioId ? `/access/permissions/?user=${usuarioId}` : '/access/permissions/';
      return apiClient<PaginatedResponse<AccessPermission>>(url);
    },
  });
};

export const useCreatePermiso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<AccessPermission>) => {
      if (MOCK_MODE) return MockAPI.createPermiso(data);
      return apiClient<AccessPermission>('/access/permissions/', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['permisos'] }),
  });
};

export const useUpdatePermiso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AccessPermission> }) => {
      if (MOCK_MODE) return data as AccessPermission;
      return apiClient<AccessPermission>(`/access/permissions/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['permisos'] }),
  });
};

export const useDeletePermiso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (MOCK_MODE) return;
      return apiClient<void>(`/access/permissions/${id}/`, { method: 'DELETE' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['permisos'] }),
  });
};

// ── Events / Eventos (/api/access/events/) ──────────

export const useEventos = (filters?: Record<string, string>) => {
  return useQuery({
    queryKey: ['eventos', filters],
    queryFn: async () => {
      if (MOCK_MODE) return MockAPI.getEventos(filters);
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
      if (MOCK_MODE) {
        return MockAPI.getEventos();
      }
      return apiClient<PaginatedResponse<AccessEvent>>('/access/events/');
    },
  });
};

// ── KPI (/api/access/kpi/) ──────────────────────────

export const useKPIData = () => {
  return useQuery({
    queryKey: ['kpi'],
    queryFn: async () => {
      if (MOCK_MODE) return MockAPI.getKPIData();
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
      if (MOCK_MODE) return MockAPI.getReporte(filters);
      return apiClient<ReporteResumen>('/access/reports/summary/');
    },
  });
};

// ── OTP (/api/users/pins/) ──────────────────────────

export const useGenerarOTP = () => {
  return useMutation({
    mutationFn: async () => {
      if (MOCK_MODE) return MockAPI.generarOTP();
      return apiClient<OTPCode>('/users/pins/', { method: 'POST' });
    },
  });
};
