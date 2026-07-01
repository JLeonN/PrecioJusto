# Plan Cache Local Primero Firestore

## Descripcion del plan

Mejorar la carga de datos privados para que la app muestre primero lo que ya existe en el dispositivo y luego actualice desde Firestore en segundo plano. El objetivo es evitar cargas visibles repetidas, reducir lecturas innecesarias, conservar fotos locales del usuario y no descargar todo cada vez que se entra a una seccion.

Estado real verificado antes de ejecutar:

- `FuentePrincipalFirestoreService` es el punto central de lectura entre local y Firestore.
- `productosStore.cargarProductos()` espera el resultado completo antes de mostrar productos.
- `FirestoreProductosService.obtenerProductosUsuario()` hoy consulta por `fechaActualizacion` descendente con `limit`, pero no tiene consulta incremental por fecha.
- `ProductosService.guardarProducto()` guarda local y tambien sincroniza hacia Firestore, por lo tanto no debe usarse para escribir cache local de datos que vienen desde Firestore.
- `IndexedDbAdapter` tiene `configurarEspacioTrabajo`, pero `CapacitorAdapter` todavia no separa claves por usuario.
- `UsuarioStore` cambia el usuario actual con `UsuarioActualService`, pero no configura el espacio de trabajo del adaptador.

La regla central del plan es: mostrar local primero, actualizar desde la nube despues, sin pisar fotos ni mezclar datos entre usuarios.

## Objetivo principal

- Mostrar productos, comercios, listas, preferencias y mesa desde cache local por usuario antes de esperar Firestore.
- Actualizar desde Firestore en segundo plano cuando corresponda.
- Evitar que datos remotos sin foto pisen fotos locales del dispositivo.
- Recuperar fotos locales antiguas que quedaron en el espacio compartido antes de separar cache por usuario.
- Reducir esperas y lecturas repetidas al navegar por la app.
- Completar el patron en productos, comercios, listas, preferencias y mesa para cerrar este frente.

## Reglas del plan

- No tocar Firebase Storage ni activar Blaze.
- No subir fotos locales a la nube.
- No borrar datos locales automaticamente.
- No mezclar datos entre usuarios Firebase ni con el usuario local legacy.
- No guardar fotos base64 en Firestore, backups, colas, inventarios ni estados globales.
- Preservar fotos locales cuando Firestore traiga `null`, campo vacio o no traiga foto.
- Buscar fotos legacy en el espacio `compartido` solo para recuperar imagenes locales, nunca para mezclar datos de negocio entre cuentas.
- La recuperacion legacy debe ser global para todos los dominios con imagenes: productos, comercios, direcciones, items de Lista Justa y mesa de trabajo.
- Preferencias no tienen fotos; ahi solo aplica local primero y cache por usuario.
- Mantener LocalStorage, IndexedDB o Capacitor como cache local por usuario.
- Aplicar el patron ya validado en Mis Productos y extenderlo al resto en este mismo plan.
- No crear un segundo sistema paralelo de datos: extender los servicios actuales.
- No usar `ProductosService.guardarProducto()` para guardar cache remota local si eso vuelve a sincronizar hacia Firestore.

## FASE 1: Auditar Lectura Actual

### Objetivo

Confirmar los puntos exactos donde la app bloquea la pantalla esperando Firestore, reemplaza estado local o pierde fotos.

- [x] Revisar `FuentePrincipalFirestoreService.js` y confirmar como decide entre local, Firestore, error y cuenta vacia.
- [x] Revisar `productosStore.js` y confirmar que `cargarProductos()` bloquea con `cargando` hasta recibir Firestore.
- [x] Revisar `MisProductosPage.vue` y confirmar donde se muestra el loader grande.
- [x] Revisar `ProductosService.js` y confirmar que `guardarProducto()` sincroniza hacia Firestore.
- [x] Revisar `FirestoreProductosService.js` y confirmar que `obtenerProductosUsuario()` solo trae pagina limitada por `fechaActualizacion`.
- [x] Revisar `UsuarioStore.js`, `UsuarioActualService.js`, `AlmacenamientoService.js`, `IndexedDbAdapter.js` y `CapacitorAdapter.js` para confirmar separacion de cache por usuario.
- [x] Repetir auditoria rapida en comercios, Lista Justa, preferencias y mesa para ubicar stores y servicios equivalentes.
- [x] Documentar en el mismo plan cualquier archivo adicional encontrado antes de implementar.

