# PLAN SINCRONIZACION INCREMENTAL GLOBAL

## Descripcion del plan

Mejorar la sincronizacion local-first de Precio Justo para que todos los dominios privados puedan abrir rapido desde cache local y actualizarse desde Firestore sin recargar datos pesados completos cuando no hace falta. El plan busca que productos, comercios, listas y mesa de trabajo detecten altas, cambios y borrados de forma liviana, guarden el resultado en cache local y mantengan Firestore como verdad cuando responde correctamente.

## Objetivo principal

- Crear un patron global de sincronizacion incremental por dominio.
- Mantener apertura rapida desde cache local.
- Descargar solo entidades nuevas o modificadas cuando sea posible.
- Eliminar del cache local entidades que ya no existan en Firestore.
- Evitar que datos pesados, como precios completos o fotos locales, bloqueen la aparicion de cambios nuevos.
- Conservar la politica actual de borrado real: borrar es borrar.

## Reglas del plan

- No romper Firebase produccion `preciojustoprod`.
- No perder la estrategia local-first.
- Firestore sigue siendo la verdad cuando responde correctamente.
- No limpiar cache local si Firestore falla, esta offline, no hay sesion o la respuesta remota no es confiable.
- No limpiar entidades locales sobrantes si la lectura remota fue parcial por `limit(...)`; antes debe existir paginacion completa o una marca explicita de lectura completa.
- No guardar fotos base64 en Firestore.
- Mantener fotos locales protegidas y fuera del objeto principal cuando aplique.
- Pensar el cambio como patron reusable para dominios privados, no como parche de una pantalla.
- Usar nombres en espanol y consistentes con el proyecto.
- No depender de `fechaUltimoUso` para detectar cambios de contenido; usar `fechaActualizacion` como version de sincronizacion.
- Mantener los datos pesados fuera del primer paso de sincronizacion cuando el dominio lo permita.

## Diagnostico previo de ejecucion simulada

El codigo actual ya tiene una base buena para ejecutar este plan:

- `productosStore`, `comerciosStore`, `ListaJustaStore` y `sesionEscaneoStore` ya muestran cache local primero y sincronizan Firestore despues.
- `ReconciliacionFirestoreLocalService.js` ya tiene helpers para limpiar locales sobrantes y filtrar locales vigentes.
- Cada dominio principal ya guarda metadatos de cache Firestore.
- Productos ya tiene resumenes en el documento principal: `precioMejor`, `comercioMejor`, `monedaReferencia`, tendencia y flags mayoristas.

Antes de ejecutar hay que cerrar estos huecos:

- `FirestoreProductosService.obtenerProductosUsuario({ incluirPrecios: true })` carga precios en serie; la sincronizacion principal debe usar `incluirPrecios: false`.
- Los servicios Firestore no tienen una API comun de "manifiesto remoto" por dominio; hay que crearla o estandarizarla.
- `FirestoreMesaTrabajoService` no tiene `obtenerItemMesaTrabajoPorId`; si el helper comun descarga detalles por ID, hay que agregarlo.
- Comercios y listas ordenan por `fechaUltimoUso`, pero la deteccion de cambios debe comparar `fechaActualizacion`.
- Las lecturas remotas actuales usan `limit(...)`; no se puede limpiar cache local contra una pagina parcial.
- En productos, la tarjeta actual espera `producto.precios` como array; la sincronizacion liviana debe garantizar `precios: []` o adaptar la UI para no romper.

## FASE 1: Relevar dominios y contratos actuales

### Objetivo

Entender como carga, guarda, sincroniza y borra cada dominio antes de tocar la arquitectura comun.

- [x] Revisar el flujo actual de productos desde store, service local, service Firestore y reconciliacion.
- [x] Revisar el flujo actual de comercios desde store, service local, service Firestore y reconciliacion.
- [x] Revisar el flujo actual de listas desde store, service local, service Firestore y reconciliacion.
- [x] Revisar el flujo actual de mesa de trabajo desde store, service local, service Firestore y reconciliacion.
- [x] Identificar que campos livianos necesita cada dominio para sincronizar existencia y cambios.
- [x] Confirmar que cada documento remoto tenga `id`, `usuarioId` y `fechaActualizacion`.
- [x] Identificar datos pesados o secundarios que no deberian bloquear la sincronizacion principal.
- [x] Confirmar si cada lectura remota actual es completa o paginada por `limit(...)`.
- [x] Confirmar que cada dominio tenga una funcion remota para obtener detalle por ID.
- [x] Registrar excepciones por dominio antes de generalizar el helper comun.

