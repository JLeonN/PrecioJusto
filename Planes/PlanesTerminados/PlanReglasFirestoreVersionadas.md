# PLAN REGLAS FIRESTORE VERSIONADAS

## Descripción del plan

Versionar en el repositorio las reglas privadas de Firestore que hoy están documentadas en planes y aplicadas manualmente en Firebase Console. El objetivo es que la seguridad de datos privados por usuario quede revisable en Git antes de seguir agregando dominios nuevos como comercios, listas y preferencias.

Este plan no cambia la lógica de productos ni agrega nuevas colecciones. Solo prepara una base controlada para mantener reglas Firestore de forma clara, repetible y auditable.

## Objetivo principal

- Crear un archivo versionado con las reglas Firestore actuales.
- Alinear las reglas con el modelo privado bajo `usuarios/{usuarioId}`.
- Documentar cómo comparar las reglas locales contra Firebase Console.
- Evitar que productos, precios u otros datos privados queden accesibles entre usuarios.
- Dejar preparada la base para ampliar reglas cuando lleguen comercios, listas, preferencias y fotos.

## Reglas del plan

- No modificar servicios de productos, precios, comercios, listas ni autenticación en este plan.
- No cambiar el modelo de datos Firestore aprobado.
- No relajar reglas de seguridad para facilitar pruebas.
- Denegar por defecto todo lo que no esté explícitamente permitido.
- Mantener las reglas en español solo en comentarios; la sintaxis Firestore debe respetar el formato oficial.
- No guardar secretos ni credenciales dentro de los archivos de reglas.
- No depender de `DatosLocalesProyectos.md` para ejecutar o revisar reglas.

## FASE 1: Revisar reglas actuales documentadas

### Objetivo

Confirmar qué reglas privadas fueron aprobadas y qué alcance tienen antes de crear el archivo versionado.

- [x] Revisar `Planes/Resumenes/ModeloFirestoreMigracion.md`.
- [x] Revisar `Planes/Resumenes/Resumen11Firebase.md`.
- [x] Revisar `Planes/PlanesTerminados/PlanFirestorePrivadoProductos.md`.
- [x] Confirmar ruta raíz privada: `usuarios/{usuarioId}`.
- [x] Confirmar que productos viven en `usuarios/{usuarioId}/productos/{productoId}`.
- [x] Confirmar que precios viven en `usuarios/{usuarioId}/productos/{productoId}/precios/{precioId}`.
- [x] Confirmar que lectura y escritura dependen de `request.auth.uid == usuarioId`.
- [x] Confirmar que todo acceso fuera de `usuarios/{usuarioId}` queda denegado por defecto.

## FASE 2: Crear archivo versionado de reglas

### Objetivo

Agregar al repositorio una fuente única local para las reglas de Firestore.

- [x] Crear archivo de reglas Firestore en una ubicación clara del repositorio.
- [x] Usar nombre compatible con herramientas Firebase si se decide usar `firestore.rules`.
- [x] Definir `rules_version = '2';`.
- [x] Definir helper `estaAutenticado()`.
- [x] Definir helper `esDueno(usuarioId)`.
- [x] Permitir lectura/escritura solo en `usuarios/{usuarioId}` cuando el usuario autenticado sea dueño.
- [x] Permitir subcolecciones privadas con la misma condición de dueño.
- [x] Denegar todo lo demás con regla final explícita.
- [x] Agregar comentarios breves solo donde ayuden a entender el alcance.

## FASE 3: Preparar configuración opcional de Firebase

### Objetivo

Decidir si el repo debe incluir configuración mínima para que Firebase CLI pueda usar el archivo de reglas más adelante.

- [x] Verificar si existe `firebase.json`.
- [x] Si no existe, decidir si este plan debe crearlo o solo dejarlo documentado.
- [x] Si se crea `firebase.json`, referenciar el archivo de reglas sin agregar datos sensibles.
- [x] Confirmar que la configuración no incluye projectId, credenciales ni tokens.
- [x] Documentar el comando manual que usaría Firebase CLI para desplegar reglas en el futuro.
- [x] Dejar claro que este plan no hace deploy automático.

