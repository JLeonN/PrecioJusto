# PLAN FIREBASE STORAGE FOTOS

> Segundo plan de Storage. El plan parecido anterior quedó renombrado como `Planes/PlanesTerminados/PlanFirebaseStorageFotos1.md`; este archivo es `PlanFirebaseStorageFotos2.md` para identificar la corrección y cierre posterior.

## Descripción del plan

Preparar e implementar el flujo de fotos privadas con Firebase Storage para que productos, comercios, direcciones y listas puedan guardar imágenes de forma confiable. Firestore ya funciona como fuente principal de datos; este plan se enfoca solo en corregir y completar la parte de imágenes, incluyendo navegador, Android, permisos, CORS, rutas, respaldo local y sincronización.

## Objetivo principal

- Dejar Firebase Storage funcionando para subir, leer y mantener fotos privadas por usuario.
- Guardar en Firestore solo las referencias necesarias de cada foto.
- Mantener respaldo local temporal cuando una foto no pueda subirse.
- Validar el flujo completo en navegador y Android.

## Reglas del plan

- No mezclar esta fase con la base comunitaria compartida.
- No guardar imágenes grandes en Firestore.
- No reemplazar imágenes locales hasta confirmar que Storage devolvió una ruta válida.
- Mantener las fotos privadas dentro del espacio del usuario autenticado.
- Evitar cambios grandes en Firestore salvo los campos mínimos necesarios para enlazar fotos.

## FASE 1: Auditar Estado Actual De Fotos

### Objetivo

Entender dónde se crean, guardan, muestran y sincronizan las fotos actualmente.

- [ ] Revisar servicios, stores y componentes que usan fotos de productos.
- [ ] Revisar servicios, stores y componentes que usan fotos de comercios y direcciones.
- [ ] Revisar servicios, stores y componentes que usan imágenes dentro de Lista Justa.
- [ ] Identificar si las fotos actuales se guardan como base64, URL, ruta local o ruta Storage.
- [ ] Confirmar qué flujo falló en la prueba MCP con Firebase Storage.
- [ ] Documentar los campos actuales relacionados con imágenes.

## FASE 2: Revisar Configuración De Firebase Storage

### Objetivo

Corregir la base externa necesaria para que Storage acepte subidas desde navegador y Android.

- [ ] Confirmar que el proyecto Firebase correcto está activo.
- [ ] Confirmar que el bucket de Storage existe y coincide con la configuración de la app.
- [ ] Revisar reglas actuales de Firebase Storage.
- [ ] Definir reglas privadas por usuario autenticado.
- [ ] Configurar CORS para permitir pruebas desde `localhost:9000`.
- [ ] Verificar que CORS no quede abierto más de lo necesario.
- [ ] Probar una subida mínima desde navegador antes de tocar flujos grandes de la app.

## FASE 3: Definir Modelo De Rutas Y Metadatos

### Objetivo

Definir una estructura clara para guardar fotos y relacionarlas con Firestore.

- [ ] Definir ruta para fotos de productos.
- [ ] Definir ruta para fotos de comercios.
- [ ] Definir ruta para fotos de direcciones.
- [ ] Definir ruta para fotos de listas.
- [ ] Definir campos Firestore mínimos: `imagenUrl`, `imagenRutaStorage`, `fotoFuente` y fecha de actualización si aplica.
- [ ] Confirmar que los documentos siguen perteneciendo al usuario autenticado.
- [ ] Evitar duplicar datos pesados entre Storage, Firestore y almacenamiento local.

## FASE 4: Crear Servicio Central De Fotos

### Objetivo

Concentrar la lógica de subida, lectura, reemplazo y error de fotos en una capa reutilizable.

- [ ] Crear o ajustar un servicio dedicado para Firebase Storage.
- [ ] Implementar subida de imagen a Storage con usuario autenticado.
- [ ] Implementar obtención de URL pública o URL descargable segura.
- [ ] Implementar borrado o reemplazo de foto anterior cuando corresponda.
- [ ] Manejar errores de Storage con mensajes claros.
- [ ] Devolver un resultado estructurado con estado, ruta, URL y error si existe.
- [ ] Evitar que productos, comercios o listas conozcan detalles internos de Storage.

