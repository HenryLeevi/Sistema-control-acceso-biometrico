export type Role = 'admin' | 'subadmin' | 'docente' | 'seguridad';

export interface User {
  id: string;
  username: string;
  email: string;
  nombre: string;
  apellido: string;
  activo: boolean;
  roles: Role[];
  fecha_creacion: string;
  ultima_actualizacion: string;
  biometria_enrolada: boolean;
}

export interface Aula {
  id: string;
  codigo: string;
  descripcion: string;
  activo: boolean;
  capacidad?: number;
  edificio?: string;
}

export interface Horario {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  descripcion?: string;
}

export interface Permiso {
  id: string;
  usuario_id: string;
  usuario?: User;
  aula_id: string;
  aula?: Aula;
  horario_id: string;
  horario?: Horario;
  activo: boolean;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface Evento {
  id: string;
  fecha_hora: string;
  usuario_id: string;
  usuario?: User;
  aula_id: string;
  aula?: Aula;
  metodo: 'facial' | 'otp' | 'manual';
  resultado: 'permitido' | 'denegado';
  motivo?: string;
  score?: number;
  alerta: boolean;
  imagen_captura?: string;
  metadata?: Record<string, any>;
}

export interface Alerta {
  id: string;
  evento_id: string;
  evento?: Evento;
  tipo: 'acceso_denegado' | 'horario_inusual' | 'score_bajo' | 'multiple_intentos';
  estado: 'nueva' | 'revisada' | 'resuelta';
  prioridad: 'baja' | 'media' | 'alta';
  revisada_por?: string;
  fecha_revision?: string;
  notas?: string;
}

export interface OTPCode {
  codigo: string;
  expira_en: string;
  usuario_id: string;
  valido: boolean;
}

export interface KPIData {
  total_accesos_hoy: number;
  tasa_exito: number;
  tasa_rechazo: number;
  alertas_activas: number;
  usuarios_activos: number;
  accesos_por_hora: { hora: string; cantidad: number }[];
  top_aulas: { aula: string; cantidad: number }[];
}

export interface ReporteResumen {
  periodo: string;
  total_accesos: number;
  accesos_permitidos: number;
  accesos_denegados: number;
  tasa_puntualidad: number;
  accesos_por_dia: { fecha: string; permitidos: number; denegados: number }[];
  accesos_por_metodo: { metodo: string; cantidad: number }[];
  heatmap: { dia: number; hora: number; cantidad: number }[];
  usuarios_mas_activos: { usuario: string; cantidad: number }[];
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
  roles: Role[];
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}
