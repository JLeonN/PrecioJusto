# Modelo Firestore y Migración

## Estado

- Fecha: 2026-05-19.
- Proyecto Firebase: `PrecioJustoPruebas2` (`preciojustopruebas2`).
- Auth: Email/Password operativo.
- Firestore: creado en `nam5`, reglas privadas activas bajo `usuarios/{usuarioId}`.
- Escrituras Firestore desde la app: habilitadas para productos, precios, comercios, Lista Justa, preferencias y confirmaciones privados.
- Migración guiada: habilitada para productos, precios, comercios, direcciones, listas, preferencias y confirmaciones con backup local previo.
- Storage privado: implementado en código para fotos de productos, comercios, direcciones e items; falta aplicar CORS al bucket real y validar subida real.
- Inventario MCP en navegador local: adaptador `local`, sin productos, precios, comercios, listas, preferencias, confirmaciones ni fotos en ese origen.

## Decisión Principal

El modelo queda privado por usuario bajo `usuarios/{usuarioId}`. Firestore será la fuente principal solo después de migrar y validar cantidades. LocalStorage/Capacitor se conserva como respaldo y para backup previo durante la migración.

## Rutas Privadas

```text
usuarios/{usuarioId}
usuarios/{usuarioId}/productos/{productoId}
usuarios/{usuarioId}/productos/{productoId}/precios/{precioId}
usuarios/{usuarioId}/comercios/{comercioId}
usuarios/{usuarioId}/listasJustas/{listaId}
usuarios/{usuarioId}/mesaTrabajoItems/{itemId}
usuarios/{usuarioId}/configuracion/preferencias
usuarios/{usuarioId}/confirmaciones/{confirmacionId}
usuarios/{usuarioId}/fotos/{fotoId}
usuarios/{usuarioId}/configuracion/migracionLocal
```

## Productos

Documento: `usuarios/{usuarioId}/productos/{productoId}`.

Campos principales:

- `id`, `usuarioId`, `nombre`, `nombreNormalizado`, `marca`, `marcaNormalizada`, `categoria`, `categoriaNormalizada`.
- `codigoBarras`, `cantidad`, `unidad`.
- `imagenUrl`, `imagenRutaStorage`, `fotoFuente`, `fuenteDato`.
- `precioMejor`, `comercioMejor`, `monedaReferencia`, `diferenciaPrecio`.
- `tendenciaGeneral`, `porcentajeTendencia`, `tieneVentajaPorCantidad`, `tieneEscalasSospechosas`.
- `fechaCreacion`, `fechaActualizacion`, `ultimaInteraccion`, `eliminado`.

Decisión: los precios no quedan embebidos en producto. Van a subcolección para evitar documentos gigantes.

Estado de implementación 2026-05-19: productos se guardan primero en almacenamiento local y luego se sincronizan como espejo Firestore privado cuando hay usuario Firebase autenticado.

## Precios

Documento: `usuarios/{usuarioId}/productos/{productoId}/precios/{precioId}`.

Campos principales:

- `id`, `usuarioId`, `productoId`, `valor`, `moneda`.
- `comercioId`, `direccionId`, `comercio`, `direccion`, `nombreCompleto`.
- `fecha`, `confirmaciones`.
- `activarPreciosMayoristas`, `escalasPorCantidad`, `escalasResumen`.
- `tieneEscalaMejora`, `tieneEscalaSospechosa`.
- `origen`, `fechaCreacion`, `fechaActualizacion`, `eliminado`.

Decisión: `precioMejor`, `comercioMejor`, `monedaReferencia` y tendencias pueden persistirse como resumen del producto para lectura rápida, pero deben recalcularse cuando cambia un precio.

Estado de implementación 2026-05-19: precios se escriben en subcolección `precios` del producto y mantienen el historial local existente.

## Comercios

Documento: `usuarios/{usuarioId}/comercios/{comercioId}`.

Campos principales:

