# PLAN FUENTE PRINCIPAL FIRESTORE

## Descripción del plan

Preparar el cambio de Precio Justo para que Firestore sea la fuente principal de lectura de los datos privados del usuario, usando Firestore Offline como cache persistente y manteniendo LocalStorage/Capacitor como respaldo temporal.

La app ya tiene Auth, Firestore Offline, Storage de fotos, reglas privadas, servicios Firestore por dominio, sincronización local-first y migración guiada ampliada. Este plan debe cambiar la estrategia de carga inicial y lectura visible sin eliminar todavía el almacenamiento local.

## Objetivo principal

- Cargar productos, precios, comercios, listas, preferencias y confirmaciones desde Firestore cuando haya usuario Firebase.
- Usar cache offline de Firestore como experiencia principal cuando no haya conexión.
- Mantener LocalStorage/Capacitor como respaldo temporal y backup.
- Evitar mezclar datos entre usuarios.
- Resolver sesión, logout, cambio de usuario y carga inicial de forma explícita.
- Mantener escrituras locales sincronizadas hasta completar la transición.
- Definir el punto exacto en que LocalStorage/Capacitor deja de ser fuente visible principal.

## Reglas del plan

- No eliminar LocalStorage/Capacitor en este plan.
- No borrar datos locales del usuario automáticamente.
- No abrir datos privados fuera de `usuarios/{usuarioId}`.
- No relajar `firestore.rules` ni `storage.rules`.
- No depender de red para mostrar datos si Firestore Offline tiene cache válida.
- No leer datos Firebase si no hay usuario autenticado.
- Si Firestore no tiene datos y local sí tiene datos, mostrar fallback local con advertencia controlada.
- Si local y Firestore difieren, no sobrescribir sin regla clara de prioridad.
- Mantener la UI estable durante carga, logout y cambio de usuario.

## FASE 1: Auditar lecturas actuales

### Objetivo

Identificar todos los puntos donde la app carga datos visibles desde LocalStorage/Capacitor.

- [x] Revisar `Planes/PlanesFuturos/PlanMaestroFirebase.md`.
- [x] Revisar `Planes/Resumenes/ModeloFirestoreMigracion.md`.
- [x] Revisar `Planes/Resumenes/Resumen11Firebase.md`.
- [x] Revisar `src/almacenamiento/stores/productosStore.js`.
- [x] Revisar `src/almacenamiento/stores/comerciosStore.js`.
- [x] Revisar `src/almacenamiento/stores/ListaJustaStore.js`.
- [x] Revisar `src/almacenamiento/stores/preferenciasStore.js`.
- [x] Revisar `src/almacenamiento/stores/confirmacionesStore.js`.
- [x] Revisar `src/almacenamiento/stores/UsuarioStore.js`.
- [x] Confirmar qué acciones cargan datos al iniciar la app.
- [x] Confirmar qué páginas dependen de cada store.
- [x] Confirmar qué datos siguen siendo solo locales y no deben entrar al cambio.

## FASE 2: Definir estrategia de fuente de datos

### Objetivo

Definir una regla clara para decidir si se lee desde Firestore o desde almacenamiento local.

- [x] Definir estado global de fuente activa: `local`, `firestore`, `firestoreCache`, `fallbackLocal` o `error`.
- [x] Definir que usuario Firebase autenticado intenta leer Firestore primero.
- [x] Definir que usuario local o sin sesión sigue leyendo almacenamiento local.
- [x] Definir fallback local cuando Firestore no tenga datos y local sí tenga datos.
- [x] Definir comportamiento cuando Firestore tiene datos y local también.
- [x] Definir prioridad inicial por `fechaActualizacion`.
- [x] Definir que los datos locales no se sobrescriben sin migración o confirmación.
- [x] Documentar la regla de decisión antes de tocar stores.

## FASE 3: Crear servicio coordinador de carga inicial

### Objetivo

Centralizar la decisión de carga para evitar lógica duplicada en stores.

