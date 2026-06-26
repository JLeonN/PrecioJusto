# Plan Producción Firebase Precio Justo

## Descripción del plan

Pasar Precio Justo desde el proyecto Firebase de pruebas `preciojustopruebas2` al proyecto Firebase de producción `PrecioJustoProd`, manteniendo intacta la integración Firebase ya terminada. El plan también debe limpiar textos visibles de prueba y validar que la app quede lista para pruebas finales de producción en navegador de desarrollo y Android, sin tocar AdMob.

## Objetivo principal

- Verificar y preparar el proyecto Firebase de producción `PrecioJustoProd`.
- Cambiar la configuración activa de la app para usar Firebase producción.
- Mantener `preciojustopruebas2` como respaldo histórico sin borrarlo.
- Revisar que no queden textos visibles de modo prueba en la app.
- Validar Auth, Firestore privado, reglas, datos por usuario y Android contra producción.

## Reglas del plan

- No borrar ni modificar destructivamente el proyecto Firebase de pruebas `preciojustopruebas2`.
- No tocar AdMob ni configuración de publicidad.
- No activar Firebase Storage, fotos ni Blaze.
- No mezclar datos de prueba con datos de producción.
- No hacer push ni release final sin confirmación de Leo.
- No guardar secretos en archivos versionados.
- Mantener Firebase producción limpio para pruebas finales con cuentas nuevas.

## FASE 1: Auditar configuración actual

### Objetivo

Confirmar desde dónde está apuntando la app antes de cambiar a producción.

- [x] Revisar `.firebaserc` y confirmar el proyecto Firebase activo actual.
- [x] Revisar `.env.local` o variables locales usadas por Firebase.
- [ ] Revisar `android/app/google-services.json` y confirmar a qué proyecto pertenece.
- [x] Revisar `firebase.json` y confirmar que apunta a `firestore.rules`.
- [x] Buscar referencias activas a `preciojustopruebas2`.
- [x] Buscar referencias activas a `PrecioJustoPruebas2`.
- [ ] Separar referencias técnicas/documentación de referencias usadas por la app.
- [ ] Confirmar que el repo está limpio o anotar cambios pendientes antes de tocar configuración.

## FASE 2: Verificar Firebase Producción

### Objetivo

Confirmar que `PrecioJustoProd` existe y tiene los servicios necesarios para la app.

- [x] Usar Firebase CLI para listar proyectos disponibles.
- [ ] Confirmar que existe el proyecto de producción `PrecioJustoProd`.
- [ ] Confirmar el `projectId` real de producción.
- [ ] Confirmar que Firebase Auth está activado con correo y contraseña.
- [ ] Confirmar que Firestore está creado.
- [ ] Confirmar que las reglas Firestore privadas pueden desplegarse en producción.
- [ ] Confirmar que existe o crear app web de producción.
- [ ] Confirmar que existe o crear app Android de producción con package correcto.
- [ ] Descargar o preparar `google-services.json` de producción.
- [ ] Obtener la configuración web Firebase de producción para `.env.local`.

## FASE 3: Cambiar la app a Firebase Producción

### Objetivo

Reemplazar la configuración activa de Firebase para que la app use producción.

- [ ] Actualizar `.firebaserc` para que el default apunte al proyecto de producción.
- [ ] Actualizar `.env.local` con la configuración web de producción.
- [ ] Reemplazar `android/app/google-services.json` por el archivo de producción.
- [x] Verificar que no queden credenciales o tokens sensibles en archivos versionados.
- [ ] Ejecutar una búsqueda global de `preciojustopruebas2` en archivos activos.
- [ ] Mantener referencias históricas solo en planes, resúmenes o documentación cuando sean útiles.
- [ ] Confirmar que `FirebaseBaseService` inicializa con el `projectId` de producción.

## FASE 4: Desplegar reglas Firestore en producción

### Objetivo

Aplicar las reglas privadas actuales al proyecto Firebase de producción.

- [x] Revisar `firestore.rules` antes del deploy.
- [x] Confirmar que las reglas solo permiten acceso bajo `usuarios/{usuarioId}`.
- [x] Confirmar que toda ruta fuera del modelo privado queda denegada.
- [ ] Ejecutar deploy de reglas contra producción.
- [ ] Confirmar desde Firebase CLI o Console que el deploy terminó correctamente.
- [ ] No modificar reglas para fotos, comunidad ni datos públicos.

## FASE 5: Limpiar textos visibles de prueba

### Objetivo

Quitar de la interfaz cualquier marca que haga pensar al usuario que está en pruebas.

- [x] Buscar `MODO PRUEBA` en `src`.
- [x] Buscar textos visibles con `prueba`, `pruebas`, `testing`, `debug`, `demo` o similares.
- [x] Revisar `MainLayout.vue` y encabezados visibles.
- [ ] Revisar Configuración y Autenticación.
- [ ] Revisar textos de Firebase visibles para usuario normal.
- [ ] Mantener texto técnico solo si está dentro de herramientas de prueba o documentación.
- [x] No tocar AdMob ni banners de publicidad.

## FASE 6: Validar datos privados en producción

### Objetivo

Probar que Firebase producción funciona con datos nuevos y aislados.

