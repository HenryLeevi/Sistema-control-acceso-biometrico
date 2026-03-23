# Sistema de Control de Accesos Biométrico (Reconocimiento Facial + OTP)

Frontend completo para un sistema de control de accesos biométrico con reconocimiento facial, incluyendo:

- **Panel Administrativo Web (Desktop)** para gestión y analítica
- **PWA móvil (Mobile-First)** para generación de códigos OTP como contingencia

Diseñado para integrarse con un backend **API REST (Django DRF)** utilizando:

- JWT (Access + Refresh)
- RBAC (Roles y permisos)
- AWS Rekognition (verificación biométrica)
- AWS S3 (almacenamiento de imágenes)
- PostgreSQL (eventos y auditoría)

---

## 🚀 Características

### 🖥 Panel Administrativo Web
- Dashboard con KPIs en tiempo real
- Gestión de usuarios + estado activo/inactivo
- Asignación de roles (RBAC)
- Permisos por aula y horario
- Enrolamiento biométrico (subida a AWS S3 + indexación en Rekognition)
- Visualización de eventos con filtros avanzados
- Sistema de alertas
- Reportes y analítica (tendencias, puntualidad, rechazos)

### 📱 PWA Móvil
- Login optimizado para móvil
- Generación de OTP con countdown
- Historial de accesos
- Offline shell (service worker)
- UI táctil optimizada

---

## 🛠 Tecnologías

- Next.js 13+ (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack React Query
- Zod + React Hook Form
- Recharts
- JWT Authentication

---

## 📦 Instalación

```bash
npm install

.env.local 



NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_MOCK_MODE=true

npm run dev

http://localhost:3000

# update deploy frontend
# final fix cors