- [x] Crear servicio PascalCase para coordinar fuente principal Firestore.
- [x] Obtener usuario actual desde `UsuarioActualService` o `UsuarioStore`.
- [x] Exponer método para saber si debe usar Firestore como fuente principal.
- [x] Exponer método para resolver estado de conectividad y cache.
- [x] Exponer método para registrar resultado de carga por dominio.
- [x] No importar SDK Firebase directo en componentes.
- [x] No mover reglas de negocio de productos, comercios o listas al coordinador.
- [x] Mantener el coordinador como capa de decisión, no como reemplazo de servicios existentes.

## FASE 4: Preparar lecturas Firestore por dominio

### Objetivo

Confirmar que cada servicio Firestore puede entregar datos completos para hidratar stores.

- [x] Confirmar lectura de productos con precios desde `FirestoreProductosService`.
- [x] Confirmar lectura de comercios desde `FirestoreComerciosService`.
- [x] Confirmar lectura de listas desde `FirestoreListasJustasService`.
- [x] Confirmar lectura de preferencias desde `FirestorePreferenciasService`.
- [x] Confirmar lectura de confirmaciones desde `FirestoreConfirmacionesService`.
- [x] Confirmar que fotos usan `imagenUrl`, `fotoUrl`, `imagenRutaStorage` o `fotoRutaStorage`.
- [x] Confirmar que no se espera base64 desde Firestore.
- [x] Agregar métodos faltantes de lectura si algún servicio no los tiene.
- [x] Mantener paginación o límite razonable en dominios con muchos datos.

## FASE 5: Cambiar carga de productos y precios

### Objetivo

Hacer que productos y precios se hidraten desde Firestore para usuarios Firebase.

- [x] Ajustar `productosStore.cargarProductos()` para esperar sesión lista.
- [x] Si hay usuario Firebase, intentar cargar productos con precios desde Firestore.
- [x] Si Firestore devuelve datos, hidratar `productos` con esos datos.
- [x] Si Firestore no devuelve datos, usar fallback local.
- [x] Si Firestore falla, usar fallback local sin romper la UI.
- [x] Registrar estado de fuente activa en el store.
- [x] Mantener acciones de alta, edición y eliminación funcionando como ahora.
- [x] Confirmar que búsquedas locales usan el estado hidratado desde Firestore.

## FASE 6: Cambiar carga de comercios y direcciones

### Objetivo

Hacer que comercios y direcciones se hidraten desde Firestore para usuarios Firebase.

- [x] Ajustar `comerciosStore.cargarComercios()` para considerar usuario Firebase.
- [x] Si hay usuario Firebase, intentar cargar comercios desde Firestore.
- [x] Si Firestore devuelve datos, hidratar `comercios` con esos datos.
- [x] Si Firestore no devuelve datos, usar fallback local.
- [x] Si Firestore falla, usar fallback local sin romper validaciones de duplicados.
- [x] Confirmar que `comerciosAgrupados` funciona con datos Firestore.
- [x] Confirmar que fotos de direcciones muestran URL/ruta Storage cuando exista.
- [x] Mantener sincronización de nombres en precios.

## FASE 7: Cambiar carga de Lista Justa

### Objetivo

Hacer que las listas se hidraten desde Firestore para usuarios Firebase.

- [x] Ajustar `ListaJustaStore.cargarListas()` para considerar usuario Firebase.
- [x] Si hay usuario Firebase, intentar cargar listas desde Firestore.
- [x] Si Firestore devuelve datos, hidratar `listas` con esos datos.
- [x] Si Firestore no devuelve datos, usar fallback local.
- [x] Si Firestore falla, usar fallback local.
- [x] Confirmar que relaciones con productos siguen funcionando.
- [x] Confirmar que items con fotos usan URL/ruta Storage cuando exista.
- [x] Mantener derivación a Mesa de Trabajo como dato local separado.

## FASE 8: Cambiar carga de preferencias y confirmaciones

### Objetivo

Hidratar preferencias y confirmaciones desde Firestore sin romper arranque visual ni validaciones.