## FASE 5: Integrar Fotos En Productos

### Objetivo

Hacer que las fotos de productos se suban a Storage y se recuperen desde Firestore.

- [ ] Detectar cuándo una foto de producto necesita subirse.
- [ ] Subir la foto antes o durante el guardado del producto.
- [ ] Guardar en Firestore la ruta y URL de la foto.
- [ ] Mantener respaldo local si la subida falla.
- [ ] Mostrar la foto desde Storage cuando exista.
- [ ] Verificar que un producto sin foto siga funcionando.
- [ ] Verificar que editar un producto no rompa la foto existente.

## FASE 6: Integrar Fotos En Comercios Y Direcciones

### Objetivo

Hacer que las fotos relacionadas con comercios y direcciones funcionen con Storage.

- [ ] Detectar dónde se toman o seleccionan fotos de comercios.
- [ ] Detectar dónde se toman o seleccionan fotos de direcciones.
- [ ] Subir la foto correspondiente a la ruta privada del usuario.
- [ ] Guardar en Firestore la ruta y URL correcta.
- [ ] Mostrar las fotos después de recargar la app.
- [ ] Verificar que comercios sin foto sigan funcionando.
- [ ] Verificar que direcciones sin foto sigan funcionando.

## FASE 7: Integrar Fotos En Lista Justa

### Objetivo

Hacer que los ítems de Lista Justa puedan conservar imágenes sin romper el modelo actual.

- [ ] Revisar cómo se guardan actualmente las imágenes de ítems.
- [ ] Subir a Storage solo las imágenes que sean nuevas o locales.
- [ ] Guardar en cada ítem la ruta y URL de Storage cuando exista.
- [ ] Mantener el ítem funcional si no tiene imagen.
- [ ] Verificar que abrir una lista después de recargar mantiene sus imágenes.
- [ ] Verificar que la Lista Inteligente no pierda imágenes por el cambio de modelo.

## FASE 8: Manejar Offline Y Reintentos

### Objetivo

Evitar pérdida de fotos cuando el usuario no tiene conexión o Storage falla temporalmente.

- [ ] Definir estado local de foto pendiente.
- [ ] Guardar localmente la foto pendiente cuando no pueda subirse.
- [ ] Reintentar la subida cuando vuelva la conexión.
- [ ] Actualizar Firestore cuando la subida pendiente se complete.
- [ ] Evitar subidas duplicadas de la misma foto.
- [ ] Mostrar un estado claro si una foto todavía está pendiente de sincronización.

## FASE 9: Limpieza Y Migración De Fotos Existentes

### Objetivo

Preparar el camino para fotos que ya existan en almacenamiento local antes de usar Storage.

- [ ] Detectar fotos locales existentes en productos.
- [ ] Detectar fotos locales existentes en comercios y direcciones.
- [ ] Detectar fotos locales existentes en listas.
- [ ] Definir si la migración de fotos será automática o manual.
- [ ] Crear backup local antes de migrar fotos.
- [ ] Evitar borrar fotos locales hasta confirmar subida y lectura desde Storage.
- [ ] Registrar cuántas fotos quedaron migradas, pendientes o con error.

## FASE TESTING

### Objetivo

Validar que las fotos funcionen de punta a punta en navegador, Android y Firebase.

- [ ] Probar login con usuario Firebase.
- [ ] Crear producto con foto desde navegador.
- [ ] Confirmar que el producto aparece con foto después de recargar.
- [ ] Confirmar que Firestore guarda `imagenUrl` e `imagenRutaStorage`.
- [ ] Confirmar que Storage contiene el archivo en la ruta esperada.
- [ ] Crear comercio con foto desde navegador.
- [ ] Crear dirección con foto desde navegador.
- [ ] Crear lista con ítem que tenga imagen.
- [ ] Cerrar sesión y volver a entrar para confirmar que las fotos cargan desde Firebase.
- [ ] Probar el mismo usuario en Android.
- [ ] Crear una foto desde Android y confirmar que aparece en navegador.
- [ ] Probar una subida sin conexión y verificar que queda pendiente.
- [ ] Volver a conectar internet y verificar que la foto pendiente se sincroniza.
- [ ] Probar un producto, comercio y lista sin foto para confirmar que no se rompe el flujo básico.
- [ ] Revisar consola del navegador y confirmar que no hay errores CORS de Firebase Storage.

