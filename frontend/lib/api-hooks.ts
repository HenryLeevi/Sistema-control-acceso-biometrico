import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, apiClientFormData } from './api-client';
import { MockAPI } from './mock-data';
import {
  User, Aula, Schedule, AccessPermission, AccessEvent, Alerta,
  KPIData, ReporteResumen, PaginatedResponse, OTPCode
} from './types';

const MOCK_MODE = typeof process.env.NEXT_PUBLIC_MOCK_MODE === 'undefined'
  ? true
  : process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

// ── Users (GET /api/users/) ──────────────────────────

export const useUsuarios = (filters?: any) => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
};

export const useUpdateUsuario = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      if (MOCK_MODE) return MockAPI.updateUsuario(id, data);
      return apiClient<User>(`/users/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
};

export const useEnrolarBiometria = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ usuarioId, imagenes }: { usuarioId: string; imagenes: File[] }) => {
      if (MOCK_MODE) return MockAPI.enrolarBiometria(usuarioId, imagenes);
      const formData = new FormData();
      imagenes.forEach((img, index) => {
        formData.append(`imagen_${index}`, img);
      });
      return apiClientFormData<{ success: boolean; message: string }>(
        `/biometric/`,
        formData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
};

// ── Aulas (GET /api/access/aulas/) ───────────────────

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aulas'] });
    },
  });
};

// ── Schedules / Horarios (GET /api/access/schedules/) ─

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horarios'] });
    },
  });
};

// ── Permissions / Permisos (GET /api/access/permissions/) ─

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permisos'] });
    },
  });
};

// ── Events / Eventos (GET /api/access/events/) ───────

export const useEventos = (filters?: any) => {
  return useQuery({
    queryKey: ['eventos', filters],
    queryFn: async () => {
      if (MOCK_MODE) return MockAPI.getEventos(filters);
      return apiClient<PaginatedResponse<AccessEvent>>('/access/events/');
    },
  });
};

// ── Alerts (GET /api/access/events/?alert_flag=true) ─

export const useAlertas = () => {
  return useQuery({
    queryKey: ['alertas'],
    queryFn: async () => {
      if (MOCK_MODE) {
        // In mock mode, return events that have alert_flag=true
        const events = await MockAPI.getEventos();
        return {
          ...events,
          results: events.results.filter(e => e.alert_flag),
        };
      }
      // Use alert_flag filter on events endpoint
      return apiClient<PaginatedResponse<AccessEvent>>('/access/events/?alert_flag=true');
    },
  });
};

// ── KPI (GET /api/access/kpi/) ───────────────────────

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

// ── Reports (GET /api/access/reports/summary/) ───────

export const useReporte = (filters?: any) => {
  return useQuery({
    queryKey: ['reporte', filters],
    queryFn: async () => {
      if (MOCK_MODE) return MockAPI.getReporte(filters);
      return apiClient<ReporteResumen>('/access/reports/summary/');
    },
  });
};

// ── OTP (POST /api/users/pins/) ──────────────────────

export const useGenerarOTP = () => {
  return useMutation({
    mutationFn: async () => {
      if (MOCK_MODE) return MockAPI.generarOTP();
      return apiClient<OTPCode>('/users/pins/', { method: 'POST' });
    },
  });
};
