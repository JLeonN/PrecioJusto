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
- Proyecto Firebase actual: `PrecioJustoPruebas2` (`preciojustopruebas2`).
- Firebase SDK instalado como dependencia del proyecto.
- Firebase Auth quedó preparado con proveedor `Correo electrónico/contraseña`.
- Firebase Auth ahora tiene flujo real de registro, login, recuperación de contraseña, persistencia de sesión y logout.
- Firestore quedó creado en `nam5 (United States)` y ahora tiene reglas privadas bajo `usuarios/{usuarioId}`.
- Firestore Offline quedó inicializado con caché persistente multi-tab cuando el navegador lo permite.
- Storage no se usa todavía.
- La app mantiene el comportamiento visible actual y sigue usando persistencia local como fuente principal visible.
- Productos y precios ya se sincronizan a Firestore como espejo privado validado cuando hay usuario Firebase autenticado.
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
- `src/almacenamiento/servicios/FirebaseBaseService.js`
- `src/almacenamiento/servicios/AutenticacionFirebaseService.js`
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
- Se confirmó que los servicios de datos siguen usando `AlmacenamientoService` con adaptadores locales.
- Se detectó CORS en `version.json` contra GitHub Pages durante dev; no pertenece a Firebase.

---

## PRÓXIMO PASO RECOMENDADO

Productos y precios ya tienen espejo privado validado. El próximo plan debería avanzar con uno de estos caminos:

- comercios privados en Firestore, para que los precios puedan referenciar comercios reales sincronizados;
- migración local guiada de productos/precios, con backup previo, conteos y reintentos;
- Storage de fotos, para subir imágenes base64 locales y guardar solo URLs/rutas en Firestore;
- corrección del CORS de `version.json` en dev para no contaminar la consola durante pruebas.

Mi recomendación práctica: seguir con comercios privados antes de la migración completa, porque precios ya dependen de `comercioId` y `direccionId`.
