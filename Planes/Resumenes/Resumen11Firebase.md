# RESUMEN 11 - FIREBASE

## PROPÓSITO

Este resumen concentra el estado actual de la integración gradual de Precio Justo con Firebase. La app ya tiene un proyecto Firebase nuevo, SDK instalado e inicialización base de Firebase Auth y Firestore Offline, pero todavía mantiene LocalStorage/Capacitor como persistencia principal y no migra datos reales.

---

## ESTADO ACTUAL

- El plan `PlanSegundoIntentoFirebase.md` quedó ejecutado y marcado como `TERMINADO`.
- El plan `PlanFirebaseBaseNuevoProyecto.md` quedó ejecutado y marcado como `TERMINADO`.
- El plan `PlanAutenticacionFirebase.md` quedó ejecutado y marcado como `TERMINADO`.
- Proyecto Firebase actual: `PrecioJustoPruebas2` (`preciojustopruebas2`).
- Firebase SDK instalado como dependencia del proyecto.
- Firebase Auth quedó preparado con proveedor `Correo electrónico/contraseña`.
- Firebase Auth ahora tiene flujo real de registro, login, recuperación de contraseña, persistencia de sesión y logout.
- Firestore quedó creado en `nam5 (United States)` con reglas iniciales de producción cerradas.
- Firestore Offline quedó inicializado con caché persistente multi-tab cuando el navegador lo permite.
- Storage no se usa todavía.
- La app mantiene el comportamiento visible actual y sigue usando persistencia local.
- El enfoque definido es primero backup privado por usuario; la comunidad queda para una etapa posterior.
- La arquitectura quedó preparada para asignar dueño (`usuarioId`) a los datos cuando exista Firebase Auth.

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

---

## ARCHIVOS PRINCIPALES

### Constantes

- `src/almacenamiento/constantes/ClavesAlmacenamiento.js`
- `src/almacenamiento/constantes/PreparacionFirebase.js`

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

## MODELO FUTURO RECOMENDADO

Estructura privada inicial:

```text
usuarios/{usuarioId}/productos/{productoId}
usuarios/{usuarioId}/productos/{productoId}/precios/{precioId}
usuarios/{usuarioId}/comercios/{comercioId}
usuarios/{usuarioId}/listasJustas/{listaId}
usuarios/{usuarioId}/configuracion/preferencias
usuarios/{usuarioId}/confirmaciones/{confirmacionId}
usuarios/{usuarioId}/fotos/{fotoId}
```

Recomendación práctica:

- Productos: migrar cada `producto_{id}` como documento.
- Precios: pasarlos a subcolección de producto para evitar documentos gigantes.
- Comercios: dejar de depender del bloque completo `comercios`.
- Lista Justa: migrar cada lista como documento separado.
- Sesión de escaneo: mantener local por defecto; sincronizar solo si luego se decide que aporta valor.
- Preferencias: migrar a documento de configuración por usuario.
- Confirmaciones: migrar a documentos separados por usuario/precio.

---

## SEGURIDAD

- `google-services.json` no se considera secreto crítico, pero debe tratarse con cuidado.
- `.env.local` está ignorado por Git y concentra configuración local.
- `DatosLocalesProyectos.md` documenta el proyecto nuevo y deja los proyectos anteriores como históricos.
- La seguridad real dependerá de Firebase Security Rules.
- Regla base actual de Firestore: lectura y escritura denegadas por defecto.
- Regla base futura: cada usuario solo puede leer/escribir sus datos privados.
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
- Se confirmó que los servicios de datos siguen usando `AlmacenamientoService` con adaptadores locales.
- Se detectó CORS en `version.json` contra GitHub Pages durante dev; no pertenece a Firebase.

---

## PRÓXIMO PASO RECOMENDADO

Antes de migrar datos reales a Firestore, conviene cerrar un plan específico de modelo de datos y migración:

- definir documentos definitivos de Firestore;
- definir subcolección de precios;
- diseñar diálogo de migración local a cuenta;
- decidir si sesión de escaneo queda solo local;
- preparar reglas privadas reales de Firestore y Storage;
- corregir el CORS de `version.json` en dev para no contaminar la consola durante pruebas.

Mi recomendación práctica: no migrar datos todavía hasta decidir el modelo final de `productos`, `precios`, `comercios` y `listasJustas`. Firestore es fácil de empezar, pero caro de corregir si el modelo nace con documentos grandes o escrituras en bloque.
