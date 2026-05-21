# PLAN FIRESTORE PRIVADO PREFERENCIAS

## Descripción del plan

Implementar la sincronización privada de preferencias de usuario en Firestore para Precio Justo, manteniendo LocalStorage/Capacitor como fuente visible principal en esta etapa.

## Objetivo principal

- Crear un servicio Firestore privado para preferencias.
- Guardar preferencias en `usuarios/{usuarioId}/configuracion/preferencias`.
- Sincronizar moneda, tema, detección regional y unidad.
- Mantener compatibilidad con el almacenamiento local actual.
- No guardar datos efímeros de sesión.
- Validar privacidad entre usuarios.
- Preparar base para migración guiada futura.

## Reglas del plan

- No reemplazar todavía LocalStorage/Capacitor como fuente visible principal.
- No migrar automáticamente preferencias locales en este plan.
- No tocar confirmaciones, comunidad, Storage ni fotos.
- No relajar `firestore.rules`.
- No escribir en Firestore si no hay usuario Firebase autenticado.
- Mantener criterio local-first: guardar local primero y sincronizar Firestore después.
- Si Firestore falla, la preferencia debe quedar guardada localmente.
- No sincronizar datos temporales de UI ni estado de sesión.

## FASE 1: Revisar modelo y flujo actual de preferencias

### Objetivo

Entender cómo se guardan preferencias antes de conectar Firestore.

- [x] Revisar `Planes/PlanesFuturos/PlanMaestroFirebase.md`.
- [x] Revisar `Planes/Resumenes/ModeloFirestoreMigracion.md`.
- [x] Revisar `Planes/Resumenes/Resumen11Firebase.md`.
- [x] Revisar `src/almacenamiento/servicios/PreferenciasService.js`.
- [x] Revisar `src/almacenamiento/stores/preferenciasStore.js`.
- [x] Revisar `src/pages/ConfiguracionPage.vue`.
- [x] Confirmar campos actuales: `modoMoneda`, `modoTema`, `monedaManual`, `paisDetectado`, `monedaDetectada`, `unidad`.
- [x] Confirmar que las preferencias efímeras de sesión quedan fuera.
- [x] Confirmar que `TemaBoot` sigue pudiendo leer preferencias locales al arrancar.

## FASE 2: Crear servicio Firestore de preferencias

### Objetivo

Agregar una capa específica para preferencias privadas sin SDK directo en componentes ni stores.

- [x] Crear servicio PascalCase para preferencias Firestore.
- [x] Obtener `usuarioId` desde `UsuarioActualService`.
- [x] Crear helper para documento `usuarios/{usuarioId}/configuracion/preferencias`.
- [x] Seleccionar solo campos permitidos por `CAMPOS_MODELO_FIRESTORE.preferencias`.
- [x] Normalizar `modoMoneda` a `automatica` o `manual`.
- [x] Normalizar `modoTema` a `claro`, `oscuro` o `sistema`.
- [x] Normalizar `monedaManual`, `paisDetectado`, `monedaDetectada` y `unidad`.
- [x] Agregar `fechaActualizacion`.
- [x] Manejar resultado omitido cuando no hay usuario Firebase autenticado.
- [x] Devolver estado `local`, `pendiente`, `sincronizado` o `error`.

## FASE 3: Implementar operaciones Firestore de preferencias

### Objetivo

Cubrir lectura y escritura privada de preferencias del usuario.

- [x] Implementar guardar preferencias completas.
- [x] Implementar obtener preferencias del usuario.
- [x] Implementar actualizar preferencias parciales.
- [x] Implementar fallback local si Firestore no está disponible.
- [x] Evitar que un usuario escriba preferencias de otro usuario.
- [x] Evitar guardar campos fuera del modelo permitido.

## FASE 4: Integrar con `PreferenciasService`

### Objetivo

Conectar Firestore como espejo sin romper comportamiento actual.

- [x] Importar servicio Firestore de preferencias en `PreferenciasService`.
- [x] Sincronizar Firestore después de `guardarPreferenciasParciales`.
- [x] Sincronizar Firestore después de cambiar modo moneda.
- [x] Sincronizar Firestore después de cambiar modo tema.
- [x] Sincronizar Firestore después de cambiar moneda manual.
- [x] Sincronizar Firestore después de detección de moneda.
- [x] Sincronizar Firestore después de cambiar unidad.
- [x] Mantener guardado local aunque Firestore falle.
- [x] No mostrar errores invasivos en UI si falla sincronización pero lo local quedó guardado.

## FASE 5: Revisar arranque, tema y sesión

### Objetivo

Evitar que la sincronización rompa el arranque visual.

- [x] Confirmar que `TemaBoot` sigue leyendo preferencias locales sin depender de red.
- [x] Confirmar que `preferenciasStore.inicializar()` sigue funcionando offline.
- [x] Confirmar que cerrar sesión no borra preferencias locales.
- [x] Confirmar que usuario Firebase nuevo puede tener preferencias por defecto.
- [x] Documentar que lectura principal desde Firestore queda para otro plan.

## FASE 6: Validar lectura Firestore sin usarla como fuente principal

