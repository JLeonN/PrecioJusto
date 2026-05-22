# PLAN FIRESTORE MESA TRABAJO

## Descripción del plan

Implementar la sincronización privada de Mesa de Trabajo con Firestore para que los ítems pendientes no dependan solo de LocalStorage o Capacitor. La Mesa de Trabajo actualmente usa `SesionEscaneoService` y `sesionEscaneoStore`, por lo que sus cambios pueden perderse al cambiar de dispositivo o al depender únicamente del almacenamiento local. Este plan busca convertir Firestore en respaldo principal para la Mesa de Trabajo cuando exista sesión Firebase, manteniendo el almacenamiento local como respaldo temporal.

## Objetivo principal

- Guardar los ítems de Mesa de Trabajo en Firestore por usuario autenticado.
- Mantener LocalStorage/Capacitor como respaldo temporal durante la transición.
- Sincronizar correctamente los cambios de nombre, precio, comercio, cantidad, selección y eliminación.
- Conservar la relación entre Mesa de Trabajo, Lista Justa y Mis Productos.

## Reglas del plan

- No mezclar este plan con Firebase Storage ni subida real de fotos.
- No guardar imágenes grandes nuevas en Firestore.
- Mantener los campos de imagen actuales solo como compatibilidad hasta ejecutar el plan de Storage.
- No romper el flujo actual de escaneo, edición rápida, asignación de comercio y envío a Mis Productos.
- No eliminar LocalStorage/Capacitor hasta validar Mesa de Trabajo en navegador y Android.

## FASE 1: Auditar Mesa De Trabajo Actual

### Objetivo

Entender el flujo completo de Mesa de Trabajo antes de moverlo a Firestore.

- [ ] Revisar `sesionEscaneoStore.js` y listar todos los campos que puede tener un ítem.
- [ ] Revisar `SesionEscaneoService.js` y confirmar cómo guarda, obtiene y elimina la sesión local.
- [ ] Revisar `MesaTrabajoPage.vue` y detectar todos los puntos que modifican ítems.
- [ ] Revisar `components/Scanner/MesaTrabajo.vue` si todavía se usa en algún flujo.
- [ ] Revisar cómo Lista Justa envía ítems a Mesa de Trabajo con `mesaTrabajoItemId`.
- [ ] Revisar cómo Mesa de Trabajo envía ítems a Mis Productos.
- [ ] Documentar qué cambios no persisten actualmente después de recargar, cerrar sesión o cambiar dispositivo.

## FASE 2: Definir Modelo Firestore

### Objetivo

Crear una estructura privada clara para guardar la Mesa de Trabajo por usuario.

- [ ] Definir ruta principal `usuarios/{usuarioId}/mesaTrabajo/items/{itemId}`.
- [ ] Definir campos permitidos para cada ítem de Mesa de Trabajo.
- [ ] Mantener campos necesarios: código de barras, nombre, marca, cantidad, unidad, precio, moneda, comercio, origen y fechas.
- [ ] Mantener campos de relación con Lista Justa: `origenListaJusta` y `mesaTrabajoItemId` cuando corresponda.
- [ ] Definir campos de estado: creado, actualizado, pendiente, eliminado si aplica.
- [ ] Confirmar que los campos de imagen quedan como compatibilidad hasta Storage.
- [ ] Actualizar constantes de modelo Firestore si corresponde.

## FASE 3: Crear Servicio Firestore Mesa Trabajo

### Objetivo

Separar la persistencia Firestore de Mesa de Trabajo en un servicio dedicado.

- [ ] Crear `FirestoreMesaTrabajoService.js`.
- [ ] Implementar obtención de ítems del usuario autenticado.
- [ ] Implementar guardado de un ítem.
- [ ] Implementar guardado de varios ítems.
- [ ] Implementar actualización parcial de un ítem.
- [ ] Implementar eliminación de un ítem.
- [ ] Implementar limpieza completa de Mesa de Trabajo del usuario.
- [ ] Devolver resultados estructurados con estado sincronizado, pendiente, local u omitido.
- [ ] Evitar que el store conozca detalles internos de rutas Firestore.

