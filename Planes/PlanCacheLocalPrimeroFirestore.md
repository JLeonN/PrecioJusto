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
- Reducir esperas y lecturas repetidas al navegar por la app.
- Crear un patron reutilizable empezando por Mis Productos como dominio piloto.

## Reglas del plan

- No tocar Firebase Storage ni activar Blaze.
- No subir fotos locales a la nube.
- No borrar datos locales automaticamente.
- No mezclar datos entre usuarios Firebase ni con el usuario local legacy.
- No guardar fotos base64 en Firestore, backups, colas, inventarios ni estados globales.
- Preservar fotos locales cuando Firestore traiga `null`, campo vacio o no traiga foto.
- Mantener LocalStorage, IndexedDB o Capacitor como cache local por usuario.
- Aplicar primero en Mis Productos y extender al resto solo cuando el piloto este validado.
- No crear un segundo sistema paralelo de datos: extender los servicios actuales.
- No usar `ProductosService.guardarProducto()` para guardar cache remota local si eso vuelve a sincronizar hacia Firestore.

## FASE 1: Auditar Lectura Actual

### Objetivo

Confirmar los puntos exactos donde la app bloquea la pantalla esperando Firestore, reemplaza estado local o pierde fotos.

- [ ] Revisar `FuentePrincipalFirestoreService.js` y confirmar como decide entre local, Firestore, error y cuenta vacia.
- [ ] Revisar `productosStore.js` y confirmar que `cargarProductos()` bloquea con `cargando` hasta recibir Firestore.
- [ ] Revisar `MisProductosPage.vue` y confirmar donde se muestra el loader grande.
- [ ] Revisar `ProductosService.js` y confirmar que `guardarProducto()` sincroniza hacia Firestore.
- [ ] Revisar `FirestoreProductosService.js` y confirmar que `obtenerProductosUsuario()` solo trae pagina limitada por `fechaActualizacion`.
- [ ] Revisar `UsuarioStore.js`, `UsuarioActualService.js`, `AlmacenamientoService.js`, `IndexedDbAdapter.js` y `CapacitorAdapter.js` para confirmar separacion de cache por usuario.
- [ ] Repetir auditoria rapida en comercios, Lista Justa, preferencias y mesa para ubicar stores y servicios equivalentes.
- [ ] Documentar en el mismo plan cualquier archivo adicional encontrado antes de implementar.

## FASE 2: Separar Cache Local Por Usuario

### Objetivo

Asegurar que el cache local de una cuenta Firebase no se mezcle con otra cuenta ni con datos locales anteriores.

- [ ] Definir un identificador local seguro para cada usuario: `uid-${usuarioIdNormalizado}`.
- [ ] Conectar `UsuarioStore.aplicarUsuarioAutenticado()` con `configurarEspacioTrabajoAlmacenamiento()`.
- [ ] Al iniciar sesion Firebase, configurar el espacio de trabajo con el `usuarioId`.
- [ ] Al cerrar sesion, volver al espacio de trabajo `compartido` o al usuario local legacy, segun el flujo actual.
- [ ] Agregar `configurarEspacioTrabajo()` a `CapacitorAdapter` con la misma logica que `IndexedDbAdapter`.
- [ ] Ajustar `CapacitorAdapter.listarTodo()`, `guardar()`, `obtener()`, `eliminar()` y `limpiarTodo()` para usar el prefijo activo del espacio de trabajo.
- [ ] Evitar que `listarTodo()` en modo compartido lea claves de otros espacios `uid-*`.
- [ ] Probar que dos cuentas distintas no lean los mismos productos desde cache local.
- [ ] Mantener intactos los datos locales existentes para que sigan disponibles para migracion manual.

## FASE 3: Crear Escritura Local Solo Cache

### Objetivo

Permitir guardar en el dispositivo datos recibidos desde Firestore sin reenviarlos a Firestore ni cambiar fechas artificialmente.

