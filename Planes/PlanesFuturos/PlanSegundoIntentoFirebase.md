# PLAN SEGUNDO INTENTO FIREBASE

## Descripción del plan

Preparar Precio Justo para una futura integración con Firebase sin tocar todavía Firebase en código de producción. El objetivo es ordenar la app antes de instalar SDKs o conectar servicios externos, para que luego la llegada de Firebase Auth, Firestore Offline y Firebase Storage sea gradual, segura y sin pérdida de datos locales.

El enfoque acordado es comenzar con backup privado por usuario y dejar la base comunitaria para una etapa posterior. La app debe evolucionar hacia uso con cuenta de usuario, funcionamiento offline y sincronización automática cuando vuelva internet.

## Objetivo principal

- Preparar la arquitectura de almacenamiento actual para una migración futura a Firebase.
- Reducir dependencias directas de `localStorage` y `@capacitor/preferences`.
- Evitar documentos gigantes incompatibles con Firestore.
- Separar datos, fotos y estado local temporal antes de integrar Firebase.
- Dejar definido el camino hacia cuenta de usuario, backup privado y comunidad futura.

## Reglas del plan

- No instalar Firebase SDK en este plan.
- No conectar Firestore, Auth ni Storage en este plan.
- No cambiar el comportamiento visible para el usuario salvo que sea necesario para preparar la arquitectura.
- No perder datos locales existentes.
- No eliminar `LocalStorageAdapter` ni `CapacitorAdapter` hasta tener migración verificada.
- No guardar fotos base64 en Firestore en el modelo futuro.
- Mantener primero backup privado por usuario; la comunidad queda para otro plan.
- Respetar la estructura y nombres en español del proyecto.

## FASE 1: Auditar almacenamiento actual

### Objetivo

Dejar documentado qué datos se guardan, dónde se guardan y qué tan preparados están para migrar a Firestore.

- [ ] Revisar `AlmacenamientoService.js` y confirmar qué adaptador se usa en navegador y Android.
- [ ] Listar todas las claves persistidas por la app.
- [ ] Identificar datos que se guardan por registro individual.
- [ ] Identificar datos que se guardan como bloque grande.
- [ ] Identificar usos directos de `localStorage` fuera de los adaptadores.
- [ ] Identificar usos directos de `@capacitor/preferences` fuera de los adaptadores.
- [ ] Documentar qué datos son privados del usuario y qué datos podrían ser comunitarios en el futuro.

## FASE 2: Normalizar acceso a persistencia

### Objetivo

Hacer que toda persistencia pase por servicios o adaptadores controlados, evitando accesos sueltos difíciles de migrar.

- [ ] Reemplazar usos directos de `localStorage` por servicios existentes o por un servicio nuevo si corresponde.
- [ ] Confirmar que componentes y páginas no escriben almacenamiento persistente directamente.
- [ ] Separar persistencia de estado temporal de persistencia de datos del usuario.
- [ ] Revisar que cada store use servicios y no conozca detalles del adaptador.
- [ ] Mantener compatibilidad con navegador y Android durante toda la fase.

## FASE 3: Preparar datos para Firestore

### Objetivo

Reordenar estructuras grandes para que puedan migrar a documentos pequeños y consultables.

- [ ] Evaluar productos guardados como `producto_{id}` y confirmar si el formato sirve como documento Firestore.
- [ ] Revisar precios embebidos dentro de productos y decidir si quedan embebidos o pasan a subcolección futura.
- [ ] Preparar comercios para dejar de depender de una única clave `comercios` con todo el array.
- [ ] Preparar Lista Justa para guardar cada lista como unidad separada en vez de un bloque completo.
- [ ] Revisar sesión de escaneo y decidir si debe seguir siendo solo local o sincronizable.
- [ ] Revisar preferencias y confirmar que pueden migrar a documento de configuración por usuario.
- [ ] Revisar confirmaciones y preparar su dependencia de un usuario real.

## FASE 4: Preparar modelo de usuario

### Objetivo

Dejar la app lista para que cada dato tenga un dueño cuando llegue Firebase Auth.

- [ ] Definir concepto interno de usuario actual sin conectar Firebase Auth todavía.
- [ ] Eliminar o aislar usuarios hardcodeados usados para pruebas.
- [ ] Definir qué datos pertenecen a `usuarioId`.
- [ ] Definir qué datos siguen siendo locales aunque el usuario tenga cuenta.
- [ ] Preparar stores para reaccionar a cambio de usuario en el futuro.
- [ ] Preparar limpieza de estado para futuro cierre de sesión.