## FASE 2: Separar Cache Local Por Usuario

### Objetivo

Asegurar que el cache local de una cuenta Firebase no se mezcle con otra cuenta ni con datos locales anteriores.

- [x] Definir un identificador local seguro para cada usuario: `uid-${usuarioIdNormalizado}`.
- [x] Conectar `UsuarioStore.aplicarUsuarioAutenticado()` con `configurarEspacioTrabajoAlmacenamiento()`.
- [x] Al iniciar sesion Firebase, configurar el espacio de trabajo con el `usuarioId`.
- [x] Al cerrar sesion, volver al espacio de trabajo `compartido` o al usuario local legacy, segun el flujo actual.
- [x] Agregar `configurarEspacioTrabajo()` a `CapacitorAdapter` con la misma logica que `IndexedDbAdapter`.
- [x] Ajustar `CapacitorAdapter.listarTodo()`, `guardar()`, `obtener()`, `eliminar()` y `limpiarTodo()` para usar el prefijo activo del espacio de trabajo.
- [x] Evitar que `listarTodo()` en modo compartido lea claves de otros espacios `uid-*`.
- [ ] Probar que dos cuentas distintas no lean los mismos productos desde cache local.
- [ ] Mantener intactos los datos locales existentes para que sigan disponibles para migracion manual.

## FASE 3: Crear Escritura Local Solo Cache

### Objetivo

Permitir guardar en el dispositivo datos recibidos desde Firestore sin reenviarlos a Firestore ni cambiar fechas artificialmente.

- [x] Agregar en `ProductosService.js` un metodo local-only, por ejemplo `guardarProductoEnCacheLocal(producto)`.
- [x] El metodo local-only debe escribir con `adaptadorActual.guardar()` y no llamar a `_sincronizarProductoFirestore()`.
- [x] Agregar un metodo para guardar varios productos en cache local por tandas, por ejemplo `guardarProductosEnCacheLocal(productos, opciones)`.
- [x] Procesar la escritura local por lotes chicos para no bloquear el hilo principal.
- [ ] No clonar ni serializar fotos base64 mas de lo necesario.
- [ ] No modificar `fechaActualizacion` cuando el dato viene de Firestore.
- [ ] Si el producto remoto esta marcado como `eliminado: true`, eliminarlo o marcarlo localmente sin volver a enviarlo a Firestore.
- [x] Dejar nombres de metodos equivalentes preparados para comercios, listas, preferencias y mesa cuando se extienda el patron.

## FASE 4: Implementar Local Primero En Mis Productos

### Objetivo

Hacer que Mis Productos muestre datos locales inmediatamente y actualice desde Firestore en segundo plano.

- [x] Modificar `productosStore.cargarProductos()` para cargar primero `productosService.obtenerTodos()`.
- [x] Asignar `productos.value` con los datos locales apenas esten disponibles.
- [x] Apagar `cargando` despues de la carga local, no despues de Firestore, si ya hay datos locales.
- [x] Usar `sincronizando` para indicar la actualizacion remota en segundo plano.
- [x] Lanzar la consulta Firestore sin bloquear la pantalla.
- [x] Si Firestore devuelve error, conservar datos locales visibles y mostrar error no bloqueante.
- [x] Si Firestore devuelve datos, fusionarlos con el estado local.
- [x] Guardar el resultado fusionado en cache local usando metodos local-only.
- [x] Evitar recargas visibles al cambiar de seccion si la ultima sincronizacion fue reciente.
- [x] Mantener `recargarProductos()` como accion manual que si puede forzar consulta remota.

## FASE 5: Merge Sin Perder Fotos

