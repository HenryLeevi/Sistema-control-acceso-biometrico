import {
  User, Aula, Horario, Permiso, Evento, Alerta,
  KPIData, ReporteResumen, AuthResponse, PaginatedResponse, OTPCode
} from './types';

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@sistema.com',
    nombre: 'Henry',
    apellido: 'Valdez',
    activo: true,
    roles: ['admin'],
    fecha_creacion: '2024-01-01T10:00:00Z',
    ultima_actualizacion: '2024-01-01T10:00:00Z',
    biometria_enrolada: true,
  },
  {
    id: '2',
    username: 'docente1',
    email: 'docente1@universidad.com',
    nombre: 'María',
    apellido: 'García',
    activo: true,
    roles: ['docente'],
    fecha_creacion: '2024-01-02T10:00:00Z',
    ultima_actualizacion: '2024-01-02T10:00:00Z',
    biometria_enrolada: true,
  },
  {
    id: '3',
    username: 'seguridad1',
    email: 'seguridad@universidad.com',
    nombre: 'Carlos',
    apellido: 'López',
    activo: true,
    roles: ['seguridad'],
    fecha_creacion: '2024-01-03T10:00:00Z',
    ultima_actualizacion: '2024-01-03T10:00:00Z',
    biometria_enrolada: false,
  },
  {
    id: '4',
    username: 'docente2',
    email: 'docente2@universidad.com',
    nombre: 'Roberto',
    apellido: 'Martínez',
    activo: true,
    roles: ['docente'],
    fecha_creacion: '2024-01-04T10:00:00Z',
    ultima_actualizacion: '2024-01-04T10:00:00Z',
    biometria_enrolada: true,
  },
  {
    id: '5',
    username: 'docente3',
    email: 'docente3@universidad.com',
    nombre: 'Ana',
    apellido: 'Fernández',
    activo: true,
    roles: ['docente'],
    fecha_creacion: '2024-01-05T10:00:00Z',
    ultima_actualizacion: '2024-01-05T10:00:00Z',
    biometria_enrolada: false,
  },
  {
    id: '6',
    username: 'subadmin1',
    email: 'subadmin@universidad.com',
    nombre: 'Laura',
    apellido: 'Torres',
    activo: true,
    roles: ['subadmin'],
    fecha_creacion: '2024-01-06T10:00:00Z',
    ultima_actualizacion: '2024-01-06T10:00:00Z',
    biometria_enrolada: false,
  },
];

export const mockAulas: Aula[] = [
  { id: '1', codigo: 'A-101', descripcion: 'Laboratorio de Computación', activo: true, capacidad: 30, edificio: 'A' },
  { id: '2', codigo: 'A-102', descripcion: 'Aula Multimedia', activo: true, capacidad: 40, edificio: 'A' },
  { id: '3', codigo: 'B-201', descripcion: 'Sala de Conferencias', activo: true, capacidad: 100, edificio: 'B' },
  { id: '4', codigo: 'C-301', descripcion: 'Laboratorio de Física', activo: true, capacidad: 25, edificio: 'C' },
  { id: '5', codigo: 'D-101', descripcion: 'Biblioteca Principal', activo: false, capacidad: 50, edificio: 'D' },
];

export const mockHorarios: Horario[] = [
  { id: '1',  dia_semana: 1, hora_inicio: '08:00', hora_fin: '10:00', descripcion: 'Lunes Mañana' },
  { id: '2',  dia_semana: 1, hora_inicio: '10:00', hora_fin: '12:00', descripcion: 'Lunes Media Mañana' },
  { id: '3',  dia_semana: 1, hora_inicio: '14:00', hora_fin: '16:00', descripcion: 'Lunes Tarde' },
  { id: '4',  dia_semana: 2, hora_inicio: '08:00', hora_fin: '10:00', descripcion: 'Martes Mañana' },
  { id: '5',  dia_semana: 2, hora_inicio: '14:00', hora_fin: '16:00', descripcion: 'Martes Tarde' },
  { id: '6',  dia_semana: 3, hora_inicio: '08:00', hora_fin: '10:00', descripcion: 'Miércoles Mañana' },
  { id: '7',  dia_semana: 3, hora_inicio: '10:00', hora_fin: '12:00', descripcion: 'Miércoles Media Mañana' },
  { id: '8',  dia_semana: 3, hora_inicio: '16:00', hora_fin: '18:00', descripcion: 'Miércoles Tarde' },
  { id: '9',  dia_semana: 4, hora_inicio: '08:00', hora_fin: '10:00', descripcion: 'Jueves Mañana' },
  { id: '10', dia_semana: 4, hora_inicio: '16:00', hora_fin: '18:00', descripcion: 'Jueves Tarde' },
  { id: '11', dia_semana: 5, hora_inicio: '08:00', hora_fin: '10:00', descripcion: 'Viernes Mañana' },
  { id: '12', dia_semana: 5, hora_inicio: '10:00', hora_fin: '12:00', descripcion: 'Viernes Media Mañana' },
];

