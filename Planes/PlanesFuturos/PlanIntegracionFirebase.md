# PLAN INTEGRACION FIREBASE

## Descripcion del plan

Migrar Precio Justo desde almacenamiento local a Firebase de forma incremental, manteniendo el plan gratuito Spark, con datos privados por usuario y sin romper el flujo actual de la app.

## Objetivo principal

- Consolidar autenticacion y perfil de usuario en Firestore con reglas seguras por `uid`
- Preparar la migracion progresiva desde `LocalStorageAdapter` hacia Firestore sin perder datos
- Consolidar Firestore como fuente de verdad para usuarios logueados, dejando el almacenamiento local como cache rapida/offline

## Reglas del plan

- Mantenerse en Spark Plan sin costos adicionales
- No mover a produccion hasta validar en `PrecioJustoPruebas`
- No borrar `users` completos en Firestore, solo documentos de prueba no vigentes
- Toda regla de acceso debe validar `request.auth.uid == userId`
- Revisar `src/almacenamiento/adaptadores/LocalStorageAdapter.js` antes de migrar datos porque contiene informacion sensible de la estructura local actual y condiciona la estrategia de migracion
- En usuario logueado, Firestore manda como fuente de verdad; local solo acelera la UI y permite soporte offline
- En usuario invitado, no se escribe en Firestore real; los datos quedan solo en almacenamiento local
- Toda creacion, edicion o borrado de datos de usuario real debe sincronizarse automaticamente sin boton manual obligatorio
- Todo borrado debe registrarse de forma que no pueda reaparecer por una sincronizacion vieja
- En web, la cache local debe soportar volumen alto mediante IndexedDB; `localStorage` queda como legado/migracion, no como cache principal
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
- [x] Verificar que ningun flujo permita acceso a datos de otro usuario

## FASE 4B: Perfil editable y datos personales

### Objetivo

Implementar perfil editable con datos precargados desde Google y formulario de datos personales (incluyendo fecha de nacimiento para calcular edad), respetando el sistema visual actual.

- [x] Definir estructura de perfil editable en Firestore:
  - [x] `origenGoogle` (solo referencia del proveedor)
  - [x] `perfilEditable` (campos editables por usuario)
- [x] Precargar por defecto desde Google:
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

## FASE 4D: Pantalla de acceso y cabecera de usuario

### Objetivo

Agregar una experiencia de acceso inicial clara y mejorar la identidad visual del usuario en la app, manteniendo el flujo actual de invitado.

- [x] Implementar pantalla de acceso inicial al abrir la app por primera vez:
  - [x] Entrar con Google
  - [x] Entrar con correo
  - [x] Continuar como invitado
- [x] Definir prioridad de sesion al iniciar:
  - [x] Si existe usuario real (Google/correo), usar siempre sesion real
  - [x] Si no existe usuario real, iniciar/continuar como invitado
- [x] Mantener sesion persistente:
  - [x] Si el usuario ya esta autenticado, no mostrar pantalla de acceso nuevamente
  - [x] Solo volver a mostrar acceso si el usuario cierra sesion o se pierde la sesion
- [ ] Definir comportamiento en perdida de sesion:
  - [ ] Error temporal de red: no cerrar sesion, mostrar aviso y reintentar
  - [ ] Token invalido/revocado: cerrar sesion real y volver a modo invitado
- [x] Mejorar visualizacion de foto de perfil:
  - [x] Mostrar avatar visible en Configuracion (no solo URL)
  - [x] Mantener `foto` como URL en Firestore, pero renderizar imagen en UI
  - [x] Definir fallback visual cuando la imagen no cargue (inicial del nombre)
- [x] Mejorar cabecera del drawer (menu lateral):
  - [x] Mantener titulo actual de la app
  - [x] Mostrar nombre del usuario debajo del encabezado cuando este logueado
  - [x] No mostrar correo en el drawer
  - [x] Si el usuario esta en modo invitado, mantener comportamiento actual sin datos personales
- [x] Mantener consistencia de estados:
  - [x] Usuario logueado ve su identidad (nombre/foto)
  - [x] Usuario invitado ve UI neutra de invitado
  - [x] Sincronizar automaticamente cambios locales cuando vuelva internet (sin accion manual)
  - [x] No romper migracion local -> Firestore ni flujos de auth ya validados
- [x] Definir origen de nombre y foto visibles:
  - [x] Prioridad: perfil editable manual > proveedor (Google/correo) > fallback invitado
  - [x] Si usuario edita manualmente, mantener ese valor hasta nuevo cambio manual
- [x] Extender edicion de perfil:
  - [x] Permitir cambiar foto de perfil desde UI (reutilizando flujo de imagen existente del proyecto)
  - [x] Permitir cambiar nombre visible desde UI y persistirlo en Firestore
- [x] Criterio de cierre de fase:
  - [x] Flujo inicial probado en login Google, correo e invitado
  - [x] Reapertura de app conserva sesion correctamente
  - [x] Drawer muestra nombre del usuario logueado y fallback correcto en invitado

## FASE 4E: Aislamiento multiusuario en mismo dispositivo

### Objetivo

Evitar mezcla de datos entre cuentas distintas en un mismo celular/navegador y asegurar cambio de cuenta limpio.

- [x] Definir politica de cierre de sesion:
  - [x] Al cerrar sesion real, volver a modo invitado automaticamente
  - [x] Mantener experiencia usable para invitado sin bloquear la app
- [x] Aislar estado local por `uid`:
  - [x] Separar o limpiar caches de sesion al cambiar de cuenta
  - [x] Evitar que usuario B vea datos sincronizados por usuario A
- [x] Definir comportamiento de migracion en cambio de cuenta:
  - [x] Migracion local -> Firestore automatica al iniciar sesion real
  - [x] No duplicar datos si el proceso se ejecuta mas de una vez
- [x] Reforzar proteccion de lectura/escritura:
  - [x] Verificar que toda consulta/escritura use rutas del `uid` activo
  - [x] Registrar error controlado si hay desajuste de `uid`
- [x] Criterio de cierre de fase:
  - [x] Login con cuenta A, logout, login con cuenta B sin fuga de datos
  - [x] Vuelta a cuenta A mantiene sus datos propios
  - [x] Evidencia de pruebas guardada

## FASE 4F: Sincronizacion automatica post-operacion (corto plazo)

### Objetivo

Asegurar que, luego del login real, cada cambio importante viaje tambien a Firebase sin depender solo de la migracion inicial.

- [x] Definir eventos que deben disparar sincronizacion automatica:
  - [x] crear/editar/eliminar producto
  - [x] agregar/editar/eliminar precio
  - [x] crear/editar/eliminar comercio
  - [x] crear/editar/eliminar lista (incluye cambios en Lista Justa y mesa de trabajo que persisten datos)
  - [x] cambios clave de perfil
- [x] Implementar cola de sincronizacion por eventos (throttle/debounce) para evitar exceso de escrituras
- [x] Mantener comportamiento offline-first:
  - [x] guardar local inmediato
  - [x] marcar cambios pendientes para subida
  - [x] subir automatico al volver internet
- [x] Evitar duplicados y sobrescrituras indebidas:
  - [x] aplicar reglas idempotentes por entidad
  - [x] mantener merge seguro en historiales de precios
- [x] Registrar estado de sincronizacion para soporte:
  - [x] ultima sincronizacion exitosa
  - [x] ultimo error de sincronizacion
  - [x] cantidad de pendientes
- [x] Mantener boton manual de reintento como plan B (sin exponer lenguaje tecnico al usuario)
- [x] Criterio de cierre de fase:
  - [x] crear datos nuevos y confirmar que aparecen en Firebase sin accion manual
  - [x] simular offline -> reconexion y confirmar subida automatica
  - [x] no hay duplicados en reintentos

## FASE 4G: Fuente de verdad en Firebase (mediano plazo)

### Objetivo

Migrar gradualmente a un modelo cloud-first donde Firestore sea la fuente principal de verdad, usando capacidades offline nativas para continuidad sin internet.

- [x] Definir arquitectura destino:
  - [x] Firestore como origen principal
  - [x] local como cache/soporte offline
  - [x] sincronizacion interna de Firestore en segundo plano
- [x] Diseñar migracion incremental por modulos:
  - [x] perfil
  - [x] productos
  - [x] comercios
  - [x] listas
- [x] Definir estrategia de conflictos:
  - [x] criterio por `updatedAt` y/o merge por campos
  - [x] reglas para historial de precios repetidos en ventanas cortas
