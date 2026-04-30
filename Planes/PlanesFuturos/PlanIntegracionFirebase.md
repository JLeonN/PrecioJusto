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

- [ ] Habilitar proveedor Google en Firebase Authentication
- [ ] Implementar `iniciarSesionConGoogle()` en servicio de auth
- [ ] Mantener fallback anonimo solo para desarrollo controlado
- [ ] Actualizar `users/{uid}/perfil/principal` al iniciar con Google (nombre, email, foto, tipoCuenta)
- [ ] Confirmar en Firebase Authentication que el proveedor cambie de anonimo a Google

## FASE 3: Migracion desde LocalStorageAdapter

### Objetivo

Definir y ejecutar migracion segura de datos locales a Firestore por usuario.

- [ ] Auditar estructura actual en `src/almacenamiento/adaptadores/LocalStorageAdapter.js`
- [ ] Documentar mapeo exacto local -> Firestore (`productos`, `comercios`, relaciones)
- [ ] Diseñar estrategia de migracion idempotente con backup local temporal
- [ ] Implementar migracion inicial con confirmacion del usuario
- [ ] Registrar errores de migracion y reintento seguro sin perdida de datos

## FASE 4: Preparar corte a produccion

### Objetivo

Replicar configuracion validada de pruebas a proyecto productivo sin improvisacion.

- [ ] Confirmar existencia y estado del proyecto `PrecioJustoProd`
- [ ] Replicar Auth, Firestore y reglas desde pruebas
- [ ] Configurar variables de entorno separadas para Prod
- [ ] Actualizar el correo electronico de asistencia del proyecto antes de salida a produccion
- [ ] Verificar comportamiento completo en entorno productivo controlado
- [ ] Definir criterio formal para cambiar la app de Pruebas a Prod

## FASE TESTING

### Objetivo

Validar flujo completo de autenticacion, perfil y persistencia en Firestore.

- [ ] Iniciar app y verificar sesion valida sin errores de permisos
- [ ] Verificar lectura/escritura de `users/{uid}/perfil/principal`
- [ ] Probar login Google web y confirmar actualizacion de perfil
- [ ] Verificar que usuario A no pueda leer/escribir datos de usuario B
- [ ] Probar reinicio de app y confirmar persistencia de sesion y perfil

## Progreso del plan

- [x] Fase 1: Consolidar base Firebase en pruebas
- [ ] Fase 2: Login Google web
- [ ] Fase 3: Migracion desde LocalStorageAdapter
- [ ] Fase 4: Preparar corte a produccion
- [ ] Fase Testing

Fecha de creacion: 14 de Marzo 2026
Fecha de ultima actualizacion: 29 de Abril 2026
Estado: EN PROCESO
