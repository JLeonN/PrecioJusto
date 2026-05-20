# PLAN FIRESTORE PRIVADO COMERCIOS

## Descripción del plan

Implementar la sincronización privada de comercios y sus direcciones/sucursales en Firestore para Precio Justo. La app ya tiene Firebase Auth, Firestore Offline, reglas privadas versionadas y productos/precios sincronizados como espejo Firestore.

Este plan debe conectar `ComerciosService` con Firestore bajo `usuarios/{usuarioId}/comercios/{comercioId}`, manteniendo LocalStorage/Capacitor como fuente visible principal y respaldo temporal. Firestore seguirá siendo espejo validado hasta completar migración, reintentos y lectura principal.

## Objetivo principal

- Crear un servicio Firestore privado para comercios.
- Guardar comercios en `usuarios/{usuarioId}/comercios/{comercioId}`.
- Guardar direcciones como arreglo embebido dentro del comercio mientras no superen el límite definido.
- Mantener compatibilidad con el almacenamiento local actual.
- Evitar guardar fotos base64 en Firestore.
- Validar privacidad entre usuarios con las reglas versionadas actuales.
- Preparar la relación futura entre precios y comercios sincronizados.

## Reglas del plan

- No reemplazar todavía LocalStorage/Capacitor como fuente visible principal.
- No migrar todos los comercios locales automáticamente en este plan.
- No tocar listas, preferencias, confirmaciones, comunidad ni Storage.
- No guardar fotos base64 en Firestore.
- No modificar el modelo Firestore aprobado salvo que se documente una razón concreta.
- No relajar `firestore.rules`.
- No escribir en Firestore si no hay usuario Firebase autenticado.
- Mantener el criterio actual: guardar local primero y sincronizar Firestore después.
- Si Firestore falla, el comercio debe quedar guardado localmente.

## FASE 1: Revisar modelo y flujo actual de comercios

### Objetivo

Entender el estado actual de comercios antes de conectar Firestore.

- [x] Revisar `Planes/Resumenes/ModeloFirestoreMigracion.md`.
- [x] Revisar `Planes/PlanesTerminados/PlanSistemaSucursales.md`.
- [x] Revisar `Planes/PlanesTerminados/PlanTrabajoComercio.md`.
- [x] Revisar `Planes/PlanesTerminados/PlanFotosComercios.md`.
- [x] Revisar `src/almacenamiento/servicios/ComerciosService.js`.
- [x] Revisar `src/almacenamiento/stores/comerciosStore.js`.
- [x] Confirmar campos actuales de comercio.
- [x] Confirmar campos actuales de dirección/sucursal.
- [x] Confirmar cómo se usan `comercioId` y `direccionId` en precios.
- [x] Confirmar que las fotos actuales pueden quedar solo locales en esta etapa.

## FASE 2: Crear servicio Firestore de comercios

### Objetivo

Agregar una capa específica para comercios privados en Firestore sin poner SDK directo en componentes ni stores.

- [x] Crear servicio con nombre PascalCase para comercios Firestore.
- [x] Obtener `usuarioId` desde `UsuarioActualService`.
- [x] Crear helper para colección `usuarios/{usuarioId}/comercios`.
- [x] Crear helper para documento `usuarios/{usuarioId}/comercios/{comercioId}`.
- [x] Normalizar ID de documento evitando barras y valores vacíos.
- [x] Normalizar texto de búsqueda para `nombreNormalizado`.
- [x] Seleccionar solo campos permitidos por `CAMPOS_MODELO_FIRESTORE.comercio`.
- [x] Seleccionar solo campos permitidos por `CAMPOS_MODELO_FIRESTORE.direccion`.
- [x] Evitar guardar `foto` base64 de comercio o dirección.
- [x] Guardar `fotoUrl` o `fotoRutaStorage` solo si ya existen.

## FASE 3: Implementar operaciones Firestore de comercio

### Objetivo

Cubrir las operaciones mínimas necesarias para que el espejo Firestore acompañe al flujo local.

- [x] Implementar guardar comercio completo.
- [x] Implementar obtener comercio por ID.
- [x] Implementar obtener comercios del usuario con límite ordenado por `fechaUltimoUso`.
- [x] Implementar actualizar comercio.
- [x] Implementar eliminación lógica con `eliminado: true`.
- [x] Implementar actualización de direcciones embebidas.
- [x] Implementar actualización de uso (`fechaUltimoUso`, `cantidadUsos`).
- [x] Manejar resultado omitido cuando no hay usuario Firebase autenticado.
- [x] Devolver estado `local`, `pendiente`, `sincronizado` o `error`.

## FASE 4: Integrar con `ComerciosService`

### Objetivo

Conectar Firestore como espejo sin romper el comportamiento actual de comercios.

- [x] Importar el servicio Firestore de comercios en `ComerciosService`.
- [x] Sincronizar Firestore después de `agregarComercio`.
- [x] Sincronizar Firestore después de `editarComercio`.
- [x] Sincronizar Firestore después de `eliminarComercio`.
- [x] Sincronizar Firestore después de `agregarDireccion`.
- [x] Sincronizar Firestore después de `editarDireccion`.
- [x] Sincronizar Firestore después de `eliminarDireccion`.
- [x] Sincronizar Firestore después de `registrarUsoComercio`.
- [x] Mantener guardado local aunque Firestore falle.
- [x] Agregar estado de sincronización al comercio cuando sea útil para diagnóstico.
- [x] Evitar mensajes invasivos en UI si la sincronización ocurre normalmente.

## FASE 5: Revisar relación con precios existentes

### Objetivo

Evitar que la sincronización de comercios deje incoherentes los precios que ya guardan `comercioId` y `direccionId`.

