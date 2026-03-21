import {
  User, Aula, Schedule, AccessPermission, AccessEvent, Alerta,
  KPIData, ReporteResumen, AuthResponse, PaginatedResponse, OTPCode
} from './types';

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@sistema.com',
    nombre: 'Henry',
    apellido: 'Valdez',
    is_active: true,
    roles: ['ADMIN'],
    created_at: '2024-01-01T10:00:00Z',
  },
  {
    id: '2',
    username: 'docente1',
    email: 'docente1@universidad.com',
    nombre: 'María',
    apellido: 'García',
    is_active: true,
    roles: ['DOCENTE'],
    created_at: '2024-01-02T10:00:00Z',
  },
  {
    id: '3',
    username: 'seguridad1',
    email: 'seguridad@universidad.com',
    nombre: 'Carlos',
    apellido: 'López',
    is_active: true,
    roles: ['BIOMETRICO'],
    created_at: '2024-01-03T10:00:00Z',
  },
];

export const mockAulas: Aula[] = [
  { id: '1', code: 'A-101', description: 'Laboratorio de Computación', is_active: true },
  { id: '2', code: 'A-102', description: 'Aula Multimedia', is_active: true },
  { id: '3', code: 'B-201', description: 'Sala de Conferencias', is_active: true },
];

export const mockHorarios: Schedule[] = [
  { id: '1', day_of_week: 1, start_time: '08:00', end_time: '10:00' },
  { id: '2', day_of_week: 1, start_time: '10:00', end_time: '12:00' },
  { id: '3', day_of_week: 2, start_time: '08:00', end_time: '10:00' },
];

export const mockPermisos: AccessPermission[] = [
  { id: '1', user: '2', aula: '1', schedule: '1', is_active: true },
  { id: '2', user: '2', aula: '2', schedule: '2', is_active: true },
];

export const mockEventos: AccessEvent[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    user: '2',
    aula: '1',
    method: 'FACE',
    result: 'SUCCESS',
    alert_flag: false,
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    user: '3',
    aula: '1',
    method: 'FACE',
    result: 'DENIED',
    reason: 'Sin permiso para esta aula',
    alert_flag: true,
  },
];

export const mockAlertas: Alerta[] = [
  { id: '1', evento_id: '2', tipo: 'acceso_denegado', estado: 'nueva', prioridad: 'alta' },
];

export const mockKPIData: KPIData = {
  total_accesos_hoy: 45,
  tasa_exito: 92.5,
  tasa_rechazo: 7.5,
  alertas_activas: 3,
  usuarios_activos: 23,
  accesos_por_hora: [
    { hora: '08:00', cantidad: 12 },
    { hora: '09:00', cantidad: 8 },
    { hora: '10:00', cantidad: 15 },
  ],
  top_aulas: [
    { aula: 'A-101', cantidad: 18 },
    { aula: 'A-102', cantidad: 12 },
  ],
};

export const mockReporte: ReporteResumen = {
  periodo: 'Última semana',
  total_accesos: 234,
  accesos_permitidos: 210,
  accesos_denegados: 24,
  tasa_puntualidad: 87.3,
  accesos_por_dia: [
    { fecha: '2024-01-15', permitidos: 28, denegados: 3 },
    { fecha: '2024-01-16', permitidos: 32, denegados: 4 },
  ],
  accesos_por_metodo: [
    { metodo: 'FACE', cantidad: 180 },
    { metodo: 'PIN', cantidad: 45 },
    { metodo: 'MANUAL', cantidad: 9 },
  ],
  heatmap: [],
  usuarios_mas_activos: [],
};

export class MockAPI {
  private static delay = () => new Promise(resolve => setTimeout(resolve, 300));

  static async login(username: string, password: string): Promise<AuthResponse> {
    await this.delay();
    const user = mockUsers.find(u => u.username === username);
    if (!user || password !== 'password123') {
      throw new Error('Credenciales inválidas');
    }
    return {
      access: 'mock_access_token_' + Date.now(),
      refresh: 'mock_refresh_token_' + Date.now(),
      user,
      roles: user.roles || [],
    };
  }

