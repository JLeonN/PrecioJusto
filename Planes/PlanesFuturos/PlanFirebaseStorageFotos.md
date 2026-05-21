# PLAN FIREBASE STORAGE FOTOS

## Descripción del plan

Implementar Firebase Storage para fotos privadas de usuario en Precio Justo. La app ya sincroniza datos privados principales con Firestore, pero las fotos base64 siguen locales y Firestore evita guardarlas como base64.

Este plan debe subir fotos de productos, comercios, direcciones e items de Lista Justa a Storage bajo una ruta privada por usuario, y guardar en Firestore solo `imagenUrl`/`fotoUrl` y `imagenRutaStorage`/`fotoRutaStorage`. LocalStorage/Capacitor siguen siendo respaldo durante esta etapa.

## Objetivo principal

- Crear configuración y reglas privadas de Firebase Storage.
- Crear un servicio Storage para fotos privadas.
- Subir fotos base64 locales a Storage cuando haya usuario Firebase y conexión.
- Guardar en Firestore solo URL o ruta Storage, nunca base64.
- Mantener la app funcionando sin conexión con la foto local.
- Preparar migración guiada de fotos locales a Storage.
- Dejar el sistema listo para que Firestore pueda ser fuente principal en planes posteriores.

## Reglas del plan

- No guardar imágenes base64 en Firestore.
- No eliminar las fotos locales hasta validar subida, URL/ruta y relectura.
- No convertir Firestore en fuente principal en este plan.
- No implementar galería comunitaria ni fotos públicas.
- No relajar `firestore.rules`.
- Crear reglas propias de Storage y agregarlas a `firebase.json`.
- No subir fotos si no hay usuario Firebase autenticado.
- Si Storage falla, la app debe conservar la foto local y marcar la subida como pendiente o fallida.
- No asumir que Storage funciona offline igual que Firestore Offline.
- Limitar tamaño y tipo de archivo desde código y reglas.

## FASE 1: Revisar fotos actuales y alcance

### Objetivo

Ubicar todos los puntos donde la app guarda, muestra o modifica fotos.

- [ ] Revisar `Planes/PlanesFuturos/PlanMaestroFirebase.md`.
- [ ] Revisar `Planes/Resumenes/ModeloFirestoreMigracion.md`.
- [ ] Revisar `Planes/Resumenes/Resumen11Firebase.md`.
- [ ] Revisar `src/composables/useCamaraFoto.js`.
- [ ] Revisar `src/almacenamiento/servicios/ProductosService.js`.
- [ ] Revisar `src/almacenamiento/servicios/ComerciosService.js`.
- [ ] Revisar `src/almacenamiento/servicios/ListaJustaService.js`.
- [ ] Revisar `src/almacenamiento/servicios/FirestoreProductosService.js`.
- [ ] Revisar `src/almacenamiento/servicios/FirestoreComerciosService.js`.
- [ ] Revisar `src/almacenamiento/servicios/FirestoreListasJustasService.js`.
- [ ] Confirmar campos actuales: `imagen`, `foto`, `imagenUrl`, `fotoUrl`, `imagenRutaStorage`, `fotoRutaStorage`, `fotoFuente`.
- [ ] Confirmar que productos, comercios, direcciones e items pueden tener fotos base64 locales.
- [ ] Confirmar que Firestore ya descarta base64 y deja rutas/URLs para Storage futuro.

## FASE 2: Configurar Firebase Storage base

### Objetivo

Agregar la base técnica de Storage sin conectar todavía la lógica de negocio.

- [ ] Agregar inicialización de Storage en `src/almacenamiento/servicios/FirebaseBaseService.js`.
- [ ] Exponer método `obtenerFirebaseStorage()`.
- [ ] Confirmar que `VITE_FIREBASE_STORAGE_BUCKET` está validado por la configuración actual.
- [ ] Crear archivo `storage.rules`.
- [ ] Agregar sección `storage.rules` en `firebase.json`.
- [ ] Definir ruta privada base `usuarios/{usuarioId}/fotos`.
- [ ] Validar que Storage no se inicializa si falta configuración Firebase.
- [ ] Documentar que Storage requiere conexión real para subir archivos.