- [x] Definir politica de limpieza local:
  - [x] que queda en cache
  - [x] que se invalida al cambiar de cuenta
  - [x] como evitar residuos de datos viejos
- [x] Definir observabilidad minima:
  - [x] logs de sync en entorno prueba
  - [x] señales de salud para detectar cuentas desfasadas
- [x] Criterio de cierre de fase:
  - [x] app funcional sin boton de migracion manual para flujo normal
  - [x] cambios en un dispositivo se reflejan en otro con la misma cuenta
  - [x] comportamiento offline estable sin perdida de datos

## FASE 4H: Auditoria y correccion Firebase como fuente de verdad por modulo

### Objetivo

Revisar toda la app modulo por modulo para asegurar que, con usuario real, Firestore sea la fuente de verdad y el almacenamiento local sea solo cache rapida/offline. Esta fase no reemplaza fases anteriores: las verifica, corrige contradicciones y deja evidencia funcional.

Estado 9 de Mayo 2026: se aplico auditoria correctiva de sincronizacion en stores y servicios principales. La prueba automatizada disponible quedo en usuario invitado, por lo que las validaciones reales contra Firestore multi-dispositivo quedan pendientes con una cuenta real de Leo o una cuenta de prueba autorizada.

Estado 10 de Mayo 2026: Playwright inicio sesion real con `yoomat.75.wow.03@hotmail.com` y cargo `80 productos`, `18 comercios` y `1 lista`. Durante la prueba real Firebase devolvio `resource-exhausted / Quota exceeded`, por lo que se detecto que la sincronizacion automatica y el polling remoto eran demasiado costosos para Spark. Se corrigio la arquitectura para sincronizar cambios parciales por entidad y consultar primero `configuracion/estadoSincronizacion` antes de bajar colecciones completas. Las pruebas remotas completas quedan bloqueadas hasta que Firestore vuelva a aceptar operaciones.

Estado 10 de Mayo 2026, iteracion estabilidad: se reprodujo app bloqueada en `localhost:9001` por `cargandoSesion=true` cuando Firestore entraba en backoff por cuota. Se agrego una capa de disponibilidad de Firestore con pausa local, timeout y fallback de perfil local para que la app abra igual en modo cache/offline. En Playwright se valido que, con Firebase pausado, la app carga con sesion real, datos locales visibles y consola sin errores ni warnings.

- [x] Definir contrato global de sincronizacion:
  - [x] Regla usuario real al crear: local inmediato, subida automatica a Firestore y validacion posterior en FASE 4I
  - [x] Regla usuario real al editar: local inmediato, actualizacion en Firestore y proteccion contra sobrescrituras viejas
  - [x] Regla usuario real al borrar: borrar local inmediato, borrar/registrar eliminacion en Firestore y validar que no reaparezca
  - [x] Regla usuario real al abrir app o cambiar dispositivo: bajar datos de Firestore sin requerir boton manual
  - [x] Regla usuario invitado: operar solo local, sin escribir datos privados en Firestore real
  - [x] Regla cambio de cuenta: limpiar/aislar cache visible para que no haya mezcla entre usuarios
- [ ] Auditar `Mis Productos`:
  - [ ] Crear producto manual y confirmar documento en `users/{uid}/productos/{productoId}`
  - [ ] Crear producto desde API/codigo de barras y confirmar imagen/datos persistidos
  - [ ] Editar nombre, marca, categoria, cantidad, unidad e imagen y confirmar actualizacion en Firestore
  - [ ] Agregar precio y confirmar merge correcto del historial sin duplicados
  - [ ] Borrar producto y confirmar que desaparece local, desaparece/remueve en Firestore y no reaparece tras recargar
  - [ ] Abrir misma cuenta en otro navegador/dispositivo y confirmar que los cambios aparecen automaticamente
  - [x] Confirmar que interacciones y confirmaciones de precio disparan sincronizacion automatica post-operacion
- [ ] Auditar `Comercios`:
  - [ ] Crear comercio y confirmar documento en `users/{uid}/comercios/{comercioId}`
  - [ ] Editar comercio y direcciones y confirmar actualizacion en Firestore
  - [ ] Agregar y borrar direcciones sin romper precios vinculados
  - [ ] Editar o quitar foto de local y confirmar persistencia
  - [ ] Borrar comercio y confirmar que no reaparece tras sincronizacion remota
  - [ ] Confirmar que `uso reciente` no pisa datos remotos mas importantes
  - [x] Corregir altas de comercios desde dialogos para pasar por `comerciosStore` y no saltarse la sincronizacion automatica
  - [x] Confirmar que `uso reciente` dispara sincronizacion automatica sin depender de boton manual
- [ ] Auditar `Lista Justa`:
  - [ ] Crear lista y confirmar documento en `users/{uid}/listasJustas/{listaId}`
  - [ ] Editar nombre/configuracion de lista y confirmar actualizacion remota
  - [ ] Agregar, editar, comprar/descomprar y borrar items con sincronizacion automatica
  - [ ] Borrar lista y confirmar que no reaparece tras recargar ni tras abrir otro dispositivo
  - [ ] Verificar listas con productos locales/remotos y precios manuales
- [ ] Auditar `Mesa de Trabajo` y escaneo:
  - [ ] Verificar que la sesion de escaneo que deba persistir se sincronice en `configuracion/sesionEscaneo`
  - [ ] Escaneo rapido: guardar producto/precio y confirmar subida automatica a Firestore
  - [ ] Rafaga: guardar varios items y confirmar que no genere duplicados ni bloqueos de UI
  - [ ] Descartar items y confirmar que no reaparezcan al recargar
  - [ ] Mover items a productos/listas y confirmar consistencia en los modulos destino
  - [x] Guardar `sesion_escaneo` con `fechaActualizacion` para resolver conflictos por ultima escritura valida
  - [x] Corregir `limpiarTodo()` para persistir sesion vacia en vez de borrar solo la clave local
  - [x] Corregir merge remoto/local de sesion de escaneo para que descartes viejos no resuciten items
- [ ] Auditar `Configuracion` y perfil:
  - [ ] Editar nombre visible, foto, fecha de nacimiento y confirmar persistencia en `perfil/principal`
  - [ ] Cambiar tema y confirmar si debe ser preferencia local o sincronizada por cuenta
  - [ ] Cambiar moneda, modo de moneda, unidad y region y confirmar persistencia en Firestore
  - [ ] Confirmar que otra instancia de la misma cuenta refleje las preferencias esperadas
  - [ ] Confirmar que cerrar sesion y volver a entrar restaure configuracion de la cuenta
  - [x] Sincronizar automaticamente cambios de tema, moneda, unidad y region desde `preferenciasStore`
  - [x] Agregar `fechaActualizacion` a preferencias para evitar sobrescrituras sin criterio temporal
  - [x] Guardar perfil editable pendiente local antes de escribir Firestore para poder reintentar si falla la red
  - [x] Recargar preferencias al cambiar contexto de cuenta para evitar mezcla visual entre usuarios
- [ ] Auditar fotos y payload multimedia:
  - [ ] Identificar donde se guardan fotos como URL y donde como base64
  - [ ] Verificar si producto, comercio y perfil guardan la foto actual en Firestore o solo local
  - [ ] Medir impacto de fotos base64 en Firestore/cache local
  - [ ] Decidir si se mantiene base64 temporalmente o se crea fase separada para Firebase Storage
  - [ ] No migrar a Storage en esta fase salvo que sea imprescindible para estabilidad
- [ ] Auditar cache local web/mobile:
  - [ ] Confirmar que web usa IndexedDB como cache principal y no se queda sin cuota con datos reales
  - [ ] Confirmar que Android mantiene `CapacitorAdapter` sin regresion
  - [ ] Verificar migracion segura desde `localStorage` legado a IndexedDB
  - [ ] Confirmar que si la cache falla no se borren datos correctos de Firestore
- [ ] Auditar reglas y rutas Firestore:
  - [ ] Confirmar que todos los paths privados viven bajo `users/{uid}`
  - [ ] Confirmar que ninguna escritura usa `uid` de otra cuenta
  - [ ] Confirmar reglas de seguridad para productos, comercios, listas, configuracion y perfil
  - [ ] Validar errores controlados ante permisos insuficientes