## FASE 2: Definir el patron incremental comun

### Objetivo

Crear una regla unica para comparar cache local contra Firestore y decidir que descargar, actualizar o eliminar.

- [x] Definir una estructura comun de metadatos locales por dominio con usuario, fecha de ultima sincronizacion y cantidad remota.
- [x] Definir una lectura remota de manifiesto por dominio con `id`, `fechaActualizacion` y los campos minimos necesarios para pintar sin datos pesados.
- [x] Definir si el manifiesto se obtiene con paginacion completa o con una lectura marcada como completa.
- [x] Comparar entidades locales contra entidades remotas livianas.
- [x] Detectar entidades nuevas que existen en Firestore y no en local.
- [x] Detectar entidades modificadas por `fechaActualizacion`.
- [x] Detectar entidades locales sobrantes que ya no existen en Firestore.
- [x] Descargar detalle completo solo de entidades nuevas o modificadas.
- [x] Borrar del cache local las entidades sobrantes solo si la lectura remota fue exitosa y completa.
- [x] Guardar el resultado reconciliado en cache local.
- [x] Si la lectura remota no es completa, actualizar nuevos/modificados pero no eliminar sobrantes.
- [x] Guardar en metadatos si la ultima sincronizacion fue `completa` o `parcial`.
- [x] Crear un helper comun con nombre en espanol, por ejemplo `SincronizacionIncrementalFirestoreService.js`.
- [x] Mantener `ReconciliacionFirestoreLocalService.js` para la comparacion de IDs y borrados, o extenderlo sin mezclar responsabilidades.

## FASE 3: Implementar sincronizacion global por dominio

### Objetivo

Aplicar el patron comun en productos, comercios, listas y mesa de trabajo manteniendo las reglas especificas de cada dominio.

- [x] Crear o ajustar helpers reutilizables para sincronizacion incremental.
- [x] Aplicar el patron a productos sin cargar precios completos como requisito de la lista principal.
- [x] Aplicar el patron a comercios respetando direcciones y fotos locales.
- [x] Aplicar el patron a listas respetando items y estado de lista.
- [x] Aplicar el patron a mesa de trabajo respetando items pendientes y resueltos.
- [x] Mantener la reconciliacion de borrados reales en todos los dominios.
- [x] Evitar cambios directos desde componentes a Firestore.
- [x] Mantener los stores como capa de estado visible y no como constructores de rutas Firestore.
- [x] En `FuentePrincipalFirestoreService.js`, separar cargas completas actuales de cargas incrementales o livianas.
- [x] En `FirestoreProductosService.js`, usar o agregar una lectura de productos sin precios para la sincronizacion principal.
- [x] En `FirestoreComerciosService.js`, agregar o exponer una lectura de manifiesto si la lectura completa sigue siendo demasiado pesada.
- [x] En `FirestoreListasJustasService.js`, agregar o exponer una lectura de manifiesto si los items embebidos vuelven pesada la lectura.
- [x] En `FirestoreMesaTrabajoService.js`, agregar `obtenerItemMesaTrabajoPorId` si el helper comun necesita detalle por ID.
- [x] Evitar que productos use una API incremental distinta a los demas dominios salvo por la carga diferida de precios.

## FASE 4: Separar datos principales de datos pesados

### Objetivo

Hacer que la sincronizacion principal no espere historiales completos, subcolecciones ni fotos locales pesadas.

- [x] En productos, usar datos principales y resumen de precio para la lista.
- [x] Cargar precios completos bajo demanda al abrir detalle o cuando una vista los necesite.
- [x] Evaluar si el expandido de tarjetas necesita carga bajo demanda o estado de precios actualizandose.
- [x] Confirmar que fotos locales no se hidraten masivamente si no hace falta.
- [x] Mantener resumenes como `precioMejor`, `comercioMejor`, `monedaReferencia` y flags mayoristas actualizados al guardar precios.
- [x] Evitar consultas de subcolecciones en serie durante la carga principal.
- [x] Garantizar que los productos livianos tengan `precios: []` si una tarjeta o vista valida que `precios` sea array.
- [x] Adaptar `TarjetaProductoYugioh.vue` para diferenciar `sin precios` de `precios aun no cargados` si se decide cargar precios bajo demanda.
- [x] Revisar `DetalleProductoPage.vue` para que pueda pedir precios completos al entrar al detalle.
- [x] Revisar pantallas de comercios que recorren `producto.precios`, porque pueden necesitar precios cargados antes de modificar comercios o direcciones.