### Objetivo

Comprobar lectura Firestore privada sin cambiar aún la fuente visible.

- [x] Implementar lectura controlada de preferencias Firestore.
- [x] Comparar en desarrollo preferencias Firestore contra preferencias locales.
- [x] Confirmar que Firestore Offline devuelve preferencias cacheadas al reconectar.
- [x] Mantener UI leyendo desde LocalStorage/Capacitor en esta etapa.
- [x] Documentar que Firestore queda como espejo validado.

## FASE 7: Preparar migración guiada futura de preferencias

### Objetivo

Dejar base lista para incluir preferencias en migración futura.

- [x] Confirmar que `InventarioMigracionFirebaseService` ya detecta preferencias.
- [x] Definir conteo esperado para preferencias como `0` o `1`.
- [x] Documentar migración por documento fijo `configuracion/preferencias`.
- [x] Documentar reintento sin duplicar documentos.
- [x] No modificar aún la migración guiada para no ampliar alcance.

## FASE 8: Actualizar documentación

### Objetivo

Mantener mapa Firebase y resúmenes alineados.

- [x] Actualizar `Planes/Resumenes/Resumen11Firebase.md`.
- [x] Actualizar `Planes/Resumenes/ModeloFirestoreMigracion.md` con estado de preferencias.
- [x] Actualizar `Planes/PlanesFuturos/PlanMaestroFirebase.md`.
- [x] Documentar que Firestore todavía no es fuente principal de UI.
- [x] Documentar que confirmaciones y Storage siguen pendientes.

## FASE TESTING

### Objetivo

Validar preferencias privadas en Firestore sin romper almacenamiento local.

- [x] Ejecutar `npm run lint`.
- [x] Ejecutar `npm run build`.
- [x] Cambiar modo tema online y verificar documento Firestore.
- [x] Cambiar modo moneda online y verificar documento Firestore.
- [x] Cambiar moneda manual online y verificar documento Firestore.
- [x] Cambiar unidad online y verificar documento Firestore.
- [x] Ejecutar detección automática y verificar `paisDetectado`/`monedaDetectada`.
- [x] Crear preferencias sin usuario Firebase y confirmar que quedan solo locales.
- [x] Cambiar preferencias sin conexión y verificar estado pendiente o sincronización posterior.
- [x] Recuperar conexión y verificar sincronización.
- [x] Verificar que usuario A no puede leer ni escribir preferencias del usuario B.
- [x] Verificar que usuario sin sesión no puede leer ni escribir preferencias.
- [x] Confirmar que `TemaBoot` no queda bloqueado por Firestore.
- [x] Confirmar que LocalStorage/Capacitor conserva preferencias.
- [x] Confirmar que productos, precios, comercios y listas siguen sincronizando como antes.
- [x] Revisar `git diff --check`.

## Progreso del plan

- [x] Fase 1: Revisar modelo y flujo actual de preferencias
- [x] Fase 2: Crear servicio Firestore de preferencias
- [x] Fase 3: Implementar operaciones Firestore de preferencias
- [x] Fase 4: Integrar con `PreferenciasService`
- [x] Fase 5: Revisar arranque, tema y sesión
- [x] Fase 6: Validar lectura Firestore sin usarla como fuente principal
- [x] Fase 7: Preparar migración guiada futura de preferencias
- [x] Fase 8: Actualizar documentación
- [x] Fase Testing

Fecha de creación: 20 de Mayo 2026
Fecha de última actualización: 20 de Mayo 2026
Estado: TERMINADO

## Resultado de ejecución

- Servicio creado: `src/almacenamiento/servicios/FirestorePreferenciasService.js`.
- `PreferenciasService` mantiene guardado local primero y sincroniza Firestore como espejo privado después.
- Se agregó estado de sincronización (`local`, `pendiente`, `sincronizado`, `error`) sin romper flujo local.
- Se agregó lectura controlada y diagnóstico local/Firestore en desarrollo.
- `ConfiguracionPage` reporta diagnóstico en consola dev para comparar local vs Firestore.
- `TemaBoot` sigue tomando preferencias locales en arranque.

## Resultado de pruebas

- `npm run lint`: correcto.
- `npm run build`: correcto.
- MCP Browser: sin sesión Firebase, guardado de preferencias queda en `local` y no intenta escritura remota.
- MCP Browser: con usuario Firebase, preferencias se escriben en `usuarios/{usuarioId}/configuracion/preferencias`.
- MCP Browser: validada whitelist de campos permitidos y normalización (`USD`, modos válidos, `fechaActualizacion`).
- MCP Browser: validado escenario offline con estado `pendiente` y sincronización al reconectar.
- MCP Browser: usuario B recibe `permission-denied` al intentar leer preferencias de usuario A.
- MCP Browser: usuario sin sesión no puede leer ni escribir preferencias en Firestore.
- MCP Browser: `TemaBoot` aplica tema local después de recarga.
- MCP Browser: productos, comercios y listas siguen operativos y sin regresión funcional visible.
- `git diff --check`: sin errores.

Nota conocida no relacionada: CORS de `version.json` en desarrollo.
