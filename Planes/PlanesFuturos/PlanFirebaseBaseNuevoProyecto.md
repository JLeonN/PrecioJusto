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

## FASE 1: Crear proyecto nuevo en Firebase Console

### Objetivo

Crear un proyecto Firebase limpio que será la base real de Precio Justo.

- [ ] Entrar a Firebase Console con la cuenta correcta.
- [ ] Crear un proyecto nuevo de Firebase para Precio Justo.
- [ ] Definir nombre del proyecto y `projectId` nuevos.
- [ ] Decidir si se activa Google Analytics durante la creación.
- [ ] Confirmar región y configuración inicial del proyecto.
- [ ] Registrar en notas locales que los proyectos anteriores no se usarán para esta integración.

## FASE 2: Registrar app web nueva

### Objetivo

Crear la app web dentro del proyecto Firebase nuevo y obtener su configuración.

- [ ] Registrar una app web nueva en Firebase Console.
- [ ] Copiar `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId` y `measurementId` si existe.
- [ ] Definir nombres de variables de entorno para cada dato de configuración web.
- [ ] Actualizar `DatosLocalesProyectos.md` con una sección nueva para el proyecto Firebase actual.
- [ ] Marcar los datos de proyectos anteriores como históricos o no usados para evitar confusión futura.

## FASE 3: Registrar app Android nueva

### Objetivo

Registrar la app Android actual en el proyecto Firebase nuevo.

- [ ] Confirmar package name actual: `com.preciojusto.app`.
- [ ] Registrar app Android nueva en Firebase Console.
- [ ] Descargar el nuevo `google-services.json`.
- [ ] Reemplazar `android/app/google-services.json` solo después de hacer respaldo o confirmar que el archivo viejo ya no se usará.
- [ ] Validar que Gradle sigue aplicando `com.google.gms.google-services`.
- [ ] Ejecutar validación Android mínima de Google Services.

## FASE 4: Preparar variables de entorno

### Objetivo

Dejar la configuración web de Firebase fuera del código duro y lista para Vite/Quasar.

- [ ] Revisar convención actual del proyecto para variables de entorno.
- [ ] Crear o actualizar archivo de ejemplo de variables si corresponde.
- [ ] Definir variables para configuración Firebase web.
- [ ] Evitar guardar contraseñas, correos o claves privadas en archivos versionables.
- [ ] Documentar cómo completar las variables locales para desarrollo.

## FASE 5: Instalar Firebase SDK

### Objetivo

Agregar Firebase como dependencia sin conectar todavía datos reales de la app.

- [ ] Instalar paquete `firebase`.
- [ ] Verificar cambios en `package.json` y `package-lock.json`.
- [ ] Confirmar que no se agregan dependencias innecesarias.
- [ ] Ejecutar lint o build mínimo después de instalar.

## FASE 6: Crear servicio base de Firebase

### Objetivo

Centralizar la inicialización de Firebase para que el resto de la app no importe Firebase directamente.

- [ ] Crear archivo PascalCase para inicialización base de Firebase.
- [ ] Inicializar Firebase App usando variables de entorno.
- [ ] Exportar instancias preparadas de Auth y Firestore.
- [ ] Evitar inicializar Firebase más de una vez.
- [ ] Manejar configuración faltante con error claro para desarrollo.
- [ ] Mantener nombres en español salvo APIs externas.

## FASE 7: Activar Firestore Offline

### Objetivo

Configurar Firestore para permitir uso offline cuando se empiece a usar como base de datos.

- [ ] Revisar configuración recomendada para Firestore Offline en web.
- [ ] Activar persistencia offline de Firestore donde corresponda.
- [ ] Manejar error cuando el navegador no permita persistencia.
- [ ] Documentar diferencia entre caché offline y almacenamiento local actual.
- [ ] No conectar todavía productos, comercios ni listas a Firestore.

## FASE 8: Preparar Auth base

### Objetivo

Dejar Firebase Auth inicializado para que un plan posterior implemente login real.

- [ ] Confirmar proveedores Auth que se usarán primero.
- [ ] Dejar Auth exportado desde el servicio base.
- [ ] Crear estructura mínima para observar usuario autenticado en un plan posterior.
- [ ] No bloquear todavía la app detrás de login.
- [ ] No reemplazar `UsuarioActualService` todavía.

## FASE 9: Crear verificación técnica mínima

### Objetivo

Comprobar que Firebase carga correctamente sin modificar almacenamiento principal.

- [ ] Agregar una verificación controlada de inicialización en desarrollo.
- [ ] Confirmar que la app puede iniciar con configuración Firebase completa.
- [ ] Confirmar que la app muestra error claro si falta configuración local.
- [ ] Verificar que no se realizan lecturas o escrituras reales innecesarias en Firestore.
- [ ] Verificar que LocalStorage/Capacitor siguen funcionando como fuente principal.

## FASE TESTING

### Objetivo

Validar que Firebase quedó instalado e inicializado sin romper la app actual.

- [ ] Ejecutar `npm run lint`.
- [ ] Ejecutar `npm run build`.
- [ ] Ejecutar validación Android de Google Services.
- [ ] Abrir la app en navegador y verificar que carga sin errores nuevos.
- [ ] Verificar que productos, comercios, listas y preferencias siguen usando almacenamiento local actual.
- [ ] Verificar que Firebase no migra datos ni crea documentos de usuario todavía.
- [ ] Verificar que las variables de entorno faltantes tienen mensaje claro en desarrollo.
- [ ] Revisar `DatosLocalesProyectos.md` y confirmar que el proyecto Firebase nuevo quedó documentado.

## Progreso del plan

- [ ] Fase 1: Crear proyecto nuevo en Firebase Console
- [ ] Fase 2: Registrar app web nueva
- [ ] Fase 3: Registrar app Android nueva
- [ ] Fase 4: Preparar variables de entorno
- [ ] Fase 5: Instalar Firebase SDK
- [ ] Fase 6: Crear servicio base de Firebase
- [ ] Fase 7: Activar Firestore Offline
- [ ] Fase 8: Preparar Auth base
- [ ] Fase 9: Crear verificación técnica mínima
- [ ] Fase Testing

Fecha de creación: 19 de Mayo 2026
Fecha de última actualización: 19 de Mayo 2026
Estado: BORRADOR