### Objetivo

Evitar que una lectura de Firestore sin fotos elimine fotos locales tomadas por el usuario.

- [x] Crear una funcion pura de merge para producto local + producto Firestore.
- [x] Identificar el producto por `id`.
- [x] Usar campos remotos para datos de negocio porque Firestore es la fuente principal.
- [x] Conservar `imagen` local si contiene base64 del usuario y Firestore no trae `imagenUrl` valida.
- [x] Usar `imagenUrl` remota si existe y representa una URL externa valida.
- [x] No copiar base64 local hacia campos remotos ni hacia Firestore.
- [x] Preservar `fotoFuente`, `imagenRutaStorage`, `fechaCreacion`, `fechaActualizacion`, `ultimaInteraccion` y `eliminado` de forma coherente.
- [x] Si Firestore trae `eliminado: true`, quitar el producto del listado visible y limpiar cache local de ese producto.
- [ ] Probar merge con producto local con foto y Firestore sin foto.
- [ ] Probar merge con producto local sin foto y Firestore con URL externa.
- [ ] Probar producto de API con imagen externa para confirmar que no se pierde.

## FASE 6: Control De Sincronizacion Y Lecturas

### Objetivo

Reducir consultas repetidas sin asumir que ya existe sincronizacion incremental completa.

- [x] Guardar por dominio una marca local de ultima sincronizacion, por ejemplo `cacheFirestoreProductosMeta`.
- [x] La marca debe incluir `usuarioId`, `fechaUltimaSincronizacion`, `fechaUltimoIntento`, `cantidadRemota` y `versionCache`.
- [x] Definir una ventana minima para no consultar Firestore en cada entrada de pantalla, por ejemplo 1 a 5 minutos.
- [x] Mantener una opcion de recarga manual que ignore esa ventana.
- [x] En esta primera ejecucion, usar carga remota limitada existente como refresh de fondo.
- [x] No implementar incremental por fecha hasta agregar metodos claros en `FirestoreProductosService`.
- [ ] Si se decide implementar incremental en esta fase, agregar metodo separado `obtenerProductosActualizadosDesde(fechaIso, opciones)`.
- [ ] El incremental debe usar `where('fechaActualizacion', '>', fechaIso)` + `orderBy('fechaActualizacion', 'asc')` y contemplar indices de Firestore si aparecen errores.
- [ ] Mantener fallback a refresh completo si falta fecha, falla el indice o la cuenta no tiene marca local.

## FASE 7: Recuperar Fotos Legacy Del Dispositivo

### Objetivo

Recuperar fotos locales antiguas que quedaron en el espacio `compartido` cuando el cache paso a estar separado por usuario. Esta fase debe resolverse como helper global antes de extender el patron al resto.

