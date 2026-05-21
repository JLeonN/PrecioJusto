# PLAN FIRESTORE PRIVADO CONFIRMACIONES

## Descripción del plan

Implementar la sincronización privada de confirmaciones de precios en Firestore para Precio Justo, manteniendo LocalStorage/Capacitor como fuente visible principal.

## Objetivo principal

- Crear un servicio Firestore privado para confirmaciones.
- Guardar confirmaciones en `usuarios/{usuarioId}/confirmaciones/{confirmacionId}`.
- Evitar confirmaciones duplicadas por usuario y precio.
- Mantener compatibilidad con el flujo local actual.
- Sincronizar altas, bajas y limpieza de confirmaciones.
- Validar privacidad entre usuarios.
- Preparar camino para comunidad y conteos globales en planes posteriores.

## FASE 1: Revisar valor y alcance de confirmaciones privadas

- [x] Revisar `Planes/PlanesFuturos/PlanMaestroFirebase.md`.
- [x] Revisar `Planes/Resumenes/ModeloFirestoreMigracion.md`.
- [x] Revisar `Planes/Resumenes/Resumen11Firebase.md`.
- [x] Revisar `src/almacenamiento/servicios/ConfirmacionesService.js`.
- [x] Revisar `src/almacenamiento/stores/confirmacionesStore.js`.
- [x] Revisar `src/pages/DetalleProductoPage.vue`.
- [x] Confirmar alcance privado de historial confirmado por usuario.
- [x] Confirmar que conteos comunitarios quedan fuera.
- [x] Confirmar continuidad offline.

## FASE 2: Crear servicio Firestore de confirmaciones

- [x] Crear servicio PascalCase para confirmaciones Firestore.
- [x] Obtener `usuarioId` desde `UsuarioActualService`.
- [x] Crear helper para `usuarios/{usuarioId}/confirmaciones`.
- [x] Crear helper para `usuarios/{usuarioId}/confirmaciones/{confirmacionId}`.
- [x] Normalizar `confirmacionId`.
- [x] Restringir a `CAMPOS_MODELO_FIRESTORE.confirmacion`.
- [x] Normalizar `id`, `usuarioId`, `productoId`, `precioId`, `fecha`, `origen`.
- [x] Manejar resultado omitido sin sesión Firebase.
- [x] Devolver estado `local`, `pendiente`, `sincronizado` o `error`.

## FASE 3: Implementar operaciones Firestore de confirmaciones

- [x] Implementar guardar confirmación privada.
- [x] Implementar obtener confirmaciones del usuario como `Set`.
- [x] Implementar verificar confirmación por precio.
- [x] Implementar eliminar confirmación privada.
- [x] Implementar limpiar confirmaciones privadas.
- [x] Evitar duplicados por `confirmacionId`.
- [x] Validar aislamiento por usuario.
- [x] Evitar campos fuera de modelo.

## FASE 4: Integrar con `ConfirmacionesService`

- [x] Importar servicio Firestore en `ConfirmacionesService`.
- [x] Sincronizar Firestore después de confirmar localmente.
- [x] Sincronizar Firestore después de eliminar confirmación local.
- [x] Sincronizar Firestore después de limpiar confirmaciones locales.
- [x] Mantener guardado local aunque Firestore falle.
- [x] Evitar errores invasivos en UI cuando falla sync remota.
- [x] Mantener `confirmacionesStore` sin SDK Firebase directo.
- [x] Mantener actualización de producto en `productosStore` como antes.

## FASE 5: Revisar contadores y límites del alcance

- [x] Confirmar que `precio.confirmaciones` sigue siendo dato local/espejo privado.
- [x] Confirmar que no hay conteo global entre usuarios.
- [x] Documentar que conteo comunitario real va en otro plan.
- [x] Confirmar que no se escribe fuera de `usuarios/{usuarioId}`.
- [x] Confirmar que no se agregan índices comunitarios en esta fase.
- [x] Confirmar base lista para migración comunitaria futura.

## FASE 6: Preparar migración guiada futura de confirmaciones

- [x] Confirmar detección local de `confirmaciones_{usuarioId}` en inventario.
- [x] Definir conversión de `preciosConfirmados` locales a documentos privados.
- [x] No ejecutar migración automática en esta fase.
- [x] Registrar notas para ampliar `MigracionLocalFirebaseService` en plan posterior.
- [x] Confirmar reintento sin duplicados por ID determinístico.
- [x] Mantener requisito de backup local previo.

## FASE 7: Actualizar documentación

- [x] Actualizar `Planes/Resumenes/Resumen11Firebase.md`.
- [x] Actualizar `Planes/Resumenes/ModeloFirestoreMigracion.md`.
- [x] Actualizar `Planes/PlanesFuturos/PlanMaestroFirebase.md`.
- [x] Documentar pendientes de comunidad, Storage/fotos y fuente principal Firestore.

## FASE TESTING

- [x] Ejecutar lint del proyecto.
- [x] Iniciar sesión con usuario Firebase.
- [x] Confirmar precio y verificar guardado local.
- [x] Verificar documento Firestore en `usuarios/{usuarioId}/confirmaciones/{confirmacionId}`.
- [x] Reintentar confirmación del mismo precio y verificar que no duplica.
- [x] Eliminar confirmación y verificar borrado local y Firestore.
- [x] Probar sin conexión y validar flujo local.
- [x] Reconectar y validar sincronización pendiente.
- [x] Cerrar sesión y verificar sync omitida.
- [x] Probar dos usuarios y validar bloqueo de lectura/escritura ajena.
- [x] Confirmar que no existe ruta pública de confirmaciones.
- [x] Confirmar que LocalStorage/Capacitor siguen como fuente visible.

## Progreso del plan

- [x] Fase 1: Revisar valor y alcance de confirmaciones privadas
- [x] Fase 2: Crear servicio Firestore de confirmaciones
- [x] Fase 3: Implementar operaciones Firestore de confirmaciones
- [x] Fase 4: Integrar con `ConfirmacionesService`
- [x] Fase 5: Revisar contadores y límites del alcance
- [x] Fase 6: Preparar migración guiada futura de confirmaciones
- [x] Fase 7: Actualizar documentación
- [x] Fase Testing

Fecha de creación: 21 de Mayo 2026
Fecha de última actualización: 21 de Mayo 2026
Estado: TERMINADO

## Resultado de ejecución

- Servicio creado: `src/almacenamiento/servicios/FirestoreConfirmacionesService.js`.
- Integración local-first completada en `ConfirmacionesService` con sync remota y timeout.
- Soporte implementado para alta, baja y limpieza de confirmaciones privadas.
- `confirmacionesStore` ajustado para refrescar `usuarioActualId` desde `UsuarioActualService` antes de operar.
- No se agregó colección pública ni lógica comunitaria.

## Resultado de pruebas

- `npm run lint`: correcto.
- `npm run build`: correcto.
- MCP Browser validó confirmación online con `sincronizado`.
- MCP Browser validó rechazo de duplicado local para mismo `precioId`.
- MCP Browser validó eliminación y limpieza con reflejo en Firestore.
- MCP Browser validó confirmación offline con estado `pendiente` y sincronización al reconectar.
- MCP Browser validó operación sin sesión Firebase con estado `local` (sync omitida).
- MCP Browser validó `PERMISSION_DENIED` para escritura/lectura de confirmaciones ajenas y rutas públicas.
- MCP Browser validó continuidad funcional de productos/comercios/listas en almacenamiento local.
