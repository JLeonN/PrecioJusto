# RESUMEN 11 - FIREBASE

## PROPÓSITO

Este resumen concentra el estado actual de la integración gradual de Precio Justo con Firebase. La app ya tiene un proyecto Firebase nuevo, SDK instalado e inicialización base de Firebase Auth y Firestore Offline, pero todavía mantiene LocalStorage/Capacitor como persistencia principal y no migra datos reales.

---

## ESTADO ACTUAL

- El plan `PlanSegundoIntentoFirebase.md` quedó ejecutado y marcado como `TERMINADO`.
- El plan `PlanFirebaseBaseNuevoProyecto.md` quedó ejecutado y marcado como `TERMINADO`.
- El plan `PlanAutenticacionFirebase.md` quedó ejecutado y marcado como `TERMINADO`.
- El plan `PlanModeloFirestoreYMigracion.md` quedó ejecutado y marcado como `TERMINADO`.
- El plan `PlanFirestorePrivadoProductos.md` quedó ejecutado y marcado como `TERMINADO`.
- El plan `PlanReglasFirestoreVersionadas.md` quedó ejecutado y marcado como `TERMINADO`.
- El plan `PlanFirestorePrivadoComercios.md` quedó ejecutado y marcado como `TERMINADO`.
- El plan `PlanMigracionLocalGuiadaFirebase.md` quedó ejecutado y marcado como `TERMINADO`.
- El plan `PlanFirestorePrivadoListasJustas.md` quedó ejecutado y marcado como `TERMINADO`.
- El plan `PlanFirestorePrivadoPreferencias.md` quedó ejecutado y marcado como `TERMINADO`.
- El plan `PlanFirestorePrivadoConfirmaciones.md` quedó ejecutado y marcado como `TERMINADO`.
- Proyecto Firebase actual: `PrecioJustoPruebas2` (`preciojustopruebas2`).
- Firebase SDK instalado como dependencia del proyecto.
- Firebase Auth quedó preparado con proveedor `Correo electrónico/contraseña`.
- Firebase Auth ahora tiene flujo real de registro, login, recuperación de contraseña, persistencia de sesión y logout.
- Firestore quedó creado en `nam5 (United States)` y ahora tiene reglas privadas bajo `usuarios/{usuarioId}`.
- Las reglas Firestore privadas quedaron versionadas en el repositorio con `firestore.rules`.
- Firestore Offline quedó inicializado con caché persistente multi-tab cuando el navegador lo permite.
- Storage no se usa todavía.
- La app mantiene el comportamiento visible actual y sigue usando persistencia local como fuente principal visible.
- Productos y precios ya se sincronizan a Firestore como espejo privado validado cuando hay usuario Firebase autenticado.
- Comercios y direcciones ya se sincronizan a Firestore como espejo privado validado cuando hay usuario Firebase autenticado.
- Lista Justa ya se sincroniza a Firestore como espejo privado validado cuando hay usuario Firebase autenticado.
- Productos, precios, comercios y direcciones ya tienen migración local guiada con backup local previo, estado Firestore y reintento idempotente.
- El enfoque definido es primero backup privado por usuario; la comunidad queda para una etapa posterior.
- La arquitectura quedó preparada para asignar dueño (`usuarioId`) a todos los datos privados.
- El modelo Firestore definitivo queda documentado en `Planes/Resumenes/ModeloFirestoreMigracion.md`.

---

## ADAPTADORES ACTUALES

- Web: `LocalStorageAdapter`
- Android nativo: `CapacitorAdapter`
- Ambos siguen activos y no se eliminan hasta tener migración verificada.
- El prefijo de almacenamiento se centralizó en `ClavesAlmacenamiento.js`.

Claves persistidas actuales:

- `producto_{id}`
- `comercios`
- `lista_justa`
- `preferencias_usuario`
- `sesion_escaneo`
- `confirmaciones_{usuarioId}`
- `contadorGracias`

