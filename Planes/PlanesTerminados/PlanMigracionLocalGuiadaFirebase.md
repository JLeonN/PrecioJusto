# PLAN MIGRACIÓN LOCAL GUIADA FIREBASE

## Descripción del plan

Implementar una migración guiada y segura desde el almacenamiento local actual hacia Firestore para los datos que ya tienen espejo privado validado: productos, precios y comercios. La app ya cuenta con Firebase Auth, Firestore Offline, reglas privadas versionadas, `FirestoreProductosService`, `FirestorePreciosService`, `FirestoreComerciosService`, `InventarioMigracionFirebaseService` y `ConexionService`.

Este plan no convierte todavía Firestore en fuente principal de UI. Primero debe crear un flujo controlado con inventario, backup local, confirmación explícita, migración idempotente, conteos de validación y reintentos para operaciones pendientes o fallidas.

## Objetivo principal

- Crear una migración local guiada para productos, precios y comercios.
- Crear backup local obligatorio antes de migrar.
- Mostrar conteos claros antes y después de migrar.
- Guardar estado de migración en Firestore bajo `usuarios/{usuarioId}/configuracion/migracionLocal`.
- Implementar reintentos idempotentes usando los mismos IDs locales.
- Mantener LocalStorage/Capacitor como fuente visible principal durante este plan.
- Evitar pérdida de datos si la migración falla a mitad.
- Dejar preparada la base para migrar listas, preferencias, confirmaciones y fotos en planes posteriores.

## Reglas del plan

- No borrar datos locales en este plan.
- No convertir Firestore en fuente principal de UI en este plan.
- No migrar listas, preferencias, confirmaciones, comunidad ni Storage en este plan.
- No subir fotos base64 a Firestore.
- No ejecutar migración sin usuario Firebase autenticado.
- No ejecutar migración sin backup local previo exitoso.
- No ejecutar migración sin confirmación explícita del usuario.
- Usar IDs locales existentes para que la migración sea idempotente.
- Si una operación falla, registrar el error y permitir reintento sin duplicar documentos.
- Mantener las reglas Firestore actuales sin relajarlas.

## FASE 1: Revisar base existente

### Objetivo

Confirmar qué piezas ya existen y qué falta para migrar sin duplicar trabajo.

- [x] Revisar `Planes/Resumenes/Resumen11Firebase.md`.
- [x] Revisar `Planes/Resumenes/ModeloFirestoreMigracion.md`.
- [x] Revisar `src/almacenamiento/servicios/InventarioMigracionFirebaseService.js`.
- [x] Revisar `src/almacenamiento/servicios/ConexionService.js`.
- [x] Revisar `src/almacenamiento/servicios/FirestoreProductosService.js`.
- [x] Revisar `src/almacenamiento/servicios/FirestorePreciosService.js`.
- [x] Revisar `src/almacenamiento/servicios/FirestoreComerciosService.js`.
- [x] Revisar claves locales en `src/almacenamiento/constantes/ClavesAlmacenamiento.js`.
- [x] Confirmar que productos, precios y comercios ya tienen escritura Firestore validada.
- [x] Confirmar que listas, preferencias, confirmaciones y fotos quedan fuera de esta migración.

## FASE 2: Definir estado de migración

### Objetivo

Crear una estructura clara para saber si la migración está pendiente, iniciada, parcial, completada o con error.

- [x] Definir documento `usuarios/{usuarioId}/configuracion/migracionLocal`.
- [x] Definir estados: `sinIniciar`, `inventariado`, `backupCreado`, `enProceso`, `parcial`, `completada`, `error`.
- [x] Guardar `fechaInicio`, `fechaUltimoIntento`, `fechaFinalizacion` y `versionMigracion`.
- [x] Guardar `adaptadorOrigen` (`local` o `capacitor`).
- [x] Guardar conteos esperados antes de migrar.
- [x] Guardar conteos migrados por tipo.
- [x] Guardar último paso completado.
- [x] Guardar lista resumida de errores por tipo de dato.
- [x] Evitar guardar datos completos del backup en Firestore.

## FASE 3: Crear servicio de migración guiada

### Objetivo

Centralizar el flujo de migración en un servicio propio, sin mezclarlo con stores ni componentes.

