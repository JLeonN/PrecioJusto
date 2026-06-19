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
- No guardar imágenes base64 en Firestore.
- No relajar `firestore.rules`.
- No escribir en Firestore si no hay usuario Firebase autenticado.
- Mantener el criterio actual: guardar local primero y sincronizar Firestore después.
- Si Firestore falla, la lista debe quedar guardada localmente.
- Si una lista supera 100 items, documentar el caso y dejar subcolección de items para otro plan.

## FASE 1: Revisar modelo y flujo actual de Lista Justa

### Objetivo

Entender cómo se guardan listas e items antes de conectar Firestore.

- [x] Revisar `PlanMaestroFirebase.md`.
- [x] Revisar `Planes/Resumenes/ModeloFirestoreMigracion.md`.
- [x] Revisar `Planes/Resumenes/Resumen11Firebase.md`.
- [x] Revisar `src/almacenamiento/servicios/ListaJustaService.js`.
- [x] Revisar `src/almacenamiento/stores/ListaJustaStore.js`.
- [x] Confirmar campos actuales de lista.
- [x] Confirmar campos actuales de item.
- [x] Confirmar relación de items con productos mediante `productoId`.
- [x] Confirmar relación de listas con comercios mediante `comercioActual` y `configuracionInteligente`.
- [x] Confirmar que imágenes de items pueden quedar solo locales en esta etapa.

## FASE 2: Crear servicio Firestore de Lista Justa

### Objetivo

Agregar una capa específica para listas privadas sin poner SDK directo en componentes ni stores.

- [x] Crear servicio con nombre PascalCase para Lista Justa Firestore.
- [x] Obtener `usuarioId` desde `UsuarioActualService`.
- [x] Crear helper para colección `usuarios/{usuarioId}/listasJustas`.
- [x] Crear helper para documento `usuarios/{usuarioId}/listasJustas/{listaId}`.
- [x] Normalizar ID de documento evitando barras y valores vacíos.
- [x] Seleccionar solo campos permitidos por `CAMPOS_MODELO_FIRESTORE.listaJusta`.
- [x] Seleccionar solo campos permitidos por `CAMPOS_MODELO_FIRESTORE.itemListaJusta`.
- [x] Normalizar `fechaCreacion`, `fechaActualizacion` y `fechaUltimoUso`.
- [x] Limitar items embebidos a `LIMITES_MODELO_FIRESTORE.itemsListaEmbebidosMaximo`.
- [x] Evitar guardar `imagen` base64 de items; usar `imagenUrl` o `imagenRutaStorage` solo si ya existen.

## FASE 3: Implementar operaciones Firestore de listas

### Objetivo

Cubrir las operaciones mínimas necesarias para que el espejo Firestore acompañe al flujo local.

- [x] Implementar guardar lista completa.
- [x] Implementar obtener lista por ID.
- [x] Implementar obtener listas del usuario con límite ordenado por `fechaUltimoUso`.
- [x] Implementar actualizar lista.
- [x] Implementar eliminación lógica con `eliminado: true`.
- [x] Implementar guardado de items embebidos.
- [x] Manejar resultado omitido cuando no hay usuario Firebase autenticado.
- [x] Devolver estado `local`, `pendiente`, `sincronizado` o `error`.

## FASE 4: Integrar con `ListaJustaService`

### Objetivo

Conectar Firestore como espejo sin romper el comportamiento actual de Lista Justa.

- [x] Importar el servicio Firestore de listas en `ListaJustaService`.
- [x] Sincronizar Firestore después de crear lista.
- [x] Sincronizar Firestore después de renombrar lista.
- [x] Sincronizar Firestore después de reiniciar lista.
- [x] Sincronizar Firestore después de eliminar lista.
- [x] Sincronizar Firestore después de agregar, editar, comprar o eliminar item.
- [x] Sincronizar Firestore después de cambiar comercio actual.
- [x] Sincronizar Firestore después de cambiar configuración inteligente.
- [x] Mantener guardado local aunque Firestore falle.
- [x] Agregar estado de sincronización a la lista cuando sea útil para diagnóstico.

## FASE 5: Revisar relación con productos, precios y comercios

### Objetivo

Evitar que Lista Justa rompa las relaciones ya preparadas en Firebase.

- [x] Confirmar que `productoId` se conserva en items.
- [x] Confirmar que items manuales que pasan a Mis Productos siguen usando el flujo actual.
- [x] Confirmar que `comercioActual` conserva IDs y datos visuales suficientes.
- [x] Confirmar que `configuracionInteligente` no guarda datos innecesariamente pesados.
- [x] No crear referencias Firestore obligatorias desde item a producto o comercio en este plan.
- [x] Documentar que la consistencia cruzada completa queda para una etapa posterior.

## FASE 6: Validar lectura Firestore sin usarla como fuente principal

### Objetivo

Comprobar que Firestore puede leer listas privadas sin cambiar todavía la UI principal.

