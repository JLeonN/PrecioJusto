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

- [ ] Revisar `Planes/Resumenes/ModeloFirestoreMigracion.md`.
- [ ] Revisar `Planes/PlanesTerminados/PlanSistemaSucursales.md`.
- [ ] Revisar `Planes/PlanesTerminados/PlanTrabajoComercio.md`.
- [ ] Revisar `Planes/PlanesTerminados/PlanFotosComercios.md`.
- [ ] Revisar `src/almacenamiento/servicios/ComerciosService.js`.
- [ ] Revisar `src/almacenamiento/stores/comerciosStore.js`.
- [ ] Confirmar campos actuales de comercio.
- [ ] Confirmar campos actuales de dirección/sucursal.
- [ ] Confirmar cómo se usan `comercioId` y `direccionId` en precios.
- [ ] Confirmar que las fotos actuales pueden quedar solo locales en esta etapa.

## FASE 2: Crear servicio Firestore de comercios

### Objetivo

Agregar una capa específica para comercios privados en Firestore sin poner SDK directo en componentes ni stores.

- [ ] Crear servicio con nombre PascalCase para comercios Firestore.
- [ ] Obtener `usuarioId` desde `UsuarioActualService`.
- [ ] Crear helper para colección `usuarios/{usuarioId}/comercios`.
- [ ] Crear helper para documento `usuarios/{usuarioId}/comercios/{comercioId}`.
- [ ] Normalizar ID de documento evitando barras y valores vacíos.
- [ ] Normalizar texto de búsqueda para `nombreNormalizado`.
- [ ] Seleccionar solo campos permitidos por `CAMPOS_MODELO_FIRESTORE.comercio`.
- [ ] Seleccionar solo campos permitidos por `CAMPOS_MODELO_FIRESTORE.direccion`.
- [ ] Evitar guardar `foto` base64 de comercio o dirección.
- [ ] Guardar `fotoUrl` o `fotoRutaStorage` solo si ya existen.

## FASE 3: Implementar operaciones Firestore de comercio

### Objetivo

Cubrir las operaciones mínimas necesarias para que el espejo Firestore acompañe al flujo local.

- [ ] Implementar guardar comercio completo.
- [ ] Implementar obtener comercio por ID.
- [ ] Implementar obtener comercios del usuario con límite ordenado por `fechaUltimoUso`.
- [ ] Implementar actualizar comercio.
- [ ] Implementar eliminación lógica con `eliminado: true`.
- [ ] Implementar actualización de direcciones embebidas.
- [ ] Implementar actualización de uso (`fechaUltimoUso`, `cantidadUsos`).
- [ ] Manejar resultado omitido cuando no hay usuario Firebase autenticado.
- [ ] Devolver estado `local`, `pendiente`, `sincronizado` o `error`.

## FASE 4: Integrar con `ComerciosService`

### Objetivo

Conectar Firestore como espejo sin romper el comportamiento actual de comercios.

- [ ] Importar el servicio Firestore de comercios en `ComerciosService`.
- [ ] Sincronizar Firestore después de `agregarComercio`.
- [ ] Sincronizar Firestore después de `editarComercio`.
- [ ] Sincronizar Firestore después de `eliminarComercio`.
- [ ] Sincronizar Firestore después de `agregarDireccion`.
- [ ] Sincronizar Firestore después de `editarDireccion`.
- [ ] Sincronizar Firestore después de `eliminarDireccion`.
- [ ] Sincronizar Firestore después de `registrarUsoComercio`.
- [ ] Mantener guardado local aunque Firestore falle.
- [ ] Agregar estado de sincronización al comercio cuando sea útil para diagnóstico.
- [ ] Evitar mensajes invasivos en UI si la sincronización ocurre normalmente.

## FASE 5: Revisar relación con precios existentes

### Objetivo

Evitar que la sincronización de comercios deje incoherentes los precios que ya guardan `comercioId` y `direccionId`.

- [ ] Confirmar que precios nuevos siguen guardando `comercioId` y `direccionId`.
- [ ] Confirmar que editar nombre de comercio actualiza historial local de precios como hasta ahora.
- [ ] Confirmar que esa actualización local de precios sigue sincronizando productos/precios a Firestore.
- [ ] No crear referencias Firestore directas obligatorias desde precio a comercio en este plan.
- [ ] Documentar que la consistencia cruzada completa queda para el plan de migración/reintentos.

## FASE 6: Validar lectura Firestore sin usarla como fuente principal

### Objetivo

Comprobar que Firestore puede leer comercios privados sin cambiar todavía la UI principal.

- [ ] Implementar carga controlada de comercios Firestore del usuario.
- [ ] Comparar en desarrollo comercios Firestore contra comercios locales.
- [ ] Confirmar que Firestore Offline devuelve comercios cacheados al recargar sin conexión.
- [ ] Mantener la pantalla de comercios leyendo desde LocalStorage/Capacitor en esta etapa.
- [ ] Documentar si Firestore queda como espejo validado o si algún flujo ya lo consulta explícitamente.

## FASE 7: Actualizar documentación

### Objetivo

Dejar claro el nuevo estado de integración para que futuros planes no repitan trabajo ni cambien el enfoque.

- [ ] Actualizar `Planes/Resumenes/Resumen11Firebase.md`.
- [ ] Actualizar `Planes/Resumenes/ModeloFirestoreMigracion.md` con estado de implementación de comercios.
- [ ] Documentar que fotos de comercios siguen pendientes para Firebase Storage.
- [ ] Documentar que LocalStorage/Capacitor sigue siendo fuente visible principal.
- [ ] Documentar pendientes detectados para reintento/reparación de sincronización.

## FASE TESTING

### Objetivo

Validar comercios privados en Firestore sin romper almacenamiento local ni productos/precios.

- [ ] Ejecutar `npm run lint`.
- [ ] Ejecutar `npm run build`.
- [ ] Crear comercio online y verificar documento en Firestore.
- [ ] Agregar dirección online y verificar arreglo `direcciones` en Firestore.
- [ ] Editar comercio online y verificar actualización en Firestore.
- [ ] Editar dirección online y verificar actualización en Firestore.
- [ ] Eliminar comercio y verificar `eliminado: true` en Firestore.
- [ ] Crear comercio sin usuario Firebase y confirmar que queda solo local.
- [ ] Crear comercio sin conexión y verificar estado pendiente o sincronización posterior.
- [ ] Recuperar conexión y verificar sincronización.
- [ ] Verificar que usuario A no puede leer ni escribir comercios del usuario B.
- [ ] Verificar que usuario sin sesión no puede leer ni escribir comercios.
- [ ] Confirmar que las fotos base64 no se guardan en Firestore.
- [ ] Confirmar que LocalStorage/Capacitor conserva los comercios.
- [ ] Confirmar que productos/precios siguen sincronizando como antes.
- [ ] Revisar `git diff --check`.

## Progreso del plan

- [ ] Fase 1: Revisar modelo y flujo actual de comercios
- [ ] Fase 2: Crear servicio Firestore de comercios
- [ ] Fase 3: Implementar operaciones Firestore de comercio
- [ ] Fase 4: Integrar con `ComerciosService`
- [ ] Fase 5: Revisar relación con precios existentes
- [ ] Fase 6: Validar lectura Firestore sin usarla como fuente principal
- [ ] Fase 7: Actualizar documentación
- [ ] Fase Testing

Fecha de creación: 20 de Mayo 2026
Fecha de última actualización: 20 de Mayo 2026
Estado: BORRADOR