export const mockPermisos: Permiso[] = [
  { id: '1',  usuario_id: '2', aula_id: '1', horario_id: '1',  activo: true, usuario: mockUsers[1], aula: { id: '1', codigo: 'A-101', descripcion: 'Lab. Computación', activo: true, capacidad: 30, edificio: 'A' } },
  { id: '2',  usuario_id: '2', aula_id: '2', horario_id: '2',  activo: true, usuario: mockUsers[1], aula: { id: '2', codigo: 'A-102', descripcion: 'Aula Multimedia', activo: true, capacidad: 40, edificio: 'A' } },
  { id: '3',  usuario_id: '2', aula_id: '3', horario_id: '5',  activo: true, usuario: mockUsers[1], aula: { id: '3', codigo: 'B-201', descripcion: 'Sala Conferencias', activo: true, capacidad: 100, edificio: 'B' } },
  { id: '4',  usuario_id: '2', aula_id: '1', horario_id: '6',  activo: true, usuario: mockUsers[1], aula: { id: '1', codigo: 'A-101', descripcion: 'Lab. Computación', activo: true, capacidad: 30, edificio: 'A' } },
  { id: '5',  usuario_id: '2', aula_id: '4', horario_id: '9',  activo: true, usuario: mockUsers[1], aula: { id: '4', codigo: 'C-301', descripcion: 'Lab. Física', activo: true, capacidad: 25, edificio: 'C' } },
  { id: '6',  usuario_id: '2', aula_id: '2', horario_id: '11', activo: true, usuario: mockUsers[1], aula: { id: '2', codigo: 'A-102', descripcion: 'Aula Multimedia', activo: true, capacidad: 40, edificio: 'A' } },
  { id: '7',  usuario_id: '4', aula_id: '2', horario_id: '3',  activo: true },
  { id: '8',  usuario_id: '4', aula_id: '3', horario_id: '7',  activo: true },
  { id: '9',  usuario_id: '3', aula_id: '1', horario_id: '4',  activo: true },
  { id: '10', usuario_id: '5', aula_id: '1', horario_id: '8',  activo: false },
];

export const mockEventos: Evento[] = [
  {
    id: '1',
    fecha_hora: new Date(Date.now() - 3600000).toISOString(),
    usuario_id: '2',
    aula_id: '1',
    metodo: 'facial',
    resultado: 'permitido',
    score: 0.95,
    alerta: false,
  },
  {
    id: '2',
    fecha_hora: new Date(Date.now() - 7200000).toISOString(),
    usuario_id: '2',
    aula_id: '2',
    metodo: 'otp',
    resultado: 'permitido',
    alerta: false,
  },
  {
    id: '3',
    fecha_hora: new Date(Date.now() - 10800000).toISOString(),
    usuario_id: '3',
    aula_id: '1',
    metodo: 'facial',
    resultado: 'denegado',
    motivo: 'Sin permiso para esta aula',
    score: 0.88,
    alerta: true,
  },
  {
    id: '4',
    fecha_hora: new Date(Date.now() - 14400000).toISOString(),
    usuario_id: '4',
    aula_id: '3',
    metodo: 'facial',
    resultado: 'permitido',
    score: 0.91,
    alerta: false,
  },
  {
    id: '5',
    fecha_hora: new Date(Date.now() - 18000000).toISOString(),
    usuario_id: '5',
    aula_id: '2',
    metodo: 'manual',
    resultado: 'denegado',
    motivo: 'PIN incorrecto',
    alerta: true,
  },
  {
    id: '6',
    fecha_hora: new Date(Date.now() - 21600000).toISOString(),
    usuario_id: '2',
    aula_id: '4',
    metodo: 'facial',
    resultado: 'permitido',
    score: 0.97,
    alerta: false,
  },
  {
    id: '7',
    fecha_hora: new Date(Date.now() - 86400000).toISOString(),
    usuario_id: '3',
    aula_id: '2',
    metodo: 'manual',
    resultado: 'permitido',
    alerta: false,
  },
];

