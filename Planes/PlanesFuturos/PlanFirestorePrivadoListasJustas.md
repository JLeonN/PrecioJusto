# PLAN FIRESTORE PRIVADO LISTAS JUSTAS

## Descripción del plan

Implementar la sincronización privada de Lista Justa en Firestore para Precio Justo. La app ya tiene Firebase Auth, Firestore Offline, reglas privadas versionadas, productos/precios y comercios sincronizados como espejo privado, además de migración guiada para esos datos.

Este plan debe conectar `ListaJustaService` con Firestore bajo `usuarios/{usuarioId}/listasJustas/{listaId}`, manteniendo LocalStorage/Capacitor como fuente visible principal. Los items quedan embebidos dentro de cada lista hasta el límite definido por el modelo.

## Objetivo principal

- Crear un servicio Firestore privado para Lista Justa.
- Guardar listas en `usuarios/{usuarioId}/listasJustas/{listaId}`.
- Guardar items embebidos dentro de cada lista mientras no superen el límite del modelo.
- Mantener compatibilidad con el almacenamiento local actual.
- Evitar guardar imágenes base64 en Firestore.
- Validar privacidad entre usuarios.
- Dejar preparada la migración guiada para incluir listas en un plan posterior.

## Reglas del plan

- No reemplazar todavía LocalStorage/Capacitor como fuente visible principal.
- No migrar automáticamente todas las listas locales en este plan.
- No tocar preferencias, confirmaciones, comunidad ni Storage.
- No guardar imágenes base64 en Firestore.
- No relajar `firestore.rules`.
- No escribir en Firestore si no hay usuario Firebase autenticado.
- Mantener el criterio actual: guardar local primero y sincronizar Firestore después.
- Si Firestore falla, la lista debe quedar guardada localmente.
- Si una lista supera 100 items, documentar el caso y dejar subcolección de items para otro plan.

## FASE 1: Revisar modelo y flujo actual de Lista Justa

### Objetivo

Entender cómo se guardan listas e items antes de conectar Firestore.

- [ ] Revisar `PlanMaestroFirebase.md`.
- [ ] Revisar `Planes/Resumenes/ModeloFirestoreMigracion.md`.
- [ ] Revisar `Planes/Resumenes/Resumen11Firebase.md`.
- [ ] Revisar `src/almacenamiento/servicios/ListaJustaService.js`.
- [ ] Revisar `src/almacenamiento/stores/ListaJustaStore.js`.
- [ ] Confirmar campos actuales de lista.
- [ ] Confirmar campos actuales de item.
- [ ] Confirmar relación de items con productos mediante `productoId`.
- [ ] Confirmar relación de listas con comercios mediante `comercioActual` y `configuracionInteligente`.
- [ ] Confirmar que imágenes de items pueden quedar solo locales en esta etapa.

## FASE 2: Crear servicio Firestore de Lista Justa

### Objetivo

Agregar una capa específica para listas privadas sin poner SDK directo en componentes ni stores.

- [ ] Crear servicio con nombre PascalCase para Lista Justa Firestore.
- [ ] Obtener `usuarioId` desde `UsuarioActualService`.
- [ ] Crear helper para colección `usuarios/{usuarioId}/listasJustas`.
- [ ] Crear helper para documento `usuarios/{usuarioId}/listasJustas/{listaId}`.
- [ ] Normalizar ID de documento evitando barras y valores vacíos.
- [ ] Seleccionar solo campos permitidos por `CAMPOS_MODELO_FIRESTORE.listaJusta`.
- [ ] Seleccionar solo campos permitidos por `CAMPOS_MODELO_FIRESTORE.itemListaJusta`.
- [ ] Normalizar `fechaCreacion`, `fechaActualizacion` y `fechaUltimoUso`.
- [ ] Limitar items embebidos a `LIMITES_MODELO_FIRESTORE.itemsListaEmbebidosMaximo`.
- [ ] Evitar guardar `imagen` base64 de items; usar `imagenUrl` o `imagenRutaStorage` solo si ya existen.

## FASE 3: Implementar operaciones Firestore de listas

### Objetivo

Cubrir las operaciones mínimas necesarias para que el espejo Firestore acompañe al flujo local.

- [ ] Implementar guardar lista completa.
- [ ] Implementar obtener lista por ID.
- [ ] Implementar obtener listas del usuario con límite ordenado por `fechaUltimoUso`.
- [ ] Implementar actualizar lista.
- [ ] Implementar eliminación lógica con `eliminado: true`.
- [ ] Implementar guardado de items embebidos.
- [ ] Manejar resultado omitido cuando no hay usuario Firebase autenticado.
- [ ] Devolver estado `local`, `pendiente`, `sincronizado` o `error`.

## FASE 4: Integrar con `ListaJustaService`

### Objetivo

Conectar Firestore como espejo sin romper el comportamiento actual de Lista Justa.

