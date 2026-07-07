# PLAN FOTOS EN FIRESTORE GRATIS

## Descripción del plan

Probar y extender una estrategia gratis para sincronizar imágenes entre Android, navegador y otros dispositivos usando solo Firebase Firestore, sin Firebase Storage ni facturación Blaze. El piloto inicial se valida en Mis Productos con una imagen principal reducida por producto, guardada en una colección separada para no inflar el documento principal. Después de validar el piloto, el patrón se extiende de forma controlada al resto de la app.

## Objetivo principal

- Permitir que una foto de producto tomada en un dispositivo se vea en otro dispositivo con la misma cuenta Firebase.
- Mantener Firestore como única nube del piloto, sin mezclar otra base de datos ni activar Storage.
- Evitar fotos grandes dentro de productos, Preferences, backups o colas de migración.
- Medir peso, rendimiento y comportamiento real antes de extender la solución al resto de la app.
- Extender el patrón validado a comercios, direcciones, listas y mesa sin duplicar lógica.

## Reglas del plan

- La base validada queda en Mis Productos y Detalle de Producto.
- No usar `FirebaseStorageFotosService.js` ni `storage.rules` en este piloto.
- No guardar base64 grande dentro de documentos principales como productos, comercios, listas o mesa.
- Guardar miniaturas sincronizadas en documentos separados por dominio.
- Mantener una sola imagen principal por entidad en esta etapa.
- Comprimir toda imagen de usuario antes de sincronizarla con Firestore.
- Mantener la foto local protegida por `FotosLocalesService.js` para caché y uso offline.
- Extender dominio por dominio, sin mezclar todos los flujos en una sola fase.

## FASE 1: Relevar el flujo actual de fotos de productos

### Objetivo

Confirmar los puntos exactos donde hoy se captura, guarda, protege, carga, fusiona y elimina la foto de un producto.

- [ ] Revisar `src/components/DetalleProducto/InfoProducto.vue` y confirmar que `actualizarFoto()` llama a `productosStore.actualizarProducto()` con `{ imagen: base64, fotoFuente: 'usuario' }`.
- [ ] Revisar `src/composables/useCamaraFoto.js` y confirmar que `abrirCamara()` devuelve `data:image/jpeg;base64,...` sin reducción final controlada.
- [ ] Revisar `src/components/Compartidos/EditorImagen.vue` y confirmar que exporta JPEG con calidad `0.85`, demasiado alta para el piloto Firestore.
- [ ] Revisar `src/almacenamiento/servicios/ProductosService.js` y confirmar que `_prepararFotoLocalProducto()` marca fotos `data:` como locales.
- [ ] Revisar `src/almacenamiento/servicios/FotosLocalesService.js` y confirmar que `protegerProducto()` separa la foto local con `fotoLocalId`.
- [ ] Revisar `src/almacenamiento/servicios/FirestoreProductosService.js` y confirmar que `normalizarProductoParaFirestore()` no sube `producto.imagen` si es `data:`.
- [ ] Revisar `src/almacenamiento/servicios/FuentePrincipalFirestoreService.js` y confirmar que `fusionarProductoLocalFirestore()` decide qué imagen mostrar al mezclar local y Firestore.
- [ ] Revisar `src/almacenamiento/stores/productosStore.js` y confirmar que carga local primero y después sincroniza desde Firestore.

## FASE 2: Crear compresión de imágenes para el piloto

### Objetivo

Agregar una utilidad reusable que convierta cualquier foto de usuario a una miniatura controlada antes de guardarla y sincronizarla.

- [ ] Crear `src/utils/ImagenesFirestoreUtils.js`.
- [ ] Implementar `esDataUriImagen(valor)` para validar imágenes `data:image/...;base64`.
- [ ] Implementar `calcularPesoBase64Bytes(dataUri)` para estimar peso real aproximado.
- [ ] Implementar `comprimirImagenParaFirestore(dataUri, opciones)` usando `Image`, `canvas` y `toDataURL`.
- [ ] Usar por defecto `tamanoMaximo: 480`, `calidad: 0.55` y `mimePreferido: 'image/webp'`.
- [ ] Si `image/webp` no queda disponible en el navegador, usar fallback `image/jpeg`.
- [ ] Devolver `{ dataUri, mime, ancho, alto, pesoBytes, fueReducida }`.
- [ ] Si el resultado supera `120000` bytes, reintentar con `tamanoMaximo: 360` y `calidad: 0.45`.
- [ ] Si después del reintento supera `180000` bytes, rechazar la sincronización remota y dejar solo foto local con aviso técnico.