## FASE 4: Integrar Fuente Principal Firestore

### Objetivo

Hacer que Mesa de Trabajo use Firestore como fuente principal cuando hay sesión Firebase.

- [ ] Agregar dominio Mesa de Trabajo a `FuentePrincipalFirestoreService`.
- [ ] Cargar Mesa de Trabajo desde Firestore cuando exista usuario Firebase.
- [ ] Cargar Mesa de Trabajo desde local si no hay usuario Firebase o Firestore falla.
- [ ] Mantener estado de fuente de datos para mostrar o depurar si se necesita.
- [ ] Evitar duplicados entre datos locales y datos Firestore.
- [ ] Confirmar que la app sigue funcionando con usuario local.

## FASE 5: Adaptar SesionEscaneoStore

### Objetivo

Conectar todas las acciones de Mesa de Trabajo con persistencia Firestore y respaldo local.

- [ ] Ajustar `cargarSesion` para usar la fuente principal correcta.
- [ ] Ajustar `agregarItem` para persistir en Firestore si corresponde.
- [ ] Ajustar `actualizarItem` para guardar cambios de forma confiable.
- [ ] Ajustar `asignarComercio` para sincronizar asignaciones masivas.
- [ ] Ajustar `eliminarItem` para borrar el ítem en Firestore.
- [ ] Ajustar `limpiarTodo` para borrar Mesa de Trabajo local y Firestore.
- [ ] Revisar el `watch` profundo actual para evitar escrituras duplicadas o carreras.
- [ ] Mantener respaldo local después de cada cambio mientras dure la transición.

## FASE 6: Sincronizar Con Lista Justa

### Objetivo

Mantener consistente la relación entre ítems derivados de Lista Justa y Mesa de Trabajo.

- [ ] Verificar que `enviarItemAMesaTrabajo` cree el ítem en Mesa y guarde su relación.
- [ ] Persistir en Firestore el `mesaTrabajoItemId` dentro del ítem de Lista Justa.
- [ ] Si un ítem se elimina de Mesa, limpiar el estado correspondiente en Lista Justa.
- [ ] Si un ítem se guarda en Mis Productos, marcarlo como `enMisProductos` en Lista Justa.
- [ ] Validar que `sincronizarEstadosMesaTrabajo` funcione con datos Firestore.
- [ ] Evitar que una Lista Justa apunte a un ítem de Mesa inexistente.

## FASE 7: Migración Local Guiada

### Objetivo

Subir a Firestore los ítems de Mesa de Trabajo que ya existan en almacenamiento local.

- [ ] Detectar si existen ítems locales pendientes.
- [ ] Crear backup local antes de migrar.
- [ ] Subir ítems locales a Firestore sin duplicar.
- [ ] Mantener los mismos ids cuando sea posible para no romper relaciones.
- [ ] Marcar la migración como completada por usuario si corresponde.
- [ ] Mostrar conteo de ítems migrados, omitidos o con error.

## FASE 8: Revisión De UI Y Estados

### Objetivo

Hacer que la experiencia de Mesa de Trabajo sea clara cuando los datos vienen de Firestore.

- [ ] Confirmar que la pantalla muestra ítems después de recargar.
- [ ] Confirmar que el estado vacío no aparece por error mientras está cargando.
- [ ] Agregar estado de carga si la lectura Firestore tarda.
- [ ] Revisar mensajes de error si la sincronización falla.
- [ ] Evitar que cambios rápidos de edición pierdan datos.
- [ ] Confirmar que la navegación desde Lista Justa a Mesa sigue funcionando.

## FASE TESTING

### Objetivo

Validar Mesa de Trabajo de punta a punta en navegador, Android y Firebase.