- [ ] Corregir contradicciones encontradas:
  - [ ] Si una fase vieja dice `LocalStorageAdapter` como base principal, actualizarla a cache legado/migracion
  - [ ] Si una tarea marcada completa no cumple la regla cloud-first, agregar subtarea correctiva sin borrar historial
  - [ ] Documentar decisiones de conflicto: remoto vs local, updatedAt, tombstones y merge de precios
  - [x] Dejar documentado que Firestore manda para usuario real y local queda como cache/offline
  - [x] Dejar documentado que `localStorage` web es legado/migracion y no cache principal para volumen alto
  - [x] Corregir errores de foco/validacion en inputs que bloqueaban altas manuales durante las pruebas
  - [x] Corregir sincronizacion automatica para que no reescriba todo el dataset en cada operacion
  - [x] Agregar sync parcial por producto, comercio, lista, preferencias y sesion de escaneo
  - [x] Agregar timeouts controlados en lecturas/escrituras remotas para evitar UI esperando indefinidamente
  - [x] Agregar `configuracion/estadoSincronizacion` para reducir polling remoto completo
  - [x] Agregar pausa local de Firestore cuando hay cuota excedida o timeout remoto
  - [x] Evitar que perfil de usuario bloquee el arranque si Firestore no responde
  - [x] Evitar llamadas Firestore innecesarias para usuario anonimo

## FASE 4I: Validacion funcional Firebase fuente de verdad

### Objetivo

Validar con pruebas ejecutables y verificables por Leo que Firebase se comporta con sentido comun en todos los modulos principales.

Estado 9 de Mayo 2026: validacion automatizada local en modo invitado completada. Falta repetir esta fase con sesion real para comprobar documentos Firestore y reflejo entre navegador/celular.

Estado 10 de Mayo 2026: Playwright valido login real con `wow.03` y datos locales por `uid`. La bateria CRUD completa no pudo cerrarse porque Firestore respondio `Quota exceeded`. Se creo un comercio temporal local durante la prueba fallida, se verifico por script externo que no habia llegado a Firestore y se limpio del almacenamiento local. Una prueba chica de preferencias confirmo que, con cuota excedida, la app deja el cambio pendiente y muestra error controlado en vez de quedar colgada.

Estado 10 de Mayo 2026, estabilidad `9001`: se ejecutaron 3 iteraciones Playwright. Iteracion 1: arranque anonimo con Firestore pausado, `cargandoSesion=false`, sin errores. Iteracion 2: crear/borrar producto local con Firestore pausado, sin errores. Iteracion 3: login real `wow.03` con Firestore pausado, datos por `uid` visibles y consola final sin errores ni warnings.

Estado 10 de Mayo 2026, prueba minima post reset `wow.03`: se limpio navegador MCP en `localhost:9000` y `localhost:9001`, Leo limpio Firestore/celular y Playwright ejecuto el flujo minimo con sesion real. Resultado local y remoto confirmado: `1 producto` desde Open Food Facts con foto/codigo (`Coke Original Taste`), `1 comercio` (`CH Mercado Prueba`), `1 lista justa` con `1 item`, `1 item` en Mesa de trabajo y `modoTema: oscuro`. Verificacion directa con Firebase SDK: `productos=1`, `comercios=1`, `listasJustas=1`, `sesionEscaneo.items=1`, `preferencias.modoTema=oscuro`, `estadoSincronizacion` existe. Consola Playwright: `0 errors`, `0 warnings`.

Estado 10 de Mayo 2026, reset por recontaminacion local: Leo inicio sesion por error en otro navegador con datos locales viejos y esos datos se resubieron a Firestore. Se limpio nuevamente el navegador MCP en `localhost:9000` y `localhost:9001`, se borro por SDK el espacio remoto `users/TOjno4zFqSa5JyVEmGpmMkj8j5k1` y se verifico remoto limpio: `productos=0`, `comercios=0`, `listasJustas=0`, `configuracion=0`, `perfil=0`, `migraciones=0`, `pruebasIntegracion=0`, documento usuario inexistente. Recomendacion: ningun navegador viejo debe volver a iniciar sesion sin borrar antes datos del sitio, IndexedDB y Firebase Auth persistence.

Estado 10 de Mayo 2026, recreacion minima posterior al segundo reset `wow.03`: Playwright cargo nuevamente el set minimo pedido por Leo en `localhost:9000`: `1 producto` desde Open Food Facts (`Coke Original Taste`, codigo `5449000000996`, foto API), `1 comercio` (`CH Mercado Prueba`, `Av. Prueba 123`), `1 lista justa` (`Lista CH Prueba`) con `1 item`, `1 item` en Mesa de trabajo listo (`1 / 1 articulos listos`) y Configuracion en `modoTema=oscuro`. Verificacion remota via Firestore REST: `productos=1`, `comercios=1`, `listasJustas=1`, `configuracion=4`, `sesionEscaneo.items=1`, `preferencias.modoTema=oscuro`. Consola Playwright final: `0 errors`, `0 warnings`.

- [x] Prueba minima post reset con cuenta real `wow.03`:
  - [x] Crear 1 producto desde API con foto y codigo de barras
  - [x] Crear 1 comercio con direccion
  - [x] Crear 1 lista justa con 1 producto
  - [x] Dejar 1 item en Mesa de trabajo
  - [x] Cambiar Configuracion a modo oscuro
  - [x] Confirmar datos locales en IndexedDB por espacio `uid`
  - [x] Confirmar datos remotos en Firestore con Firebase SDK
  - [x] Confirmar consola sin errores ni warnings

- [ ] Probar `Mis Productos` con dos instancias:
  - [ ] Instancia A crea producto con precio y foto
  - [ ] Instancia B ve el producto sin accion manual
  - [ ] Instancia A edita producto/precio/foto
  - [ ] Instancia B ve la edicion sin duplicados
  - [ ] Instancia A borra el producto
  - [ ] Instancia B deja de verlo y no reaparece tras recargar
- [ ] Probar `Comercios` con dos instancias:
  - [ ] Crear comercio con direccion y foto
  - [ ] Editar comercio/direccion/foto
  - [ ] Borrar comercio y confirmar que no reaparece
- [ ] Probar `Lista Justa` con dos instancias:
  - [ ] Crear lista
  - [ ] Agregar/editar/borrar items
  - [ ] Borrar lista
  - [ ] Confirmar consistencia tras recargar ambas instancias
- [ ] Probar `Mesa de Trabajo`:
  - [ ] Escaneo rapido guarda producto/precio y sincroniza
  - [ ] Rafaga no duplica productos ni bloquea UI
  - [ ] Descartar items no reaparece tras recarga
  - [x] Invitado: agregar item, persistir `sesion_escaneo`, limpiar mesa y confirmar sesion vacia con `fechaActualizacion`
- [ ] Probar `Configuracion`:
  - [ ] Editar perfil, foto y fecha de nacimiento
  - [ ] Cambiar moneda/unidad/region
  - [ ] Cerrar sesion y volver a entrar
  - [ ] Abrir la misma cuenta en otro dispositivo y confirmar datos esperados
  - [x] Invitado: cambiar preferencia de unidad y confirmar persistencia local sin pendientes de Firestore
  - [x] Cuenta real `wow.03`: cambiar unidad con Firestore en cuota excedida y confirmar pendiente/error controlado
- [ ] Probar aislamiento:
  - [ ] Cuenta A no ve productos/comercios/listas/configuracion de cuenta B
  - [ ] Invitado no sube datos privados a Firebase real
  - [ ] Cambio A -> B -> A conserva datos correctos
  - [x] Confirmar en Playwright que la sesion usada era anonima y no generaba pendientes de sincronizacion reales
- [ ] Probar resiliencia:
  - [ ] Crear/editar/borrar offline y reconectar
  - [ ] Verificar que pendientes se suben solos
  - [ ] Verificar que borrados no reaparecen
  - [ ] Verificar que no hay errores de consola bloqueantes
  - [x] Ejecutar `npm run lint` sin errores
  - [x] Ejecutar `npm run build` sin errores bloqueantes
  - [x] Corregir error bloqueante `validate/focus is not a function` detectado al agregar producto manual
  - [x] Detectar y documentar bloqueo externo `resource-exhausted / Quota exceeded` de Firestore
  - [x] Confirmar que la app corta por timeout controlado en vez de quedarse esperando indefinidamente
  - [x] Confirmar que `localhost:9001` carga sin consola roja cuando Firestore esta pausado
  - [x] Confirmar que login real no depende del perfil remoto para abrir la app

## FASE 5: Optimizacion de rendimiento (mobile + web)

### Objetivo

Mejorar la velocidad percibida y real de la app con Firebase activa, priorizando apertura fluida, menor carga inicial y sincronizacion incremental sin bloquear UI.

- [ ] Reducir trabajo en arranque de sesion:
  - [ ] cargar primero UI critica (pantalla inicial + datos visibles)
  - [ ] diferir sincronizaciones pesadas post-render
  - [ ] evitar tareas de migracion/barrido completo en el primer frame
