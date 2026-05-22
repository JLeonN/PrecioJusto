# PLAN FIREBASE STORAGE FOTOS

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

- [ ] Fase 1: Auditar Estado Actual De Fotos
- [ ] Fase 2: Revisar Configuración De Firebase Storage
- [ ] Fase 3: Definir Modelo De Rutas Y Metadatos
- [ ] Fase 4: Crear Servicio Central De Fotos
- [ ] Fase 5: Integrar Fotos En Productos
- [ ] Fase 6: Integrar Fotos En Comercios Y Direcciones
- [ ] Fase 7: Integrar Fotos En Lista Justa
- [ ] Fase 8: Manejar Offline Y Reintentos
- [ ] Fase 9: Limpieza Y Migración De Fotos Existentes
- [ ] Fase Testing

Fecha de creación: 22 de Mayo 2026
Fecha de última actualización: 22 de Mayo 2026
Estado: BORRADOR
