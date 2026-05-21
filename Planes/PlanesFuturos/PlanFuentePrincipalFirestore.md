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
- No cambiar comunidad ni datos compartidos en este plan.
- No relajar `firestore.rules` ni `storage.rules`.
- No depender de red para mostrar datos si Firestore Offline tiene cache válida.
- No leer datos Firebase si no hay usuario autenticado.
- Si Firestore no tiene datos y local sí tiene datos, mostrar fallback local con advertencia controlada.
- Si local y Firestore difieren, no sobrescribir sin regla clara de prioridad.
- Mantener la UI estable durante carga, logout y cambio de usuario.

## FASE 1: Auditar lecturas actuales

### Objetivo

Identificar todos los puntos donde la app carga datos visibles desde LocalStorage/Capacitor.

- [ ] Revisar `Planes/PlanesFuturos/PlanMaestroFirebase.md`.
- [ ] Revisar `Planes/Resumenes/ModeloFirestoreMigracion.md`.
- [ ] Revisar `Planes/Resumenes/Resumen11Firebase.md`.
- [ ] Revisar `src/almacenamiento/stores/productosStore.js`.
- [ ] Revisar `src/almacenamiento/stores/comerciosStore.js`.
- [ ] Revisar `src/almacenamiento/stores/ListaJustaStore.js`.
- [ ] Revisar `src/almacenamiento/stores/preferenciasStore.js`.
- [ ] Revisar `src/almacenamiento/stores/confirmacionesStore.js`.
- [ ] Revisar `src/almacenamiento/stores/UsuarioStore.js`.
- [ ] Confirmar qué acciones cargan datos al iniciar la app.
- [ ] Confirmar qué páginas dependen de cada store.
- [ ] Confirmar qué datos siguen siendo solo locales y no deben entrar al cambio.

## FASE 2: Definir estrategia de fuente de datos

### Objetivo

Definir una regla clara para decidir si se lee desde Firestore o desde almacenamiento local.

- [ ] Definir estado global de fuente activa: `local`, `firestore`, `firestoreCache`, `fallbackLocal` o `error`.
- [ ] Definir que usuario Firebase autenticado intenta leer Firestore primero.
- [ ] Definir que usuario local o sin sesión sigue leyendo almacenamiento local.
- [ ] Definir fallback local cuando Firestore no tenga datos y local sí tenga datos.
- [ ] Definir comportamiento cuando Firestore tiene datos y local también.
- [ ] Definir prioridad inicial por `fechaActualizacion`.
- [ ] Definir que los datos locales no se sobrescriben sin migración o confirmación.
- [ ] Documentar la regla de decisión antes de tocar stores.

## FASE 3: Crear servicio coordinador de carga inicial

### Objetivo

Centralizar la decisión de carga para evitar lógica duplicada en stores.

- [ ] Crear servicio PascalCase para coordinar fuente principal Firestore.
- [ ] Obtener usuario actual desde `UsuarioActualService` o `UsuarioStore`.
- [ ] Exponer método para saber si debe usar Firestore como fuente principal.
- [ ] Exponer método para resolver estado de conectividad y cache.
- [ ] Exponer método para registrar resultado de carga por dominio.
- [ ] No importar SDK Firebase directo en componentes.
- [ ] No mover reglas de negocio de productos, comercios o listas al coordinador.
- [ ] Mantener el coordinador como capa de decisión, no como reemplazo de servicios existentes.

## FASE 4: Preparar lecturas Firestore por dominio

### Objetivo

Confirmar que cada servicio Firestore puede entregar datos completos para hidratar stores.

- [ ] Confirmar lectura de productos con precios desde `FirestoreProductosService`.
- [ ] Confirmar lectura de comercios desde `FirestoreComerciosService`.
- [ ] Confirmar lectura de listas desde `FirestoreListasJustasService`.
- [ ] Confirmar lectura de preferencias desde `FirestorePreferenciasService`.
- [ ] Confirmar lectura de confirmaciones desde `FirestoreConfirmacionesService`.
- [ ] Confirmar que fotos usan `imagenUrl`, `fotoUrl`, `imagenRutaStorage` o `fotoRutaStorage`.
- [ ] Confirmar que no se espera base64 desde Firestore.
- [ ] Agregar métodos faltantes de lectura si algún servicio no los tiene.
- [ ] Mantener paginación o límite razonable en dominios con muchos datos.

## FASE 5: Cambiar carga de productos y precios

### Objetivo

Hacer que productos y precios se hidraten desde Firestore para usuarios Firebase.

