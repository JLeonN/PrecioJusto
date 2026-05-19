# PLAN FIREBASE BASE NUEVO PROYECTO

## Descripción del plan

Crear desde cero la base real de Firebase para Precio Justo usando un proyecto nuevo en Firebase Console. Los proyectos existentes vistos en Firebase (`PrecioJustoPruebas` y `PrecioJustoProd`) no se usarán para esta integración, salvo como referencia histórica si hiciera falta comparar algo.

Este plan cubre la creación del proyecto nuevo, el registro de la app web y Android, la documentación de los nuevos datos locales, la instalación del SDK de Firebase y la conexión mínima de Firebase Auth, Firestore y Firestore Offline. No migra productos, comercios, listas ni fotos todavía.

## Objetivo principal

- Crear un proyecto nuevo de Firebase para Precio Justo.
- Registrar una app web y una app Android nuevas dentro del proyecto.
- Actualizar la documentación local con los datos nuevos y dejar los datos viejos como referencia histórica.
- Instalar e inicializar Firebase en la app sin cambiar todavía la persistencia principal.
- Dejar lista la base técnica para los próximos planes de Auth, Firestore privado, migración local y Storage.

## Reglas del plan

- No usar los proyectos Firebase existentes para esta integración nueva.
- No borrar datos viejos de `DatosLocalesProyectos.md` sin confirmar antes con Leo.
- No migrar datos locales en este plan.
- No subir fotos a Firebase Storage en este plan.
- No reemplazar `LocalStorageAdapter` ni `CapacitorAdapter` en este plan.
- No activar comunidad en este plan.
- Mantener la app funcionando como hasta ahora mientras se agrega la base de Firebase.
- Usar variables de entorno para configuración web cuando corresponda.
- No hardcodear credenciales sensibles ni contraseñas en código.

## Resultado de ejecución

Ejecución realizada el 19 de Mayo 2026.

- Proyecto Firebase nuevo creado: `PrecioJustoPruebas2`.
- `projectId` confirmado: `preciojustopruebas2`.
- Google Analytics quedó desactivado.
- App web registrada: `PrecioJustoWebPruebas2`.
- App Android registrada: `PrecioJustoAndroidPruebas2`.
- Package Android confirmado: `com.preciojusto.app`.
- `android/app/google-services.json` reemplazado con el archivo nuevo del proyecto `preciojustopruebas2`.
- El archivo anterior quedó respaldado localmente en `.playwright-mcp/GoogleServicesAnteriorPrecioJustoPruebas.json`.
- Firestore creado en `nam5 (United States)`.
- Firestore quedó en modo producción con reglas iniciales cerradas: lectura y escritura denegadas por defecto.
- Firebase Auth quedó preparado con proveedor `Correo electrónico/contraseña`.
- No se crearon usuarios, colecciones ni documentos Firestore desde la app.
- `firebase` quedó instalado como dependencia del proyecto.
- Se creó `FirebaseBaseService` para inicializar Firebase App, Auth y Firestore.
- Se creó `FirebaseBoot` para verificación controlada en desarrollo.
- Firestore Offline quedó configurado con caché persistente multi-tab y fallback a caché en memoria si el navegador no lo permite.
- La app sigue usando `AlmacenamientoService`, `LocalStorageAdapter` y `CapacitorAdapter` como persistencia principal.
- `DatosLocalesProyectos.md` y `Resumen11Firebase.md` quedaron actualizados con el estado nuevo.

## Observaciones de testing

- `google-services.json` validado con `project_id = preciojustopruebas2`.
- `google-services.json` validado con `package_name = com.preciojusto.app`.
- `npm run lint` pasó sin errores.
- `npm run build` pasó correctamente.
- `npm run androidReleaseConSimbolos` pasó correctamente.
- La app cargó en navegador local en `http://127.0.0.1:9300/#/` usando MCP.
- La consola confirmó Firebase base inicializado con Auth, Firestore y Firestore Offline activos.
- La interfaz cargó correctamente en la vista `Lista Justa`.
- Se confirmó por búsqueda de código que ningún servicio de productos, comercios, listas, preferencias o fotos importa Firebase directamente.
- En navegador local aparecieron errores CORS de `version.json` contra GitHub Pages. Son del chequeo de actualización existente y no están relacionados con Firebase.

## FASE 1: Crear proyecto nuevo en Firebase Console

### Objetivo

Crear un proyecto Firebase limpio que será la base real de Precio Justo.

- [x] Entrar a Firebase Console con la cuenta correcta.
- [x] Crear un proyecto nuevo de Firebase para Precio Justo.
- [x] Definir nombre del proyecto y `projectId` nuevos.
- [x] Decidir si se activa Google Analytics durante la creación.
- [x] Confirmar región y configuración inicial del proyecto.
- [x] Registrar en notas locales que los proyectos anteriores no se usarán para esta integración.

## FASE 2: Registrar app web nueva

### Objetivo

Crear la app web dentro del proyecto Firebase nuevo y obtener su configuración.