export const mockAlertas: Alerta[] = [
  {
    id: '1',
    evento_id: '3',
    tipo: 'acceso_denegado',
    estado: 'nueva',
    prioridad: 'media',
  },
  {
    id: '2',
    evento_id: '5',
    tipo: 'multiple_intentos',
    estado: 'nueva',
    prioridad: 'alta',
  },
  {
    id: '3',
    evento_id: '1',
    tipo: 'score_bajo',
    estado: 'revisada',
    prioridad: 'baja',
    revisada_por: 'Carlos López',
    notas: 'Cámara con poca iluminación',
  },
  {
    id: '4',
    evento_id: '2',
    tipo: 'horario_inusual',
    estado: 'resuelta',
    prioridad: 'media',
    revisada_por: 'Henry Valdez',
    notas: 'Acceso autorizado por administrador',
  },
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
    { hora: '11:00', cantidad: 6 },
    { hora: '12:00', cantidad: 4 },
  ],
  top_aulas: [
    { aula: 'A-101', cantidad: 18 },
    { aula: 'A-102', cantidad: 12 },
    { aula: 'B-201', cantidad: 10 },
    { aula: 'C-301', cantidad: 5 },
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
    { fecha: '2024-01-17', permitidos: 30, denegados: 5 },
    { fecha: '2024-01-18', permitidos: 35, denegados: 2 },
    { fecha: '2024-01-19', permitidos: 38, denegados: 6 },
    { fecha: '2024-01-20', permitidos: 25, denegados: 2 },
    { fecha: '2024-01-21', permitidos: 22, denegados: 2 },
  ],
  accesos_por_metodo: [
    { metodo: 'facial', cantidad: 180 },
    { metodo: 'otp', cantidad: 45 },
    { metodo: 'manual', cantidad: 9 },
  ],
  heatmap: [
    { dia: 1, hora: 8, cantidad: 15 },
    { dia: 1, hora: 10, cantidad: 20 },
    { dia: 2, hora: 8, cantidad: 18 },
    { dia: 2, hora: 14, cantidad: 12 },
    { dia: 3, hora: 10, cantidad: 22 },
  ],
  usuarios_mas_activos: [
    { usuario: 'María García', cantidad: 45 },
    { usuario: 'Juan Pérez', cantidad: 38 },
    { usuario: 'Carlos López', cantidad: 32 },
  ],
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
      roles: user.roles,
    };
  }

  static async getMe(): Promise<User> {
    await this.delay();
    return mockUsers[0];
  }

  static async getUsuarios(filters?: any): Promise<PaginatedResponse<User>> {
    await this.delay();
    return {
      results: mockUsers,
      count: mockUsers.length,
      next: null,
      previous: null,
    };
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
      username: data.username || '',
      email: data.email || '',
      nombre: data.nombre || '',
      apellido: data.apellido || '',
      activo: data.activo ?? true,
      roles: data.roles || ['docente'],
      fecha_creacion: new Date().toISOString(),
      ultima_actualizacion: new Date().toISOString(),
      biometria_enrolada: false,
    };
    mockUsers.push(newUser);
    return newUser;
  }

  static async updateUsuario(id: string, data: Partial<User>): Promise<User> {
    await this.delay();
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) throw new Error('Usuario no encontrado');
    mockUsers[index] = { ...mockUsers[index], ...data, ultima_actualizacion: new Date().toISOString() };
    return mockUsers[index];
  }

  static async getAulas(): Promise<PaginatedResponse<Aula>> {
    await this.delay();
    return {
      results: mockAulas,
      count: mockAulas.length,
      next: null,
      previous: null,
    };
  }

  static async createAula(data: Partial<Aula>): Promise<Aula> {
    await this.delay();
    const newAula: Aula = {
      id: String(mockAulas.length + 1),
      codigo: data.codigo || '',
      descripcion: data.descripcion || '',
      activo: data.activo ?? true,
    };
    mockAulas.push(newAula);
    return newAula;
  }

  static async getHorarios(): Promise<PaginatedResponse<Horario>> {
    await this.delay();
    return {
      results: mockHorarios,
      count: mockHorarios.length,
      next: null,
      previous: null,
    };
  }

  static async createHorario(data: Partial<Horario>): Promise<Horario> {
    await this.delay();
    const newHorario: Horario = {
      id: String(mockHorarios.length + 1),
      dia_semana: data.dia_semana || 1,
      hora_inicio: data.hora_inicio || '08:00',
      hora_fin: data.hora_fin || '10:00',
      descripcion: data.descripcion,
    };
    mockHorarios.push(newHorario);
    return newHorario;
  }

  static async getPermisos(usuarioId?: string): Promise<PaginatedResponse<Permiso>> {
    await this.delay();
    const filtered = usuarioId
      ? mockPermisos.filter(p => p.usuario_id === usuarioId)
      : mockPermisos;
    return {
      results: filtered,
      count: filtered.length,
      next: null,
      previous: null,
    };
  }

  static async createPermiso(data: Partial<Permiso>): Promise<Permiso> {
    await this.delay();
    const newPermiso: Permiso = {
      id: String(mockPermisos.length + 1),
      usuario_id: data.usuario_id || '',
      aula_id: data.aula_id || '',
      horario_id: data.horario_id || '',
      activo: data.activo ?? true,
    };
    mockPermisos.push(newPermiso);
    return newPermiso;
  }

  static async getEventos(filters?: any): Promise<PaginatedResponse<Evento>> {
    await this.delay();
    return {
      results: mockEventos,
      count: mockEventos.length,
      next: null,
      previous: null,
    };
  }

  static async getAlertas(): Promise<PaginatedResponse<Alerta>> {
    await this.delay();
    return {
      results: mockAlertas,
      count: mockAlertas.length,
      next: null,
      previous: null,
    };
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
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    return {
      codigo,
      expira_en: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      usuario_id: '2',
      valido: true,
    };
  }

  static async enrolarBiometria(usuarioId: string, imagenes: File[]): Promise<{ success: boolean; message: string }> {
    await this.delay();
    return {
      success: true,
      message: `${imagenes.length} imágenes procesadas correctamente`,
    };
  }
}
