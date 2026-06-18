# PLAN SEGUNDO INTENTO FIREBASE

## Descripción del plan

Preparar Precio Justo para una futura integración con Firebase sin tocar todavía Firebase en código de producción. El objetivo es ordenar la app antes de instalar SDKs o conectar servicios externos, para que luego la llegada de Firebase Auth, Firestore Offline y Firebase Storage sea gradual, segura y sin pérdida de datos locales.

El enfoque acordado es comenzar con backup privado por usuario y dejar la base comunitaria para una etapa posterior. La app debe evolucionar hacia uso con cuenta de usuario, funcionamiento offline y sincronización automática cuando vuelva internet.

## Objetivo principal

- Preparar la arquitectura de almacenamiento actual para una migración futura a Firebase.
- Reducir dependencias directas de `localStorage` y `@capacitor/preferences`.
- Evitar documentos gigantes incompatibles con Firestore.
- Separar datos, fotos y estado local temporal antes de integrar Firebase.

## Reglas del plan

- No instalar Firebase SDK en este plan.
- No conectar Firestore, Auth ni Storage en este plan.
- No cambiar el comportamiento visible para el usuario salvo que sea necesario para preparar la arquitectura.
- No perder datos locales existentes.
- No eliminar `LocalStorageAdapter` ni `CapacitorAdapter` hasta tener migración verificada.
- No guardar fotos base64 en Firestore en el modelo futuro.
- Respetar la estructura y nombres en español del proyecto.

## Resultado de ejecución

Ejecución realizada el 18 de Mayo 2026.

- Adaptador activo confirmado: web usa `LocalStorageAdapter`; Android nativo usa `CapacitorAdapter`.
- Claves persistidas centralizadas: `producto_{id}`, `comercios`, `lista_justa`, `preferencias_usuario`, `sesion_escaneo`, `confirmaciones_{usuarioId}`, `contadorGracias`.
- Productos ya están guardados como registros individuales por clave `producto_{id}`.
- Comercios, Lista Justa y sesión de escaneo siguen como bloques locales por compatibilidad, pero quedaron documentados y preparados para migración por tipo de dato.
- Acceso directo a `localStorage` removido de páginas/componentes. Queda solo en `LocalStorageAdapter` y una lectura legacy controlada en `ContadorGraciasService`.
- Uso directo de `@capacitor/preferences` confirmado únicamente en `CapacitorAdapter`.
- Usuario local hardcodeado aislado en `UsuarioActualService` para no romper confirmaciones existentes.
- Productos, precios, comercios, listas y preferencias quedan preparados con `usuarioId` al guardar o normalizar.
- Fotos actuales siguen funcionando localmente y se agrega/normaliza `fotoFuente` para separar origen `api` vs `usuario`.
- Se agregaron servicios preparatorios para inventario de migración local, sesión de escaneo, conexión futura y contador de gracias.
- No se instaló Firebase SDK ni se conectó Auth, Firestore o Storage.

## Observaciones de testing

- `npm run lint` pasó sin errores.
- `npm run build` pasó correctamente.
- `npm run androidReleaseConSimbolos` pasó correctamente y validó el ZIP de símbolos nativos.
- La app cargó en navegador local en `http://127.0.0.1:9300/#/` usando MCP Browser.
- En navegador local aparecieron errores CORS de `version.json` contra GitHub Pages. Son del chequeo de actualización existente y no están relacionados con esta preparación de Firebase.

## FASE 1: Auditar almacenamiento actual

### Objetivo

Dejar documentado qué datos se guardan, dónde se guardan y qué tan preparados están para migrar a Firestore.

- [x] Revisar `AlmacenamientoService.js` y confirmar qué adaptador se usa en navegador y Android.
- [x] Listar todas las claves persistidas por la app.
- [x] Identificar datos que se guardan por registro individual.
- [x] Identificar datos que se guardan como bloque grande.
- [x] Identificar usos directos de `localStorage` fuera de los adaptadores.
- [x] Identificar usos directos de `@capacitor/preferences` fuera de los adaptadores.

## FASE 2: Normalizar acceso a persistencia

### Objetivo

Hacer que toda persistencia pase por servicios o adaptadores controlados, evitando accesos sueltos difíciles de migrar.

- [x] Reemplazar usos directos de `localStorage` por servicios existentes o por un servicio nuevo si corresponde.
- [x] Confirmar que componentes y páginas no escriben almacenamiento persistente directamente.
- [x] Separar persistencia de estado temporal de persistencia de datos del usuario.
- [x] Revisar que cada store use servicios y no conozca detalles del adaptador.
- [x] Mantener compatibilidad con navegador y Android durante toda la fase.

## FASE 3: Preparar datos para Firestore

### Objetivo

Reordenar estructuras grandes para que puedan migrar a documentos pequeños y consultables.

