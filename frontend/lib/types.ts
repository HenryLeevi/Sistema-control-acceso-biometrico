// ─────────────────────────────────────────
// types.ts — Matches backend serializer field names (English)
// UI labels remain in Spanish — these are data types, not display labels.
// Roles are uppercase to match backend (ADMIN, SUBADMIN, DOCENTE, SEGURIDAD).
// ─────────────────────────────────────────

// Backend returns roles as uppercase strings
export type Role = 'ADMIN' | 'SUBADMIN' | 'DOCENTE' | 'SEGURIDAD';

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
  created_at: string;
  // Present in login/me response — not in base UserSerializer
  username?: string;
  roles?: Role[];
}

export interface AppRole {
  id: string;
  name: Role;
}

export interface UserRole {
  id: string;
  user: string;   // UUID
  role: string;   // UUID
  role_name?: string;
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
  day_of_week: number;  // 0=Mon … 6=Sun
  day_label?: string;   // "Lunes", "Martes"… (read-only, from backend)
  start_time: string;   // "HH:MM:SS"
  end_time: string;
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
  user_email?: string;
  user_nombre?: string;
}

export interface AccessEvent {
  id: string;
  timestamp: string;
  user?: string;    // UUID (nullable — unidentified attempts)
  aula: string;     // UUID
  device?: string;  // UUID
  method: 'FACE' | 'PIN' | 'MANUAL';
  result: 'SUCCESS' | 'DENIED';
  reason?: string;
  alert_flag: boolean;
  correlation_id?: string;
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