- `id`, `usuarioId`, `nombre`, `nombreNormalizado`, `tipo`.
- `direcciones` como arreglo embebido mientras no supere 50 sucursales.
- `fotoUrl`, `fotoRutaStorage`, `fotoFuente`.
- `fechaCreacion`, `fechaActualizacion`, `fechaUltimoUso`, `cantidadUsos`, `eliminado`.

Dirección embebida:

- `id`, `calle`, `barrio`, `ciudad`, `nombreCompleto`.
- `fotoUrl`, `fotoRutaStorage`, `fotoFuente`.
- `fechaCreacion`, `fechaActualizacion`, `fechaUltimoUso`, `eliminado`.

Decisión: conservar `comercioId` y `direccionId` en precios. Si un comercio cambia de nombre, los precios mantienen snapshot textual (`comercio`, `direccion`, `nombreCompleto`) para compatibilidad visual y los IDs para relación real.

Estado de implementación 2026-05-20: comercios se guardan primero en almacenamiento local y luego se sincronizan como espejo Firestore privado. Las direcciones se mantienen embebidas en el documento de comercio. Las fotos base64 siguen locales y no se escriben en Firestore.

## Lista Justa

Documento: `usuarios/{usuarioId}/listasJustas/{listaId}`.

Campos principales:

- `id`, `usuarioId`, `nombre`, `orden`, `estadoGeneral`, `preferenciaPrecioFaltante`.
- `comercioActual`, `configuracionInteligente`, `items`, `metadatos`.
- `fechaCreacion`, `fechaActualizacion`, `fechaUltimoUso`, `eliminado`.

Decisión: los items quedan embebidos al inicio. Límite recomendado: 100 items por lista. Si una lista supera ese límite, el plan posterior debe pasar items a subcolección `items`.

Estado de implementación 2026-05-20: Lista Justa se guarda primero en almacenamiento local y luego se sincroniza como espejo Firestore privado. Los items se mantienen embebidos, conservan `productoId`, datos de comercio y estado de compra. Las imágenes base64 de items siguen locales y no se escriben en Firestore.

## Preferencias

Documento: `usuarios/{usuarioId}/configuracion/preferencias`.

Campos:

- `usuarioId`, `modoMoneda`, `modoTema`, `monedaManual`, `paisDetectado`, `monedaDetectada`, `unidad`, `fechaActualizacion`.

Decisión: sincronizar moneda, tema y unidad. Preferencias efímeras de sesión no se sincronizan.
Estado de implementación 2026-05-20: `PreferenciasService` guarda primero en almacenamiento local y luego sincroniza como espejo Firestore privado mediante `FirestorePreferenciasService`. Si no hay sesión Firebase o falla Firestore, la preferencia queda guardada localmente y el estado de sincronización queda en `local`, `pendiente` o `error` sin bloquear la UI.

## Mesa de Trabajo

Documento: `usuarios/{usuarioId}/mesaTrabajoItems/{itemId}`.

Campos:

- `id`, `usuarioId`, `codigoBarras`, `nombre`, `marca`, `cantidad`, `unidad`.
- `precio`, `moneda`, `comercio`, `productoExistenteId`, `origenListaJusta`.
- `imagenUrl`, `imagenRutaStorage`, `fotoFuente` (solo compatibilidad; sin subida nueva en este plan).
- `activarPreciosMayoristas`, `escalasPorCantidad`, `sinCoincidencia`.
- `datosOriginales`, `fechaCreacion`, `fechaActualizacion`.

Decisión: Mesa usa Firestore como fuente principal cuando hay sesión Firebase, y LocalStorage/Capacitor como respaldo temporal para usuario local, fallback y contingencia offline.
Estado de implementación 2026-05-22: existe `FirestoreMesaTrabajoService` y `sesionEscaneoStore` sincroniza automáticamente alta/edición/borrado/limpieza de ítems con esta ruta, manteniendo relación con Lista Justa.

## Confirmaciones