- [ ] Agregar en `ProductosService.js` un metodo local-only, por ejemplo `guardarProductoEnCacheLocal(producto)`.
- [ ] El metodo local-only debe escribir con `adaptadorActual.guardar()` y no llamar a `_sincronizarProductoFirestore()`.
- [ ] Agregar un metodo para guardar varios productos en cache local por tandas, por ejemplo `guardarProductosEnCacheLocal(productos, opciones)`.
- [ ] Procesar la escritura local por lotes chicos para no bloquear el hilo principal.
- [ ] No clonar ni serializar fotos base64 mas de lo necesario.
- [ ] No modificar `fechaActualizacion` cuando el dato viene de Firestore.
- [ ] Si el producto remoto esta marcado como `eliminado: true`, eliminarlo o marcarlo localmente sin volver a enviarlo a Firestore.
- [ ] Dejar nombres de metodos equivalentes preparados para comercios, listas, preferencias y mesa cuando se extienda el patron.

## FASE 4: Implementar Local Primero En Mis Productos

### Objetivo

Hacer que Mis Productos muestre datos locales inmediatamente y actualice desde Firestore en segundo plano.

- [ ] Modificar `productosStore.cargarProductos()` para cargar primero `productosService.obtenerTodos()`.
- [ ] Asignar `productos.value` con los datos locales apenas esten disponibles.
- [ ] Apagar `cargando` despues de la carga local, no despues de Firestore, si ya hay datos locales.
- [ ] Usar `sincronizando` para indicar la actualizacion remota en segundo plano.
- [ ] Lanzar la consulta Firestore sin bloquear la pantalla.
- [ ] Si Firestore devuelve error, conservar datos locales visibles y mostrar error no bloqueante.
- [ ] Si Firestore devuelve datos, fusionarlos con el estado local.
- [ ] Guardar el resultado fusionado en cache local usando metodos local-only.
- [ ] Evitar recargas visibles al cambiar de seccion si la ultima sincronizacion fue reciente.
- [ ] Mantener `recargarProductos()` como accion manual que si puede forzar consulta remota.

## FASE 5: Merge Sin Perder Fotos

### Objetivo

Evitar que una lectura de Firestore sin fotos elimine fotos locales tomadas por el usuario.

- [ ] Crear una funcion pura de merge para producto local + producto Firestore.
- [ ] Identificar el producto por `id`.
- [ ] Usar campos remotos para datos de negocio porque Firestore es la fuente principal.
- [ ] Conservar `imagen` local si contiene base64 del usuario y Firestore no trae `imagenUrl` valida.
- [ ] Usar `imagenUrl` remota si existe y representa una URL externa valida.
- [ ] No copiar base64 local hacia campos remotos ni hacia Firestore.
- [ ] Preservar `fotoFuente`, `imagenRutaStorage`, `fechaCreacion`, `fechaActualizacion`, `ultimaInteraccion` y `eliminado` de forma coherente.
- [ ] Si Firestore trae `eliminado: true`, quitar el producto del listado visible y limpiar cache local de ese producto.
- [ ] Probar merge con producto local con foto y Firestore sin foto.
- [ ] Probar merge con producto local sin foto y Firestore con URL externa.
- [ ] Probar producto de API con imagen externa para confirmar que no se pierde.

## FASE 6: Control De Sincronizacion Y Lecturas

### Objetivo

Reducir consultas repetidas sin asumir que ya existe sincronizacion incremental completa.

- [ ] Guardar por dominio una marca local de ultima sincronizacion, por ejemplo `cacheFirestoreProductosMeta`.
- [ ] La marca debe incluir `usuarioId`, `fechaUltimaSincronizacion`, `fechaUltimoIntento`, `cantidadRemota` y `versionCache`.
- [ ] Definir una ventana minima para no consultar Firestore en cada entrada de pantalla, por ejemplo 1 a 5 minutos.
- [ ] Mantener una opcion de recarga manual que ignore esa ventana.
- [ ] En esta primera ejecucion, usar carga remota limitada existente como refresh de fondo.
- [ ] No implementar incremental por fecha hasta agregar metodos claros en `FirestoreProductosService`.
- [ ] Si se decide implementar incremental en esta fase, agregar metodo separado `obtenerProductosActualizadosDesde(fechaIso, opciones)`.
- [ ] El incremental debe usar `where('fechaActualizacion', '>', fechaIso)` + `orderBy('fechaActualizacion', 'asc')` y contemplar indices de Firestore si aparecen errores.
- [ ] Mantener fallback a refresh completo si falta fecha, falla el indice o la cuenta no tiene marca local.