---

## CAMBIOS REALIZADOS

### Persistencia

- Se removieron escrituras directas a `localStorage` desde páginas/componentes.
- `GraciasPage` ahora usa `ContadorGraciasService`.
- La sesión de escaneo ahora usa `SesionEscaneoService`.
- Los stores ya no acceden directamente al adaptador para la sesión de escaneo.
- `@capacitor/preferences` queda usado únicamente dentro de `CapacitorAdapter`.

### Usuario

- Se creó `UsuarioActualService`.
- El usuario local legacy `user_actual_123` quedó aislado en un único servicio.
- Productos, precios, comercios, listas y preferencias se preparan con `usuarioId`.
- Los stores tienen base para limpiar estado ante futuro cierre de sesión.

### Fotos

- Se agregó/normaliza `fotoFuente` para diferenciar origen:
  - `api`
  - `usuario`
  - `storage` futuro
  - `externa` futuro
- Las fotos actuales siguen funcionando localmente.
- Regla futura: Firestore no debe guardar base64; debe guardar URL o referencia a Storage.

### Migración

- Se creó `InventarioMigracionFirebaseService`.
- Permite leer datos locales actuales por tipo.
- Permite generar un backup local previo antes de una migración real.
- Define conteos útiles para validar antes/después: productos, precios, comercios, direcciones, listas, fotos y confirmaciones.

### Conexión

- Se creó `ConexionService` usando `@capacitor/network`.
- Queda como base para indicadores futuros de offline, sincronizando y error de sincronización.

### Base Firebase

- Se creó el proyecto `PrecioJustoPruebas2` desde Firebase Console.
- Se registró la app web `PrecioJustoWebPruebas2`.
- Se registró la app Android `PrecioJustoAndroidPruebas2` con package `com.preciojusto.app`.
- Se reemplazó `android/app/google-services.json` con la configuración nueva.
- Se agregó `FirebaseBaseService` para centralizar App, Auth y Firestore.
- Se agregó `FirebaseBoot` para verificar inicialización en desarrollo sin leer ni escribir documentos.

### Autenticación Firebase

- Se agregó `AutenticacionFirebaseService` para centralizar Firebase Auth.
- Se agregó `UsuarioStore` con usuario, email, nombre, foto, carga, errores y acciones de sesión.
- Se agregó `UsuarioBoot` para iniciar la escucha de sesión al arrancar la app.
- Se agregó `AutenticacionPage` con ingreso, registro y recuperación de contraseña.
- Las rutas principales ahora requieren sesión y redirigen a `/acceso`.
- `ConfiguracionPage` muestra el estado de cuenta y permite cerrar sesión con confirmación.
- Al cerrar sesión se restaura el usuario local legacy y no se borran datos locales.

### Modelo Firestore y migración

- Se definió el modelo privado bajo `usuarios/{usuarioId}`.
- Productos quedan en `usuarios/{usuarioId}/productos/{productoId}`.
- Precios quedan en subcolección `usuarios/{usuarioId}/productos/{productoId}/precios/{precioId}` para evitar documentos gigantes.
- Comercios quedan en `usuarios/{usuarioId}/comercios/{comercioId}` con direcciones embebidas mientras no superen 50 sucursales.
- Listas Justas quedan en `usuarios/{usuarioId}/listasJustas/{listaId}` con items embebidos hasta 100 items.
- Preferencias quedan en `usuarios/{usuarioId}/configuracion/preferencias`.
- Confirmaciones quedan en `usuarios/{usuarioId}/confirmaciones/{confirmacionId}`.
- Fotos no guardan base64 en Firestore; se guardará URL o ruta Storage cuando exista el plan de Storage.
- `sesion_escaneo`, backups y cola de sincronización quedan locales.
- Se agregaron constantes de rutas, límites y campos del modelo en `PreparacionFirebase.js`.

### Firestore privado de productos