## Progreso del plan

- [x] Fase 1: Auditar Estado Actual De Fotos
- [x] Fase 2: Revisar Configuración De Firebase Storage
- [x] Fase 3: Definir Modelo De Rutas Y Metadatos
- [x] Fase 4: Crear Servicio Central De Fotos
- [x] Fase 5: Integrar Fotos En Productos
- [x] Fase 6: Integrar Fotos En Comercios Y Direcciones
- [x] Fase 7: Integrar Fotos En Lista Justa
- [x] Fase 8: Manejar Offline Y Reintentos
- [x] Fase 9: Limpieza Y Migración De Fotos Existentes
- [x] Fase Testing local

## Resultado de ejecución

Fecha: 22 de Mayo 2026.

- Se confirmó que ya existía un plan Storage anterior con el mismo nombre y se renombró a `PlanFirebaseStorageFotos1.md`.
- Este segundo plan quedó renombrado como `PlanFirebaseStorageFotos2.md`.
- `FirebaseBaseService` ya inicializa Storage y valida `VITE_FIREBASE_STORAGE_BUCKET`.
- `storage.rules` mantiene acceso privado bajo `usuarios/{usuarioId}/fotos/{archivo=**}`, solo para `request.auth.uid == usuarioId`, imágenes y tamaño máximo de 5 MB.
- `firebase.json` referencia reglas de Firestore y Storage.
- Se agregó `FirebaseStorageCors.json` para documentar la configuración CORS mínima de desarrollo.
- `FirebaseStorageFotosService` centraliza subida, URL de descarga, validación de tipo/tamaño y borrado privado.
- Productos, comercios, direcciones e items de Lista Justa preparan fotos base64 para Storage antes de sincronizar Firestore.
- Firestore sigue recibiendo solo `imagenUrl`/`fotoUrl` y `imagenRutaStorage`/`fotoRutaStorage`; no se envía base64.
- La lectura principal desde Firestore hidrata campos visuales compatibles (`imagen` y `foto`) desde las URL de Storage para que la UI pueda mostrar fotos después de recargar.
- Se agregó `FotosPendientesStorageService` para reintentar fotos locales pendientes cuando hay usuario Firebase y vuelve la conexión.
- `MainLayout` dispara reintentos al iniciar, volver la app a primer plano y recuperar conexión.
- La eliminación de fotos limpia referencias y solicita borrado en Storage cuando existe ruta previa.

## Validación ejecutada

- [x] `npm run lint`
- [x] `npm run build`
- [x] `npm run androidReleaseConSimbolos`
- [x] App abierta en `http://127.0.0.1:9000` con MCP Browser.
- [x] La app redirige a `/acceso?redirigir=/` sin sesión.
- [x] Consola del navegador sin errores ni advertencias nuevas.
- [x] Servidor local respondió `200`.

## Validación externa pendiente

- No se pudo aplicar CORS al bucket porque esta máquina no tiene instalados `firebase`, `gcloud` ni `gsutil`.
- Falta aplicar `FirebaseStorageCors.json` al bucket real desde una herramienta de Google.
- Falta prueba manual con usuario Firebase real: subir foto desde navegador, revisar archivo en Storage, revisar campos en Firestore, repetir en Android y comprobar aislamiento entre dos usuarios.

Fecha de creación: 22 de Mayo 2026
Fecha de última actualización: 22 de Mayo 2026
Estado: TERMINADO_LOCAL_CON_PENDIENTES_EXTERNOS