- [ ] Importar el servicio Firestore de listas en `ListaJustaService`.
- [ ] Sincronizar Firestore después de crear lista.
- [ ] Sincronizar Firestore después de renombrar lista.
- [ ] Sincronizar Firestore después de reiniciar lista.
- [ ] Sincronizar Firestore después de eliminar lista.
- [ ] Sincronizar Firestore después de agregar, editar, comprar o eliminar item.
- [ ] Sincronizar Firestore después de cambiar comercio actual.
- [ ] Sincronizar Firestore después de cambiar configuración inteligente.
- [ ] Mantener guardado local aunque Firestore falle.
- [ ] Agregar estado de sincronización a la lista cuando sea útil para diagnóstico.

## FASE 5: Revisar relación con productos, precios y comercios

### Objetivo

Evitar que Lista Justa rompa las relaciones ya preparadas en Firebase.

- [ ] Confirmar que `productoId` se conserva en items.
- [ ] Confirmar que items manuales que pasan a Mis Productos siguen usando el flujo actual.
- [ ] Confirmar que `comercioActual` conserva IDs y datos visuales suficientes.
- [ ] Confirmar que `configuracionInteligente` no guarda datos innecesariamente pesados.
- [ ] No crear referencias Firestore obligatorias desde item a producto o comercio en este plan.
- [ ] Documentar que la consistencia cruzada completa queda para una etapa posterior.

## FASE 6: Validar lectura Firestore sin usarla como fuente principal

### Objetivo

Comprobar que Firestore puede leer listas privadas sin cambiar todavía la UI principal.

- [ ] Implementar carga controlada de listas Firestore del usuario.
- [ ] Comparar en desarrollo listas Firestore contra listas locales.
- [ ] Confirmar que Firestore Offline devuelve listas cacheadas al recargar sin conexión.
- [ ] Mantener las pantallas de Lista Justa leyendo desde LocalStorage/Capacitor en esta etapa.
- [ ] Documentar si Firestore queda como espejo validado o si algún flujo lo consulta explícitamente.

## FASE 7: Preparar migración guiada futura de listas

### Objetivo

Dejar lista la base para que `MigracionLocalFirebaseService` pueda incluir listas en otro plan.

- [ ] Confirmar que `InventarioMigracionFirebaseService` ya cuenta listas e items.
- [ ] Definir conteos esperados para listas e items.
- [ ] Documentar cómo migrar listas usando IDs locales.
- [ ] Documentar cómo reintentar sin duplicar listas.
- [ ] No modificar todavía la migración guiada si aumenta demasiado el alcance.

## FASE 8: Actualizar documentación

### Objetivo

Mantener el mapa Firebase y los resúmenes alineados.

- [ ] Actualizar `Planes/Resumenes/Resumen11Firebase.md`.
- [ ] Actualizar `Planes/Resumenes/ModeloFirestoreMigracion.md` con estado de Lista Justa.
- [ ] Actualizar `Planes/PlanesFuturos/PlanMaestroFirebase.md`.
- [ ] Documentar que Firestore todavía no es fuente principal de UI.
- [ ] Documentar que preferencias, confirmaciones y Storage siguen pendientes.

## FASE TESTING

### Objetivo

Validar Lista Justa privada en Firestore sin romper almacenamiento local ni los datos ya sincronizados.

- [ ] Ejecutar `npm run lint`.
- [ ] Ejecutar `npm run build`.
- [ ] Crear lista online y verificar documento en Firestore.
- [ ] Agregar item online y verificar arreglo `items` en Firestore.
- [ ] Editar item online y verificar actualización en Firestore.
- [ ] Marcar item como comprado y verificar actualización en Firestore.
- [ ] Cambiar comercio actual y verificar actualización en Firestore.
- [ ] Eliminar lista y verificar `eliminado: true` en Firestore.
- [ ] Crear lista sin usuario Firebase y confirmar que queda solo local.
- [ ] Crear lista sin conexión y verificar estado pendiente o sincronización posterior.
- [ ] Recuperar conexión y verificar sincronización.
- [ ] Verificar que usuario A no puede leer ni escribir listas del usuario B.
- [ ] Verificar que usuario sin sesión no puede leer ni escribir listas.
- [ ] Confirmar que imágenes base64 de items no se guardan en Firestore.
- [ ] Confirmar que LocalStorage/Capacitor conserva las listas.
- [ ] Confirmar que productos, precios y comercios siguen sincronizando como antes.
- [ ] Revisar `git diff --check`.

## Progreso del plan

- [ ] Fase 1: Revisar modelo y flujo actual de Lista Justa
- [ ] Fase 2: Crear servicio Firestore de Lista Justa
- [ ] Fase 3: Implementar operaciones Firestore de listas
- [ ] Fase 4: Integrar con `ListaJustaService`
- [ ] Fase 5: Revisar relación con productos, precios y comercios
- [ ] Fase 6: Validar lectura Firestore sin usarla como fuente principal
- [ ] Fase 7: Preparar migración guiada futura de listas
- [ ] Fase 8: Actualizar documentación
- [ ] Fase Testing

Fecha de creación: 20 de Mayo 2026
Fecha de última actualización: 20 de Mayo 2026
Estado: BORRADOR
