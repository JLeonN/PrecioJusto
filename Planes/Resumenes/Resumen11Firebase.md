# RESUMEN 11 - FIREBASE

## PROPÓSITO

Este resumen concentra el estado actual de la preparación de Precio Justo para una futura integración con Firebase. La app todavía no usa Firebase SDK en producción, pero ya quedó ordenada para que la llegada de Firebase Auth, Firestore Offline y Firebase Storage sea gradual y sin pérdida de datos locales.

---

## ESTADO ACTUAL

- El plan `PlanSegundoIntentoFirebase.md` quedó ejecutado y marcado como `TERMINADO`.
- No se instaló Firebase SDK.
- No se conectó Firestore, Auth ni Storage.
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
- La seguridad real dependerá de Firebase Security Rules.
- Regla base futura: cada usuario solo puede leer/escribir sus datos privados.
- Storage debe limitar fotos a `usuarios/{usuarioId}/fotos`.

---

## TESTING REALIZADO

- `npm run lint` pasó sin errores.
- `npm run build` pasó correctamente.
- `npm run androidReleaseConSimbolos` pasó correctamente.
- La app cargó en navegador local con MCP Browser.
- Se detectó CORS en `version.json` contra GitHub Pages durante dev; no pertenece a Firebase.

---

## PRÓXIMO PASO RECOMENDADO

Antes de implementar Firebase real, conviene cerrar un plan específico de modelo de datos y migración:

- definir documentos definitivos de Firestore;
- definir subcolección de precios;
- diseñar diálogo de migración local a cuenta;
- decidir si sesión de escaneo queda solo local;
- preparar reglas de Firestore y Storage;
- corregir el CORS de `version.json` en dev para no contaminar la consola durante pruebas.

Mi recomendación práctica: no instalar Firebase todavía hasta decidir el modelo final de `productos`, `precios`, `comercios` y `listasJustas`. Firestore es fácil de empezar, pero caro de corregir si el modelo nace con documentos grandes o escrituras en bloque.