## FASE 7: Extender Patron A Otros Dominios

### Objetivo

Aplicar el patron validado de Mis Productos al resto de datos privados sin romper lo que ya sincroniza bien.

- [ ] Aplicar local primero a comercios y direcciones usando `ComerciosService`, `FirestoreComerciosService` y `comerciosStore`.
- [ ] Preservar fotos locales de comercios si existen.
- [ ] Aplicar local primero a Lista Justa usando `ListaJustaService`, `FirestoreListasJustasService` y `ListaJustaStore`.
- [ ] Aplicar local primero a preferencias usando `PreferenciasService`, `FirestorePreferenciasService` y `preferenciasStore`.
- [ ] Aplicar local primero a mesa usando `sesionEscaneoStore`, `FirestoreMesaTrabajoService` y servicios relacionados.
- [ ] Crear helpers compartidos solo si el patron ya se repitio al menos en productos y comercios.
- [ ] Confirmar que cada dominio usa cache por usuario y no cache global compartida.
- [ ] No cambiar reglas de migracion local preguntada salvo que una prueba demuestre que afecta este flujo.

## FASE 8: Ajustes De UX

### Objetivo

Hacer que el usuario sienta la app rapida sin mostrar informacion tecnica innecesaria.

- [ ] Evitar loaders grandes cuando hay cache local.
- [ ] Mostrar `Actualizando...` solo si realmente se consulta la nube.
- [ ] No mostrar textos de Firebase, Firestore ni cache al usuario normal.
- [ ] Mantener feedback de error si no se pudo actualizar, sin ocultar datos locales.
- [ ] Confirmar que navegar entre pantallas no dispara cargas visibles innecesarias.
- [ ] Confirmar que las fotos locales no desaparecen visualmente durante la actualizacion.

## FASE TESTING

### Objetivo

Validar de forma ejecutable por IA y revisable por humano que la app carga rapido, conserva fotos locales y sincroniza sin mezclar usuarios.

- [ ] Ejecutar `rg -n "\\x{00C3}|\\x{00C2}|\\x{00E2}|\\x{FFFD}" src Planes`.
- [ ] Ejecutar `npm run lint`.
- [ ] Ejecutar `npm run build`.
- [ ] Probar con una cuenta que tenga mas de 80 productos.
- [ ] Entrar a Mis Productos y confirmar que muestra cache local de inmediato.
- [ ] Cambiar de seccion y volver a Mis Productos, confirmando que no descarga todo otra vez de forma visible.
- [ ] Confirmar que fotos locales de productos no desaparecen despues de sincronizar.
- [ ] Crear o editar un producto en otro dispositivo o entorno de prueba y confirmar que aparece luego de la sincronizacion.
- [ ] Probar con producto local con foto y Firestore sin foto.
- [ ] Probar con producto de API con URL externa y confirmar que la URL se conserva.
- [ ] Probar cierre de sesion e ingreso con otro usuario, confirmando que no se mezclan datos ni fotos.
- [ ] Probar sin internet y confirmar que se muestran datos locales.
- [ ] Recuperar internet y confirmar que se actualiza en segundo plano.
- [ ] Repetir pruebas basicas en comercios, Lista Justa, preferencias y mesa despues de extender el patron.
- [ ] Probar en Android real antes de publicar.

## Progreso del plan

- [ ] Fase 1: Auditar Lectura Actual
- [ ] Fase 2: Separar Cache Local Por Usuario
- [ ] Fase 3: Crear Escritura Local Solo Cache
- [ ] Fase 4: Implementar Local Primero En Mis Productos
- [ ] Fase 5: Merge Sin Perder Fotos
- [ ] Fase 6: Control De Sincronizacion Y Lecturas
- [ ] Fase 7: Extender Patron A Otros Dominios
- [ ] Fase 8: Ajustes De UX
- [ ] Fase Testing

Fecha de creacion: 30 de Junio 2026
Fecha de ultima actualizacion: 30 de Junio 2026
Estado: BORRADOR