- [ ] Implementar carga progresiva de datos:
  - [ ] evitar cargar todo `productos/comercios/listas` al iniciar
  - [ ] priorizar dataset minimo necesario por pantalla
  - [ ] paginar o diferir modulos con volumen alto
- [x] Optimizar persistencia local:
  - [x] evitar payloads grandes en `Preferences` (solo metadata cuando aplique)
  - [x] reducir cantidad de lecturas/escrituras por rafaga
  - [x] consolidar escrituras por lotes en eventos consecutivos
- [ ] Optimizar sincronizacion automatica:
  - [ ] aumentar debounce/throttle en mobile para reducir picos
  - [ ] no sincronizar si no hay cambios efectivos
  - [x] evitar recargas globales de stores cuando alcanza con actualizacion incremental
  - [x] sincronizar solo entidades afectadas en operaciones automaticas
  - [x] reducir polling remoto completo usando `configuracion/estadoSincronizacion`
- [x] Afinar sincronizacion remota:
  - [x] traer solo datos necesarios/recientes cuando sea posible
  - [x] reducir merges completos si no hubo cambios remotos relevantes
  - [x] mantener consistencia de borrados y conflictos sin reintroducir datos eliminados
- [ ] Instrumentar metricas de rendimiento:
  - [ ] medir tiempo de apertura (cold start) en celular real
  - [ ] medir tiempo hasta datos visibles (listas/comercios/productos)
  - [ ] registrar cantidad de operaciones de storage y sync por arranque
- [ ] Criterio de cierre de fase:
  - [ ] apertura percibida claramente mas rapida en celular real con cuenta de datos grandes
  - [ ] no hay regresion funcional en productos/comercios/listas/mesa de trabajo
  - [ ] sincronizacion mantiene consistencia multi-dispositivo
  - [ ] evidencia guardada con logs antes/despues y comparativa de tiempos

## FASE TESTING RENDIMIENTO (Playwright + celular real)

### Objetivo

Validar mejora de performance con medicion comparativa y evidencia tecnica reproducible.

- [ ] Definir baseline antes de optimizar:
  - [ ] tiempo de cold start en celular real (cuenta `wow.03`)
  - [ ] tiempo hasta primer dato visible en Lista Justa
  - [ ] cantidad de operaciones de storage al arranque
- [ ] Ejecutar pruebas de rendimiento tras cada bloque de optimizacion:
  - [ ] arranque de app con sesion real (3 corridas minimas)
  - [ ] navegacion inicial entre Inicio, Comercios y Mesa de trabajo
  - [ ] creacion/edicion/eliminacion de datos con sync activa
- [ ] Validar que no haya regresion funcional durante optimizacion:
  - [x] productos/comercios/listas/mesa siguen consistentes entre celular y navegador
  - [ ] borrados no reaparecen tras sincronizacion
- [ ] Guardar evidencia:
  - [ ] logs Android (`adb logcat`) antes/despues
  - [ ] capturas o video corto del flujo en celular
  - [ ] resumen comparativo de tiempos y observaciones
- [ ] Criterio de salida testing rendimiento:
  - [ ] mejora observable y medible respecto al baseline
  - [ ] sin errores bloqueantes nuevos
  - [ ] resultados documentados en este plan

## FASE 6: Preparar corte a produccion

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
- [x] Probar migracion local -> Firestore:
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

## FASE TESTING 4D-4E (Playwright)

### Objetivo

Validar por IA (Playwright) los nuevos flujos de pantalla inicial, sincronizacion automatica y aislamiento multiusuario.

- [x] Probar flujo inicial de sesion:
  - [x] Usuario real entra y no vuelve a ver pantalla de acceso al reabrir
    - Validado en Playwright: con sesion real activa, navegar a `/#/acceso` redirige automaticamente a `/#/`.
  - [x] Usuario invitado entra y mantiene estado de invitado
    - Validado en Playwright con recarga (`F5`) y permanencia en `/#/` sin redireccion a `/#/acceso` cuando ya existe estado invitado activo.
  - [x] Cerrar sesion real vuelve a flujo de acceso y estado invitado
    - Validado en Playwright: desde Configuracion, `Cerrar sesión` redirige a `/#/acceso` y la UI queda en invitado.
- [x] Probar comportamiento offline:
  - [x] Crear/editar datos sin internet (guardado local)
    - Validado técnicamente con Playwright: `context.setOffline(true)` + alta local directa en LocalStorage por espacio `uid-*`.
  - [x] Reconectar internet y verificar sincronizacion automatica a Firestore
    - Validado técnicamente con Playwright: `context.setOffline(false)` + `window.dispatchEvent(new Event('online'))`, con persistencia de resumen de migración y estado estable.
- [x] Probar prioridad de perfil visible:
  - [x] Perfil manual sobreescribe datos de proveedor
    - Validado en Playwright: cambio manual de nombre (`Leo Manual ####`) visible en drawer.
  - [x] Si no hay perfil manual, se usan datos del proveedor
    - Validado previamente en flujos Google/correo al precargar `displayName/email/photoURL` en `perfil`.
- [x] Probar cabecera de usuario en drawer:
- [x] Logueado: muestra nombre y avatar/fallback
  - Validado en Playwright con cuenta por correo: drawer muestra iniciales y nombre visible del usuario.
  - [x] Invitado: mantiene cabecera neutra sin datos personales
    - Validado en Playwright: al cerrar sesión (`/#/acceso`) se muestra `Usuario anónimo` en Configuración y botón de acceso en cabecera.
- [x] Validar UI de inputs reutilizables en Acceso inicial y Configuracion:
  - [x] Tema claro/oscuro en Configuracion sin regresion visual
  - [x] Foco y hover en inputs reutilizables
  - [x] Ojo de contraseña operativo en Acceso inicial y Configuracion
  - [ ] Autofill validado manualmente por usuario en navegador principal (pendiente confirmacion visual final)
- [ ] Probar multiusuario en mismo dispositivo:
  - [x] Login A -> logout -> login B, sin ver datos de A
  - [x] Login B -> logout -> login A, conserva datos de A
  - [x] Dataset de prueba controlado por cuenta (aislamiento real):
    - [x] Cuenta `yoomat.75.wow.03@hotmail.com`: crear 50 productos distintos (con codigos de barra reales para intentar imagen/API), crear 10 comercios, asignar precios distintos por comercio y dejar algunos productos sin precio en algunos comercios.
    - [x] Cuenta `yoomat.75.wow.04@hotmail.com`: crear 30 productos distintos, crear 5 comercios, asignar precios distintos y dejar algunos productos sin precio en algunos comercios.
    - [x] Verificar que no haya cruce de datos entre ambas cuentas en productos, comercios, precios, listas y perfil.
    - [x] Verificar consistencia al alternar sesiones A/B/A en el mismo dispositivo.
    - Evidencia: Playwright en `localhost` mostró `30 productos guardados` para `wow.04` y `50 productos guardados` para `wow.03`; al volver a `wow.04` se mantuvo `30`, confirmando aislamiento por espacio de trabajo `uid`.
- [x] Probar no-duplicacion de migracion automatica:
  - [x] Ejecutar flujo de migracion mas de una vez y confirmar idempotencia
    - Validado en Playwright con cuenta `yoomat.75.wow.04@hotmail.com`: dos migraciones consecutivas completadas, manteniendo el mismo resumen `Productos: 30, comercios: 5, listas: 0` sin crecimiento inesperado.
- [x] Validar contador de pendientes de sincronización (FASE 4F):
  - [x] Al guardar cambios de perfil aparece `1 cambio pendiente` en `Datos y sincronización`.
  - [x] Luego de la sincronización automática el contador se limpia sin acción manual.
- [x] Validar offline -> reconexión (FASE 4F):
  - [x] En offline, editar perfil mantiene cambio local y muestra pendientes.
  - [x] Al reconectar (`online`), la sincronización automática limpia pendientes (validado con espera extendida en Playwright).
- [x] Validar no duplicación en reintentos manuales (FASE 4F):
  - [x] Ejecutar `Reintentar sincronización` dos veces seguidas mantiene estable el conteo de productos.
  - [x] Evidencia Playwright: `conteoAntes=70`, `conteoDespues=70`.
- [x] Guardar evidencia Playwright:
  - [x] capturas
    - `evidencia-configuracion-actual.png`, `evidencia-drawer-nombre-manual.png`.
  - [x] logs
    - Consola Playwright: `.playwright-mcp\\console-2026-05-04T09-58-14-752Z.log`.
  - [x] resumen final por escenario
    - Acceso inicial, cierre de sesión, migración idempotente, aislamiento por `uid` y prioridad de perfil manual validados.
