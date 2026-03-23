# Documentación Técnica: Sistema de Control de Accesos Biométrico

## 1. Arquitectura Lógica
El sistema sigue un patrón de **Arquitectura en Capas** para asegurar la mantenibilidad y escalabilidad.

- **Capa de Presentación:** PWA para Tablets y Móviles, y un Panel Administrativo Web.
- **Capa de Aplicación:** API REST desarrollada en Django Rest Framework con autenticación JWT.
- **Capa de Dominio:** Lógica de negocio para la toma de decisiones de acceso (Horarios + Permisos).
- **Capa de Infraestructura:** Integración con Azure AI Face, Azure PostgreSQL y Azure Blob Storage.

## 2. Arquitectura Cloud (Microsoft Azure)
Se utiliza un modelo **Edge-to-Cloud**:
- Los dispositivos locales (Tablets/Raspberry Pi) capturan biometría y controlan cerraduras.
- El backend en Azure Web App procesa la identificación y verifica las reglas de negocio.

## 3. Modelo de Datos (PostgreSQL)
El esquema consta de las siguientes tablas principales:

- **USUARIO:** Atributos de perfil (ID, Nombre, DUI, Email, Estado).
- **ROL / USUARIO_ROL:** Implementación de RBAC (ADMIN, DOCENTE, etc.).
- **CREDENCIAL:** Almacenamiento seguro de hashes de contraseñas.
- **PIN_CONTINGENCIA:** PINs temporales de backup por usuario.
- **BIOMETRIA:** Referencias a PersonIDs en Azure Face API.
- **AULA / HORARIO / PERMISO_ACCESO:** Triangulación de reglas de acceso.
- **ACCESO_EVENTO:** Log inmutable de auditoría (Timestamp, Método, Resultado, Score).

## 4. Flujo de Validación
1. Captura de imagen en Tablet.
2. Envío a Backend Cloud.
3. Identificación en Azure Face.
4. Cruce local de permisos (Aula + Horario + Estado Usuario).
5. Comando de apertura vía WebSocket al hardware local.
6. Registro del evento en la base de datos.