  static async getMe(): Promise<User> {
    await this.delay();
    return mockUsers[0];
  }

  static async getUsuarios(filters?: any): Promise<PaginatedResponse<User>> {
    await this.delay();
    return { results: mockUsers, count: mockUsers.length, next: null, previous: null };
  }

  static async getUsuario(id: string): Promise<User> {
    await this.delay();
    const user = mockUsers.find(u => u.id === id);
    if (!user) throw new Error('Usuario no encontrado');
    return user;
  }

  static async createUsuario(data: Partial<User>): Promise<User> {
    await this.delay();
    const newUser: User = {
      id: String(mockUsers.length + 1),
      email: data.email || '',
      nombre: data.nombre || '',
      apellido: data.apellido || '',
      is_active: data.is_active ?? true,
      created_at: new Date().toISOString(),
    };
    mockUsers.push(newUser);
    return newUser;
  }

  static async updateUsuario(id: string, data: Partial<User>): Promise<User> {
    await this.delay();
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) throw new Error('Usuario no encontrado');
    mockUsers[index] = { ...mockUsers[index], ...data };
    return mockUsers[index];
  }

  static async getAulas(): Promise<PaginatedResponse<Aula>> {
    await this.delay();
    return { results: mockAulas, count: mockAulas.length, next: null, previous: null };
  }

  static async createAula(data: Partial<Aula>): Promise<Aula> {
    await this.delay();
    const newAula: Aula = {
      id: String(mockAulas.length + 1),
      code: data.code || '',
      description: data.description || '',
      is_active: data.is_active ?? true,
    };
    mockAulas.push(newAula);
    return newAula;
  }

  static async getHorarios(): Promise<PaginatedResponse<Schedule>> {
    await this.delay();
    return { results: mockHorarios, count: mockHorarios.length, next: null, previous: null };
  }

  static async createHorario(data: Partial<Schedule>): Promise<Schedule> {
    await this.delay();
    const newHorario: Schedule = {
      id: String(mockHorarios.length + 1),
      day_of_week: data.day_of_week || 1,
      start_time: data.start_time || '08:00',
      end_time: data.end_time || '10:00',
    };
    mockHorarios.push(newHorario);
    return newHorario;
  }

  static async getPermisos(usuarioId?: string): Promise<PaginatedResponse<AccessPermission>> {
    await this.delay();
    const filtered = usuarioId
      ? mockPermisos.filter(p => p.user === usuarioId)
      : mockPermisos;
    return { results: filtered, count: filtered.length, next: null, previous: null };
  }

  static async createPermiso(data: Partial<AccessPermission>): Promise<AccessPermission> {
    await this.delay();
    const newPermiso: AccessPermission = {
      id: String(mockPermisos.length + 1),
      user: data.user || '',
      aula: data.aula || '',
      schedule: data.schedule || '',
      is_active: data.is_active ?? true,
    };
    mockPermisos.push(newPermiso);
    return newPermiso;
  }

  static async getEventos(filters?: any): Promise<PaginatedResponse<AccessEvent>> {
    await this.delay();
    return { results: mockEventos, count: mockEventos.length, next: null, previous: null };
  }

  static async getAlertas(): Promise<PaginatedResponse<Alerta>> {
    await this.delay();
    return { results: mockAlertas, count: mockAlertas.length, next: null, previous: null };
  }

  static async getKPIData(): Promise<KPIData> {
    await this.delay();
    return mockKPIData;
  }

  static async getReporte(filters?: any): Promise<ReporteResumen> {
    await this.delay();
    return mockReporte;
  }

  static async generarOTP(): Promise<OTPCode> {
    await this.delay();
    return {
      codigo: Math.floor(100000 + Math.random() * 900000).toString(),
      expira_en: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      usuario_id: '2',
      valido: true,
    };
  }

  static async enrolarBiometria(usuarioId: string, imagenes: File[]): Promise<{ success: boolean; message: string }> {
    await this.delay();
    return { success: true, message: `${imagenes.length} imágenes procesadas correctamente` };
  }
}