- [x] Implementar carga controlada de listas Firestore del usuario.
- [x] Comparar en desarrollo listas Firestore contra listas locales.
- [x] Confirmar que Firestore Offline devuelve listas cacheadas al recargar sin conexión.
- [x] Mantener las pantallas de Lista Justa leyendo desde LocalStorage/Capacitor en esta etapa.
- [x] Documentar si Firestore queda como espejo validado o si algún flujo lo consulta explícitamente.

## FASE 7: Preparar migración guiada futura de listas

### Objetivo

Dejar lista la base para que `MigracionLocalFirebaseService` pueda incluir listas en otro plan.

- [x] Confirmar que `InventarioMigracionFirebaseService` ya cuenta listas e items.
- [x] Definir conteos esperados para listas e items.
- [x] Documentar cómo migrar listas usando IDs locales.
- [x] Documentar cómo reintentar sin duplicar listas.
- [x] No modificar todavía la migración guiada si aumenta demasiado el alcance.

## FASE 8: Actualizar documentación

### Objetivo

Mantener el mapa Firebase y los resúmenes alineados.

- [x] Actualizar `Planes/Resumenes/Resumen11Firebase.md`.
- [x] Actualizar `Planes/Resumenes/ModeloFirestoreMigracion.md` con estado de Lista Justa.
- [x] Actualizar `Planes/PlanesFuturos/PlanMaestroFirebase.md`.
- [x] Documentar que Firestore todavía no es fuente principal de UI.
- [x] Documentar que preferencias, confirmaciones y Storage siguen pendientes.

## FASE TESTING

### Objetivo

Validar Lista Justa privada en Firestore sin romper almacenamiento local ni los datos ya sincronizados.

- [x] Ejecutar `npm run lint`.
- [x] Ejecutar `npm run build`.
- [x] Crear lista online y verificar documento en Firestore.
- [x] Agregar item online y verificar arreglo `items` en Firestore.
- [x] Editar item online y verificar actualización en Firestore.
- [x] Marcar item como comprado y verificar actualización en Firestore.
- [x] Cambiar comercio actual y verificar actualización en Firestore.
- [x] Eliminar lista y verificar `eliminado: true` en Firestore.
- [x] Crear lista sin usuario Firebase y confirmar que queda solo local.
- [x] Crear lista sin conexión y verificar estado pendiente o sincronización posterior.
- [x] Recuperar conexión y verificar sincronización.
- [x] Verificar que usuario A no puede leer ni escribir listas del usuario B.
- [x] Verificar que usuario sin sesión no puede leer ni escribir listas.
- [x] Confirmar que imágenes base64 de items no se guardan en Firestore.
- [x] Confirmar que LocalStorage/Capacitor conserva las listas.
- [x] Confirmar que productos, precios y comercios siguen sincronizando como antes.
- [x] Revisar `git diff --check`.

## Progreso del plan

- [x] Fase 1: Revisar modelo y flujo actual de Lista Justa
- [x] Fase 2: Crear servicio Firestore de Lista Justa
- [x] Fase 3: Implementar operaciones Firestore de listas
- [x] Fase 4: Integrar con `ListaJustaService`
- [x] Fase 5: Revisar relación con productos, precios y comercios
- [x] Fase 6: Validar lectura Firestore sin usarla como fuente principal
- [x] Fase 7: Preparar migración guiada futura de listas
- [x] Fase 8: Actualizar documentación
- [x] Fase Testing

Fecha de creación: 20 de Mayo 2026
Fecha de última actualización: 20 de Mayo 2026
Estado: TERMINADO

## Resultado de ejecución

- Servicio creado: `src/almacenamiento/servicios/FirestoreListasJustasService.js`.
- `ListaJustaService` mantiene guardado local primero y sincroniza Firestore como espejo privado después.
- `ListaJustaStore` marca la eliminación local como `eliminado: true` en Firestore.
- Ruta activa: `usuarios/{usuarioId}/listasJustas/{listaId}`.
- Los items quedan embebidos hasta 100 items y conservan `productoId`, estado de compra y datos visuales de comercio.
- Las imágenes base64 de items no se guardan en Firestore; quedan pendientes para Storage.
- Firestore todavía no es fuente principal visible de Lista Justa.

## Resultado de pruebas

- `npm run lint`: correcto.
- `npm run build`: correcto.
- MCP Browser: lista sin usuario Firebase quedó solo local.
- MCP Browser: lista online se creó en Firestore con item embebido.
- MCP Browser: edición de item, marcado como comprado y comercio actual se reflejaron en Firestore.
- MCP Browser: eliminación lógica dejó `eliminado: true` y `estadoGeneral: eliminada`.
- MCP Browser: lista offline quedó con estado `pendiente` y sincronizó al reconectar.
- MCP Browser: usuario B y usuario sin sesión recibieron `permission-denied` al leer listas del usuario A.
- MCP Browser: imágenes base64 de items no quedaron como base64 ni como campo `imagen` en Firestore.
- MCP Browser: productos/precios y comercios siguieron sincronizando después de integrar Lista Justa.
- `git diff --check`: sin errores.

Nota conocida: el CORS de `version.json` en desarrollo y los errores `ERR_INTERNET_DISCONNECTED` de la simulación offline no pertenecen a una regresión de este plan.
