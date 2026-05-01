# PLAN INTEGRACION FIREBASE

## Descripcion del plan

Migrar Precio Justo desde almacenamiento local a Firebase de forma incremental, manteniendo el plan gratuito Spark, con datos privados por usuario y sin romper el flujo actual de la app.

## Objetivo principal

- Consolidar autenticacion y perfil de usuario en Firestore con reglas seguras por `uid`
- Preparar la migracion progresiva desde `LocalStorageAdapter` hacia Firestore sin perder datos

## Reglas del plan

- Mantenerse en Spark Plan sin costos adicionales
- No mover a produccion hasta validar en `PrecioJustoPruebas`
- No borrar `users` completos en Firestore, solo documentos de prueba no vigentes
- Toda regla de acceso debe validar `request.auth.uid == userId`
- Revisar `src/almacenamiento/adaptadores/LocalStorageAdapter.js` antes de migrar datos porque contiene informacion sensible de la estructura local actual y condiciona la estrategia de migracion
- Considerar que Leo esta aprendiendo Firebase y requiere guia paso a paso en Firebase.com para cada accion de consola

## FASE 1: Consolidar base Firebase en pruebas

### Objetivo

Dejar estable la base de autenticacion y perfil en `PrecioJustoPruebas`.

- [x] Crear y configurar proyecto `PrecioJustoPruebas`
- [x] Configurar app web y app Android
- [x] Crear Firestore `(default)` en `nam5 (United States)`
- [x] Habilitar Authentication anonima para pruebas
- [x] Autorizar dominio `localhost`
- [x] Inicializar Firebase en Quasar con `.env.local`
- [x] Crear `users/{uid}/perfil/principal` automatico en arranque
- [x] Aplicar reglas privadas por usuario en Firestore
- [x] Limpiar documentos de prueba antiguos no vigentes

## FASE 2: Login Google web

### Objetivo

Agregar inicio de sesion real con Google en web sobre la base ya estable.

- [x] Habilitar proveedor Google en Firebase Authentication
- [x] Implementar `iniciarSesionConGoogle()` en servicio de auth
- [x] Mantener fallback anonimo solo para desarrollo controlado
- [x] Actualizar `users/{uid}/perfil/principal` al iniciar con Google (nombre, email, foto, tipoCuenta)
- [x] Confirmar en Firebase Authentication que el proveedor cambie de anonimo a Google

## FASE 3: Migracion desde LocalStorageAdapter

### Objetivo

Definir y ejecutar migracion segura de datos locales a Firestore por usuario.

- [x] Auditar estructura actual en `src/almacenamiento/adaptadores/LocalStorageAdapter.js`
- [x] Documentar mapeo exacto local -> Firestore (`productos`, `comercios`, relaciones)
- [x] Diseñar estrategia de migracion idempotente con backup local temporal
- [x] Implementar migracion inicial con confirmacion del usuario
- [x] Registrar errores de migracion y reintento seguro sin perdida de datos

## FASE 4A: Auth robusta

### Objetivo

Implementar una autenticacion robusta y segura (correo, Google, invitado), con manejo correcto de errores, recuperacion de contraseña y control de acceso por sesion.

- [ ] Diseñar UX de acceso inicial al abrir app (correo, Google, invitado)
- [ ] Definir comportamiento de cada entrada:
  - [ ] Entrar con Google
  - [ ] Entrar con correo y contraseña
  - [ ] Continuar como invitado
- [ ] Implementar login/registro con correo y contraseña en Firebase Auth
- [ ] Mantener login con Google y fallback invitado ya existente
- [ ] Implementar modal reutilizable de aviso para modo invitado:
  - [ ] Mensaje amigable: al continuar como invitado, los datos se guardan en el celular
  - [ ] Aclarar que, si luego se registra/inicia sesion, debera migrar datos para mantenerlos
  - [ ] Boton principal `Aceptar`
  - [ ] Boton secundario `Registrarme ahora`
  - [ ] Diseñar como componente reutilizable para futuros avisos/confirmaciones
- [ ] Manejar errores de autenticacion en UI (ej.: contraseña incorrecta, usuario inexistente, correo invalido)
- [ ] Implementar recuperacion de contraseña por correo
- [ ] Definir flujo completo de recuperacion de contraseña:
  - [ ] Pantalla/accion `Olvide mi contraseña`
  - [ ] Envio de correo de recuperacion
  - [ ] Mensaje de confirmacion de envio
  - [ ] Manejo de errores comunes (correo invalido/no registrado)
- [ ] Implementar guardas de ruta por estado de sesion (acceso controlado en UI)
- [ ] Verificar que ningun flujo permita acceso a datos de otro usuario

## FASE 4B: Perfil editable y datos personales

### Objetivo

Implementar perfil editable con datos precargados desde Google y formulario de datos personales (incluyendo fecha de nacimiento para calcular edad), respetando el sistema visual actual.