- Se creó `FirestoreProductosService` para escribir y leer productos privados.
- Se creó `FirestorePreciosService` para manejar precios como subcolección del producto.
- Ruta activa de productos: `usuarios/{usuarioId}/productos/{productoId}`.
- Ruta activa de precios: `usuarios/{usuarioId}/productos/{productoId}/precios/{precioId}`.
- `ProductosService` guarda primero en LocalStorage/Capacitor y luego intenta sincronizar Firestore.
- Si no hay usuario Firebase autenticado, la sincronización Firestore se omite y el dato queda local.
- Si Firestore queda pendiente por conexión, la app devuelve estado `pendiente` con timeout controlado para no trabar la UI.
- `productosStore` expone estado de sincronización y `MisProductosPage` muestra un aviso cuando hay error.
- Firestore no guarda imágenes base64; las fotos locales siguen locales hasta el plan de Storage.
- Firestore todavía no es fuente principal de UI; queda como espejo privado de productos/precios.
- No se escriben comercios, listas, preferencias, fotos, comunidad ni Storage en esta fase.

### Reglas Firestore versionadas

- Se agregó `firestore.rules` como fuente versionada local de reglas Firestore.
- Se agregó `firebase.json` mínimo apuntando a `firestore.rules`.
- La configuración local no incluye projectId, credenciales ni tokens.
- Las reglas mantienen `rules_version = '2';`, `estaAutenticado()` y `esDueno(usuarioId)`.
- El acceso queda permitido solo bajo `usuarios/{usuarioId}` cuando `request.auth.uid == usuarioId`.
- Todas las subcolecciones privadas heredan la misma condición de dueño.
- Toda ruta fuera de `usuarios/{usuarioId}` queda denegada explícitamente.
- Firebase Console y el repo quedaron alineados en criterio de seguridad; la Console no conserva los comentarios locales.
- No se hizo deploy automático. Comando manual futuro: `firebase deploy --only firestore:rules`.
- Comercios, listas y preferencias deberán reutilizar `esDueno(usuarioId)` cuando se agreguen.
- Comunidad pública y Storage de fotos requieren planes y reglas separadas.

### Firestore privado de comercios

- Se creó `FirestoreComerciosService` para escribir y leer comercios privados.
- Ruta activa de comercios: `usuarios/{usuarioId}/comercios/{comercioId}`.
- Las direcciones quedan embebidas dentro del documento de comercio mientras respeten el límite del modelo.
- `ComerciosService` guarda primero en LocalStorage/Capacitor y luego intenta sincronizar Firestore.
- Si no hay usuario Firebase autenticado, la sincronización Firestore se omite y el comercio queda local.
- Si Firestore queda pendiente por conexión, la app devuelve estado `pendiente` con timeout controlado.
- La eliminación local de comercio marca `eliminado: true` en Firestore.
- Firestore no guarda fotos base64 de comercios ni direcciones; Storage sigue pendiente.
- Firestore todavía no es fuente principal de UI; queda como espejo privado de comercios/direcciones.
- No se agregaron referencias Firestore obligatorias desde precios a comercios; precios siguen guardando `comercioId` y `direccionId`.

### Migración local guiada

- Se creó `MigracionLocalFirebaseService` para centralizar inventario, backup, confirmación, migración, validación y reintentos.
- El estado de migración se guarda en `usuarios/{usuarioId}/configuracion/migracionLocal`.
- Estados definidos: `sinIniciar`, `inventariado`, `backupCreado`, `enProceso`, `parcial`, `completada`, `error`.
- El backup local queda bajo `backupMigracionFirebase_{fecha}` y no se borra al terminar.
- La cola local de reintentos queda bajo `colaSincronizacion_migracionFirebase`.
- La migración usa los mismos IDs locales para productos, precios, comercios y direcciones, por lo que el reintento no duplica documentos.
- Si no hay usuario Firebase autenticado, la migración queda bloqueada.
- Si no hay conexión, el flujo queda `parcial`, registra cola local y permite reintentar.
- Firestore sigue sin ser fuente principal de UI; la app continúa leyendo datos visibles desde LocalStorage/Capacitor.
- Listas, preferencias, confirmaciones, comunidad, Storage y fotos base64 quedan fuera de esta migración.