- [x] Validar fuente de verdad Firebase (FASE 4G):
  - [x] Botón manual de reintento oculto en flujo normal (visible solo en modo prueba/pendientes/error).
  - [x] Sincronización remota en segundo plano visible en Configuración (`Última actualización en segundo plano`).
  - [x] Simulación de dispositivo limpio: borrado de claves locales de productos/comercios/listas y recuperación automática desde Firebase al recargar (`70 productos guardados` restaurados).

## Progreso del plan

- [x] Fase 1: Consolidar base Firebase en pruebas
- [x] Fase 2: Login Google web
- [x] Fase 3: Migracion desde LocalStorageAdapter
- [x] Fase 4A: Auth robusta
- [x] Fase 4B: Perfil editable y datos personales
- [ ] Fase 4C: Reorganizacion UX de Configuracion
- [x] Fase 4D: Pantalla de acceso y cabecera de usuario
- [x] Fase 4E: Aislamiento multiusuario en mismo dispositivo
- [x] Fase 4F: Sincronizacion automatica post-operacion
- [x] Fase 4G: Fuente de verdad en Firebase
- [ ] Fase 4H: Auditoria y correccion Firebase como fuente de verdad por modulo
- [ ] Fase 4I: Validacion funcional Firebase fuente de verdad
- [ ] Fase 5: Optimizacion de rendimiento (mobile + web)
- [ ] Fase Testing Rendimiento (Playwright + celular real)
- [ ] Fase 6: Preparar corte a produccion
- [x] Fase Testing
- [x] Fase Testing 4D-4E (Playwright)

Fecha de creacion: 14 de Marzo 2026
Fecha de ultima actualizacion: 10 de Mayo 2026
Estado: EN PROCESO

## Verificacion practica Firebase por modulo

Esta lista registra pruebas reales hechas entre navegador web, celular y Firestore para separar que funciona de lo que falta retocar.

### Mis Productos

- [x] Web -> Firebase: carga manual desde navegador funcionando.
  - Producto probado: `Dulce De Leche`, marca `Conaprole`, codigo `7730105005091`, precio `199 UYU`, comercio `CH Mercado Prueba`.
  - Confirmacion Firestore: el producto aparecio en `users/TOjno4zFqSa5JyVEmGpmMkj8j5k1/productos`.
- [x] Web -> Celular: carga manual desde navegador reflejada en celular.
  - Leo confirmo en celular que el producto agregado desde la web aparecio correctamente.
  - Nota: prueba especifica hecha desde flujo de carga manual con codigo de barras/API; puede ser relevante si otros flujos se comportan distinto.
- [x] Celular -> Firebase: carga manual desde celular funcionando.
  - Producto probado: `Clight naranja dulce`, marca `Mondelez`, codigo `7622201703141`.
  - Confirmacion Firestore: el conteo subio a `3 productos` y el producto aparecio con `fechaActualizacion=2026-05-10T19:04:15.966Z`.
- [ ] Celular -> Web: pendiente confirmar que el producto creado desde celular aparezca en navegador sin accion manual.
- [x] Web -> Firebase: agregar nuevo precio a producto creado desde celular funcionando.
  - Producto probado: `Clight naranja dulce`.
  - Accion: desde la web se agrego un nuevo precio `25 UYU` en `CH Mercado Prueba`.
  - Confirmacion Firestore: el producto quedo con `2 precios`, original `20 USD` y nuevo `25 UYU`, con `fechaActualizacion=2026-05-10T19:09:43.082Z`.
- [x] Celular -> Firebase: agregar nuevo precio a producto creado desde web funcionando.
  - Producto probado: `Dulce De Leche`, codigo `7730105005091`.
  - Accion: desde celular Leo agrego/cambio precio a `210`.
  - Confirmacion Firestore: el producto quedo con `2 precios`, original `199 UYU` y nuevo `210 USD`, con `fechaActualizacion=2026-05-10T19:10:18.108Z`.
- [x] Celular -> Firebase: edicion de datos principales de producto funcionando.
  - Producto probado: `Clight naranja dulce`, codigo `7622201703141`.
  - Accion: Leo edito desde celular nombre, marca, categoria, cantidad, unidad e imagen.
  - Confirmacion Firestore: `nombre=Clight naranja dulce prueba`, `marca=Mondelez prueba`, `categoria=Polvo para preparar bebida analcoholica artificial dietetica prueba`, `cantidad=123`, `unidad=litro`.
  - Confirmacion imagen: el producto mantiene imagen remota de Open Food Facts y `fotoFuente=api`.
  - Observacion tecnica: no aparece campo `gramosOLitros` en el documento de producto remoto; revisar si ese campo solo existe en Lista Justa o si falta persistirlo en Mis Productos.
- [x] Celular -> Firebase: restaurar datos desde API detectado y corregido parcialmente.
  - Producto probado: `Clight naranja dulce`, codigo `7622201703141`.
  - Accion: Leo uso el boton `Restaurar datos desde la API` desde celular.
  - Confirmacion Firestore antes de la correccion: nombre, marca y categoria volvieron a los valores API, pero `cantidad=123` y `unidad=litro` quedaron con los valores editados manualmente.
  - Causa detectada: `InfoProducto.restaurarDesdeApi()` no enviaba `cantidad` ni `unidad` al store.
  - Segunda causa detectada: `OpenFoodFactsService` no parseaba `7.5 gr`; devolvia default `1 unidad`.
  - Correccion aplicada: restaurar desde API ahora incluye `cantidad/unidad` y Open Food Facts reconoce `gr`.
  - Validacion tecnica: busqueda directa de `7622201703141` devuelve `cantidad=7.5`, `unidad=gramo`.
- [x] Celular/Web -> Firebase: precio mayorista guardado y reflejado correctamente.
  - Producto probado: `Clight naranja dulce`, codigo `7622201703141`.
  - Accion: Leo agrego precio mayorista en celular y luego confirmo visualmente en la web.
  - Confirmacion Firestore: se guardo un nuevo precio en `Ta-Ta / Enotracalle` con `valor=25 UYU`, `activarPreciosMayoristas=true`.
  - Escalas guardadas: `3 -> 24`, `6 -> 23`, `12 -> 20`.
  - Estado del producto en Firestore durante la prueba: `cantidad=7.5`, `unidad=gramo`, `3 precios` totales.

### Lista Justa

- [x] Web -> Firebase: crear lista vacia desde navegador funcionando.
  - Lista probada: `Prueba Firebase 1`.
  - Confirmacion Firestore: el conteo subio a `3 listasJustas` y la lista aparecio con `0 items`, `fechaActualizacion=2026-05-10T19:15:11.754Z`.
- [ ] Pendiente validar Web -> Celular para lista vacia `Prueba Firebase 1`.
- [x] Celular -> Firebase: crear lista vacia desde celular funcionando.
  - Lista probada: `Prueba 2`.
  - Confirmacion Firestore: la lista aparecio con `0 items`, `fechaActualizacion=2026-05-10T19:15:49.900Z`.
- [ ] Celular -> Firebase: borrar lista desde celular pendiente/requiere correccion.
  - Leo borro una lista vieja desde celular esperando quedar con `2 listasJustas`.
  - Confirmacion Firestore: aun quedan `3 listasJustas`; la lista vieja `546` sigue remota con `1 item`.
  - Lectura tecnica: el alta desde celular sincroniza, pero el borrado de lista desde celular no llego a Firestore o quedo pendiente sin aplicarse.
- [x] Correccion de limpieza fisica remota para eliminaciones.
  - Problema detectado: la app ocultaba listas eliminadas por `configuracion/eliminaciones`, pero podia quedar el documento fisico viejo en `listasJustas`.
  - Correccion aplicada: la limpieza fisica ahora procesa tambien eliminaciones confirmadas/remotas, no solo eliminaciones pendientes locales.
  - Verificacion Firestore: `listasJustas` quedo con `2 documentos fisicos` visibles (`Prueba Firebase 1` y `Prueba 2`) y `0 documentos fisicos marcados como eliminados`.
  - Revision cruzada: `productos` y `comercios` tambien fueron comprobados; hay tombstones historicos, pero `0 documentos fisicos marcados como eliminados`.
- [x] Web/Celular -> Firebase: listas con producto manual y producto desde Mis Productos funcionando.
  - `Prueba Firebase 1`: quedo con `2 items`, `Jugo` manual y `Coke Original Taste` desde Mis Productos.
  - `Prueba 2`: quedo con `2 items`, `Manual Web 1` manual y `Dulce De Leche` desde Mis Productos.
  - Confirmacion Firestore: `listasJustas=2`, ambas listas con `cantidadItems=2`.
  - Consola navegador: sin errores nuevos durante la carga de items.