- [ ] Definir estructura de perfil editable en Firestore:
  - [ ] `origenGoogle` (solo referencia del proveedor)
  - [ ] `perfilEditable` (campos editables por usuario)
- [ ] Precargar por defecto desde Google:
  - [ ] foto (`photoURL`)
  - [ ] nombre (`displayName`)
  - [ ] email (`email`)
  - [ ] usuarioId (`uid`)
- [ ] Permitir edicion manual de perfil por usuario sin perder seguridad por `uid`
- [ ] Implementar formulario de datos personales en perfil (fase final de esta etapa):
  - [ ] fecha de nacimiento (opcional, para calcular edad)
  - [ ] edad calculada en app (no tomada de Google)
- [ ] Agregar validaciones minimas de formulario (perfil + fecha)
- [ ] Mostrar estados y errores amigables en UI (carga, exito, fallo)
- [ ] Respetar sistema de diseño actual:
  - [ ] solo usar colores y variables ya definidas en `src/css/Variables.css`
  - [ ] asegurar soporte en modo oscuro

## FASE 5: Preparar corte a produccion

### Objetivo

Replicar configuracion validada de pruebas a proyecto productivo sin improvisacion.

- [ ] Confirmar existencia y estado del proyecto `PrecioJustoProd`
- [ ] Replicar Auth, Firestore y reglas desde pruebas
- [x] Configurar variables de entorno separadas para Prod
- [ ] Actualizar el correo electronico de asistencia del proyecto antes de salida a produccion
- [ ] Verificar comportamiento completo en entorno productivo controlado
- [ ] Definir criterio formal para cambiar la app de Pruebas a Prod
- [ ] Definir checklist Go/No-Go de salida a produccion:
  - [ ] Reglas de Firestore publicadas y verificadas
  - [ ] Auth (Google, correo y recuperacion) funcionando en Prod
  - [ ] Pruebas E2E criticas en verde
  - [ ] Variables de entorno Prod confirmadas
  - [ ] Plan de rollback confirmado
- [ ] Definir plan de rollback operativo:
  - [ ] Volver `VITE_FIREBASE_ENTORNO=pruebas` si falla Prod
  - [ ] Mantener release estable anterior lista para restaurar
  - [ ] Registrar incidente y causa raiz antes de reintentar
- [ ] Definir control de costos en Spark (gratis):
  - [ ] Revisar consumo semanal (Auth/Firestore)
  - [ ] Configurar alertas de uso en consola
  - [ ] Revisar consultas costosas antes de escalar usuarios

## FASE TESTING

### Objetivo

Validar flujo completo de autenticacion, perfil y persistencia con ejecucion guiada por IA (Playwright) y confirmacion humana en datos sensibles.

- [ ] Ejecutar suite E2E con Playwright para login/perfil/migracion.
- [ ] Antes de pruebas con cuenta real, la IA debe pedir confirmacion y credenciales temporales al usuario.
- [ ] Probar acceso como invitado:
  - [ ] Entrar como invitado
  - [ ] Confirmar aviso de guardado local en celular
  - [ ] Confirmar creacion/actualizacion de perfil anonimo
- [ ] Probar acceso con Google:
  - [ ] Iniciar sesion con Google (con credenciales provistas en el momento)
  - [ ] Confirmar actualizacion de nombre/email/foto en perfil
- [ ] Probar acceso con correo:
  - [ ] Registro nuevo
  - [ ] Login correcto
  - [ ] Login con contraseña incorrecta
- [ ] Probar recuperacion de contraseña:
  - [ ] Enviar correo de recuperacion
  - [ ] Confirmar feedback correcto en UI
- [ ] Probar seguridad de sesion y guardas:
  - [ ] Navegacion con sesion activa
  - [ ] Bloqueo/redireccion con sesion inactiva
  - [ ] Verificar que usuario A no pueda leer/escribir datos de usuario B
- [ ] Probar migracion local -> Firestore:
  - [ ] Ejecutar migracion inicial
  - [ ] Ejecutar segunda migracion y confirmar que no duplica
  - [ ] Forzar error controlado y verificar reintento seguro
- [ ] Probar perfil editable:
  - [ ] Editar datos manuales y confirmar persistencia
  - [ ] Probar formulario de fecha de nacimiento y calculo de edad
- [ ] Criterio de salida de testing:
  - [ ] No hay errores bloqueantes
  - [ ] Flujos criticos en verde
  - [ ] Evidencia guardada (logs/capturas/resumen)

## Progreso del plan

- [x] Fase 1: Consolidar base Firebase en pruebas
- [x] Fase 2: Login Google web
- [x] Fase 3: Migracion desde LocalStorageAdapter
- [ ] Fase 4A: Auth robusta
- [ ] Fase 4B: Perfil editable y datos personales
- [ ] Fase 5: Preparar corte a produccion
- [ ] Fase Testing

Fecha de creacion: 14 de Marzo 2026
Fecha de ultima actualizacion: 1 de Mayo 2026
Estado: EN PROCESO