- [x] Registrar una app web nueva en Firebase Console.
- [x] Copiar `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId` y `measurementId` si existe.
- [x] Definir nombres de variables de entorno para cada dato de configuración web.
- [x] Actualizar `DatosLocalesProyectos.md` con una sección nueva para el proyecto Firebase actual.
- [x] Marcar los datos de proyectos anteriores como históricos o no usados para evitar confusión futura.

## FASE 3: Registrar app Android nueva

### Objetivo

Registrar la app Android actual en el proyecto Firebase nuevo.

- [x] Confirmar package name actual: `com.preciojusto.app`.
- [x] Registrar app Android nueva en Firebase Console.
- [x] Descargar el nuevo `google-services.json`.
- [x] Reemplazar `android/app/google-services.json` solo después de hacer respaldo o confirmar que el archivo viejo ya no se usará.
- [x] Validar que Gradle sigue aplicando `com.google.gms.google-services`.
- [x] Ejecutar validación Android mínima de Google Services.

## FASE 4: Preparar variables de entorno

### Objetivo

Dejar la configuración web de Firebase fuera del código duro y lista para Vite/Quasar.

- [x] Revisar convención actual del proyecto para variables de entorno.
- [x] Crear o actualizar archivo de ejemplo de variables si corresponde.
- [x] Definir variables para configuración Firebase web.
- [x] Evitar guardar contraseñas, correos o claves privadas en archivos versionables.
- [x] Documentar cómo completar las variables locales para desarrollo.

## FASE 5: Instalar Firebase SDK

### Objetivo

Agregar Firebase como dependencia sin conectar todavía datos reales de la app.

- [x] Instalar paquete `firebase`.
- [x] Verificar cambios en `package.json` y `package-lock.json`.
- [x] Confirmar que no se agregan dependencias innecesarias.
- [x] Ejecutar lint o build mínimo después de instalar.

## FASE 6: Crear servicio base de Firebase

### Objetivo

Centralizar la inicialización de Firebase para que el resto de la app no importe Firebase directamente.

- [x] Crear archivo PascalCase para inicialización base de Firebase.
- [x] Inicializar Firebase App usando variables de entorno.
- [x] Exportar instancias preparadas de Auth y Firestore.
- [x] Evitar inicializar Firebase más de una vez.
- [x] Manejar configuración faltante con error claro para desarrollo.
- [x] Mantener nombres en español salvo APIs externas.

## FASE 7: Activar Firestore Offline

### Objetivo

Configurar Firestore para permitir uso offline cuando se empiece a usar como base de datos.

- [x] Revisar configuración recomendada para Firestore Offline en web.
- [x] Activar persistencia offline de Firestore donde corresponda.
- [x] Manejar error cuando el navegador no permita persistencia.
- [x] Documentar diferencia entre caché offline y almacenamiento local actual.
- [x] No conectar todavía productos, comercios ni listas a Firestore.

## FASE 8: Preparar Auth base

### Objetivo

Dejar Firebase Auth inicializado para que un plan posterior implemente login real.

- [x] Confirmar proveedores Auth que se usarán primero.
- [x] Dejar Auth exportado desde el servicio base.
- [x] Crear estructura mínima para observar usuario autenticado en un plan posterior.
- [x] No bloquear todavía la app detrás de login.
- [x] No reemplazar `UsuarioActualService` todavía.

## FASE 9: Crear verificación técnica mínima

### Objetivo

Comprobar que Firebase carga correctamente sin modificar almacenamiento principal.

- [x] Agregar una verificación controlada de inicialización en desarrollo.
- [x] Confirmar que la app puede iniciar con configuración Firebase completa.
- [x] Confirmar que la app muestra error claro si falta configuración local.
- [x] Verificar que no se realizan lecturas o escrituras reales innecesarias en Firestore.
- [x] Verificar que LocalStorage/Capacitor siguen funcionando como fuente principal.

## FASE TESTING

### Objetivo

Validar que Firebase quedó instalado e inicializado sin romper la app actual.

- [x] Ejecutar `npm run lint`.
- [x] Ejecutar `npm run build`.
- [x] Ejecutar validación Android de Google Services.
- [x] Abrir la app en navegador y verificar que carga sin errores nuevos.
- [x] Verificar que productos, comercios, listas y preferencias siguen usando almacenamiento local actual.
- [x] Verificar que Firebase no migra datos ni crea documentos de usuario todavía.
- [x] Verificar que las variables de entorno faltantes tienen mensaje claro en desarrollo.
- [x] Revisar `DatosLocalesProyectos.md` y confirmar que el proyecto Firebase nuevo quedó documentado.

## Progreso del plan

- [x] Fase 1: Crear proyecto nuevo en Firebase Console
- [x] Fase 2: Registrar app web nueva
- [x] Fase 3: Registrar app Android nueva
- [x] Fase 4: Preparar variables de entorno
- [x] Fase 5: Instalar Firebase SDK
- [x] Fase 6: Crear servicio base de Firebase
- [x] Fase 7: Activar Firestore Offline
- [x] Fase 8: Preparar Auth base
- [x] Fase 9: Crear verificación técnica mínima
- [x] Fase Testing

Fecha de creación: 19 de Mayo 2026
Fecha de última actualización: 19 de Mayo 2026
Estado: TERMINADO