### Firestore privado de Lista Justa

- Se creó `FirestoreListasJustasService` para escribir y leer listas privadas.
- Ruta activa de listas: `usuarios/{usuarioId}/listasJustas/{listaId}`.
- Los items quedan embebidos dentro del documento de lista mientras respeten el límite de 100 items del modelo.
- `ListaJustaService` guarda primero en LocalStorage/Capacitor y luego intenta sincronizar Firestore.
- Si no hay usuario Firebase autenticado, la sincronización Firestore se omite y la lista queda local.
- Si Firestore queda pendiente por conexión, la app devuelve estado `pendiente` con timeout controlado.
- La eliminación local de lista marca `eliminado: true` y `estadoGeneral: eliminada` en Firestore.
- Firestore no guarda imágenes base64 de items; Storage sigue pendiente.
- Firestore todavía no es fuente principal de UI; queda como espejo privado de Lista Justa.
- No se agregaron referencias Firestore obligatorias desde items a productos o comercios; los items conservan `productoId`, `comercioActual` y datos visuales.

### Firestore privado de preferencias

- Se creó `FirestorePreferenciasService` para escribir y leer preferencias privadas.
- Ruta activa de preferencias: `usuarios/{usuarioId}/configuracion/preferencias`.
- `PreferenciasService` guarda primero en LocalStorage/Capacitor y luego intenta sincronizar Firestore.
- Si no hay usuario Firebase autenticado, la sincronización Firestore se omite y la preferencia queda local.
- Si Firestore queda pendiente por conexión, la app devuelve estado `pendiente` con timeout controlado.
- Se sincronizan solo campos del modelo (`modoMoneda`, `modoTema`, `monedaManual`, `paisDetectado`, `monedaDetectada`, `unidad`, `fechaActualizacion`).
- Se agregó lectura controlada para comparar local vs Firestore en desarrollo sin cambiar la fuente principal de UI.
- `TemaBoot` sigue leyendo preferencias locales; Firestore permanece como espejo privado en esta etapa.

### Firestore privado de confirmaciones

- Se creó `FirestoreConfirmacionesService` para escribir, leer y borrar confirmaciones privadas.
- Ruta activa de confirmaciones: `usuarios/{usuarioId}/confirmaciones/{confirmacionId}`.
- `ConfirmacionesService` mantiene local-first y luego sincroniza Firestore.
- El `confirmacionId` se deriva de `productoId + precioId` para evitar duplicados por usuario.
- Altas, bajas y limpieza de confirmaciones mantienen el estado local aunque Firestore falle.
- No se creó colección pública de confirmaciones; sigue todo bajo `usuarios/{usuarioId}`.

---

## ARCHIVOS PRINCIPALES

### Constantes

- `src/almacenamiento/constantes/ClavesAlmacenamiento.js`
- `src/almacenamiento/constantes/PreparacionFirebase.js`
- `Planes/Resumenes/ModeloFirestoreMigracion.md`

### Servicios nuevos

- `src/almacenamiento/servicios/UsuarioActualService.js`
- `src/almacenamiento/servicios/SesionEscaneoService.js`
- `src/almacenamiento/servicios/ContadorGraciasService.js`
- `src/almacenamiento/servicios/ConexionService.js`
- `src/almacenamiento/servicios/InventarioMigracionFirebaseService.js`
- `src/almacenamiento/servicios/MigracionLocalFirebaseService.js`
- `src/almacenamiento/servicios/FirebaseBaseService.js`
- `src/almacenamiento/servicios/AutenticacionFirebaseService.js`
- `src/almacenamiento/servicios/FirestoreListasJustasService.js`
- `src/almacenamiento/servicios/FirestorePreferenciasService.js`
- `src/almacenamiento/servicios/FirestoreConfirmacionesService.js`
- `src/boot/FirebaseBoot.js`
- `src/boot/UsuarioBoot.js`
- `src/almacenamiento/stores/UsuarioStore.js`
- `src/pages/AutenticacionPage.vue`