- [x] Crear servicio con nombre PascalCase para migración Firebase.
- [x] Obtener usuario actual desde `UsuarioActualService`.
- [x] Bloquear migración si el usuario actual es local legacy.
- [x] Leer inventario con `InventarioMigracionFirebaseService`.
- [x] Crear backup local con `crearBackupLocalPrevio()`.
- [x] Validar que el backup se guardó antes de continuar.
- [x] Preparar conteos esperados de productos, precios, comercios y direcciones.
- [x] Crear o actualizar documento de estado de migración en Firestore.
- [x] Exponer método para iniciar migración.
- [x] Exponer método para reintentar migración.
- [x] Exponer método para obtener estado actual.

## FASE 4: Migrar productos y precios

### Objetivo

Subir productos y sus precios usando los servicios Firestore ya existentes y conservando IDs locales.

- [x] Migrar cada producto local con `FirestoreProductosService`.
- [x] Conservar `producto.id` como ID del documento Firestore.
- [x] Migrar precios como subcolección del producto.
- [x] Conservar `precio.id` como ID del documento Firestore.
- [x] Omitir base64 de imágenes y dejar referencia pendiente para Storage futuro.
- [x] Registrar por producto si migró, quedó pendiente o falló.
- [x] Reintentar producto sin crear duplicados.
- [x] Verificar conteo de productos migrados.
- [x] Verificar conteo de precios migrados.

## FASE 5: Migrar comercios y direcciones

### Objetivo

Subir comercios y direcciones embebidas usando el servicio Firestore ya existente y conservando IDs locales.

- [x] Migrar cada comercio local con `FirestoreComerciosService`.
- [x] Conservar `comercio.id` como ID del documento Firestore.
- [x] Conservar IDs de direcciones embebidas.
- [x] Respetar límite de direcciones embebidas definido en el modelo.
- [x] Omitir fotos base64 de comercios y direcciones.
- [x] Registrar por comercio si migró, quedó pendiente o falló.
- [x] Reintentar comercio sin crear duplicados.
- [x] Verificar conteo de comercios migrados.
- [x] Verificar conteo de direcciones migradas.

## FASE 6: Crear cola local de reintentos

### Objetivo

Registrar operaciones pendientes o fallidas para poder reintentarlas sin perder datos ni duplicar documentos.

- [x] Definir estructura local bajo `PREFIJO_COLA_SINCRONIZACION`.
- [x] Registrar tipo de dato: producto, precio o comercio.
- [x] Registrar acción: crear, actualizar o eliminar.
- [x] Registrar ID local del documento afectado.
- [x] Registrar cantidad de intentos.
- [x] Registrar último error legible.
- [x] Registrar fecha de último intento.
- [x] Implementar reintento manual desde el servicio de migración.
- [x] Preparar base para reintento automático futuro cuando vuelva la conexión.
- [x] Eliminar de la cola solo cuando Firestore confirme escritura o el servicio marque éxito.

## FASE 7: Integrar confirmación en UI

### Objetivo

Dar al usuario control claro antes de migrar datos locales a Firestore.

- [x] Definir dónde se muestra el flujo de migración, preferentemente en configuración.
- [x] Mostrar resumen de inventario local.
- [x] Mostrar advertencia de que se creará backup local previo.
- [x] Mostrar estado de conexión antes de iniciar.
- [x] Pedir confirmación explícita antes de migrar.
- [x] Mostrar progreso por tipo de dato.
- [x] Mostrar resultado final con conteos.
- [x] Mostrar errores reintentables sin borrar datos locales.
- [x] Permitir reintentar si el estado queda `parcial` o `error`.
- [x] No mostrar este flujo si no hay usuario Firebase autenticado.

## FASE 8: Validar conteos y consistencia

### Objetivo

Confirmar que lo local y Firestore coinciden para los datos incluidos en este plan.

- [x] Leer productos Firestore del usuario y comparar contra productos locales.
- [x] Leer precios Firestore por producto y comparar conteos contra precios locales.
- [x] Leer comercios Firestore del usuario y comparar contra comercios locales.
- [x] Comparar direcciones embebidas contra direcciones locales.
- [x] Registrar diferencias detectadas en estado de migración.
- [x] Marcar migración como `completada` solo si los conteos coinciden o las diferencias quedan justificadas.
- [x] No eliminar backup local aunque la migración termine correctamente.

