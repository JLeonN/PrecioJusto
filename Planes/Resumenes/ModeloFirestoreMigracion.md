# Modelo Firestore y Migración

## Estado

- Fecha: 2026-05-19.
- Proyecto Firebase: `PrecioJustoPruebas2` (`preciojustopruebas2`).
- Auth: Email/Password operativo.
- Firestore: creado en `nam5`, reglas privadas activas bajo `usuarios/{usuarioId}`.
- Escrituras Firestore desde la app: habilitadas solo para productos y precios privados.
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

## Lista Justa

Documento: `usuarios/{usuarioId}/listasJustas/{listaId}`.

Campos principales:

- `id`, `usuarioId`, `nombre`, `orden`, `estadoGeneral`, `preferenciaPrecioFaltante`.
- `comercioActual`, `configuracionInteligente`, `items`, `metadatos`.
- `fechaCreacion`, `fechaActualizacion`, `fechaUltimoUso`, `eliminado`.

Decisión: los items quedan embebidos al inicio. Límite recomendado: 100 items por lista. Si una lista supera ese límite, el plan posterior debe pasar items a subcolección `items`.

## Preferencias

Documento: `usuarios/{usuarioId}/configuracion/preferencias`.

Campos:

- `usuarioId`, `modoMoneda`, `modoTema`, `monedaManual`, `paisDetectado`, `monedaDetectada`, `unidad`, `fechaActualizacion`.

Decisión: sincronizar moneda, tema y unidad. Preferencias efímeras de sesión no se sincronizan.

## Confirmaciones

Documento: `usuarios/{usuarioId}/confirmaciones/{confirmacionId}`.

Campos:

- `id`, `usuarioId`, `productoId`, `precioId`, `fecha`, `origen`.

Decisión: usar documento por confirmación para evitar arrays crecientes. El `confirmacionId` recomendado es `${productoId}_${precioId}` para prevenir duplicados por usuario.

## Fotos y Storage

Firestore no guarda base64. Guarda `imagenUrl` o `imagenRutaStorage`.

Storage futuro:

```text
usuarios/{usuarioId}/fotos/productos/{productoId}/{fotoId}
usuarios/{usuarioId}/fotos/comercios/{comercioId}/{direccionId}/{fotoId}
usuarios/{usuarioId}/fotos/listas/{listaId}/{itemId}/{fotoId}
```

Decisión: imágenes externas de API quedan como URL externa con `fotoFuente: api` o `externa`. Fotos de usuario en base64 se migran después a Storage; si Storage aumenta riesgo, la primera migración Firestore puede dejar esas fotos locales y registrar pendiente de subida.

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

Orden seguro:

1. Verificar usuario autenticado.
2. Ejecutar inventario local.
3. Crear backup local previo con `InventarioMigracionFirebaseService.crearBackupLocalPrevio()`.
4. Mostrar resumen de cantidades al usuario.
5. Pedir confirmación explícita.
6. Crear `usuarios/{usuarioId}` y `configuracion/migracionLocal` con estado `iniciada`.
7. Migrar productos sin precios.
8. Migrar precios por subcolección.
9. Migrar comercios y conservar IDs locales.
10. Migrar listas y preservar relación con productos.
11. Migrar preferencias.
12. Migrar confirmaciones.
13. Validar cantidades antes/después.
14. Marcar migración como `completada`.

Si falla a mitad, guardar estado `error`, último paso completado y permitir reintento idempotente usando los mismos IDs locales.

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
- `FirestoreComerciosService`
- `FirestoreListasJustasService`
- `FirestorePreferenciasService`
- `FirestoreMigracionService`
- `ColaSincronizacionService`

Orden recomendado actual: comercios, listas, preferencias, migración guiada y recién después Storage/fotos si se decide subir imágenes locales.