## FASE 3: Crear reglas privadas de Storage

### Objetivo

Proteger las fotos para que cada usuario acceda solo a sus propios archivos.

- [ ] Crear función de regla para usuario autenticado.
- [ ] Crear función de regla para validar dueño por `usuarioId`.
- [ ] Permitir lectura/escritura solo bajo `usuarios/{usuarioId}/fotos/{archivo=**}`.
- [ ] Bloquear cualquier ruta fuera de `usuarios/{usuarioId}/fotos`.
- [ ] Limitar escrituras a archivos `image/*`.
- [ ] Definir tamaño máximo inicial de foto.
- [ ] Validar que las reglas usan `request.auth.uid == usuarioId`.
- [ ] Agregar notas para probar reglas antes de producción.

## FASE 4: Crear servicio Storage de fotos

### Objetivo

Centralizar subida, descarga y borrado lógico de fotos privadas.

- [ ] Crear servicio PascalCase para fotos Storage.
- [ ] Obtener `usuarioId` desde `UsuarioActualService`.
- [ ] Crear helper para ruta de producto.
- [ ] Crear helper para ruta de comercio.
- [ ] Crear helper para ruta de dirección.
- [ ] Crear helper para ruta de item de Lista Justa.
- [ ] Convertir data URI base64 a `Blob`.
- [ ] Validar tipo MIME permitido.
- [ ] Validar tamaño máximo antes de subir.
- [ ] Subir archivo con API modular de Firebase Storage.
- [ ] Obtener URL de descarga después de subir.
- [ ] Devolver `rutaStorage`, `url`, `fotoFuente: storage` y estado de sincronización.
- [ ] Manejar resultado omitido cuando no hay usuario Firebase autenticado.
- [ ] Manejar error sin romper el guardado local.

## FASE 5: Integrar Storage con productos

### Objetivo

Subir fotos de productos a Storage y reflejar ruta/URL en Firestore.

- [ ] Detectar cuando `producto.imagen` es base64 de usuario.
- [ ] Subir la foto antes o durante la sincronización Firestore del producto.
- [ ] Guardar en el producto local `imagenRutaStorage`, `imagenUrl` y `fotoFuente: storage` cuando la subida sea exitosa.
- [ ] Mantener `imagen` local para compatibilidad durante la transición.
- [ ] Confirmar que `FirestoreProductosService` no escribe base64.
- [ ] Confirmar que productos sin foto no intentan subir nada.
- [ ] Confirmar que fotos externas de API no se suben innecesariamente.
- [ ] Confirmar que quitar foto limpia campos locales y deja Firestore sin URL/ruta activa.

## FASE 6: Integrar Storage con comercios y direcciones

### Objetivo

Subir fotos de comercios/direcciones a Storage sin romper el modelo embebido actual.

- [ ] Detectar cuando `comercio.foto` es base64 de usuario.
- [ ] Detectar cuando `direccion.foto` es base64 de usuario.
- [ ] Subir foto de comercio con ruta estable por comercio.
- [ ] Subir foto de dirección con ruta estable por comercio y dirección.
- [ ] Guardar `fotoRutaStorage`, `fotoUrl` y `fotoFuente: storage` al completar subida.
- [ ] Mantener `foto` local durante la transición.
- [ ] Confirmar que `FirestoreComerciosService` no escribe base64.
- [ ] Confirmar que editar o borrar una dirección no deja referencias inconsistentes.

## FASE 7: Integrar Storage con Lista Justa

### Objetivo

Evitar que los items de listas lleven base64 a Firestore.

- [ ] Detectar cuando `item.imagen` es base64 de usuario.
- [ ] Definir ruta Storage para item de Lista Justa.
- [ ] Subir foto de item cuando corresponda.
- [ ] Guardar `imagenRutaStorage`, `imagenUrl` y `fotoFuente: storage` al completar subida.
- [ ] Mantener `imagen` local durante la transición.
- [ ] Confirmar que `FirestoreListasJustasService` no escribe base64.
- [ ] Confirmar que listas sin foto no cambian comportamiento.

## FASE 8: Preparar reintentos y estado de subida

### Objetivo

Evitar pérdida de fotos cuando Storage no puede subir por conexión o error temporal.

