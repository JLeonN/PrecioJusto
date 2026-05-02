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

- [x] Diseñar UX de acceso inicial al abrir app (correo, Google, invitado)
- [x] Definir comportamiento de cada entrada:
  - [x] Entrar con Google
  - [x] Entrar con correo y contraseña
  - [x] Continuar como invitado
- [x] Implementar login/registro con correo y contraseña en Firebase Auth
- [x] Mantener login con Google y fallback invitado ya existente
- [x] Implementar modal reutilizable de aviso para modo invitado:
  - [x] Mensaje amigable: al continuar como invitado, los datos se guardan en el celular
  - [x] Aclarar que, si luego se registra/inicia sesion, debera migrar datos para mantenerlos
  - [x] Boton principal `Aceptar`
  - [x] Boton secundario `Registrarme ahora`
  - [x] Diseñar como componente reutilizable para futuros avisos/confirmaciones
- [x] Manejar errores de autenticacion en UI (ej.: contraseña incorrecta, usuario inexistente, correo invalido)
- [x] Implementar recuperacion de contraseña por correo
- [x] Definir flujo completo de recuperacion de contraseña:
  - [x] Pantalla/accion `Olvide mi contraseña`
  - [x] Envio de correo de recuperacion
  - [x] Mensaje de confirmacion de envio
  - [x] Manejo de errores comunes (correo invalido/no registrado)
- [x] Implementar guardas de ruta por estado de sesion (acceso controlado en UI)
- [ ] Verificar que ningun flujo permita acceso a datos de otro usuario

## FASE 4B: Perfil editable y datos personales

### Objetivo

Implementar perfil editable con datos precargados desde Google y formulario de datos personales (incluyendo fecha de nacimiento para calcular edad), respetando el sistema visual actual.

- [x] Definir estructura de perfil editable en Firestore:
  - [x] `origenGoogle` (solo referencia del proveedor)
  - [x] `perfilEditable` (campos editables por usuario)
- [ ] Precargar por defecto desde Google:
  - [x] foto (`photoURL`)
  - [x] nombre (`displayName`)
  - [x] email (`email`)
  - [x] usuarioId (`uid`)
- [x] Permitir edicion manual de perfil por usuario sin perder seguridad por `uid`
- [x] Implementar formulario de datos personales en perfil (fase final de esta etapa):
  - [x] fecha de nacimiento (opcional, para calcular edad)
  - [x] edad calculada en app (no tomada de Google)
- [x] Agregar validaciones minimas de formulario (perfil + fecha)
- [x] Mostrar estados y errores amigables en UI (carga, exito, fallo)
- [x] Respetar sistema de diseño actual:
  - [x] solo usar colores y variables ya definidas en `src/css/Variables.css`
  - [x] asegurar soporte en modo oscuro

## FASE 4C: Reorganizacion UX de Configuracion

### Objetivo

Reordenar la pantalla de Configuracion para que sea clara, agrupada y escalable, sin romper logica existente de Firebase/Auth/Perfil/Migracion.

- [x] Mantener una sola pagina de Configuracion (sin separar en rutas nuevas en esta fase)
- [x] Reorganizar la UI en bloques desplegables (acordeon), con enfoque mobile-first
- [x] Definir orden final de bloques:
  - [x] Cuenta y perfil
  - [x] Tema
  - [x] Moneda y region
  - [x] Datos y sincronizacion
  - [x] Informacion
- [x] Unificar `Cuenta` + `Perfil` en un mismo bloque con subtitulos internos
- [x] Renombrar etiquetas para mejorar claridad:
  - [x] `Modo oscuro` -> `Tema`
  - [x] `Moneda predeterminada` -> `Moneda y region`
- [x] Agregar resumen corto por bloque cerrado (estado actual visible sin abrir):
  - [x] Tema activo
  - [x] Moneda efectiva y modo (automatica/manual)
  - [x] Estado de cuenta (invitado/google/correo)
- [x] Eliminar textos repetidos o fuera de lugar (ejemplo: mensajes de moneda dispersos)
- [x] Mantener toda la logica actual sin cambios funcionales (solo reorganizacion visual/UX)
- [x] Respetar sistema visual actual:
  - [x] solo variables de `src/css/Variables.css`
  - [x] soporte modo oscuro
  - [x] sin inventar paleta nueva
- [ ] Definir criterio de cierre de fase UX:
  - [ ] navegacion mas clara en mobile
  - [ ] usuario encuentra `Cuenta`, `Perfil`, `Tema` y `Moneda` en menos de 2 toques
  - [ ] no hay regresion en login, perfil, migracion ni preferencias

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

- [x] Ejecutar suite E2E con Playwright para login/perfil/migracion.
- [x] Antes de pruebas con cuenta real, la IA debe pedir confirmacion y credenciales temporales al usuario.
- [x] Probar acceso como invitado:
  - [x] Entrar como invitado
  - [x] Confirmar aviso de guardado local en celular
  - [x] Confirmar creacion/actualizacion de perfil anonimo
- [x] Probar acceso con Google:
  - [x] Iniciar sesion con Google (con credenciales provistas en el momento)
  - [x] Confirmar actualizacion de nombre/email/foto en perfil
- [x] Probar acceso con correo:
  - [x] Registro nuevo
  - [x] Login correcto
  - [x] Login con contraseña incorrecta
- [x] Probar recuperacion de contraseña:
  - [x] Enviar correo de recuperacion
  - [x] Confirmar feedback correcto en UI
- [x] Probar seguridad de sesion y guardas:
  - [x] Navegacion con sesion activa
  - [x] Bloqueo/redireccion con sesion inactiva
    - Decision funcional: invitado puede usar toda la app. No se aplica redireccion por sesion anonima; si no hay usuario registrado, la sesion anonima queda habilitada para continuidad y posterior migracion.
  - [x] Verificar que usuario A no pueda leer/escribir datos de usuario B
- [ ] Probar migracion local -> Firestore:
  - [x] Ejecutar migracion inicial
  - [x] Ejecutar segunda migracion y confirmar que no duplica
  - [x] Forzar error controlado y verificar reintento seguro
- [x] Probar perfil editable:
  - [x] Editar datos manuales y confirmar persistencia
  - [x] Probar formulario de fecha de nacimiento y calculo de edad
- [x] Criterio de salida de testing:
  - [x] No hay errores bloqueantes
    - Nota: persiste error CORS de `version.json` externo, no bloquea flujos Firebase ni autenticacion.
  - [x] Flujos criticos en verde
  - [x] Evidencia guardada (logs/capturas/resumen)

## Progreso del plan

- [x] Fase 1: Consolidar base Firebase en pruebas
- [x] Fase 2: Login Google web
- [x] Fase 3: Migracion desde LocalStorageAdapter
- [x] Fase 4A: Auth robusta
- [x] Fase 4B: Perfil editable y datos personales
- [ ] Fase 4C: Reorganizacion UX de Configuracion
- [ ] Fase 5: Preparar corte a produccion
- [x] Fase Testing

Fecha de creacion: 14 de Marzo 2026
Fecha de ultima actualizacion: 2 de Mayo 2026
Estado: EN PROCESO