- [x] Celular/Web -> Firebase: renombrar listas funcionando con correccion aplicada.
  - Deteccion: el cambio desde celular a `Prueba N 1` llego primero a Firestore, pero luego el navegador con datos locales viejos lo piso al editar otra lista.
  - Correccion aplicada: `actualizarNombreLista()` ahora sincroniza solo la lista editada usando `listaId`, no todas las listas locales.
  - Correccion preventiva: `restaurarPreciosOriginales()` tambien sincroniza solo la lista afectada.
  - Estado final verificado en Firestore: `Prueba N 1` y `Prueba N 2`, ambas con `2 items`.
  - Validacion tecnica: `npm run lint` sin errores y consola navegador sin errores nuevos.
- [x] Celular -> Firebase: edicion de items dentro de lista funcionando.
  - Lista probada: `N 1`.
  - Accion: Leo edito el item manual `Jugo` desde celular y lo dejo como `Pan`, precio `89`, moneda `UYU`.
  - Confirmacion Firestore: el item manual quedo con `nombre=Pan`, `precioManual=89`, `moneda=UYU`.
- [x] Celular -> Firebase: editar precio de item desde Mis Productos dentro de lista funcionando.
  - Lista probada: `N 1`.
  - Accion: Leo edito `Coke Original Taste` desde celular y guardo precio `110 UYU`.
  - Confirmacion Firestore: el item quedo con `precioManual=110`, `moneda=UYU`.
- [x] Celular -> Firebase: agregar producto desde Mis Productos y editarlo dentro de lista funcionando.
  - Lista probada: `N 1`.
  - Accion: Leo agrego `Dulce De Leche`, codigo `7730105005091`, lo edito a `200 UYU` y confirmo con check.
  - Confirmacion Firestore: la lista paso a `3 items` y `Dulce De Leche` quedo con `precioManual=200`, `moneda=UYU`.
- [x] Celular -> Firebase: restaurar precio original de item desde Mis Productos funcionando.
  - Lista probada: `N 1`.
  - Accion: Leo uso restaurar sobre `Coke Original Taste`.
  - Confirmacion Firestore: el item quedo con `precioManual=null`, usando el precio base del producto en Mis Productos.
  - Confirmacion producto base: `Coke Original Taste` mantiene precio original `120 UYU` en `users/TOjno4zFqSa5JyVEmGpmMkj8j5k1/productos`.
- [x] Celular -> Firebase: enviar item de Lista Justa a Mesa de trabajo funcionando.
  - Lista probada: `N 1`.
  - Accion: Leo envio `Dulce De Leche` a Mesa de trabajo desde celular.
  - Confirmacion Lista Justa en Firestore: `Dulce De Leche` quedo con `estadoDerivacion=enMesa` y `mesaTrabajoItemId=escaneo_1778627436355_2onks`.
  - Confirmacion Mesa de trabajo en Firestore: `configuracion/sesionEscaneo` contiene `Dulce De Leche`, precio `200`, moneda `UYU`, codigo `7730105005091`.
- [ ] Pendiente validar Celular -> Web.
- [ ] Pendiente validar alta, edicion y borrado contra Firestore.

### Comercios

- [x] Celular -> Firebase: alta de comercio funcionando.
  - Comercio probado: `Tata`.
  - Confirmacion Firestore: se creo el comercio en `users/TOjno4zFqSa5JyVEmGpmMkj8j5k1/comercios`.
  - Datos iniciales guardados: nombre `Tata`, tipo `Supermercado`, calle `Cam Maldonado 5885`, barrio `Bella Italia`, ciudad `Montevideo`.
- [x] Celular -> Firebase: edicion de comercio funcionando.
  - Comercio probado: `Ta-Ta`.
  - Confirmacion Firestore: el comercio se actualizo con nombre `Ta-Ta`, tipo `Hipermercado`, calle `Cam Maldonado 5858`.
  - Observacion tecnica: barrio y ciudad quedaron con punto y espacio final (`Bella Italia. `, `Montevideo. `); conviene normalizar con `trim()`.
- [x] Celular -> Firebase/Web: agregar sucursal corregido.
  - Accion probada: Leo agrego una nueva sucursal a `Ta-Ta`.
  - Resultado inicial Firestore: la sucursal llego, pero se creo como segundo comercio `Ta-Ta` separado en vez de agregarse como nueva direccion del comercio existente.
  - Documento nuevo detectado: `1778628177927z4qmeuh`, nombre `Ta-Ta`, tipo `Hipermercado`, direccion `Enotracalle`, barrio `Centro`, ciudad `Montevideo`.
  - Documento original: `1778627877161gxzfyip`, nombre `Ta-Ta`, direccion `Cam Maldonado 5858`.
  - Correccion aplicada: `DialogoAgregarSucursal` y el flujo de coincidencias ahora usan `agregarDireccion()` sobre el comercio existente en vez de crear otro comercio.
  - Correccion de datos: se fusiono la sucursal duplicada dentro de `Ta-Ta`, se elimino el documento duplicado y se marco su id en eliminaciones remotas.
  - Correccion de UI: el agrupador de comercios ahora cuenta sucursales por cantidad real de `direcciones[]`, no por cantidad de documentos agrupados.
  - Correccion de sincronizacion: la fusion parcial ahora compara `fechaActualizacion`, `actualizadoEn`, `fechaUltimoUso` y `fechaCreacion` para evitar que cache local vieja pise documentos remotos nuevos.
  - Estado final verificado en Firestore: `Ta-Ta`, tipo `Hipermercado`, con 2 sucursales (`Cam Maldonado 5858` y `Enotracalle`).
  - Estado final verificado en navegador: Comercios muestra `Ta-Ta`, `Hipermercado` y `2 sucursales`.
- [x] Web -> Firebase: modal de comercios similares agrega sucursal al comercio existente.
  - Flujo probado con MCP: al crear comercio `Ta-Ta` con direccion temporal, aparecio el modal `Comercios similares encontrados`.
  - Accion: se selecciono `Ta-Ta` dentro del modal como comercio similar.
  - Confirmacion Firestore: no se creo un nuevo documento de comercio; `Ta-Ta` paso temporalmente a `3 direcciones`.
  - Limpieza de prueba: la sucursal temporal `Sucursal Temporal MCP 123` fue eliminada desde la pantalla de edicion.
  - Estado final verificado en Firestore y navegador: `Ta-Ta` vuelve a `2 sucursales`.
- [x] Web -> Firebase: eliminar sucursal funciona y mantiene comercio principal.
  - Flujo probado con MCP: eliminacion de la sucursal temporal desde `Editar comercio`.
  - Confirmacion Firestore: el documento `Ta-Ta` permanece y su arreglo `direcciones[]` vuelve a contener solo `Cam Maldonado 5858` y `Enotracalle`.
- [x] Revision tecnica: eliminar comercio contempla comercios agrupados heredados.
  - Correccion aplicada: la eliminacion de una tarjeta agrupada expande la seleccion a todos los `comerciosOriginales`, evitando dejar ramas antiguas con el mismo nombre.
- [x] Revision tecnica: fusionar sucursales revisado.
  - Flujo revisado: mover precios a la sucursal destino, actualizar `comercioId`, `direccionId`, `comercio`, `direccion` y `nombreCompleto`, y eliminar la sucursal origen.
  - Correccion aplicada: `nombreCompleto` usa formato consistente `Comercio - Direccion`.
  - Nota: no se ejecuto una fusion real sobre `Ta-Ta` para no destruir las dos sucursales reales durante la prueba.
- [ ] Pendiente validar Web -> Celular.
- [ ] Pendiente validar Celular -> Web.
- [ ] Pendiente validar borrado contra Firestore.

### Mesa de trabajo

- [x] Celular -> Firebase/Web: alta de item en Mesa de trabajo funcionando.
  - Producto probado: `9788466371803`.
  - Confirmacion Firestore inicial: item presente en `configuracion/sesionEscaneo` con `nombre=Habla menos, actúa más`, `marca=Brian Tracy`, `origenApi=true`, `fuenteDato=Open Library`, `cantidad=1`, `unidad=unidad`, `precio=500 UYU`.
  - Confirmacion remota inicial: el producto no estaba aun en `users/{uid}/productos`; quedo solo en Mesa de trabajo (comportamiento esperado).