- [ ] Crear una cuenta nueva de prueba en producción.
- [ ] Iniciar sesión con esa cuenta.
- [ ] Guardar perfil desde Configuración.
- [ ] Confirmar en Firestore producción `usuarios/{usuarioId}/configuracion/perfil`.
- [ ] Crear producto y confirmar documento en Firestore producción.
- [ ] Crear comercio y confirmar documento en Firestore producción.
- [ ] Crear Lista Justa y confirmar documento en Firestore producción.
- [ ] Cambiar preferencias de tema y moneda y confirmar documento en Firestore producción.
- [ ] Usar Mesa de Trabajo y confirmar documentos en Firestore producción.
- [ ] Confirmar que los datos se ven al recargar la app.
- [ ] Confirmar que no se escriben datos en `preciojustopruebas2`.

## FASE 7: Validar seguridad entre usuarios

### Objetivo

Confirmar que producción mantiene aislamiento real entre cuentas.

- [ ] Crear o usar una segunda cuenta de prueba en producción.
- [ ] Confirmar que usuario B no ve datos de usuario A.
- [x] Intentar leer datos de usuario A desde usuario B y confirmar `permission-denied`.
- [ ] Confirmar que usuario sin sesión no puede leer rutas privadas.
- [x] Confirmar que rutas fuera de `usuarios/{usuarioId}` quedan bloqueadas.
- [x] Eliminar cuentas temporales solo si Leo lo autoriza.

## FASE 8: Validar Android con Firebase Producción

### Objetivo

Confirmar que la app Android usa el proyecto Firebase de producción.

- [x] Ejecutar `npm run lint`.
- [x] Ejecutar `npm run build`.
- [x] Ejecutar `npm run cel`.
- [ ] Instalar o abrir la app en Android.
- [ ] Iniciar sesión con cuenta de producción.
- [ ] Crear o editar datos desde Android.
- [ ] Confirmar en Firestore producción que Android escribe en el proyecto correcto.
- [ ] Confirmar que no aparecen errores de Firebase en Android Studio.
- [ ] Confirmar que el cambio de cuenta limpia datos visibles del usuario anterior.

## FASE 9: Documentar cierre de producción

### Objetivo

Dejar claro para futuras IA y para Leo qué proyecto Firebase usa producción.

- [x] Actualizar resumen Firebase si corresponde.
- [ ] Documentar que `preciojustopruebas2` queda como respaldo histórico.
- [ ] Documentar el `projectId` de producción usado realmente.
- [ ] Anotar cuentas temporales usadas para prueba si Leo quiere conservarlas.
- [ ] Mover este plan a terminados solo cuando el testing esté completo.

## FASE TESTING

### Objetivo

Validar de forma ejecutable por IA y revisable por Leo que producción quedó lista sin tocar AdMob.

- [x] `npm run lint` pasa sin errores.
- [x] `npm run build` pasa sin errores.
- [x] `npm run cel` pasa y abre Android Studio.
- [ ] Firebase CLI confirma el proyecto de producción activo.
- [ ] Firebase Auth producción permite crear cuenta nueva.
- [ ] Firestore producción recibe perfil, productos, comercios, listas, preferencias y Mesa.
- [ ] Firestore reglas producción bloquean acceso entre usuarios.
- [x] La app no muestra `MODO PRUEBA` ni textos visibles de pruebas.
- [ ] Android usa Firebase producción.
- [ ] Leo prueba en celular y confirma que funciona correctamente.

## Progreso del plan

- [ ] Fase 1: Auditar configuración actual
- [ ] Fase 2: Verificar Firebase Producción
- [ ] Fase 3: Cambiar la app a Firebase Producción
- [ ] Fase 4: Desplegar reglas Firestore en producción
- [ ] Fase 5: Limpiar textos visibles de prueba
- [ ] Fase 6: Validar datos privados en producción
- [ ] Fase 7: Validar seguridad entre usuarios
- [ ] Fase 8: Validar Android con Firebase Producción
- [ ] Fase 9: Documentar cierre de producción
- [ ] Fase Testing (automatizado OK, prueba manual de Leo pendiente)

Fecha de creación: 25 de junio 2026
Fecha de última actualización: 25 de junio 2026
Estado: EN EJECUCIÓN

## Ejecución 25 de junio 2026

- Producción verificada: proyecto `PrecioJustoProd` con `projectId` real `preciojustoprod`.
- Se crearon las apps Firebase `PrecioJustoWebProd` y `PrecioJustoAndroidProd` con package `com.preciojusto.app`.
- Se activó Cloud Firestore y se creó la base `(default)` en `nam5` con Free Tier activo.
- Se desplegaron reglas privadas de Firestore a producción.
- Se activó Firebase Auth con Email/Password desde `firebase.json`.
- Se actualizó `.firebaserc`, `.env.local` y `android/app/google-services.json` para apuntar a producción.
- Se validó por API que un usuario puede escribir/leer sus datos y que otro usuario recibe bloqueo `permission-denied`.
- Se limpiaron usuarios y documentos temporales usados en la validación automatizada.
- Queda pendiente validar flujo completo de pantallas y Android con `npm run cel` y prueba real de Leo.

## Validación técnica

- `npm run lint`: OK.
- `npm run build`: OK.
- `npm run cel`: OK, compilación Android release ejecutada.
- `firebase use`: `preciojustoprod`.
- Validación Firestore/Auth por API: OK, con usuarios temporales creados y eliminados.
- Pendiente real: prueba manual de Leo en celular creando datos reales en producción.