## FASE 3: Crear servicio Firestore para imágenes de productos

### Objetivo

Guardar, leer y borrar miniaturas de productos en documentos separados, bajo el UID del usuario actual.

- [ ] Crear `src/almacenamiento/servicios/FirestoreImagenesProductosService.js`.
- [ ] Usar `firebaseBaseService.obtenerFirestoreDb()` y `usuarioActualService.obtenerUsuarioActual()`.
- [ ] Crear helper `obtenerUsuarioFirebaseActual()` siguiendo el patrón de `FirestoreProductosService.js`.
- [ ] Crear ruta `usuarios/{usuarioId}/imagenesProductos/{productoId}`.
- [ ] Implementar `guardarImagenProducto(productoId, imagenOptimizada)`.
- [ ] Guardar campos `id`, `usuarioId`, `productoId`, `mime`, `ancho`, `alto`, `pesoBytes`, `imagenBase64`, `fechaCreacion`, `fechaActualizacion` y `versionFormato`.
- [ ] Implementar `obtenerImagenProducto(productoId, opciones = {})`.
- [ ] Implementar `obtenerImagenesProductos(productoIds = [], opciones = {})` con lectura por tandas para no disparar muchas promesas juntas.
- [ ] Implementar `eliminarImagenProducto(productoId)`.
- [ ] Si no hay usuario Firebase, devolver resultado omitido equivalente al patrón `crearResultadoOmitido()`.
- [ ] No importar ni usar `firebase/storage`.

## FASE 4: Agregar campos livianos al modelo de producto

### Objetivo

Hacer que el producto sepa si tiene imagen sincronizada sin guardar la imagen pesada dentro del documento principal.

- [ ] Editar `src/almacenamiento/constantes/PreparacionFirebase.js`.
- [ ] Agregar a `CAMPOS_MODELO_FIRESTORE.producto` los campos `imagenFirestoreId`, `imagenFirestoreEstado`, `imagenFirestorePesoBytes` y `fechaImagenFirestore`.
- [ ] No agregar `imagenBase64` ni `imagenMiniaturaBase64` al modelo `producto`.
- [ ] Mantener `imagenUrl`, `imagenRutaStorage`, `fotoFuente`, `fotoLocalId` y `sincronizacionFoto` con su sentido actual.
- [ ] Actualizar `normalizarProductoParaFirestore()` en `FirestoreProductosService.js` para preservar los nuevos campos livianos si existen.

## FASE 5: Sincronizar imagen al guardar foto de producto

### Objetivo

Cuando el usuario cambie la foto de un producto, guardar rápido localmente y sincronizar una miniatura reducida con Firestore.

- [ ] En `ProductosService.js`, importar `comprimirImagenParaFirestore` desde `ImagenesFirestoreUtils.js`.
- [ ] En `ProductosService.js`, importar `firestoreImagenesProductosService`.
- [ ] Crear método privado `_sincronizarImagenProductoFirestore(producto)` separado de `_sincronizarProductoFirestore(producto)`.
- [ ] Ejecutar `_sincronizarImagenProductoFirestore(producto)` solo si `producto.imagen` es `data:image/...;base64` y hay usuario Firebase.
- [ ] Comprimir la imagen antes de llamar a Firestore.
- [ ] Guardar la miniatura en `usuarios/{uid}/imagenesProductos/{productoId}`.
- [ ] Actualizar el producto principal con metadatos livianos: `imagenFirestoreId`, `imagenFirestoreEstado`, `imagenFirestorePesoBytes`, `fechaImagenFirestore`, `fotoFuente: 'usuario'`.
- [ ] Si falla la compresión o Firestore, dejar la foto local intacta y guardar `sincronizacionFoto.estado = 'error'`.
- [ ] Si no hay usuario Firebase, mantener comportamiento local actual.
- [ ] Evitar que `_sincronizarProductoFirestore(producto)` suba base64 al producto principal.

## FASE 6: Cargar imágenes sincronizadas desde Firestore

### Objetivo

Al cargar Mis Productos desde otro dispositivo, traer las miniaturas Firestore y mostrarlas como `producto.imagen`.