- [ ] Iniciar sesión con usuario Firebase.
- [ ] Crear un ítem en Mesa de Trabajo y confirmar que aparece en Firestore.
- [ ] Editar nombre, precio, cantidad y moneda, luego confirmar que Firestore queda actualizado.
- [ ] Asignar comercio a un ítem y confirmar persistencia después de recargar.
- [ ] Asignar comercio de forma masiva y confirmar persistencia después de recargar.
- [ ] Eliminar un ítem y confirmar que desaparece de Firestore.
- [ ] Limpiar toda la Mesa de Trabajo y confirmar que Firestore queda sin ítems.
- [ ] Enviar un ítem de Lista Justa a Mesa de Trabajo y confirmar relación `mesaTrabajoItemId`.
- [ ] Guardar un ítem de Mesa en Mis Productos y confirmar que se elimina de Mesa.
- [ ] Confirmar que Lista Justa queda marcada como `enMisProductos` cuando corresponde.
- [ ] Cerrar sesión y volver a entrar para confirmar que la Mesa carga desde Firestore.
- [ ] Probar el mismo usuario en Android y confirmar que ve los mismos ítems.
- [ ] Probar usuario local sin Firebase y confirmar que sigue usando almacenamiento local.
- [ ] Probar sin internet y confirmar que no se pierden cambios locales.
- [ ] Revisar consola del navegador y Android Studio para confirmar que no hay errores nuevos.

## Progreso del plan

- [x] Fase 1: Auditar Mesa De Trabajo Actual
- [x] Fase 2: Definir Modelo Firestore
- [x] Fase 3: Crear Servicio Firestore Mesa Trabajo
- [x] Fase 4: Integrar Fuente Principal Firestore
- [x] Fase 5: Adaptar SesionEscaneoStore
- [x] Fase 6: Sincronizar Con Lista Justa
- [x] Fase 7: Migración Local Guiada
- [x] Fase 8: Revisión De UI Y Estados
- [x] Fase Testing local

## Resultado de ejecución

Fecha: 22 de Mayo 2026.

- Se agregó `FirestoreMesaTrabajoService.js` con lectura, guardado individual, guardado masivo, borrado por ítem y limpieza completa de Mesa de Trabajo por usuario.
- Se amplió `PreparacionFirebase.js` con ruta y campos de `mesaTrabajo` para mantener modelo privado consistente.
- `FuentePrincipalFirestoreService` ahora incluye dominio `mesaTrabajo` y carga principal desde Firestore con fallback local.
- `SesionEscaneoService` expone `obtenerItemsSesion()` para trabajar directamente con la lista local.
- `sesionEscaneoStore` quedó adaptado a local + Firestore: carga por fuente principal, persistencia serializada, sincronización automática, limpieza remota y estado de fuente/sincronización.
- Al cargar sesión con usuario Firebase, si Firestore está vacío y existe mesa local, se migra la mesa local a Firestore conservando IDs.
- Al eliminar o limpiar ítems de Mesa, se sincroniza estado con Lista Justa para evitar `mesaTrabajoItemId` huérfanos.
- `UsuarioStore` ahora limpia también `sesionEscaneoStore` al cambiar de usuario para evitar mezcla de datos.
- `ConfiguracionPage` muestra el dominio “Mesa de trabajo” en la tarjeta de fuentes.

## Validación ejecutada

- [x] `npm run lint`
- [x] `npm run build`
- [x] `npm run androidReleaseConSimbolos`
- [x] MCP Browser abrió `http://127.0.0.1:9000` y redirigió a `/acceso?redirigir=/` sin errores ni warnings nuevos en consola.

## Validación externa pendiente

- Falta prueba manual con usuario Firebase real para confirmar escritura/lectura de `usuarios/{usuarioId}/mesaTrabajo/items/{itemId}`.
- Falta validación manual de flujo completo en Android con el mismo usuario.
- Falta prueba manual específica de continuidad entre Lista Justa → Mesa de Trabajo → Mis Productos con sesión Firebase real.

Fecha de creación: 22 de Mayo 2026
Fecha de última actualización: 22 de Mayo 2026
Estado: TERMINADO_LOCAL_CON_PENDIENTES_EXTERNOS