## FASE 9: Documentar resultado y límites

### Objetivo

Dejar claro qué quedó migrado, qué sigue local y qué falta para convertir Firestore en fuente principal.

- [x] Actualizar `Planes/Resumenes/Resumen11Firebase.md`.
- [x] Actualizar `Planes/Resumenes/ModeloFirestoreMigracion.md`.
- [x] Documentar que productos, precios y comercios tienen migración guiada.
- [x] Documentar que listas, preferencias, confirmaciones y fotos siguen pendientes.
- [x] Documentar que Firestore todavía no es fuente principal de UI.
- [x] Documentar cómo reintentar migración parcial.
- [x] Documentar dónde queda el backup local.

## FASE TESTING

### Objetivo

Validar la migración guiada sin pérdida de datos y sin cambiar todavía la fuente principal visible.

- [x] Ejecutar `npm run lint`.
- [x] Ejecutar `npm run build`.
- [x] Ejecutar inventario local y verificar conteos.
- [x] Crear backup local y verificar que queda guardado.
- [x] Intentar migrar sin usuario Firebase y confirmar bloqueo.
- [x] Migrar con usuario Firebase autenticado.
- [x] Verificar documento `configuracion/migracionLocal`.
- [x] Verificar productos migrados en Firestore.
- [x] Verificar precios migrados en subcolecciones.
- [x] Verificar comercios migrados en Firestore.
- [x] Verificar direcciones embebidas migradas.
- [x] Verificar que fotos base64 no se guardan en Firestore.
- [x] Simular fallo o desconexión y confirmar estado `parcial` o `error`.
- [x] Reintentar migración y confirmar que no se duplican documentos.
- [x] Comparar conteos local contra Firestore después del reintento.
- [x] Confirmar que LocalStorage/Capacitor conserva los datos.
- [x] Confirmar que la UI sigue leyendo desde almacenamiento local.
- [x] Confirmar que usuario B no puede leer datos migrados del usuario A.
- [x] Revisar `git diff --check`.

## Progreso del plan

- [x] Fase 1: Revisar base existente
- [x] Fase 2: Definir estado de migración
- [x] Fase 3: Crear servicio de migración guiada
- [x] Fase 4: Migrar productos y precios
- [x] Fase 5: Migrar comercios y direcciones
- [x] Fase 6: Crear cola local de reintentos
- [x] Fase 7: Integrar confirmación en UI
- [x] Fase 8: Validar conteos y consistencia
- [x] Fase 9: Documentar resultado y límites
- [x] Fase Testing

Fecha de creación: 20 de Mayo 2026
Fecha de última actualización: 20 de Mayo 2026
Estado: TERMINADO


## Resultado de ejecución

- Servicio creado: `src/almacenamiento/servicios/MigracionLocalFirebaseService.js`.
- UI integrada en `src/pages/ConfiguracionPage.vue` con inventario, conexión, backup, migración y reintento.
- Estado Firestore: `usuarios/{usuarioId}/configuracion/migracionLocal`.
- Backup local: `backupMigracionFirebase_{fecha}`.
- Cola local: `colaSincronizacion_migracionFirebase`.
- Firestore sigue como espejo/migración; LocalStorage/Capacitor sigue siendo fuente principal visible.

## Resultado de pruebas

- `npm run lint`: correcto.
- `npm run build`: correcto.
- MCP Browser: bloqueo sin usuario Firebase correcto.
- MCP Browser: inventario, backup, migración online y estado `completada` correctos.
- MCP Browser: producto, precio, comercio y dirección migrados con conteos 1/1/1/1.
- MCP Browser: fotos base64 locales no quedaron como base64 en Firestore.
- MCP Browser: desconexión simulada dejó estado `parcial`, cola local de 3 items y reintento online sin duplicados.
- MCP Browser: usuario B recibió `permission-denied` al leer datos del usuario A.
- `git diff --check`: sin errores.

Nota conocida: el CORS de `version.json` en desarrollo y los errores `ERR_INTERNET_DISCONNECTED` de la simulación offline no pertenecen a una regresión de este plan.
