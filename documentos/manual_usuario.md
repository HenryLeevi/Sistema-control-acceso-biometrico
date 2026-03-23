# Manual de Usuario: Guía Operativa Detallada

Este manual describe el funcionamiento de cada módulo del sistema de control de accesos.

## 1. Panel Administrativo (Portal Web)

### 1.1 Gestión de Usuarios
- **Registro:** Crear perfiles con DUI y correo institucional.
- **Enrolamiento:** Desde la lista de usuarios, usar el icono de huella para capturar el rostro (3 ángulos recomendados).
- **Estado:** Un usuario "Inactivo" no podrá autenticarse ni generar códigos OTP.

### 1.2 Configuración de Accesos
- **Aulas:** Catálogo de puertas controladas.
- **Horarios:** Definición de rangos (ej. Lunes de 07:00 a 09:00).
- **Permisos:** Asignación de un docente a un aula específica en un horario determinado. El acceso se denegará automáticamente fuera de estos parámetros.

### 1.3 Monitoreo y Reportes
- **Dashboard:** Visualización de KPIs (Éxitos vs Denegados).
- **Eventos:** Auditoría en tiempo real de quién ha ingresado y por qué método.

## 2. Operación en Aula (Tablet)

### 2.1 Acceso Facial
1. El usuario se posiciona frente a la cámara.
2. El sistema indica "Procesando...".
3. Si es válido, se escucha "Bienvenido [Nombre]" y la puerta se libera por 5 segundos.

### 2.2 Acceso por OTP (Contingencia)
1. Presionar el botón "Contingencia/PIN".
2. Ingresar el código de 6 dígitos generado en la PWA móvil.

## 3. Portal Docente (PWA)
- **Instalación:** Acceder a la URL desde el móvil y seleccionar "Añadir a pantalla de inicio".
- **Horarios:** Ver la agenda semanal de aulas asignadas.
- **Generar OTP:** Botón para obtener un código dinámico válido por 120 segundos.