- [ ] En `productosStore.js`, importar `firestoreImagenesProductosService`.
- [ ] Crear helper local `hidratarImagenesProductosFirestore(productosBase)`.
- [ ] En el helper, tomar solo productos con `imagenFirestoreId` o `imagenFirestoreEstado === 'sincronizado'`.
- [ ] Leer imágenes desde `usuarios/{uid}/imagenesProductos/{productoId}` por tandas chicas.
- [ ] Fusionar cada `imagenBase64` remota como `producto.imagen`.
- [ ] Guardar `imagenBase64` remota en caché local usando `productosService.guardarProductosEnCacheLocal()` para que `FotosLocalesService.protegerProducto()` la separe en `fotoLocalId`.
- [ ] Ejecutar la hidratación después de `fusionarProductosLocalFirestore()` y antes de asignar `productos.value`.
- [ ] No bloquear toda la lista si una imagen falla; mostrar el producto sin imagen y registrar advertencia.
- [ ] Mantener listas rápidas: si hay muchas imágenes, cargar primero productos y luego hidratar imágenes en segundo plano.

## FASE 7: Eliminar o reemplazar imagen sincronizada

### Objetivo

Evitar imágenes huérfanas en Firestore cuando se quita una foto o se elimina un producto.

- [ ] En `ProductosService.js`, cuando `producto.imagen` pasa a `null`, llamar a `firestoreImagenesProductosService.eliminarImagenProducto(producto.id)` si hay usuario Firebase.
- [ ] Al quitar foto desde `InfoProducto.vue`, enviar también `imagenFirestoreId: null`, `imagenFirestoreEstado: null`, `imagenFirestorePesoBytes: null` y `fechaImagenFirestore: null`.
- [ ] En `eliminarProducto(productoId)`, después de borrar local y antes o después de borrar el producto Firestore, eliminar `imagenesProductos/{productoId}`.
- [ ] Si la eliminación de imagen remota falla, no impedir que el producto se elimine; registrar advertencia.
- [ ] Al reemplazar foto, sobrescribir el documento `imagenesProductos/{productoId}` con `setDoc(..., { merge: true })`.

## FASE 8: Revisar reglas Firestore

### Objetivo

Confirmar que cada usuario pueda leer y escribir solo sus propias imágenes de productos.

- [ ] Revisar `firestore.rules`.
- [ ] Confirmar que la regla actual `match /usuarios/{usuarioId}/{documento=**}` ya cubre `imagenesProductos`.
- [ ] No agregar reglas nuevas si la regla genérica privada sigue cubriendo correctamente la ruta.
- [ ] Si la regla genérica cambia o no cubre el caso, agregar regla para `usuarios/{usuarioId}/imagenesProductos/{productoId}`.
- [ ] Validar que solo `request.auth.uid == usuarioId` pueda leer y escribir.
- [ ] Si se agrega validación de tamaño por reglas, limitar el campo `imagenBase64` o el documento completo de forma compatible con Firestore Rules.
- [ ] Ejecutar deploy de reglas solo cuando Leo lo pida explícitamente.

## FASE 9: Medir el piloto

### Objetivo

Saber si Firestore con miniaturas sirve antes de extender la solución a más partes de la app.

- [x] Confirmar sincronización navegador -> Android con una foto de producto.
- [x] Confirmar sincronización Android -> navegador con una foto de producto.
- [ ] Crear 5 productos con imagen desde Android.
- [ ] Verificar en Firebase Console que cada producto tiene documento liviano y cada imagen vive en `imagenesProductos`.
- [ ] Confirmar que ningún documento `productos/{productoId}` tiene `imagen` ni `imagenBase64`.
- [ ] Confirmar que cada documento de imagen pesa menos de `180000` bytes.
- [x] Abrir navegador con la misma cuenta y confirmar que aparecen las imágenes.
- [x] Cambiar una foto desde navegador y confirmar que Android la recibe al recargar/sincronizar.
- [ ] Quitar una foto y confirmar que desaparece en ambos dispositivos.
- [ ] Eliminar un producto y confirmar que se elimina su imagen remota.
- [ ] Repetir con 20 productos.
- [ ] Repetir con 50 productos solo si la prueba de 20 abre rápido y sin errores.
- [ ] Registrar tiempo aproximado de carga inicial con 5, 20 y 50 imágenes.

## FASE 10: Documentar decisión después de la prueba

### Objetivo

Cerrar el piloto con una decisión técnica clara: mantener, ajustar o descartar Firestore para imágenes.

