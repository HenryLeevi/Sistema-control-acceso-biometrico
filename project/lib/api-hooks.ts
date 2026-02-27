import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, apiClientFormData } from './api-client';
import { MockAPI } from './mock-data';
import {
  User, Aula, Horario, Permiso, Evento, Alerta,
  KPIData, ReporteResumen, PaginatedResponse, OTPCode
} from './types';

const MOCK_MODE = typeof process.env.NEXT_PUBLIC_MOCK_MODE === 'undefined'
  ? true
  : process.env.NEXT_PUBLIC_MOCK_MODE === 'true';

export const useUsuarios = (filters?: any) => {
  return useQuery({
    queryKey: ['usuarios', filters],
    queryFn: async () => {
      if (MOCK_MODE) return MockAPI.getUsuarios(filters);
      return apiClient<PaginatedResponse<User>>('/usuarios', { method: 'GET' });
    },
  });
};

export const useUsuario = (id: string) => {
  return useQuery({
    queryKey: ['usuario', id],
    queryFn: async () => {
      if (MOCK_MODE) return MockAPI.getUsuario(id);
      return apiClient<User>(`/usuarios/${id}`);
    },
    enabled: !!id,
  });
};

export const useCreateUsuario = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<User>) => {
      if (MOCK_MODE) return MockAPI.createUsuario(data);
      return apiClient<User>('/usuarios', { method: 'POST', body: JSON.stringify(data) });
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
      return apiClient<User>(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) });
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
        `/usuarios/${usuarioId}/biometria/enrolar`,
        formData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
};

export const useAulas = () => {
  return useQuery({
    queryKey: ['aulas'],
    queryFn: async () => {
      if (MOCK_MODE) return MockAPI.getAulas();
      return apiClient<PaginatedResponse<Aula>>('/aulas');
    },
  });
};

export const useCreateAula = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Aula>) => {
      if (MOCK_MODE) return MockAPI.createAula(data);
      return apiClient<Aula>('/aulas', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aulas'] });
    },
  });
};

export const useHorarios = () => {
  return useQuery({
    queryKey: ['horarios'],
    queryFn: async () => {
      if (MOCK_MODE) return MockAPI.getHorarios();
      return apiClient<PaginatedResponse<Horario>>('/horarios');
    },
  });
};

export const useCreateHorario = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Horario>) => {
      if (MOCK_MODE) return MockAPI.createHorario(data);
      return apiClient<Horario>('/horarios', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horarios'] });
    },
  });
};

export const usePermisos = (usuarioId?: string) => {
  return useQuery({
    queryKey: ['permisos', usuarioId],
    queryFn: async () => {
      if (MOCK_MODE) return MockAPI.getPermisos(usuarioId);
      const url = usuarioId ? `/permisos?usuario_id=${usuarioId}` : '/permisos';
      return apiClient<PaginatedResponse<Permiso>>(url);
    },
  });
};

export const useCreatePermiso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Permiso>) => {
      if (MOCK_MODE) return MockAPI.createPermiso(data);
      return apiClient<Permiso>('/permisos', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permisos'] });
    },
  });
};

export const useEventos = (filters?: any) => {
  return useQuery({
    queryKey: ['eventos', filters],
    queryFn: async () => {
      if (MOCK_MODE) return MockAPI.getEventos(filters);
      return apiClient<PaginatedResponse<Evento>>('/eventos');
    },
  });
};

export const useAlertas = () => {
  return useQuery({
    queryKey: ['alertas'],
    queryFn: async () => {
      if (MOCK_MODE) return MockAPI.getAlertas();
      return apiClient<PaginatedResponse<Alerta>>('/alertas');
    },
  });
};

export const useKPIData = () => {
  return useQuery({
    queryKey: ['kpi'],
    queryFn: async () => {
      if (MOCK_MODE) return MockAPI.getKPIData();
      return apiClient<KPIData>('/dashboard/kpi');
    },
    refetchInterval: 30000,
  });
};

export const useReporte = (filters?: any) => {
  return useQuery({
    queryKey: ['reporte', filters],
    queryFn: async () => {
      if (MOCK_MODE) return MockAPI.getReporte(filters);
      return apiClient<ReporteResumen>('/reportes/resumen');
    },
  });
};

export const useGenerarOTP = () => {
  return useMutation({
    mutationFn: async () => {
      if (MOCK_MODE) return MockAPI.generarOTP();
      return apiClient<OTPCode>('/otp/generar', { method: 'POST' });
    },
  });
};