- [ ] Ajustar `productosStore.cargarProductos()` para esperar sesión lista.
- [ ] Si hay usuario Firebase, intentar cargar productos con precios desde Firestore.
- [ ] Si Firestore devuelve datos, hidratar `productos` con esos datos.
- [ ] Si Firestore no devuelve datos, usar fallback local.
- [ ] Si Firestore falla, usar fallback local sin romper la UI.
- [ ] Registrar estado de fuente activa en el store.
- [ ] Mantener acciones de alta, edición y eliminación funcionando como ahora.
- [ ] Confirmar que búsquedas locales usan el estado hidratado desde Firestore.

## FASE 6: Cambiar carga de comercios y direcciones

### Objetivo

Hacer que comercios y direcciones se hidraten desde Firestore para usuarios Firebase.

- [ ] Ajustar `comerciosStore.cargarComercios()` para considerar usuario Firebase.
- [ ] Si hay usuario Firebase, intentar cargar comercios desde Firestore.
- [ ] Si Firestore devuelve datos, hidratar `comercios` con esos datos.
- [ ] Si Firestore no devuelve datos, usar fallback local.
- [ ] Si Firestore falla, usar fallback local sin romper validaciones de duplicados.
- [ ] Confirmar que `comerciosAgrupados` funciona con datos Firestore.
- [ ] Confirmar que fotos de direcciones muestran URL/ruta Storage cuando exista.
- [ ] Mantener sincronización de nombres en precios.

## FASE 7: Cambiar carga de Lista Justa

### Objetivo

Hacer que las listas se hidraten desde Firestore para usuarios Firebase.

- [ ] Ajustar `ListaJustaStore.cargarListas()` para considerar usuario Firebase.
- [ ] Si hay usuario Firebase, intentar cargar listas desde Firestore.
- [ ] Si Firestore devuelve datos, hidratar `listas` con esos datos.
- [ ] Si Firestore no devuelve datos, usar fallback local.
- [ ] Si Firestore falla, usar fallback local.
- [ ] Confirmar que relaciones con productos siguen funcionando.
- [ ] Confirmar que items con fotos usan URL/ruta Storage cuando exista.
- [ ] Mantener derivación a Mesa de Trabajo como dato local separado.

## FASE 8: Cambiar carga de preferencias y confirmaciones

### Objetivo

Hidratar preferencias y confirmaciones desde Firestore sin romper arranque visual ni validaciones.

- [ ] Mantener `TemaBoot` leyendo local al primer arranque para evitar parpadeo visual.
- [ ] Después de sesión lista, cargar preferencias Firestore si hay usuario Firebase.
- [ ] Aplicar preferencias Firestore al store solo si son válidas.
- [ ] Mantener fallback local para preferencias.
- [ ] Cargar confirmaciones Firestore como `Set` de `precioId`.
- [ ] Mantener fallback local para confirmaciones.
- [ ] Confirmar que confirmar precio no duplica estado local ni Firestore.
- [ ] Confirmar que cerrar sesión limpia estado reactivo de confirmaciones.

## FASE 9: Manejar sesión, logout y cambio de usuario

### Objetivo

Evitar mezcla de datos privados entre usuarios.

- [ ] Esperar `UsuarioStore.esperarSesionLista()` antes de cargar datos principales.
- [ ] Al iniciar sesión, limpiar estado reactivo anterior antes de hidratar Firestore.
- [ ] Al cerrar sesión, limpiar stores privados.
- [ ] Al volver a usuario local, cargar solo almacenamiento local.
- [ ] Al cambiar de usuario Firebase, limpiar datos del usuario anterior.
- [ ] Evitar que writes pendientes del usuario anterior se apliquen al usuario nuevo.
- [ ] Confirmar que datos cacheados de Firestore no se muestran al usuario incorrecto.
- [ ] Documentar flujo esperado de sesión.

## FASE 10: Revisar escrituras durante transición

### Objetivo

Mantener compatibilidad mientras las lecturas pasan a Firestore.

- [ ] Mantener guardado local primero durante esta etapa.
- [ ] Mantener sincronización Firestore después del guardado local.
- [ ] Confirmar que editar un dato cargado desde Firestore también queda local.
- [ ] Confirmar que eliminar un dato cargado desde Firestore marca eliminación correctamente.
- [ ] Confirmar que las fotos siguen pasando por Storage.
- [ ] Definir si se necesita guardar snapshot Firestore en local después de cargar.
- [ ] Evitar bucles de escritura al hidratar datos desde Firestore.
- [ ] Registrar estados `pendiente`, `sincronizado` y `error` de forma visible para debugging.

