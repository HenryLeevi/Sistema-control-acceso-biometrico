// ─────────────────────────────────────────
// types.ts — Matches backend serializer field names (English)
// UI labels remain in Spanish — these are data types, not display labels.
// ─────────────────────────────────────────

export type Role = 'admin' | 'subadmin' | 'docente' | 'seguridad';

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  dui?: string;
  fecha_nacimiento?: string;
  residencia?: string;
  is_active: boolean;
  created_at: string;
  // Computed by frontend or login response — not in UserSerializer
  username?: string;
  roles?: Role[];
}

export interface Aula {
  id: string;
  code: string;
  description: string;
  is_active: boolean;
  desired_state?: string;
  actual_state?: string;
}

export interface Schedule {
  id: string;
  day_of_week: number;
  day_label?: string;
  start_time: string;
  end_time: string;
}

export interface AccessPermission {
  id: string;
  user: string;   // UUID
  aula: string;    // UUID
  schedule: string; // UUID
  is_active: boolean;
}

export interface AccessEvent {
  id: string;
  timestamp: string;
  user: string;     // UUID
  aula: string;     // UUID
  device?: string;  // UUID
  method: 'FACE' | 'PIN' | 'MANUAL';
  result: 'SUCCESS' | 'DENIED';
  reason?: string;
  alert_flag: boolean;
  correlation_id?: string;
}

export interface Alerta {
  id: string;
  evento_id: string;
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