### Servicios ajustados

- `src/almacenamiento/servicios/ProductosService.js`
- `src/almacenamiento/servicios/ComerciosService.js`
- `src/almacenamiento/servicios/ListaJustaService.js`
- `src/almacenamiento/servicios/PreferenciasService.js`
- `src/almacenamiento/servicios/ConfirmacionesService.js`

---

## MODELO FIRESTORE APROBADO

Estructura privada aprobada:

```text
usuarios/{usuarioId}/productos/{productoId}
usuarios/{usuarioId}/productos/{productoId}/precios/{precioId}
usuarios/{usuarioId}/comercios/{comercioId}
usuarios/{usuarioId}/listasJustas/{listaId}
usuarios/{usuarioId}/configuracion/preferencias
usuarios/{usuarioId}/confirmaciones/{confirmacionId}
usuarios/{usuarioId}/fotos/{fotoId}
usuarios/{usuarioId}/configuracion/migracionLocal
```

Recomendación práctica:

- Productos: migrar cada `producto_{id}` como documento.
- Precios: pasarlos a subcolección de producto para evitar documentos gigantes.
- Comercios: dejar de depender del bloque completo `comercios`.
- Lista Justa: migrar cada lista como documento separado.
- Sesión de escaneo: mantener local por defecto; sincronizar solo si luego se decide que aporta valor.
- Preferencias: migrar a documento de configuración por usuario.
- Confirmaciones: migrar a documentos separados por usuario/precio.
- Reglas privadas: habilitar escrituras solo después de probar `request.auth.uid == usuarioId`.

---

## SEGURIDAD

- `google-services.json` no se considera secreto crítico, pero debe tratarse con cuidado.
- `.env.local` está ignorado por Git y concentra configuración local.
- `DatosLocalesProyectos.md` documenta el proyecto nuevo y deja los proyectos anteriores como históricos.
- La seguridad real dependerá de Firebase Security Rules.
- Regla base actual de Firestore: lectura y escritura denegadas por defecto.
- Regla base activa: cada usuario solo puede leer/escribir sus datos privados bajo `usuarios/{usuarioId}`.
- Storage debe limitar fotos a `usuarios/{usuarioId}/fotos`.

---

## TESTING REALIZADO