- [x] Celular -> Firebase/Web: edicion completa de item de Mesa funcionando.
  - Accion: Leo edito nombre, marca, cantidad, unidad, precio, comercio/direccion y foto (con recorte) desde celular.
  - Confirmacion Firestore: item actualizado con `nombre=Habla menos, actúa más pruba`, `marca=Brian Tracy prueba`, `cantidad=15`, `unidad=pack`, `precio=500000000 UYU`, `comercio=Ta-Ta`, `direccion=Enotracalle`.
  - Confirmacion foto editada: `imagen` guardada como `base64` (recorte aplicado), largo aproximado `4759`.
- [x] Celular -> Firebase/Web: precio mayorista en Mesa funcionando.
  - Producto probado: `9788466371803`.
  - Confirmacion Firestore: `activarPreciosMayoristas=true` y `escalasPorCantidad` con `2` escalas (`3 -> 85585`, `6 -> 6584`).
  - Confirmacion visual: Leo verifico que en navegador se reflejo correctamente.
- [x] Celular -> Firebase/Web: restaurar datos y restaurar foto en Mesa funcionando.
  - Accion: Leo uso ambos botones de restaurar (datos y foto) sobre el item `9788466371803`.
  - Confirmacion Firestore: nombre/marca/cantidad/unidad volvieron a valores API (`Habla menos, actúa más`, `Brian Tracy`, `1 unidad`), `imagen` volvio a URL API (dejo de ser base64), mayoristas desactivado (`activarPreciosMayoristas=false`, `0` escalas).
  - Validacion de regla funcional: el precio manual no se restaura automaticamente; luego Leo lo cambio y quedo `precio=1000 UYU`.
- [x] Celular -> Firebase: eliminar item de Mesa de trabajo funcionando.
  - Accion: Leo elimino un producto desde Mesa de trabajo en celular.
  - Confirmacion Firestore: `configuracion/sesionEscaneo.items` quedo con `2` items (antes `3`), con `fechaActualizacion=2026-05-13T10:13:39.601Z`.
  - Items remanentes confirmados:
    - `7730105005091` - `Dulce De Leche` - `200 UYU`.
    - `9788466371803` - `Habla menos, actúa más` - `1000 UYU`.
- [x] Web -> Celular: alta de item en Mesa de trabajo reflejada correctamente.
  - Accion: Leo cargo desde navegador el producto `7730306000017`.
  - Confirmacion funcional: Leo confirmo que el item aparecio en celular sin problemas.
  - Confirmacion Firebase: item presente en `configuracion/sesionEscaneo` como `Pulpa de tomate` (`Deambrosi`), `75 UYU`, fuente `Open Food Facts`.
- [x] Celular -> Web: sincronizacion de cambios de Mesa en ambas direcciones (punto 2) validada en pruebas previas.
  - Estado: ya validado durante la secuencia anterior de ediciones/restauraciones en `9788466371803`, con reflejo en navegador.
- [x] Celular -> Firebase: asignacion de comercio en bloque funcionando.
  - Accion: Leo asigno `Ta-Ta` a todos los items de Mesa desde celular.
  - Confirmacion Firestore: `3` items en `sesionEscaneo` con `comercio=Ta-Ta` y `direccion=Cam Maldonado 5858`.
  - Items verificados: `7730105005091`, `9788466371803`, `7730306000017`.
- [x] Reproduccion MCP del flujo de envio y borrado (controlado) funcionando.
  - Flujo ejecutado en MCP para aislar error reportado:
    - Enviar a Mis Productos el libro `9788466371803`.
    - Eliminar `Dulce De Leche` desde la tarjeta.
    - Eliminar `Pulpa de tomate` desde accion de tarjeta.
  - Resultado final Firestore:
    - `configuracion/sesionEscaneo.items=0` (Mesa vacia).
    - `users/{uid}/productos` paso a `4` productos totales.
    - Libro creado en Mis Productos: `Habla menos, actúa más`, `1000 UYU`, comercio `Ta-Ta`, direccion `Cam Maldonado 5858`.
  - Conclusion tecnica: el flujo funcional no falla en backend/sincronizacion al reproducirlo con MCP; el desfasaje observado antes en celular no pudo reproducirse en esta corrida.
- [x] Celular -> Firebase: enviar item completo desde Mesa a Mis Productos funcionando (caso azucar azul).
  - Accion: Leo completo el item `azúcar azul` (solo faltaba comercio) y lo envio desde Mesa en celular.
  - Confirmacion Firestore Mesa: `sesionEscaneo.items=2`, `azúcar azul` ya no figura en Mesa.
  - Confirmacion Firestore Mis Productos: se creo `azúcar azul` (`codigo=7730975890346`) con `marca=bella unión`, `cantidad=1`, `unidad=kilo`.
  - Precio guardado en producto: `45 UYU`, comercio `CH Mercado Prueba`, direccion `Av. Prueba 123`.
- [x] Celular -> Firebase: eliminar item `Arroc` desde tarjeta funcionando.
  - Accion: Leo elimino `Arroc` (codigo `7730114000117`) desde su tarjeta en Mesa.
  - Confirmacion Firestore Mesa: `sesionEscaneo.items=1` y `Arroc` ya no aparece.
  - Item remanente actual en Mesa: `Arroz` (`7730114400016`), `56 UYU`.
- [x] Celular -> Firebase: eliminar item `Arroz` desde selector funcionando.
  - Accion: Leo elimino `Arroz` (codigo `7730114400016`) usando el selector en Mesa.
  - Confirmacion Firestore Mesa: `sesionEscaneo.items=0` y `Arroz` ya no aparece.
  - Estado final actual de Mesa: vacia en Firebase.
- [x] Correccion de desfasaje Web/Celular en Mesa (item fantasma local).
  - Sintoma reportado: Firebase y celular mostraban Mesa vacia, pero en navegador seguia visible `Arroz`.
  - Diagnostico: en la fusion `sesionEscaneo` local/remota, cuando timestamps eran iguales se priorizaba local (`>=`), manteniendo datos stale del navegador.
  - Correccion aplicada: en `fusionarSesionEscaneoConRemoto` ahora local solo gana si `fechaLocal > fechaRemota`; en empate se prioriza remoto (Firestore).
  - Resultado esperado tras recarga/sincronizacion: si Firestore esta vacio, la Mesa web tambien queda vacia.
- [ ] Pendiente validar Web -> Celular.
- [ ] Pendiente validar Celular -> Web.
- [ ] Pendiente validar que items listos, descartados y enviados no reaparezcan.

### Configuracion

- [ ] Pendiente validar tema, moneda, region y perfil entre Web -> Celular.
- [ ] Pendiente validar tema, moneda, region y perfil entre Celular -> Web.

## Pendientes de chequeo detectados desde Resumenes

Esta lista sale de cruzar `Planes/Resumenes` con la verificacion practica Firebase. Sirve para no olvidar capacidades reales de la app que todavia no tienen evidencia completa Web/Celular/Firestore.

### Mis Productos

- [ ] Validar edicion completa de producto entre dispositivos: codigo de barras y campo gramos/litros. Nombre, marca, categoria, cantidad, unidad e imagen ya fueron validados parcialmente con `7622201703141`.
- [ ] Validar cambio, recuperacion y eliminacion de foto de producto, confirmando que Firestore/cache conservan el estado esperado.
- [ ] Validar borrado de producto desde web y desde celular, confirmando que no reaparece al recargar ni al abrir otro dispositivo.
- [ ] Validar historial de precios con varios comercios y sucursales, confirmando que `comercioId`, `direccionId`, `comercio` y `direccion` quedan consistentes.
- [ ] Validar precio mayorista o escalas por cantidad dentro de productos y su efecto posterior en Lista Justa.
- [ ] Validar confirmaciones de precios si el flujo sigue activo: confirmar precio, desconfirmar/reportar si existe, persistencia y aislamiento por usuario.
- [ ] Validar filtros, ordenamientos y busqueda de Mis Productos luego de sincronizar datos remotos.
- [ ] Validar detalle de producto completo: estadisticas, filtros de historial, tarjetas por comercio y consistencia luego de editar/borrar precios.
- [ ] Validar producto creado desde API con imagen remota y producto creado manual sin API, ambos sincronizados Web/Celular.

### Lista Justa