## FASE 11: Preparar fallback local controlado

### Objetivo

Usar LocalStorage/Capacitor como respaldo sin ocultar problemas reales.

- [ ] Crear helper para cargar fallback local por dominio.
- [ ] Registrar cuándo se usó fallback local.
- [ ] Mostrar advertencia discreta en configuración si Firestore falló.
- [ ] No mostrar alertas invasivas en flujos normales.
- [ ] Confirmar que una app recién instalada sin cache y sin internet muestra estado vacío claro.
- [ ] Confirmar que una app con cache Firestore funciona offline sin tocar local.
- [ ] Confirmar que local no pisa Firestore automáticamente.

## FASE 12: Actualizar UI de estados de datos

### Objetivo

Dar visibilidad mínima al usuario y buena información para debugging.

- [ ] Mostrar en configuración la fuente activa de datos.
- [ ] Mostrar si los datos vienen de Firestore, cache offline o respaldo local.
- [ ] Mostrar último estado de sincronización.
- [ ] Mostrar pendientes o errores sin bloquear uso normal.
- [ ] Mantener textos cortos y claros.
- [ ] Evitar agregar pantallas nuevas si alcanza con configuración.
- [ ] Confirmar que UI móvil no queda saturada.

## FASE 13: Actualizar documentación

### Objetivo

Mantener planes y resúmenes alineados con el cambio de arquitectura.

- [ ] Actualizar `Planes/Resumenes/ModeloFirestoreMigracion.md`.
- [ ] Actualizar `Planes/Resumenes/Resumen11Firebase.md`.
- [ ] Actualizar `Planes/PlanesFuturos/PlanMaestroFirebase.md` cuando el plan quede completado.
- [ ] Documentar que Firestore pasa a fuente principal de lectura.
- [ ] Documentar que LocalStorage/Capacitor queda como respaldo temporal.
- [ ] Documentar qué falta para eliminar dependencia local en un plan posterior.

## FASE TESTING

### Objetivo

Validar que Firestore puede ser fuente principal sin pérdida de datos ni mezcla de usuarios.

- [ ] Ejecutar lint o el comando de validación disponible del proyecto.
- [ ] Iniciar sesión con usuario Firebase con datos ya migrados.
- [ ] Confirmar que productos y precios cargan desde Firestore.
- [ ] Confirmar que comercios y direcciones cargan desde Firestore.
- [ ] Confirmar que Lista Justa carga desde Firestore.
- [ ] Confirmar que preferencias se aplican correctamente después de sesión lista.
- [ ] Confirmar que confirmaciones cargan desde Firestore.
- [ ] Desconectar internet y reiniciar app para validar cache Firestore.
- [ ] Probar app recién instalada sin cache y sin internet.
- [ ] Cerrar sesión y confirmar que stores privados quedan limpios.
- [ ] Iniciar sesión con otro usuario y confirmar que no aparecen datos del usuario anterior.
- [ ] Crear, editar y eliminar datos con Firestore como fuente principal.
- [ ] Confirmar que LocalStorage/Capacitor conserva respaldo temporal.
- [ ] Confirmar que Firestore no contiene base64.
- [ ] Confirmar que fotos se muestran desde Storage o fallback local según corresponda.
- [ ] Probar Android con `npm run cel` solo si el cambio ya pasó validaciones web.

## Progreso del plan

- [ ] Fase 1: Auditar lecturas actuales
- [ ] Fase 2: Definir estrategia de fuente de datos
- [ ] Fase 3: Crear servicio coordinador de carga inicial
- [ ] Fase 4: Preparar lecturas Firestore por dominio
- [ ] Fase 5: Cambiar carga de productos y precios
- [ ] Fase 6: Cambiar carga de comercios y direcciones
- [ ] Fase 7: Cambiar carga de Lista Justa
- [ ] Fase 8: Cambiar carga de preferencias y confirmaciones
- [ ] Fase 9: Manejar sesión, logout y cambio de usuario
- [ ] Fase 10: Revisar escrituras durante transición
- [ ] Fase 11: Preparar fallback local controlado
- [ ] Fase 12: Actualizar UI de estados de datos
- [ ] Fase 13: Actualizar documentación
- [ ] Fase Testing

Fecha de creación: 21 de Mayo 2026
Fecha de última actualización: 21 de Mayo 2026
Estado: BORRADOR