## FASE 5: Ajustar experiencia de sincronizacion

### Objetivo

Mostrar al usuario que los datos locales ya estan disponibles y que la nube se esta actualizando en segundo plano.

- [x] Mostrar un indicador suave de `Actualizando...` cuando Firestore sincroniza en segundo plano.
- [x] Evitar bloquear la pantalla si ya hay cache local util.
- [x] Mostrar errores de sincronizacion sin borrar datos locales.
- [x] Asegurar que productos o entidades nuevas aparezcan rapido despues de la lectura liviana.
- [x] Asegurar que entidades borradas en otro dispositivo desaparezcan despues de una respuesta remota correcta.
- [x] Guardar los cambios sincronizados en cache local para que la siguiente apertura sea rapida.
- [x] Mostrar estado distinto si se actualizaron datos principales pero aun faltan datos secundarios como precios.
- [x] Evitar notificaciones invasivas durante sincronizaciones normales de fondo.

## FASE TESTING

### Objetivo

Validar que la sincronizacion incremental global funcione en navegador, celular y Firestore real sin perder local-first ni borrado real.

- [x] Ejecutar `npm run lint`.
- [x] Ejecutar `npm run build`.
- [x] Crear un set local con mas entidades que el limite remoto configurado y verificar que no se borran locales por una lectura parcial.
- [x] Probar en navegador con una cuenta Firebase real.
- [x] Probar en celular con la misma cuenta Firebase real.
- [x] Crear un producto en celular y verificar que aparece en navegador sin esperar precios completos.
- [x] Verificar que el producto nuevo queda guardado en cache local del navegador.
- [x] Borrar un producto en celular y verificar que desaparece en navegador despues de sincronizar.
- [x] Agregar un precio en celular y verificar que el resumen de precio se actualiza en navegador.
- [x] Abrir detalle de producto y verificar que carga precios completos bajo demanda.
- [x] Repetir alta, modificacion y borrado con comercios.
- [x] Repetir alta, modificacion y borrado con listas.
- [x] Repetir alta, modificacion y borrado con mesa de trabajo.
- [x] Confirmar en Firebase Console que los documentos existen o desaparecen en las rutas correctas.
- [x] Probar sin conexion y confirmar que no se limpia cache local por error.
- [x] Confirmar que fotos locales se conservan cuando Firestore no trae foto valida.
- [x] Confirmar que la app abre rapido con cache local existente.
- [x] Confirmar que una sincronizacion parcial actualiza nuevos/modificados pero no ejecuta limpieza de sobrantes.
- [x] Confirmar que una sincronizacion completa si limpia sobrantes borrados en otro dispositivo.

## Progreso del plan

- [x] Fase 1: Relevar dominios y contratos actuales
- [x] Fase 2: Definir el patron incremental comun
- [x] Fase 3: Implementar sincronizacion global por dominio
- [x] Fase 4: Separar datos principales de datos pesados
- [x] Fase 5: Ajustar experiencia de sincronizacion
- [x] Fase Testing

Fecha de creacion: 5 de Julio 2026
Fecha de ultima actualizacion: 5 de Julio 2026
Estado: COMPLETADO


## Cierre

Plan cerrado el 5 de Julio 2026 despues de validar el flujo real entre navegador, celular y Firestore produccion.

- Leo agregó un producto llamado Café desde navegador y apareció rápido al abrir la app del celular.
- Leo eliminó el producto desde celular y desapareció del navegador después de sincronizar.
- Se verificó Firestore producción `preciojustoprod`: no quedó ningún producto `Café`/`Cafe` de hoy cerca de las 21:15.
- Solo existe un producto `Cafe` viejo, con fecha 2026-04-09, por lo que no corresponde a la prueba actual.
- Validaciones técnicas ejecutadas: `npm run lint`, `npm run build` e instalación Android por USB con `$InstalarCel`.
