# Sistema de Control de Accesos Biométrico

Frontend completo para un sistema de control de accesos biométrico con reconocimiento facial, incluyendo panel administrativo web y PWA móvil para generación de códigos OTP.

## Características

### Panel Administrativo Web (Desktop)
- Dashboard con KPIs en tiempo real
- Gestión completa de usuarios con enrolamiento biométrico
- Administración de aulas, horarios y permisos
- Visualización de eventos de acceso con filtros avanzados
- Sistema de alertas para eventos sospechosos
- Reportes y analíticas con gráficos interactivos
- Control de acceso basado en roles (RBAC)

### PWA Móvil (Mobile-First)
- Autenticación móvil optimizada
- Generación de códigos OTP con countdown
- Historial de accesos personalizados
- Modo offline con service worker
- Interfaz táctil optimizada

## Tecnologías

- **Framework**: Next.js 13 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Componentes**: shadcn/ui
- **State Management**: TanStack React Query
- **Validación**: Zod + React Hook Form
- **Gráficos**: Recharts
- **Autenticación**: JWT (access + refresh tokens)

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.local.example .env.local
```

## Variables de Entorno

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_MOCK_MODE=true
```

## Ejecución

```bash
# Modo desarrollo
npm run dev

# Build de producción
npm run build

# Ejecutar producción
npm start
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## Usuarios de Demostración

### Administrador
- Usuario: `admin`
- Contraseña: `password123`
- Acceso: Panel administrativo completo

### Docente
- Usuario: `docente1`
- Contraseña: `password123`
- Acceso: PWA móvil con OTP

## Estructura del Proyecto

```
/app
  /admin          # Panel administrativo
    /usuarios     # Gestión de usuarios
    /aulas        # Gestión de aulas
    /horarios     # Gestión de horarios
    /permisos     # Asignación de permisos
    /eventos      # Registro de eventos
    /alertas      # Alertas del sistema
    /reportes     # Reportes y analíticas
  /pwa            # PWA móvil
    /login        # Login móvil
    /home         # Inicio móvil
    /otp          # Generador de OTP
    /historial    # Historial de accesos
  /login          # Login web
/components       # Componentes reutilizables
/lib              # Utilidades y helpers
  api-client.ts   # Cliente API con refresh automático
  api-hooks.ts    # React Query hooks
  auth-context.tsx # Context de autenticación
  types.ts        # Definiciones TypeScript
  mock-data.ts    # Datos de demostración
```

## Rutas Principales

### Web Admin
- `/login` - Login administrativo
- `/admin` - Dashboard principal
- `/admin/usuarios` - Gestión de usuarios
- `/admin/aulas` - Gestión de aulas
- `/admin/horarios` - Gestión de horarios
- `/admin/permisos` - Asignación de permisos
- `/admin/eventos` - Registro de eventos
- `/admin/alertas` - Sistema de alertas
- `/admin/reportes` - Reportes y analíticas

### PWA Móvil
- `/pwa/login` - Login móvil
- `/pwa/home` - Inicio usuario
- `/pwa/otp` - Generador OTP
- `/pwa/historial` - Historial personal

## Modo Mock

El proyecto incluye un modo de demostración con datos simulados. Para activarlo:

1. Establecer `NEXT_PUBLIC_MOCK_MODE=true` en `.env.local`
2. Los datos se generan automáticamente desde `lib/mock-data.ts`
3. Ideal para desarrollo sin backend

## Integración con Backend Real

Para conectar con un API real:

1. Establecer `NEXT_PUBLIC_MOCK_MODE=false`
2. Configurar `NEXT_PUBLIC_API_BASE_URL` con la URL del backend
3. Los endpoints esperados están documentados en `lib/types.ts`

### Endpoints Requeridos

```
POST /auth/login
POST /auth/refresh
GET  /auth/me

GET  /usuarios
POST /usuarios
PUT  /usuarios/:id
POST /usuarios/:id/biometria/enrolar

GET  /aulas
POST /aulas

GET  /horarios
POST /horarios

GET  /permisos
POST /permisos

GET  /eventos

GET  /alertas

GET  /dashboard/kpi
GET  /reportes/resumen

POST /otp/generar
```

## Características de Seguridad

- Tokens JWT con refresh automático
- Roles y permisos (RBAC)
- Protección de rutas con RoleGuard
- Validación de formularios con Zod
- Manejo seguro de credenciales

## PWA Features

- Manifest configurado en `/public/manifest.json`
- Service Worker básico en `/public/sw.js`
- Cache de rutas principales para modo offline
- Optimizado para instalación en dispositivos móviles

## Responsive Design

- Admin: Desktop-first (optimizado para PC)
- PWA: Mobile-first (optimizado para smartphones)
- Breakpoints adaptables con Tailwind CSS
- Navegación táctil optimizada en móvil

## Soporte de Navegadores

- Chrome/Edge (últimas 2 versiones)
- Firefox (últimas 2 versiones)
- Safari (últimas 2 versiones)
- Navegadores móviles modernos

## Build para Producción

```bash
npm run build
npm start
```

El build generará una aplicación optimizada lista para producción.

## Licencia

Este proyecto es un sistema de demostración para control de accesos biométrico.