- `npm run lint` pasó sin errores.
- `npm run build` pasó correctamente.
- `npm run androidReleaseConSimbolos` pasó correctamente.
- La app cargó en navegador local con MCP Browser.
- Firebase base inicializó con `projectId: preciojustopruebas2`, Auth activo y Firestore Offline activo.
- MCP Browser validó redirección a login sin sesión, registro de usuario, login correcto, contraseña incorrecta con error claro, persistencia tras recarga y logout.
- La red observada mostró llamadas a `identitytoolkit.googleapis.com` para Auth y no mostró escrituras de documentos Firestore.
- MCP Browser ejecutó inventario local con `InventarioMigracionFirebaseService`: el origen probado no tenía productos, precios, comercios, listas, preferencias, confirmaciones ni fotos.
- `npm run lint` validó las constantes nuevas del modelo Firestore.
- `npm run lint` validó los servicios privados de productos/precios.
- `npm run build` validó el bundle con la sincronización Firestore de productos/precios.
- MCP Browser validó escritura online de producto y precio en Firestore.
- MCP Browser validó que una imagen base64 queda local y no se escribe en Firestore.
- MCP Browser validó guardado offline local con estado `pendiente` y sincronización al reconectar.
- MCP Browser validó lectura desde cache Firestore después de recarga online y desconexión controlada.
- MCP Browser validó aislamiento: usuario B y usuario no autenticado reciben `permission-denied` al intentar acceder a datos del usuario A.
- MCP Browser validó que no se crearon documentos en `comercios`, `listas`, `preferencias` ni `fotos`.
- MCP Browser validó reglas versionadas: usuario A pudo leer/escribir su producto, usuario B quedó bloqueado, usuario sin sesión quedó bloqueado y una ruta fuera del modelo privado quedó denegada.
- Se validó `firebase.json` como JSON correcto y sin secretos.
- MCP Browser validó escritura, edición, uso, dirección embebida y eliminación lógica de comercios en Firestore.
- MCP Browser validó que comercio sin usuario Firebase queda solo local.
- MCP Browser validó comercio offline con estado `pendiente` y sincronización al reconectar.
- MCP Browser validó cache offline de comercio.
- MCP Browser validó que fotos base64 de comercios y direcciones no se escriben en Firestore.
- MCP Browser validó que productos/precios siguen sincronizando y conservan `comercioId`/`direccionId`.
- MCP Browser validó bloqueo de migración sin usuario Firebase.
- MCP Browser validó inventario local, backup previo, migración online y documento `configuracion/migracionLocal` con estado `completada`.
- MCP Browser validó migración de producto, precio, comercio y dirección con conteos `1/1/1/1`.
- MCP Browser validó que fotos base64 locales no se guardan como base64 en Firestore durante la migración.
- MCP Browser simuló desconexión: el flujo quedó `parcial`, registró 3 items en cola y luego reintentó online hasta `completada` sin duplicar documentos.
- MCP Browser validó que usuario B recibe `permission-denied` al intentar leer datos migrados del usuario A.
- MCP Browser validó que la tarjeta de configuración muestra inventario, conexión, estado y acciones de backup/migración.
- MCP Browser validó creación, edición de item, marcado como comprado, comercio actual y eliminación lógica de Lista Justa en Firestore.
- MCP Browser validó que Lista Justa sin usuario Firebase queda solo local.
- MCP Browser validó Lista Justa offline con estado `pendiente` y sincronización manual al reconectar.
- MCP Browser validó que usuario B y usuario sin sesión reciben `permission-denied` al intentar leer listas del usuario A.
- MCP Browser validó que imágenes base64 de items no se escriben como base64 en Firestore.
- MCP Browser validó que productos/precios y comercios siguen sincronizando después de integrar Lista Justa.
- MCP Browser validó diagnóstico local/Firestore de preferencias sin sesión: queda en estado `local` y sin escritura remota.
- MCP Browser validó normalización y whitelist del modelo de preferencias Firestore, sin campos extra.
- MCP Browser validó confirmación online en Firestore, prevención de duplicados y eliminación de confirmación sincronizada.
- MCP Browser validó confirmación offline con estado `pendiente` y sincronización al reconectar.
- MCP Browser validó limpieza de confirmaciones y bloqueo `PERMISSION_DENIED` para escritura/lectura ajena y ruta pública.
- MCP Browser validó confirmación sin sesión Firebase con guardado local y sync omitida.
- Se confirmó que los servicios de datos siguen usando `AlmacenamientoService` con adaptadores locales.
- Se detectó CORS en `version.json` contra GitHub Pages durante dev; no pertenece a Firebase.
- Durante la simulación offline se observaron errores `ERR_INTERNET_DISCONNECTED` esperados en consola; no son regresión funcional.

---

## PRÓXIMO PASO RECOMENDADO

Productos, precios, comercios, Lista Justa, preferencias y confirmaciones ya tienen espejo privado validado. El próximo plan debería avanzar con uno de estos caminos:

- Storage de fotos, para subir imágenes base64 locales y guardar solo URLs/rutas en Firestore;
- corrección del CORS de `version.json` en dev para no contaminar la consola durante pruebas.

Mi recomendación práctica: priorizar Storage de fotos y después pasar la lectura principal a Firestore.