- [ ] Definir estado local de subida de foto: `local`, `pendiente`, `sincronizado` o `error`.
- [ ] Guardar estado por producto, comercio, dirección o item.
- [ ] Reintentar subida cuando el usuario vuelva a tener conexión.
- [ ] No bloquear el guardado local por error de Storage.
- [ ] Mostrar advertencia discreta solo si aporta valor a la UI.
- [ ] Confirmar que cerrar sesión no intenta subir fotos sin usuario.
- [ ] Confirmar que cambiar de usuario no mezcla rutas Storage.

## FASE 9: Preparar migración guiada de fotos locales

### Objetivo

Dejar lista la migración futura de base64 local a Storage.

- [ ] Confirmar que `InventarioMigracionFirebaseService` cuenta fotos de productos y comercios.
- [ ] Agregar conteo de fotos de Lista Justa si falta.
- [ ] Diseñar migración por lotes para no subir demasiadas fotos de golpe.
- [ ] Definir backup local obligatorio antes de migrar fotos.
- [ ] Definir reintento idempotente por `rutaStorage`.
- [ ] No eliminar base64 local hasta que Storage y Firestore queden validados.
- [ ] Documentar que la migración completa se ejecuta en otro plan si el alcance crece demasiado.

## FASE 10: Actualizar documentación

### Objetivo

Mantener alineados planes, resumen y modelo técnico.

- [ ] Actualizar `Planes/Resumenes/Resumen11Firebase.md`.
- [ ] Actualizar `Planes/Resumenes/ModeloFirestoreMigracion.md`.
- [ ] Actualizar `Planes/PlanesFuturos/PlanMaestroFirebase.md` cuando el plan quede completado.
- [ ] Documentar rutas Storage privadas.
- [ ] Documentar límite de tamaño y tipos MIME permitidos.
- [ ] Documentar que Storage/fotos queda privado y separado de comunidad.

## FASE TESTING

### Objetivo

Validar que Storage recibe fotos privadas sin mandar base64 a Firestore ni romper el uso offline.

- [ ] Ejecutar lint o el comando de validación disponible del proyecto.
- [ ] Iniciar sesión con usuario Firebase.
- [ ] Agregar foto base64 a un producto y verificar que se sube a Storage.
- [ ] Verificar que Firestore guarda `imagenUrl` o `imagenRutaStorage`, no base64.
- [ ] Agregar foto a una dirección de comercio y verificar subida privada.
- [ ] Agregar foto a un item de Lista Justa y verificar subida privada.
- [ ] Probar sin conexión y confirmar que la foto queda local.
- [ ] Reconectar y confirmar que la subida pendiente se completa.
- [ ] Probar con dos usuarios y confirmar que no pueden leer ni escribir fotos ajenas.
- [ ] Intentar subir archivo no imagen y confirmar que reglas/código lo bloquean.
- [ ] Intentar subir imagen demasiado grande y confirmar que reglas/código lo bloquean.
- [ ] Quitar una foto y confirmar que la app no muestra una URL vieja como activa.
- [ ] Confirmar que `firebase.json` incluye Firestore y Storage rules.
- [ ] Confirmar que `firestore.rules` sigue cerrado fuera de `usuarios/{usuarioId}`.
- [ ] Confirmar que LocalStorage/Capacitor siguen funcionando como respaldo.

## Progreso del plan

- [ ] Fase 1: Revisar fotos actuales y alcance
- [ ] Fase 2: Configurar Firebase Storage base
- [ ] Fase 3: Crear reglas privadas de Storage
- [ ] Fase 4: Crear servicio Storage de fotos
- [ ] Fase 5: Integrar Storage con productos
- [ ] Fase 6: Integrar Storage con comercios y direcciones
- [ ] Fase 7: Integrar Storage con Lista Justa
- [ ] Fase 8: Preparar reintentos y estado de subida
- [ ] Fase 9: Preparar migración guiada de fotos locales
- [ ] Fase 10: Actualizar documentación
- [ ] Fase Testing

Fecha de creación: 21 de Mayo 2026
Fecha de última actualización: 21 de Mayo 2026
Estado: BORRADOR
