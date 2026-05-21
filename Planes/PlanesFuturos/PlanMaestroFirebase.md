# PLAN MAESTRO FIREBASE

## Descripción del plan

Mantener un mapa maestro de la integración Firebase de Precio Justo para evitar repetir planes ya terminados, detectar el próximo paso correcto y conservar una visión clara del camino completo. Este archivo debe revisarse antes de crear o ejecutar cualquier nuevo plan relacionado con Firebase, Firestore, migración, Storage, comunidad o sincronización.

El objetivo no es reemplazar los planes detallados, sino ordenar qué ya está terminado, qué está pendiente y cuál es el siguiente plan recomendado.

## Objetivo principal

- Registrar los planes Firebase ya completados.
- Registrar los planes Firebase pendientes en orden recomendado.
- Evitar volver a generar o ejecutar un plan ya terminado.
- Definir reglas para decidir el próximo paso.
- Mantener una ruta clara hasta que Firestore pueda ser fuente principal.

## Reglas del plan

- Antes de generar un plan Firebase nuevo, revisar este plan maestro.
- Antes de ejecutar un plan Firebase, comprobar si ya existe en `Planes/PlanesTerminados`.
- Si un plan aparece como terminado, no repetirlo; auditarlo y seguir con el próximo pendiente.
- Si se termina un plan Firebase, actualizar este plan maestro.
- No convertir Firestore en fuente principal hasta completar datos privados principales, Storage pendiente y validación de migración.
- No eliminar LocalStorage/Capacitor hasta que exista una migración completa validada y una etapa explícita de reemplazo.

## FASE 1: Base Firebase completada

### Objetivo

Registrar los pasos ya terminados que prepararon el proyecto Firebase, la autenticación y las reglas.

- [x] `PlanSegundoIntentoFirebase.md`: preparar arquitectura local para Firebase.
- [x] `PlanFirebaseBaseNuevoProyecto.md`: crear proyecto Firebase nuevo y conectar SDK.
- [x] `PlanAutenticacionFirebase.md`: implementar cuenta, login, registro, recuperación y logout.
- [x] `PlanModeloFirestoreYMigracion.md`: definir modelo privado, reglas, límites y migración.
- [x] `PlanReglasFirestoreVersionadas.md`: versionar `firestore.rules` y `firebase.json`.

## FASE 2: Datos privados principales completados

### Objetivo

Registrar los dominios privados que ya tienen espejo Firestore validado.

- [x] `PlanFirestorePrivadoProductos.md`: productos y precios privados en Firestore.
- [x] `PlanFirestorePrivadoComercios.md`: comercios y direcciones privadas en Firestore.
- [x] `PlanMigracionLocalGuiadaFirebase.md`: migración guiada con backup, estado y reintentos para productos, precios y comercios.

## FASE 3: Próximos datos privados pendientes

### Objetivo

Ordenar los planes que todavía faltan para completar el backup privado por usuario.

- [x] `PlanFirestorePrivadoListasJustas.md`: sincronizar Lista Justa privada en Firestore.
- [x] `PlanFirestorePrivadoPreferencias.md`: sincronizar preferencias privadas en Firestore.
- [x] `PlanFirestorePrivadoConfirmaciones.md`: sincronizar confirmaciones privadas en Firestore si se confirma que aportan valor.
- [ ] Actualizar migración guiada para incluir listas, preferencias y confirmaciones con servicios ya implementados.

## FASE 4: Fotos y Storage pendientes

### Objetivo

Separar correctamente fotos de Firestore para no guardar base64 en documentos.

- [ ] `PlanFirebaseStorageFotos.md`: subir fotos locales a Firebase Storage y guardar solo URL/ruta.
- [ ] Definir reglas Storage privadas bajo `usuarios/{usuarioId}/fotos`.
- [ ] Migrar fotos de productos, comercios/direcciones y listas si corresponde.
- [ ] Validar que Firestore no reciba base64.

## FASE 5: Fuente principal Firestore

### Objetivo

Preparar el cambio de fuente principal después de que la sincronización privada esté madura.

- [ ] Crear plan para lectura principal desde Firestore.
- [ ] Mantener LocalStorage/Capacitor como respaldo temporal durante transición.
- [ ] Implementar carga inicial desde Firestore por usuario.
- [ ] Resolver estado al cerrar sesión, cambiar usuario o usar otro dispositivo.
- [ ] Validar cache offline como experiencia principal.
- [ ] Definir cuándo se puede dejar de depender del almacenamiento local como fuente visible.

## FASE 6: Comunidad y datos compartidos

### Objetivo

Separar la base privada del usuario de una futura base comunitaria compartida.

- [ ] Crear plan de modelo comunitario separado del árbol `usuarios/{usuarioId}`.
- [ ] Definir reglas públicas/semipúblicas sin exponer datos privados.
- [ ] Definir moderación, confirmaciones y calidad de datos.
- [ ] Definir qué datos pueden compartirse y cuáles quedan privados.

## FASE 7: Pendientes no Firebase que afectan pruebas

### Objetivo

Registrar temas laterales que pueden ensuciar pruebas pero no bloquean Firebase.

- [ ] Evaluar corrección del CORS de `version.json` en desarrollo.
- [ ] Mantener `PlanGeolocalizacionComercios.md` como plan futuro separado.
- [ ] Revisar `TareasPendientes.md` antes de abrir planes generales no Firebase.

## FASE TESTING

### Objetivo

Validar que este plan maestro sirve como control antes de crear nuevos planes Firebase.

- [ ] Antes de crear un plan Firebase nuevo, buscar si ya existe en `Planes/PlanesTerminados`.
- [ ] Confirmar que el próximo plan recomendado no está terminado.
- [ ] Confirmar que el plan nuevo apunta al primer pendiente real.
- [ ] Actualizar este plan maestro cuando un plan cambie de pendiente a completado.
- [ ] Mantener `Planes/Resumenes/Resumen11Firebase.md` alineado con este plan maestro.

## Próximo plan recomendado

El próximo plan recomendado es `PlanFirebaseStorageFotos.md`.

Motivo: productos, precios, comercios, Lista Justa, preferencias y confirmaciones ya tienen espejo Firestore. El próximo cuello de botella es mover fotos base64 a Storage antes de convertir Firestore en fuente principal.

## Progreso del plan

- [x] Fase 1: Base Firebase completada
- [x] Fase 2: Datos privados principales completados
- [ ] Fase 3: Próximos datos privados pendientes
- [ ] Fase 4: Fotos y Storage pendientes
- [ ] Fase 5: Fuente principal Firestore
- [ ] Fase 6: Comunidad y datos compartidos
- [ ] Fase 7: Pendientes no Firebase que afectan pruebas
- [ ] Fase Testing

Fecha de creación: 20 de Mayo 2026
Fecha de última actualización: 20 de Mayo 2026
Estado: ACTIVO