Documento: `usuarios/{usuarioId}/confirmaciones/{confirmacionId}`.

Campos:

- `id`, `usuarioId`, `productoId`, `precioId`, `fecha`, `origen`.

Decisión: usar documento por confirmación para evitar arrays crecientes. El `confirmacionId` recomendado es `${productoId}_${precioId}` para prevenir duplicados por usuario.
Estado de implementación 2026-05-21: `ConfirmacionesService` guarda primero en almacenamiento local y luego sincroniza como espejo Firestore privado mediante `FirestoreConfirmacionesService`. Las altas, bajas y limpiezas mantienen el flujo local aunque Firestore falle.

## Fotos y Storage

Firestore no guarda base64. Guarda `imagenUrl`/`fotoUrl` y `imagenRutaStorage`/`fotoRutaStorage`.

Storage privado implementado:

```text
usuarios/{usuarioId}/fotos/productos/productos-{productoId}.{extension}
usuarios/{usuarioId}/fotos/comercios/comercios-{comercioId}.{extension}
usuarios/{usuarioId}/fotos/direcciones/direcciones-{comercioId}-{direccionId}.{extension}
usuarios/{usuarioId}/fotos/listas/listas-{listaId}-{itemId}.{extension}
```

Decisión: imágenes externas de API quedan como URL externa con `fotoFuente: api` o `externa`. Fotos de usuario en base64 se suben a Storage cuando existe usuario Firebase y conexión; si falla, se conserva la foto local y queda pendiente de reintento.

Estado de implementación 2026-05-22:

- `FirebaseStorageFotosService` sube, obtiene URL de descarga, valida MIME/tamaño y borra fotos privadas.
- `FotosPendientesStorageService` reintenta fotos pendientes al iniciar, recuperar conexión o volver la app a primer plano.
- `FuentePrincipalFirestoreService` reconstruye `imagen` y `foto` desde URL Storage para compatibilidad visual de la UI.
- `storage.rules` protege `usuarios/{usuarioId}/fotos/{archivo=**}` con usuario autenticado, archivos `image/*` y máximo 5 MB.
- `FirebaseStorageCors.json` queda versionado para aplicar CORS de desarrollo al bucket real.
- Pendiente externo: aplicar CORS con herramienta de Google y validar subida real desde navegador/Android.

## Datos Solo Locales

- `sesion_escaneo`: queda local por defecto.
- Backups de migración: quedan locales.
- Cola de sincronización: queda local hasta que se implemente el servicio.
- Estado temporal de UI y formularios: local/reactivo.