- [ ] Si el piloto funciona bien, actualizar `Planes/Manuales/ManualFirebaseGratis.md` con la estrategia validada.
- [ ] Documentar límites reales usados: tamaño, calidad, formato, cantidad probada y comportamiento Android.
- [ ] Si el piloto es lento o pesado, dejar recomendado volver a fotos locales hasta poder usar Firebase Storage.
- [ ] Si el piloto se acepta, crear un plan nuevo para extender el patrón a comercios, listas o mesa.
- [ ] No extender el patrón a otros dominios dentro de este plan.

## FASE 11: Generalizar servicios de imágenes

### Objetivo

Convertir lo validado en productos en una base reusable para todos los dominios con fotos.

- [ ] Revisar `FirestoreImagenesProductosService.js` y extraer lógica común sin romper el piloto validado.
- [ ] Crear `FirestoreImagenesService.js` o equivalente con soporte por dominio.
- [ ] Definir rutas separadas por dominio: `imagenesProductos`, `imagenesComercios`, `imagenesDirecciones`, `imagenesListas` e `imagenesMesa`.
- [ ] Mantener helpers de usuario Firebase, normalización de IDs, tandas de lectura y borrado en un solo lugar.
- [ ] Mantener wrappers de dominio si ayudan a que cada store quede claro.
- [ ] Reutilizar `ImagenesFirestoreUtils.js` para todos los dominios.
- [ ] Evitar que un dominio dependa de nombres internos de otro dominio.

## FASE 12: Extender fotos a comercios y direcciones

### Objetivo

Sincronizar fotos de comercios y direcciones usando el mismo patrón validado en productos.

- [ ] Revisar `FirestoreComerciosService.js`, `comerciosStore.js` y componentes de edición de comercio.
- [ ] Identificar el flujo exacto donde se guarda `foto`, `fotoUrl`, `fotoRutaStorage`, `fotoFuente` y `fotoLocalId`.
- [ ] Agregar metadatos livianos para comercio: `fotoFirestoreId`, `fotoFirestoreEstado`, `fotoFirestorePesoBytes` y `fechaFotoFirestore`.
- [ ] Agregar metadatos livianos equivalentes para cada dirección.
- [ ] Guardar miniaturas de comercios en `usuarios/{uid}/imagenesComercios/{comercioId}`.
- [ ] Guardar miniaturas de direcciones en `usuarios/{uid}/imagenesDirecciones/{comercioIdDireccionId}`.
- [ ] Hidratar fotos remotas al cargar comercios desde Firestore.
- [ ] Borrar miniaturas remotas al quitar foto, borrar comercio o borrar dirección.
- [ ] Probar navegador -> Android y Android -> navegador con una foto de comercio.
- [ ] Probar navegador -> Android y Android -> navegador con una foto de dirección.

## FASE 13: Extender fotos a listas

### Objetivo

Sincronizar imágenes de items de listas sin inflar el documento principal de la lista.

- [ ] Revisar `FirestoreListasJustasService.js`, `ListaJustaStore.js` y pantallas de detalle de lista.
- [ ] Identificar si la imagen visible del item viene del producto, del item manual o de una captura propia.
- [ ] No duplicar imágenes de producto si el item puede resolver la foto desde `productoId`.
- [ ] Agregar metadatos livianos solo cuando el item tenga imagen propia.
- [ ] Guardar miniaturas propias de items en `usuarios/{uid}/imagenesListas/{listaIdItemId}`.
- [ ] Hidratar imágenes remotas al cargar listas desde Firestore.
- [ ] Borrar miniaturas remotas al quitar item, limpiar lista o eliminar lista.
- [ ] Probar una lista con item de producto existente y confirmar que usa la foto de producto.
- [ ] Probar una lista con item manual con foto propia y confirmar sincronización entre dispositivos.

## FASE 14: Extender fotos a mesa de trabajo

### Objetivo

Sincronizar imágenes de items de mesa cuando la foto todavía no pertenece a un producto definitivo.