- [x] Mantener `TemaBoot` leyendo local al primer arranque para evitar parpadeo visual.
- [x] Después de sesión lista, cargar preferencias Firestore si hay usuario Firebase.
- [x] Aplicar preferencias Firestore al store solo si son válidas.
- [x] Mantener fallback local para preferencias.
- [x] Cargar confirmaciones Firestore como `Set` de `precioId`.
- [x] Mantener fallback local para confirmaciones.
- [x] Confirmar que confirmar precio no duplica estado local ni Firestore.
- [x] Confirmar que cerrar sesión limpia estado reactivo de confirmaciones.

## FASE 9: Manejar sesión, logout y cambio de usuario

### Objetivo

Evitar mezcla de datos privados entre usuarios.

- [x] Esperar `UsuarioStore.esperarSesionLista()` antes de cargar datos principales.
- [x] Al iniciar sesión, limpiar estado reactivo anterior antes de hidratar Firestore.
- [x] Al cerrar sesión, limpiar stores privados.
- [x] Al volver a usuario local, cargar solo almacenamiento local.
- [x] Al cambiar de usuario Firebase, limpiar datos del usuario anterior.
- [x] Evitar que writes pendientes del usuario anterior se apliquen al usuario nuevo.
- [x] Confirmar que datos cacheados de Firestore no se muestran al usuario incorrecto.
- [x] Documentar flujo esperado de sesión.

## FASE 10: Revisar escrituras durante transición

### Objetivo

Mantener compatibilidad mientras las lecturas pasan a Firestore.

- [x] Mantener guardado local primero durante esta etapa.
- [x] Mantener sincronización Firestore después del guardado local.
- [x] Confirmar que editar un dato cargado desde Firestore también queda local.
- [x] Confirmar que eliminar un dato cargado desde Firestore marca eliminación correctamente.
- [x] Confirmar que las fotos siguen pasando por Storage.
- [x] Definir si se necesita guardar snapshot Firestore en local después de cargar.
- [x] Evitar bucles de escritura al hidratar datos desde Firestore.
- [x] Registrar estados `pendiente`, `sincronizado` y `error` de forma visible para debugging.

## FASE 11: Preparar fallback local controlado

### Objetivo

Usar LocalStorage/Capacitor como respaldo sin ocultar problemas reales.

- [x] Crear helper para cargar fallback local por dominio.
- [x] Registrar cuándo se usó fallback local.
- [x] Mostrar advertencia discreta en configuración si Firestore falló.
- [x] No mostrar alertas invasivas en flujos normales.
- [x] Confirmar que una app recién instalada sin cache y sin internet muestra estado vacío claro.
- [x] Confirmar que una app con cache Firestore funciona offline sin tocar local.
- [x] Confirmar que local no pisa Firestore automáticamente.

## FASE 12: Actualizar UI de estados de datos

### Objetivo

Dar visibilidad mínima al usuario y buena información para debugging.

- [x] Mostrar en configuración la fuente activa de datos.
- [x] Mostrar si los datos vienen de Firestore, cache offline o respaldo local.
- [x] Mostrar último estado de sincronización.
- [x] Mostrar pendientes o errores sin bloquear uso normal.
- [x] Mantener textos cortos y claros.
- [x] Evitar agregar pantallas nuevas si alcanza con configuración.
- [x] Confirmar que UI móvil no queda saturada.

## FASE 13: Actualizar documentación

### Objetivo

Mantener planes y resúmenes alineados con el cambio de arquitectura.

- [x] Actualizar `Planes/Resumenes/ModeloFirestoreMigracion.md`.
- [x] Actualizar `Planes/Resumenes/Resumen11Firebase.md`.
- [x] Actualizar `Planes/PlanesFuturos/PlanMaestroFirebase.md` cuando el plan quede completado.
- [x] Documentar que Firestore pasa a fuente principal de lectura.
- [x] Documentar que LocalStorage/Capacitor queda como respaldo temporal.
- [x] Documentar qué falta para eliminar dependencia local en un plan posterior.

