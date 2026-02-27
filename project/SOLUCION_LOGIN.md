# SOLUCIÓN AL ERROR "Failed to Fetch"

## El Problema
El sistema estaba intentando conectarse a un backend real que no existe, causando el error "failed to fetch".

## La Solución
He configurado el sistema para usar **modo demostración por defecto**, con datos simulados sin necesidad de backend.

## ¿Qué cambió?

1. **El modo mock ahora está ACTIVADO por defecto**
   - No necesitas configurar nada
   - Funciona inmediatamente sin backend

2. **Banner amarillo visible**
   - Siempre verás un banner que dice "Modo Demostración Activo"
   - Esto confirma que estás usando datos simulados

3. **Mensajes de debug en consola**
   - Abre la consola del navegador (F12)
   - Verás `[AUTH] Modo mock activo, usando datos de demostración`

## Cómo usar AHORA

### PASO 1: Reinicia el servidor

```bash
# Presiona Ctrl+C para detener
# Luego inicia de nuevo:
npm run dev
```

### PASO 2: Abre el navegador

```
http://localhost:3000/login
```

### PASO 3: Usa estas credenciales

**Panel Administrativo:**
- Usuario: `admin`
- Contraseña: `password123`

**PWA Móvil (http://localhost:3000/pwa/login):**
- Usuario: `docente1`
- Contraseña: `password123`

## Verificación

Deberías ver:

1. ✅ Banner amarillo arriba que dice "Modo Demostración Activo"
2. ✅ Cuadro azul con las credenciales claramente visibles
3. ✅ Al abrir la consola (F12), mensajes que dicen `[AUTH] Modo mock activo`

## Si TODAVÍA tienes el error

### Opción 1: Limpia la caché

```bash
# Detén el servidor
# Borra la carpeta .next
rm -rf .next

# Inicia de nuevo
npm run dev
```

### Opción 2: Usa modo incógnito

1. Abre una ventana de incógnito/privada
2. Ve a `http://localhost:3000/login`
3. Usa las credenciales de demo

### Opción 3: Verifica la consola

1. Abre DevTools (F12)
2. Ve a la pestaña Console
3. Busca errores en rojo
4. Deberías ver `[AUTH] Modo mock activo`

## Otros usuarios disponibles

```javascript
// ADMIN
username: 'admin'
password: 'password123'
roles: ['admin']

// DOCENTE
username: 'docente1'
password: 'password123'
roles: ['docente']

// SEGURIDAD
username: 'seguridad1'
password: 'password123'
roles: ['seguridad']
```

## Funcionalidades disponibles en modo demo

✅ Login y autenticación
✅ Dashboard con KPIs
✅ Gestión de usuarios
✅ Gestión de aulas
✅ Gestión de horarios
✅ Asignación de permisos
✅ Visualización de eventos
✅ Sistema de alertas
✅ Reportes y gráficos
✅ PWA móvil con OTP
✅ Historial de accesos

## ¿El modo demo está activo?

Sí, si ves:
- Banner amarillo en la parte superior
- Credenciales en cuadro azul
- Mensajes en consola que dicen "[AUTH] Modo mock activo"

No, si ves:
- Error "failed to fetch"
- No hay banner amarillo
- La consola muestra "[AUTH] Conectando con API real"

En ese caso, limpia la caché y reinicia el servidor.

## Archivo .env.local

El archivo `.env.local` ya está creado con:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_MOCK_MODE=true
```

Pero **no es necesario** porque el modo mock ahora es el predeterminado.

## Para desarrollo futuro

Si quieres conectar a un backend real:
1. Edita `.env.local` y pon `NEXT_PUBLIC_MOCK_MODE=false`
2. Configura `NEXT_PUBLIC_API_BASE_URL` con tu API real
3. Reinicia el servidor

---

**TL;DR**: Reinicia el servidor (`npm run dev`), ve a `/login`, usa `admin` / `password123`. Verás un banner amarillo confirmando el modo demo.