- [ ] Revisar `FirestoreMesaTrabajoService.js`, `sesionEscaneoStore.js` y `MesaTrabajoPage.vue`.
- [ ] Identificar diferencias entre `item.imagen` y `item.datosOriginales.imagen`.
- [ ] Guardar miniaturas de mesa en `usuarios/{uid}/imagenesMesa/{mesaItemId}`.
- [ ] Evitar duplicar la foto cuando el item ya se resolvió hacia un producto con imagen sincronizada.
- [ ] Al convertir un item de mesa en producto, mover o reutilizar la imagen siguiendo el patrón de productos.
- [ ] Borrar miniaturas remotas cuando el item de mesa se resuelva o se elimine.
- [ ] Probar captura desde mesa en Android y confirmarla en navegador.
- [ ] Probar resolución hacia producto y confirmar que la foto queda visible en producto.

## FASE 15: Consolidar reglas y manual

### Objetivo

Dejar documentada la estrategia global de fotos gratis y cerrar el patrón para futuras extensiones.

- [ ] Confirmar que `firestore.rules` cubre todas las colecciones nuevas bajo `usuarios/{uid}`.
- [ ] Confirmar que no se usa `FirebaseStorageFotosService.js` en el flujo gratis global.
- [ ] Revisar que ningún documento principal guarde `imagenBase64` o `fotoBase64`.
- [ ] Actualizar `Planes/Manuales/ManualFirebaseGratis.md` con la estrategia validada de miniaturas Firestore.
- [ ] Documentar límites usados: tamaño máximo, calidad, formato, rutas y dominios cubiertos.
- [ ] Documentar cuándo conviene migrar a Firebase Storage si la app empieza a generar ingresos.
- [ ] Marcar este plan como completado solo después de probar productos, comercios, listas y mesa en navegador y Android.

## FASE TESTING

### Objetivo

Validar de forma ejecutable por IA y revisable por humano que el piloto sincroniza imágenes sin romper caché local, Firestore ni Android.

- [x] Ejecutar `npm run lint`.
- [x] Ejecutar `npm run build`.
- [x] Probar en navegador con una cuenta Firebase real.
- [x] Probar en Android con la misma cuenta Firebase real.
- [x] Desde Android, tomar foto en un producto y verificar que aparece en navegador.
- [x] Desde navegador, cambiar foto de un producto y verificar que aparece en Android.
- [ ] Probar sin conexión: cambiar una foto, confirmar que queda local y que la app no se rompe.
- [ ] Recuperar conexión y confirmar comportamiento definido para reintento o error.
- [ ] Verificar en Firestore Console que la ruta usada es `usuarios/{uid}/imagenesProductos/{productoId}`.
- [ ] Verificar que `usuarios/{uid}/productos/{productoId}` solo tiene metadatos livianos de imagen.
- [ ] Verificar que `@capacitor/preferences` no recibe fotos ni JSON grande.
- [ ] Revisar consola del navegador sin errores nuevos.
- [ ] Probar en Android real con `adb logcat` si hay cierre inesperado o lentitud fuerte.
- [ ] Confirmar que borrar producto elimina o invalida su imagen remota.
- [ ] Confirmar que logout/login no deja imágenes de otro usuario visibles.
- [ ] Probar foto de comercio en navegador y Android.
- [ ] Probar foto de dirección en navegador y Android.
- [ ] Probar item de lista con foto propia en navegador y Android.
- [ ] Probar item de mesa con foto propia en navegador y Android.
- [ ] Verificar que los documentos principales de todos los dominios quedan livianos.
- [ ] Verificar que las colecciones de imágenes por dominio se crean bajo `usuarios/{uid}`.

## Progreso del plan

- [x] Fase 1: Relevar el flujo actual de fotos de productos
- [x] Fase 2: Crear compresión de imágenes para el piloto
- [x] Fase 3: Crear servicio Firestore para imágenes de productos
- [x] Fase 4: Agregar campos livianos al modelo de producto
- [x] Fase 5: Sincronizar imagen al guardar foto de producto
- [x] Fase 6: Cargar imágenes sincronizadas desde Firestore
- [x] Fase 7: Eliminar o reemplazar imagen sincronizada
- [x] Fase 8: Revisar reglas Firestore
- [ ] Fase 9: Medir el piloto
- [ ] Fase 10: Documentar decisión después de la prueba
- [ ] Fase 11: Generalizar servicios de imágenes
- [ ] Fase 12: Extender fotos a comercios y direcciones
- [ ] Fase 13: Extender fotos a listas
- [ ] Fase 14: Extender fotos a mesa de trabajo
- [ ] Fase 15: Consolidar reglas y manual
- [ ] Fase Testing

Fecha de creación: 7 de Julio 2026
Fecha de última actualización: 7 de Julio 2026
Estado: EN PROCESO