## FASE 4: Comparar contra Firebase Console

### Objetivo

Evitar diferencias silenciosas entre las reglas versionadas y las reglas reales activas en Firebase.

- [x] Abrir las reglas actuales en Firebase Console.
- [x] Comparar manualmente contra el archivo versionado.
- [x] Corregir cualquier diferencia insegura antes de seguir.
- [x] Confirmar que las reglas activas en Console tienen el mismo criterio privado por usuario.
- [x] Registrar en el resumen del plan si Console y repo quedaron alineados.

## FASE 5: Documentar mantenimiento futuro

### Objetivo

Dejar una guía breve para ampliar reglas sin romper privacidad cuando se agreguen nuevos módulos.

- [x] Documentar que todo nuevo dominio privado debe vivir bajo `usuarios/{usuarioId}`.
- [x] Documentar que comercios, listas y preferencias deben reutilizar `esDueno(usuarioId)`.
- [x] Documentar que Storage de fotos requiere reglas propias en otro archivo o plan.
- [x] Actualizar `Planes/Resumenes/Resumen11Firebase.md` con el estado de reglas versionadas.

## FASE TESTING

### Objetivo

Validar que las reglas versionadas son correctas, seguras y no rompen la compilación del proyecto.

- [x] Ejecutar `npm run lint`.
- [x] Ejecutar `npm run build`.
- [x] Probar con usuario autenticado que puede leer/escribir sus productos.
- [x] Probar con usuario autenticado B que no puede leer/escribir productos del usuario A.
- [x] Probar que usuario no autenticado no puede leer ni escribir en `usuarios/{usuarioId}`.
- [x] Probar que una ruta fuera del modelo privado queda denegada.
- [x] Confirmar que productos y precios existentes siguen funcionando como espejo Firestore.
- [x] Confirmar que LocalStorage/Capacitor no se ven afectados.
- [x] Confirmar que no se agregaron secretos ni credenciales al repositorio.

## Resultado de ejecución

- Se creó `firestore.rules` como fuente versionada local de reglas Firestore.
- Se creó `firebase.json` mínimo apuntando a `firestore.rules`.
- `firebase.json` no incluye projectId, credenciales, tokens ni datos sensibles.
- El archivo local usa `rules_version = '2';`, `estaAutenticado()` y `esDueno(usuarioId)`.
- El acceso queda permitido solo bajo `usuarios/{usuarioId}` cuando `request.auth.uid == usuarioId`.
- Las subcolecciones privadas heredan la misma regla de dueño.
- Toda ruta fuera de `usuarios/{usuarioId}` queda cerrada explícitamente.
- Firebase Console y el archivo local quedaron alineados en criterio de seguridad; la Console no conserva los comentarios locales.
- No se hizo deploy automático desde este plan.
- Comando manual futuro con Firebase CLI: `firebase deploy --only firestore:rules`.

## Resultado de pruebas

- `npm run lint`: correcto.
- `npm run build`: correcto.
- `firebase.json`: JSON válido.
- `git diff --check`: correcto.
- MCP Browser: usuario A pudo crear y leer su producto/precio privado.
- MCP Browser: usuario B no pudo leer ni escribir producto de usuario A (`permission-denied`).
- MCP Browser: usuario sin sesión no pudo leer producto privado (`permission-denied`).
- MCP Browser: una ruta fuera del modelo privado quedó denegada (`permission-denied`).
- MCP Browser: productos y precios siguen funcionando como espejo Firestore.
- MCP Browser: LocalStorage siguió activo para el producto creado.
- Revisión de secretos: no se agregaron credenciales ni tokens en `firestore.rules` ni `firebase.json`.

## Progreso del plan

- [x] Fase 1: Revisar reglas actuales documentadas
- [x] Fase 2: Crear archivo versionado de reglas
- [x] Fase 3: Preparar configuración opcional de Firebase
- [x] Fase 4: Comparar contra Firebase Console
- [x] Fase 5: Documentar mantenimiento futuro
- [x] Fase Testing

Fecha de creación: 20 de Mayo 2026
Fecha de última actualización: 20 de Mayo 2026
Estado: TERMINADO