- [x] Crear un helper global, por ejemplo `FotosLegacyCacheService`, para leer temporalmente desde `compartido` usando `ejecutarConEspacioTrabajoAlmacenamiento('compartido', ...)`.
- [x] El helper debe leer solo datos legacy necesarios para fotos desde estas claves reales: `PREFIJO_PRODUCTOS`, `CLAVE_COMERCIOS`, `CLAVE_LISTA_JUSTA` y `CLAVE_SESION_ESCANEO`.
- [x] El helper debe exponer funciones puras para fusionar fotos, sin guardar ni sincronizar por su cuenta.
- [x] Productos: buscar por `producto.id` y recuperar solo `imagen`, `fotoFuente`, `sincronizacionFoto`, `imagenUrl` externa si corresponde y `imagenRutaStorage`.
- [x] Comercios: buscar por `comercio.id` y recuperar solo `foto`, `fotoFuente`, `fotoUrl` externa si corresponde y `fotoRutaStorage`.
- [x] Direcciones: buscar por `comercio.id` + `direccion.id` y recuperar solo `foto`, `fotoFuente`, `fotoUrl` externa si corresponde y `fotoRutaStorage`.
- [x] Lista Justa: buscar por `lista.id` + `item.id` y recuperar solo `imagen`, `fotoFuente`, `imagenUrl` externa si corresponde y `imagenRutaStorage`.
- [x] Mesa de trabajo: buscar por `item.id` y recuperar solo `imagen`, `fotoFuente`, `imagenUrl` externa si corresponde, `imagenRutaStorage` y, si existe, `datosOriginales.imagen` con su `fotoFuente`.
- [x] No copiar nombre, precios, fechas, estado, comercio, moneda, cantidades ni ningun otro dato de negocio desde `compartido`.
- [x] No copiar fotos base64 a Firestore, backups, colas ni estados globales.
- [x] Guardar la foto recuperada en el cache local del usuario con metodos local-only del dominio correspondiente.
- [x] No subir la foto recuperada a Firestore ni Firebase Storage.
- [x] Si no existe foto legacy, dejar el item sin imagen y no mostrar error al usuario.
- [x] Integrar el helper en el merge de productos ya existente.
- [x] Integrar el helper en el merge de comercios/direcciones cuando se implemente comercios.
- [x] Integrar el helper en el merge de listas cuando se implemente Lista Justa.
- [x] Integrar el helper en el merge de mesa cuando se implemente mesa de trabajo.
- [ ] Probar con una cuenta que antes tenia fotos locales y confirmar que reaparecen si todavia existen en el dispositivo.

## FASE 8: Extender Patron A Otros Dominios

### Objetivo

Aplicar el patron validado de Mis Productos al resto de datos privados sin romper lo que ya sincroniza bien.

- [x] Auditar `ComerciosService`, `FirestoreComerciosService`, `comerciosStore` y paginas que llaman `cargarComercios()`.
- [x] En `ComerciosService`, agregar metodos local-only para guardar cache de comercios y direcciones sin llamar `sincronizarComercioFirestore`.
- [x] Aplicar local primero a comercios y direcciones usando `ComerciosService`, `FirestoreComerciosService` y `comerciosStore`.
- [x] Fusionar comercios por `id` preservando fotos locales de comercio y direcciones si Firestore no trae URL valida.
- [x] Usar recuperacion legacy global para `comercio.foto` y `direccion.foto`.
- [x] Guardar metadatos de ultima sincronizacion de comercios con una clave propia, por ejemplo `cacheFirestoreComerciosMeta`.
- [x] Auditar `ListaJustaService`, `FirestoreListasJustasService`, `ListaJustaStore` y paginas de Lista Justa.
- [x] En `ListaJustaService`, agregar metodos local-only para guardar cache de listas sin llamar `sincronizarListasFirestore`.
- [x] Aplicar local primero a Lista Justa usando `ListaJustaService`, `FirestoreListasJustasService` y `ListaJustaStore`.
- [x] Fusionar listas por `id` y preservar imagenes locales de items si existen.
- [x] Usar recuperacion legacy global para `lista.items[].imagen`.
- [x] Guardar metadatos de ultima sincronizacion de listas con una clave propia, por ejemplo `cacheFirestoreListasMeta`.
- [x] Auditar `PreferenciasService`, `FirestorePreferenciasService` y `preferenciasStore`.
- [x] En `PreferenciasService`, agregar guardado local-only de preferencias para cache remoto sin reenviar inmediatamente a Firestore.
- [x] Aplicar local primero a preferencias, manteniendo Firestore como fuente principal cuando responde.
- [x] Auditar `sesionEscaneoStore`, `FirestoreMesaTrabajoService`, `SesionEscaneoService` y `MesaTrabajoPage`.
- [x] En `SesionEscaneoService`, agregar metodos local-only para cache de mesa sin llamar `firestoreMesaTrabajoService`.
- [x] Aplicar local primero a mesa de trabajo y preservar imagenes locales de items si existen.
- [x] Revisar y ajustar `resolverCargaMesaConRespaldoLocal` para no migrar datos compartidos silenciosamente a la cuenta actual; el espacio `compartido` solo debe usarse para fotos legacy.
- [x] Usar recuperacion legacy global para `item.imagen` y `item.datosOriginales.imagen`.
- [x] Guardar metadatos de ultima sincronizacion de mesa con una clave propia, por ejemplo `cacheFirestoreMesaMeta`.
- [ ] Crear helpers compartidos solo si el patron ya se repitio al menos en productos y comercios.
- [ ] Confirmar que cada dominio usa cache por usuario y no cache global compartida.
- [ ] No cambiar reglas de migracion local preguntada salvo que una prueba demuestre que afecta este flujo.

