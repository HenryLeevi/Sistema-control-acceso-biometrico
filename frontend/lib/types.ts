// ─────────────────────────────────────────
// types.ts — Matches backend serializer field names (English)
// UI labels remain in Spanish — these are data types, not display labels.
// Roles are uppercase to match backend (ADMIN, SUBADMIN, DOCENTE, SEGURIDAD).
// ─────────────────────────────────────────

// Backend returns roles as uppercase strings
export type Role = 'ADMIN' | 'SUBADMIN' | 'DOCENTE' | 'BIOMETRICO';

// Helper to normalize role from API (handles legacy lowercase too)
export function normalizeRole(r: string): Role {
  return r.toUpperCase() as Role;
}

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  dui?: string | null;
  fecha_nacimiento?: string | null;
  residencia?: string;
  is_active: boolean;
  is_enrolled?: boolean;
  pin?: string;
  created_at: string;
  // Present in login/me response — not in base UserSerializer
  username?: string;
  roles?: Role[];
  local_user_id?: string | null;
}

export interface AppRole {
  id: string;
  name: Role;
}

export interface UserRole {
  id: string;
  user: string;   // UUID
  role: string;   // UUID
  role_name?: string;  // display label e.g. "Docente"
  role_code?: string;  // raw code e.g. "DOCENTE"
}

export interface Aula {
  id: string;
  code: string;
  description: string;
  is_active: boolean;
  desired_state?: 'OPEN' | 'CLOSED';
  actual_state?: 'OPEN' | 'CLOSED';
}

export interface Schedule {
  id: string;
  day_of_week: number | null;  // 0=Mon … 6=Sun
  date: string | null;         // "YYYY-MM-DD"
  start_time: string | null;   // "HH:MM:SS"
  end_time: string | null;
  is_recurring: boolean;
  is_anytime: boolean;
}

export interface AccessPermission {
  id: string;
  user: string;    // UUID (writable)
  aula: string;    // UUID (writable)
  schedule: string; // UUID (writable)
  is_active: boolean;
  // Read-only display extras from enriched serializer
  aula_code?: string;
  aula_description?: string;
  schedule_display?: string;
  schedule_day?: number;
  schedule_start?: string;
  schedule_end?: string;
  schedule_is_anytime?: boolean;
  schedule_date?: string | null;
  schedule_is_recurring?: boolean;
  user_email?: string;
  user_nombre?: string;
}

export interface AccessEvent {
  id: string;
  timestamp: string;
  user?: string;    // UUID (nullable — unidentified attempts)
  user_nombre?: string; // Full name from backend
  user_email?: string;  // Email from backend
  aula: string;     // UUID
  aula_code?: string; // Human-readable code
  device?: string;  // UUID
  method: 'FACE' | 'PIN' | 'OTP' | 'MANUAL';
  result: 'SUCCESS' | 'DENIED';
  reason?: string;
  alert_flag: boolean;
  correlation_id?: string;
  score?: number;
  response_time?: number;
}

// Legacy Alerta type — kept for backward compat but system uses AccessEvent
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
  id: string;
  code: string;
  expires_at: string;
  message?: string;
}

export interface TrendData {
  value: number;
  isPositive: boolean;
}

export interface KPIData {
  total_accesos: number;
  total_accesos_trend?: TrendData;
  tasa_exito: number;
  tasa_exito_trend?: TrendData;
  tasa_rechazo: number;
  tasa_rechazo_trend?: TrendData;
  falsos_negativos: number;
  falsos_negativos_trend?: TrendData;
  uso_otp: number;
  uso_otp_trend?: TrendData;
  score_promedio: number;
  score_promedio_trend?: TrendData;
  tiempo_respuesta_promedio: number;
  tiempo_respuesta_trend?: TrendData;
  alertas_activas: number;
  alertas_activas_trend?: TrendData;
  usuarios_activos: number;
  usuarios_activos_trend?: TrendData;
  accesos_por_hora?: { hora: string; cantidad: number }[];
  accesos_por_dia?: { hora: string; cantidad: number }[];
  top_aulas: { aula: string; cantidad: number }[];
  accesos_por_metodo?: { metodo: string; cantidad: number }[];
  start_date: string;
  end_date: string;
  is_today: boolean;
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

export interface Biometric {
  id: string;
  user: string;
  face_id: string;
  storage_url: string;
  is_active: boolean;
  created_at: string;
}