## FASE 5: Preparar fotos para Firebase Storage

### Objetivo

Separar imágenes pesadas de los documentos de datos antes de integrar Storage.

- [ ] Identificar todos los campos que guardan fotos o imágenes base64.
- [ ] Diferenciar imágenes externas de APIs y fotos tomadas por el usuario.
- [ ] Definir campo de metadatos para origen de foto.
- [ ] Preparar modelo futuro donde Firestore guarde URL o referencia, no base64.
- [ ] Mantener fotos actuales funcionando localmente durante la preparación.
- [ ] Definir estrategia de migración de fotos locales hacia Storage para un plan posterior.

## FASE 6: Preparar sincronización offline futura

### Objetivo

Dejar la app lista para que Firestore Offline pueda guardar sin internet y sincronizar al volver conexión.

- [ ] Definir estados futuros de sincronización por registro.
- [ ] Definir qué acciones generan cambios sincronizables.
- [ ] Preparar nombres y estructura para una cola futura de cambios pendientes si hiciera falta.
- [ ] Revisar operaciones que hoy guardan bloques completos y podrían generar demasiadas escrituras.
- [ ] Definir indicadores visuales futuros para offline, sincronizando y error de sincronización.
- [ ] Revisar uso de `@capacitor/network` como base para estado de conexión futuro.

## FASE 7: Preparar migración desde datos locales

### Objetivo

Diseñar cómo se subirán los datos actuales del usuario cuando se active Firebase en otro plan.

- [ ] Definir lectura de datos locales actuales desde `LocalStorageAdapter` y `CapacitorAdapter`.
- [ ] Definir backup local previo antes de cualquier migración real.
- [ ] Definir diálogo futuro para preguntar al usuario si quiere subir datos locales a su cuenta.
- [ ] Definir proceso de migración por tipo de dato.
- [ ] Definir estrategia para mapear IDs locales a IDs futuros de Firestore.
- [ ] Definir reintento si falla la migración a mitad.
- [ ] Definir validación de cantidad de productos, comercios, listas y fotos antes y después de migrar.

## FASE 8: Seguridad y configuración previa

### Objetivo

Eliminar riesgos obvios antes de avanzar hacia servicios reales de Firebase.

- [ ] Revisar archivos locales con credenciales sensibles.
- [ ] Mover datos sensibles fuera de archivos versionables si corresponde.
- [ ] Confirmar que `google-services.json` no expone secretos críticos, pero tratarlo con cuidado.
- [ ] Definir variables de entorno futuras para configuración web de Firebase.
- [ ] Definir reglas futuras de Firestore para que cada usuario lea y escriba solo sus datos privados.
- [ ] Definir reglas futuras de Storage para fotos privadas del usuario.

## FASE TESTING

### Objetivo

Validar que la app quedó preparada para Firebase sin romper el almacenamiento local actual.

- [ ] Ejecutar lint y corregir errores si aparecen.
- [ ] Probar en navegador que productos, comercios, listas, preferencias y sesión de escaneo persisten.
- [ ] Probar en Android que productos, comercios, listas, preferencias y sesión de escaneo persisten.
- [ ] Verificar que no queden escrituras directas a `localStorage` fuera de casos justificados.
- [ ] Verificar que no queden usos directos de `@capacitor/preferences` fuera del adaptador.
- [ ] Verificar que ninguna preparación borre datos locales existentes.
- [ ] Verificar que fotos actuales siguen mostrándose correctamente.
- [ ] Verificar que el build web sigue funcionando.
- [ ] Verificar que el flujo Android sigue funcionando con `npm run cel` cuando corresponda.

## Progreso del plan

- [ ] Fase 1: Auditar almacenamiento actual
- [ ] Fase 2: Normalizar acceso a persistencia
- [ ] Fase 3: Preparar datos para Firestore
- [ ] Fase 4: Preparar modelo de usuario
- [ ] Fase 5: Preparar fotos para Firebase Storage
- [ ] Fase 6: Preparar sincronización offline futura
- [ ] Fase 7: Preparar migración desde datos locales
- [ ] Fase 8: Seguridad y configuración previa
- [ ] Fase Testing

Fecha de creación: 18 de Mayo 2026
Fecha de última actualización: 18 de Mayo 2026
Estado: BORRADOR