## FASE 9: Ajustes De UX

### Objetivo

Hacer que el usuario sienta la app rapida sin mostrar informacion tecnica innecesaria.

- [ ] Evitar loaders grandes cuando hay cache local.
- [ ] Mostrar `Actualizando...` solo si realmente se consulta la nube.
- [ ] No mostrar textos de Firebase, Firestore ni cache al usuario normal.
- [ ] Mantener feedback de error si no se pudo actualizar, sin ocultar datos locales.
- [ ] Confirmar que navegar entre pantallas no dispara cargas visibles innecesarias.
- [ ] Confirmar que las fotos locales no desaparecen visualmente durante la actualizacion.
- [ ] Si una foto legacy se recupera correctamente, no mostrar aviso tecnico al usuario.
- [ ] Si una foto legacy ya no existe en el dispositivo, no mostrar error; simplemente dejar el producto sin imagen.

## FASE TESTING

### Objetivo

Validar de forma ejecutable por IA y revisable por humano que la app carga rapido, conserva fotos locales y sincroniza sin mezclar usuarios.

- [x] Ejecutar `rg -n "\\x{00C3}|\\x{00C2}|\\x{00E2}|\\x{FFFD}" src Planes`.
- [x] Ejecutar `npm run lint`.
- [x] Ejecutar `npm run build`.
- [ ] Probar con una cuenta que tenga mas de 80 productos.
- [ ] Entrar a Mis Productos y confirmar que muestra cache local de inmediato.
- [ ] Cambiar de seccion y volver a Mis Productos, confirmando que no descarga todo otra vez de forma visible.
- [ ] Confirmar que fotos locales de productos no desaparecen despues de sincronizar.
- [ ] Crear o editar un producto en otro dispositivo o entorno de prueba y confirmar que aparece luego de la sincronizacion.
- [ ] Probar con producto local con foto y Firestore sin foto.
- [ ] Probar recuperacion de foto legacy desde el espacio `compartido` hacia el cache del usuario.
- [ ] Probar con producto de API con URL externa y confirmar que la URL se conserva.
- [ ] Probar comercio con foto local antigua y Firestore sin foto.
- [ ] Probar direccion de comercio con foto local antigua y Firestore sin foto.
- [ ] Probar item de Lista Justa o mesa con imagen local antigua si existe ese caso.
- [ ] Probar cierre de sesion e ingreso con otro usuario, confirmando que no se mezclan datos ni fotos.
- [ ] Probar sin internet y confirmar que se muestran datos locales.
- [ ] Recuperar internet y confirmar que se actualiza en segundo plano.
- [ ] Repetir pruebas basicas en comercios, Lista Justa, preferencias y mesa despues de extender el patron.
- [ ] Probar en Android real antes de publicar.

## Progreso del plan

- [x] Fase 1: Auditar Lectura Actual
- [x] Fase 2: Separar Cache Local Por Usuario
- [x] Fase 3: Crear Escritura Local Solo Cache
- [x] Fase 4: Implementar Local Primero En Mis Productos
- [x] Fase 5: Merge Sin Perder Fotos
- [x] Fase 6: Control De Sincronizacion Y Lecturas
- [x] Fase 7: Recuperar Fotos Legacy Del Dispositivo
- [x] Fase 8: Extender Patron A Otros Dominios
- [ ] Fase 9: Ajustes De UX
- [ ] Fase Testing

Fecha de creacion: 30 de Junio 2026
Fecha de ultima actualizacion: 30 de Junio 2026
Estado: EN PROCESO