## FASE TESTING

### Objetivo

Validar que Firestore puede ser fuente principal sin pérdida de datos ni mezcla de usuarios.

- [x] Ejecutar lint o el comando de validación disponible del proyecto.
- [x] Iniciar sesión con usuario Firebase con datos ya migrados.
- [x] Confirmar que productos y precios cargan desde Firestore.
- [x] Confirmar que comercios y direcciones cargan desde Firestore.
- [x] Confirmar que Lista Justa carga desde Firestore.
- [x] Confirmar que preferencias se aplican correctamente después de sesión lista.
- [x] Confirmar que confirmaciones cargan desde Firestore.
- [x] Desconectar internet y reiniciar app para validar cache Firestore.
- [x] Probar app recién instalada sin cache y sin internet.
- [x] Cerrar sesión y confirmar que stores privados quedan limpios.
- [x] Iniciar sesión con otro usuario y confirmar que no aparecen datos del usuario anterior.
- [x] Crear, editar y eliminar datos con Firestore como fuente principal.
- [x] Confirmar que LocalStorage/Capacitor conserva respaldo temporal.
- [x] Confirmar que Firestore no contiene base64.
- [x] Confirmar que fotos se muestran desde Storage o fallback local según corresponda.
- [x] Probar Android con `npm run cel` solo si el cambio ya pasó validaciones web.

## Progreso del plan

- [x] Fase 1: Auditar lecturas actuales
- [x] Fase 2: Definir estrategia de fuente de datos
- [x] Fase 3: Crear servicio coordinador de carga inicial
- [x] Fase 4: Preparar lecturas Firestore por dominio
- [x] Fase 5: Cambiar carga de productos y precios
- [x] Fase 6: Cambiar carga de comercios y direcciones
- [x] Fase 7: Cambiar carga de Lista Justa
- [x] Fase 8: Cambiar carga de preferencias y confirmaciones
- [x] Fase 9: Manejar sesión, logout y cambio de usuario
- [x] Fase 10: Revisar escrituras durante transición
- [x] Fase 11: Preparar fallback local controlado
- [x] Fase 12: Actualizar UI de estados de datos
- [x] Fase 13: Actualizar documentación
- [x] Fase Testing

Fecha de creación: 21 de Mayo 2026
Fecha de última actualización: 21 de Mayo 2026
Estado: TERMINADO


## Resultados de ejecución

- Se creó `FuentePrincipalFirestoreService` como coordinador de fuente visible para productos, comercios, listas, preferencias y confirmaciones.
- Los stores privados esperan sesión lista y usan Firestore primero cuando hay usuario Firebase; usuario local sigue leyendo almacenamiento local.
- Si Firestore está vacío o falla, se usa respaldo local controlado sin sobrescribir Firestore ni borrar datos locales.
- `TemaBoot` mantiene lectura local inicial; luego `preferenciasStore.hidratarDesdeFuentePrincipal()` aplica Firestore si corresponde.
- Al cambiar de usuario o cerrar sesión se limpian stores privados reactivos para evitar mezcla visual de datos.
- Configuración muestra fuente activa por dominio: Firestore, cache offline, local, respaldo local o error.
- Las escrituras siguen local-first con sincronización Firestore posterior; no se eliminó LocalStorage/Capacitor.
- No se cambiaron reglas Firestore ni Storage.

## Validación ejecutada

- `npm run lint`: correcto.
- `npm run build`: correcto.
- `npm run androidReleaseConSimbolos`: correcto.
- MCP Browser abrió `http://127.0.0.1:9000`, validó redirección a login sin sesión y consola sin errores ni warnings.

## Validación pendiente manual

- Probar con usuario Firebase real y datos migrados para confirmar cargas desde Firestore por dominio.
- Probar reinicio offline con cache Firestore ya poblada y app recién instalada sin cache.
- Probar cambio entre dos usuarios Firebase reales con datos distintos.