- [x] Confirmar que precios nuevos siguen guardando `comercioId` y `direccionId`.
- [x] Confirmar que editar nombre de comercio actualiza historial local de precios como hasta ahora.
- [x] Confirmar que esa actualización local de precios sigue sincronizando productos/precios a Firestore.
- [x] No crear referencias Firestore directas obligatorias desde precio a comercio en este plan.
- [x] Documentar que la consistencia cruzada completa queda para el plan de migración/reintentos.

## FASE 6: Validar lectura Firestore sin usarla como fuente principal

### Objetivo

Comprobar que Firestore puede leer comercios privados sin cambiar todavía la UI principal.

- [x] Implementar carga controlada de comercios Firestore del usuario.
- [x] Comparar en desarrollo comercios Firestore contra comercios locales.
- [x] Confirmar que Firestore Offline devuelve comercios cacheados al recargar sin conexión.
- [x] Mantener la pantalla de comercios leyendo desde LocalStorage/Capacitor en esta etapa.
- [x] Documentar si Firestore queda como espejo validado o si algún flujo ya lo consulta explícitamente.

## FASE 7: Actualizar documentación

### Objetivo

Dejar claro el nuevo estado de integración para que futuros planes no repitan trabajo ni cambien el enfoque.

- [x] Actualizar `Planes/Resumenes/Resumen11Firebase.md`.
- [x] Actualizar `Planes/Resumenes/ModeloFirestoreMigracion.md` con estado de implementación de comercios.
- [x] Documentar que fotos de comercios siguen pendientes para Firebase Storage.
- [x] Documentar que LocalStorage/Capacitor sigue siendo fuente visible principal.
- [x] Documentar pendientes detectados para reintento/reparación de sincronización.

## FASE TESTING

### Objetivo

Validar comercios privados en Firestore sin romper almacenamiento local ni productos/precios.

- [x] Ejecutar `npm run lint`.
- [x] Ejecutar `npm run build`.
- [x] Crear comercio online y verificar documento en Firestore.
- [x] Agregar dirección online y verificar arreglo `direcciones` en Firestore.
- [x] Editar comercio online y verificar actualización en Firestore.
- [x] Editar dirección online y verificar actualización en Firestore.
- [x] Eliminar comercio y verificar `eliminado: true` en Firestore.
- [x] Crear comercio sin usuario Firebase y confirmar que queda solo local.
- [x] Crear comercio sin conexión y verificar estado pendiente o sincronización posterior.
- [x] Recuperar conexión y verificar sincronización.
- [x] Verificar que usuario A no puede leer ni escribir comercios del usuario B.
- [x] Verificar que usuario sin sesión no puede leer ni escribir comercios.
- [x] Confirmar que las fotos base64 no se guardan en Firestore.
- [x] Confirmar que LocalStorage/Capacitor conserva los comercios.
- [x] Confirmar que productos/precios siguen sincronizando como antes.
- [x] Revisar `git diff --check`.

## Resultado de ejecución

- Se creó `FirestoreComerciosService` como capa privada Firestore para comercios.
- Los comercios se escriben en `usuarios/{usuarioId}/comercios/{comercioId}`.
- Las direcciones se guardan como arreglo embebido dentro del comercio, respetando el límite del modelo.
- `ComerciosService` mantiene guardado local primero y sincroniza Firestore después.
- Si no hay usuario Firebase autenticado, la sincronización Firestore se omite y el comercio queda local.
- Si Firestore queda pendiente por conexión, la app devuelve estado `pendiente` con timeout controlado y conserva el dato local.
- Las fotos base64 de comercios y direcciones no se escriben en Firestore.
- La eliminación local de comercio marca `eliminado: true` en Firestore.
- Firestore queda como espejo privado validado; LocalStorage/Capacitor sigue siendo fuente visible principal.
- No se tocaron listas, preferencias, confirmaciones, comunidad, Storage ni reglas Firestore.

## Resultado de pruebas

- `npm run lint`: correcto.
- `npm run build`: correcto.
- `git diff --check`: correcto.
- MCP Browser: comercio online creado y leído desde Firestore.
- MCP Browser: dirección online agregada y verificada en el arreglo `direcciones`.
- MCP Browser: comercio y dirección editados y verificados en Firestore.
- MCP Browser: uso de comercio registrado y `cantidadUsos` actualizado en Firestore.
- MCP Browser: dirección eliminada y arreglo actualizado en Firestore.
- MCP Browser: comercio eliminado localmente y marcado `eliminado: true` en Firestore.
- MCP Browser: comercio sin usuario Firebase quedó local y no apareció en Firestore.
- MCP Browser: comercio offline quedó local con estado `pendiente` y sincronizó al reconectar.
- MCP Browser: usuario B no pudo leer ni escribir comercios de usuario A (`permission-denied`).
- MCP Browser: usuario sin sesión no pudo leer comercios privados (`permission-denied`).
- MCP Browser: lectura offline desde cache devolvió el comercio cacheado.
- MCP Browser: fotos base64 de comercio y dirección no quedaron en Firestore.
- MCP Browser: productos/precios siguieron sincronizando y conservaron `comercioId`/`direccionId`.

## Progreso del plan

- [x] Fase 1: Revisar modelo y flujo actual de comercios
- [x] Fase 2: Crear servicio Firestore de comercios
- [x] Fase 3: Implementar operaciones Firestore de comercio
- [x] Fase 4: Integrar con `ComerciosService`
- [x] Fase 5: Revisar relación con precios existentes
- [x] Fase 6: Validar lectura Firestore sin usarla como fuente principal
- [x] Fase 7: Actualizar documentación
- [x] Fase Testing

Fecha de creación: 20 de Mayo 2026
Fecha de última actualización: 20 de Mayo 2026
Estado: TERMINADO