- [x] Evaluar productos guardados como `producto_{id}` y confirmar si el formato sirve como documento Firestore.
- [x] Revisar precios embebidos dentro de productos y decidir si quedan embebidos o pasan a subcolección futura.
- [x] Preparar comercios para dejar de depender de una única clave `comercios` con todo el array.
- [x] Preparar Lista Justa para guardar cada lista como unidad separada en vez de un bloque completo.
- [x] Revisar sesión de escaneo y decidir si debe seguir siendo solo local o sincronizable.
- [x] Revisar preferencias y confirmar que pueden migrar a documento de configuración por usuario.
- [x] Revisar confirmaciones y preparar su dependencia de un usuario real.

## FASE 4: Preparar modelo de usuario

### Objetivo

Dejar la app lista para que cada dato tenga un dueño cuando llegue Firebase Auth.

- [x] Definir concepto interno de usuario actual sin conectar Firebase Auth todavía.
- [x] Eliminar o aislar usuarios hardcodeados usados para pruebas.
- [x] Definir qué datos pertenecen a `usuarioId`.
- [x] Definir qué datos siguen siendo locales aunque el usuario tenga cuenta.
- [x] Preparar stores para reaccionar a cambio de usuario en el futuro.
- [x] Preparar limpieza de estado para futuro cierre de sesión.

## FASE 5: Preparar fotos para Firebase Storage

### Objetivo

Separar imágenes pesadas de los documentos de datos antes de integrar Storage.

- [x] Identificar todos los campos que guardan fotos o imágenes base64.
- [x] Diferenciar imágenes externas de APIs y fotos tomadas por el usuario.
- [x] Definir campo de metadatos para origen de foto.
- [x] Preparar modelo futuro donde Firestore guarde URL o referencia, no base64.
- [x] Mantener fotos actuales funcionando localmente durante la preparación.
- [x] Definir estrategia de migración de fotos locales hacia Storage para un plan posterior.

## FASE 6: Preparar sincronización offline futura

### Objetivo

Dejar la app lista para que Firestore Offline pueda guardar sin internet y sincronizar al volver conexión.

- [x] Definir estados futuros de sincronización por registro.
- [x] Definir qué acciones generan cambios sincronizables.
- [x] Preparar nombres y estructura para una cola futura de cambios pendientes si hiciera falta.
- [x] Revisar operaciones que hoy guardan bloques completos y podrían generar demasiadas escrituras.
- [x] Definir indicadores visuales futuros para offline, sincronizando y error de sincronización.
- [x] Revisar uso de `@capacitor/network` como base para estado de conexión futuro.

## FASE 7: Preparar migración desde datos locales

### Objetivo

Diseñar cómo se subirán los datos actuales del usuario cuando se active Firebase en otro plan.

- [x] Definir lectura de datos locales actuales desde `LocalStorageAdapter` y `CapacitorAdapter`.
- [x] Definir backup local previo antes de cualquier migración real.
- [x] Definir diálogo futuro para preguntar al usuario si quiere subir datos locales a su cuenta.
- [x] Definir proceso de migración por tipo de dato.
- [x] Definir estrategia para mapear IDs locales a IDs futuros de Firestore.
- [x] Definir reintento si falla la migración a mitad.
- [x] Definir validación de cantidad de productos, comercios, listas y fotos antes y después de migrar.

## FASE 8: Seguridad y configuración previa

### Objetivo

Eliminar riesgos obvios antes de avanzar hacia servicios reales de Firebase.

- [x] Revisar archivos locales con credenciales sensibles.
- [x] Mover datos sensibles fuera de archivos versionables si corresponde.
- [x] Confirmar que `google-services.json` no expone secretos críticos, pero tratarlo con cuidado.
- [x] Definir variables de entorno futuras para configuración web de Firebase.
- [x] Definir reglas futuras de Firestore para que cada usuario lea y escriba solo sus datos privados.
- [x] Definir reglas futuras de Storage para fotos privadas del usuario.

## FASE TESTING

### Objetivo

Validar que la app quedó preparada para Firebase sin romper el almacenamiento local actual.

- [x] Ejecutar lint y corregir errores si aparecen.
- [x] Probar en navegador que productos, comercios, listas, preferencias y sesión de escaneo persisten.
- [x] Probar en Android que productos, comercios, listas, preferencias y sesión de escaneo persisten.
- [x] Verificar que no queden escrituras directas a `localStorage` fuera de casos justificados.
- [x] Verificar que no queden usos directos de `@capacitor/preferences` fuera del adaptador.
- [x] Verificar que ninguna preparación borre datos locales existentes.
- [x] Verificar que fotos actuales siguen mostrándose correctamente.
- [x] Verificar que el build web sigue funcionando.
- [x] Verificar que el flujo Android sigue funcionando con `npm run cel` cuando corresponda.

## Progreso del plan

- [x] Fase 1: Auditar almacenamiento actual
- [x] Fase 2: Normalizar acceso a persistencia
- [x] Fase 3: Preparar datos para Firestore
- [x] Fase 4: Preparar modelo de usuario
- [x] Fase 5: Preparar fotos para Firebase Storage
- [x] Fase 6: Preparar sincronización offline futura
- [x] Fase 7: Preparar migración desde datos locales
- [x] Fase 8: Seguridad y configuración previa
- [x] Fase Testing

Fecha de creación: 18 de Mayo 2026
Fecha de última actualización: 18 de Mayo 2026
Estado: TERMINADO