- [x] Validado en `N 1`: restaurar precio de producto existente (`Dulce De Leche`) desde Mis Productos y persistencia en Firebase.
- [x] Validado en `N 1`: edición de precio manual (`Coke`) y alta/edición de item manual (`Habla menos, actúa más`) con persistencia en Firebase.
- [x] Validado en `N 1`: eliminación de item (`Coke`) y envío de item manual (`Pan`) a Mesa; ambos reflejados en Firebase.
- [x] Validado en `N 1`: cambio de comercio actual a `Ta-Ta` sucursal `Enotracalle` reflejado en Firebase (`comercioActual` con `direccionId` y `direccionNombre`).
- [x] Corrección aplicada: fusión de listas remota/local ahora resuelve conflictos por ítem (`actualizadoEn`) en vez de pisar lista completa por timestamp general, para evitar pérdida de cambios parciales entre web/cel.
- [x] Corrección aplicada: marcar `comprado` ahora usa valor explícito del checkbox (true/false) en vez de toggle implícito por estado actual, evitando rebotes a `false` en eventos duplicados.
- [ ] Pendiente observado: revalidar en Android/Web que `Pan` (manual, en Mesa) conserve `comprado=true` luego de marcarlo y sincronizar.
- [ ] Validar Web -> Celular y Celular -> Web para lista vacia, lista con items y lista renombrada sin accion manual.
- [ ] Validar borrado de lista desde web y desde celular, confirmando borrado fisico/remoto o tombstone correcto y que no reaparezca.
- [ ] Validar borrar item individual, comprar/descomprar, cambiar cantidad y cambiar moneda, confirmando sincronizacion en Firestore.
- [ ] Validar filtros de detalle (`pendientes`, `comprados`, `todos`) despues de sincronizar desde otro dispositivo.
- [ ] Validar `comercioActual` de una lista: seleccionar, cambiar, quitar y comprobar persistencia remota.
- [ ] Validar alta desde Mis Productos con seleccion multiple, cantidades independientes y prevencion de duplicados.
- [ ] Validar alta manual con busqueda hibrida local/API, codigo de barras, precio opcional y escalas mayoristas.
- [ ] Validar restaurar precio original y `usaPreciosLocales` en ambos sentidos Web/Celular.
- [ ] Validar derivacion Lista Justa -> Mis Productos cuando el item manual esta completo.
- [ ] Validar derivacion Lista Justa -> Mesa de trabajo y retorno/estado cuando el item sale de Mesa.
- [ ] Validar Lista Justa Inteligente: comercio base, comercios de comparacion, heredar comercio actual, ranking, ahorro estimado y faltantes de precio.
- [ ] Validar banners de precios faltantes y monedas mezcladas luego de sincronizar.

### Comercios

- [ ] Validar Web -> Celular y Celular -> Web para alta, edicion y sucursales sin accion manual.
- [ ] Validar edicion completa de comercio: nombre, tipo/categoria, calle, barrio, ciudad y normalizacion de espacios/puntos.
- [ ] Validar foto de comercio y foto de sucursal: agregar, cambiar, quitar y comprobar persistencia.
- [ ] Validar borrado de una sucursal real con precios vinculados, confirmando que no deja referencias rotas.
- [ ] Validar borrado completo de comercio con productos/precios vinculados, confirmando comportamiento esperado de precios afectados.
- [ ] Validar fusion de sucursales usando comercios descartables, confirmando que los precios se mueven a la sucursal destino y que la origen desaparece.
- [ ] Validar modal de duplicado exacto y modal de similares con casos de comercio nuevo, sucursal nueva y cancelacion.
- [ ] Validar `uso reciente` y ordenamiento por uso, confirmando que no pisa ediciones remotas mas nuevas.
- [ ] Validar tarjetas agrupadas de cadenas con documentos heredados y con comercios nuevos ya normalizados.

### Mesa de trabajo y scanner

- [x] Validado Web -> Cel y Cel -> Web en Mesa para altas desde API con códigos distintos (sin duplicados no intencionales).
- [x] Validado editar item de Mesa desde celular y reflejo en web/Firebase (nombre, precio, comercio, cantidad/unidad).
- [x] Validado restaurar datos de item desde celular: restablece campos de producto y mantiene el precio definido por usuario.
- [x] Validado persistencia de cambios offline tras cierre completo de app y reconexión (sync automática al reabrir).
- [x] Validado recorte/actualización de foto en Mesa con persistencia posterior.
- [x] Validado `Limpiar todo`: mesa vacía persistente en web (sin reaparición tras recarga).
- [ ] Validar Escaneo rapido desde celular: codigo detectado, API/local, edicion en tarjeta, precio, moneda, foto, `Siguiente` e `Ir a mesa`.
- [ ] Validar Rafaga desde celular: varios codigos seguidos, debounce, duplicados, busquedas en background y ausencia de bloqueos.
- [ ] Validar fallback web/manual del scanner si corresponde en navegador.
- [ ] Validar edicion de item en Mesa: nombre, marca, precio, moneda, cantidad, unidad, comercio, direccion y foto.
- [ ] Validar recuperar datos y recuperar foto en tarjeta de escaneo/Mesa cuando el item viene de API o producto existente.
- [ ] Validar asignacion de comercio individual y asignacion en bloque con seleccion multiple.
- [ ] Validar envio parcial a Mis Productos: item nuevo crea producto, item existente agrega precio, sin duplicados.
- [ ] Validar limpiar todo, descartar item y eliminar item, confirmando que no reaparecen por sincronizacion remota.
- [ ] Validar ordenamientos de Mesa luego de sincronizar: menos completo, mas completo, comercio, sin comercio y alfabetico.
- [ ] Validar visibilidad del acceso a Mesa en header/drawer segun haya o no items pendientes.

### Configuracion, cuenta y perfil

- [x] Validado Celular -> Web: cambio de tema (`claro/oscuro`) y moneda manual (`ARS/UYU`) sincronizan correctamente.
- [x] Validado perfil editable (nombre, fecha y foto) con persistencia final en Firebase/Web.
- [ ] Nota: no quedó perfecto en inmediatez visual Web; en algunas pruebas fue necesario refrescar (`F5`) para ver el cambio al instante, aunque el dato sí quedó guardado en Firebase.
- [ ] Validar perfil completo Web/Celular: nombre visible, foto, email, fecha de nacimiento y edad calculada.
- [ ] Validar prioridad de perfil editable sobre datos del proveedor despues de cerrar sesion y volver a entrar.
- [ ] Validar tema claro/oscuro/sistema entre dispositivos y decidir si debe sincronizar por cuenta o quedar local por dispositivo.
- [ ] Validar moneda manual, moneda automatica, region y unidad predeterminada entre dispositivos.
- [ ] Validar que cambiar moneda en un precio puntual no cambie la preferencia global.
- [ ] Validar recuperacion de contrasena, login con correo, login Google y cierre de sesion sin mezcla de datos.
- [ ] Validar usuario invitado: no escribe datos privados en Firestore real y conserva datos solo locales.
- [ ] Validar cambio de cuenta A/B/A en el mismo navegador/celular luego de las ultimas correcciones.
- [ ] Validar estado de sincronizacion visible: ultima sincronizacion, pendientes, errores y reintento manual como plan B.

### Sincronizacion, offline y rendimiento

- [x] Fix aplicado: persistir cola de sincronización pendiente en almacenamiento local (`sincronizacion_pendiente_firestore`) para no perder cambios offline al cerrar/reabrir app.
- [x] Fix aplicado: restaurar cola pendiente al iniciar sesión real y disparar sincronización automática de pendientes restaurados.
- [x] Validado en Android real: cierre total de app offline con cambios pendientes y re-apertura con red activa sincroniza automáticamente sin tocar `Guardar` de nuevo. Evidencia reportada: cambios offline en Mesa (`Coca-Cola`, estado "prueba sin wifi", precio/comercio/cantidad) y ajustes de producto se reflejaron al reconectar.
- [ ] Validar offline -> reconexion por modulo: productos, comercios, listas, mesa y configuracion.
- [ ] Validar dispositivo limpio: borrar cache local y confirmar recuperacion desde Firestore sin boton manual.
- [ ] Validar que un navegador con cache vieja no pise datos nuevos de celular al iniciar sesion.
- [ ] Validar que eliminaciones pendientes se procesen aunque la app se cierre antes de sincronizar.
- [ ] Validar que no queden documentos fisicos basura en `productos`, `comercios`, `listasJustas` ni `configuracion`.
- [ ] Validar consumo Firestore en Spark con dataset real chico, evitando `resource-exhausted`.
- [ ] Validar IndexedDB como cache web principal y que `localStorage` no vuelva a llenarse.
- [ ] Validar Android real con build actual: arranque, login, sincronizacion inicial, uso offline y reconexion.
- [ ] Validar consola sin errores/warnings nuevos en navegador y logs Android sin errores bloqueantes.