## Reglas Firestore Propuestas

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function estaAutenticado() {
      return request.auth != null;
    }
    function esDueno(usuarioId) {
      return estaAutenticado() && request.auth.uid == usuarioId;
    }
    match /usuarios/{usuarioId} {
      allow read, write: if esDueno(usuarioId);
      match /{documento=**} {
        allow read, write: if esDueno(usuarioId);
      }
    }
    match /{documento=**} {
      allow read, write: if false;
    }
  }
}
```

Estas reglas ya fueron aplicadas en Firebase Console y probadas con usuario A, usuario B y usuario sin sesión.

## Índices Recomendados

- `productos`: `fechaActualizacion desc`, `nombreNormalizado asc`, `codigoBarras asc`, `ultimaInteraccion desc`.
- `precios`: `fecha desc`, `comercioId asc + direccionId asc + fecha desc`, `moneda asc + valor asc`.
- `comercios`: `nombreNormalizado asc`, `fechaUltimoUso desc`.
- `listasJustas`: `fechaUltimoUso desc`, `orden asc`.
- `confirmaciones`: `precioId asc`, `productoId asc`.

Recomendación práctica: crear índices solo cuando una consulta real los pida o cuando el siguiente plan defina queries concretas.

## Migración Local a Firestore

Estado de implementación 2026-05-20: existe `MigracionLocalFirebaseService` y panel en `ConfiguracionPage` para ejecutar la migración guiada de productos, precios, comercios y direcciones.

Orden seguro implementado:

1. Verificar usuario autenticado.
2. Ejecutar inventario local.
3. Crear backup local previo con `InventarioMigracionFirebaseService.crearBackupLocalPrevio()`.
4. Mostrar resumen de cantidades al usuario.
5. Pedir confirmación explícita.
6. Crear `usuarios/{usuarioId}/configuracion/migracionLocal`.
7. Migrar productos y precios con `FirestoreProductosService`.
8. Migrar comercios y direcciones con `FirestoreComerciosService`.
9. Registrar cola local bajo `colaSincronizacion_migracionFirebase` si algo falla o no hay conexión.
10. Validar cantidades antes/después.
11. Marcar migración como `completada` solo si los conteos coinciden.

Si falla a mitad, guardar estado `parcial` o `error`, último paso completado y permitir reintento idempotente usando los mismos IDs locales.

Límites actuales:

- LocalStorage/Capacitor sigue como respaldo temporal.
- Las fotos base64 locales no se escriben en Firestore; se intentan subir a Storage y, si falla, quedan locales para reintento.

## Sincronización Inicial

Después de migrar:

- Firestore pasa a fuente principal.
- Firestore Offline mantiene caché persistente.
- Capacitor/LocalStorage queda como respaldo temporal y backup, no como fuente activa.
- Estados visibles: `local`, `pendiente`, `sincronizado`, `error`.
- Al cerrar sesión, se limpia estado reactivo y se conserva backup local.
- En otro dispositivo, se carga desde Firestore y caché offline.
- Conflictos simples se resuelven por `fechaActualizacion`; conflictos de edición del mismo campo requieren aviso al usuario.

## Próximo Plan de Código

Productos y precios ya tienen servicios específicos implementados. Mantener el criterio de crear servicios por dominio antes que un `FirestoreAdapter` genérico:

- `FirestoreProductosService` implementado.
- `FirestorePreciosService` implementado.
- `FirestoreComerciosService` implementado.
- `FirestoreListasJustasService` implementado.
- `FirestorePreferenciasService` implementado.
- `FirestoreConfirmacionesService` implementado.
- `FirestoreMigracionService`
- `ColaSincronizacionService`


## Actualización migración guiada V2

Fecha: 2026-05-21.

La migración guiada ahora incluye Lista Justa, preferencias, confirmaciones y fotos privadas cuando Storage está disponible. `VERSION_MIGRACION_LOCAL_FIREBASE` subió a `migracionLocalFirebaseV2`.

Conteos nuevos del estado:

- `listas`
- `itemsListaJusta`
- `preferencias`
- `confirmaciones`
- `fotosProductos`
- `fotosComercios`
- `fotosListas`

La migración sigue usando backup local previo, cola local de pendientes y escritura idempotente con los mismos IDs. Firestore no pasa a fuente principal todavía y LocalStorage/Capacitor conserva los datos originales.


## Fuente Principal Firestore

Fecha: 2026-05-21.

Firestore pasó a ser la fuente visible principal para productos/precios, comercios/direcciones, Lista Justa, preferencias y confirmaciones cuando existe usuario Firebase autenticado. La decisión queda centralizada en `FuentePrincipalFirestoreService`: usuario local lee LocalStorage/Capacitor, usuario Firebase intenta Firestore primero y usa cache offline cuando no hay conexión.

LocalStorage/Capacitor se conserva como respaldo temporal y no se sobrescribe automáticamente al hidratar desde Firestore. Si Firestore está vacío o falla y existen datos locales, la app muestra respaldo local con estado `fallbackLocal`. Las escrituras siguen local-first y luego sincronizan Firestore para no romper flujos existentes.

`ConfiguracionPage` muestra la fuente activa por dominio y los stores privados se limpian al cambiar usuario o cerrar sesión para evitar mezcla visual de datos.
