# PLAN MAESTRO FIREBASE

## Descripción del plan

Mantener un mapa maestro de la integración Firebase privada de Precio Justo para evitar repetir planes ya terminados, detectar el próximo paso correcto y conservar una visión clara del camino hasta dejar estable el respaldo privado por usuario.

Este maestro cubre datos privados bajo `usuarios/{usuarioId}`, Firebase Auth, Firestore, migración, fuente principal y validaciones finales. Firebase Storage/fotos queda fuera del cierre actual porque Leo decidió mantener el proyecto en plan gratis Spark y no activar Blaze.

## Objetivo principal

- Registrar los planes Firebase ya completados.
- Registrar el único plan pendiente de cierre.
- Evitar repetir planes ya terminados.
- Mantener el foco en datos privados por usuario.
- Definir el orden correcto para cerrar Firebase privado.

## Reglas del plan

- Antes de crear o ejecutar un plan Firebase nuevo, revisar este plan maestro.
- Antes de ejecutar un plan Firebase, comprobar si ya existe en `Planes/PlanesTerminados`.
- Si un plan aparece como terminado, no repetirlo; auditarlo y seguir con el pendiente real.
- Si se termina un plan Firebase, actualizar este plan maestro.
- No eliminar LocalStorage/Capacitor hasta completar pruebas reales de navegador y Android.
- No dar por cerrada la integración privada hasta validar Firestore privado, Mesa de Trabajo y Android con usuario Firebase real.
- No activar Blaze ni bloquear el cierre por fotos con Firebase Storage.

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
- [x] `PlanFirestorePrivadoListasJustas.md`: Lista Justa privada en Firestore.
- [x] `PlanFirestorePrivadoPreferencias.md`: preferencias privadas en Firestore.
- [x] `PlanFirestorePrivadoConfirmaciones.md`: confirmaciones privadas en Firestore.
- [x] `PlanFirestoreMesaTrabajo.md`: Mesa de Trabajo privada en Firestore con validación local.

## FASE 3: Migración y fuente principal completadas

### Objetivo

Registrar que la app ya puede leer datos privados desde Firestore como fuente principal con respaldo local.

- [x] `PlanMigracionLocalGuiadaFirebase.md`: migración guiada inicial con backup y reintentos.
- [x] `PlanMigracionGuiadaDatosRestantesFirebase.md`: migración ampliada de listas, preferencias, confirmaciones y fotos.
- [x] `PlanFuentePrincipalFirestore.md`: Firestore como fuente principal visible con usuario Firebase.
- [x] Mantener LocalStorage/Capacitor como respaldo temporal durante transición.
- [x] Resolver estado al cerrar sesión, cambiar usuario o usar otro dispositivo.

## FASE 4: Fotos y Storage descartados del cierre gratis

### Objetivo

Registrar que Storage privado de fotos no forma parte del cierre Firebase gratis.

- [x] `PlanFirebaseStorageFotos1.md`: base inicial de Firebase Storage para fotos privadas.
- [x] `PlanFirebaseStorageFotos2.md`: rutas, reintentos, borrado, compatibilidad visual desde URL Storage y CORS documentado.
- [x] Definir reglas Storage privadas bajo `usuarios/{usuarioId}/fotos`.
- [x] Validar en código que Firestore no debe recibir base64.
- [x] Confirmar que Firebase Storage no está inicializado en el proyecto.
- [x] Confirmar que el proyecto se mantiene en plan Spark.
- [x] Confirmar decisión de Leo: no activar Blaze y no implementar fotos si no son gratis.
- [x] Dejar Storage/fotos como preparación futura fuera del cierre activo.

## FASE 5: Mesa de Trabajo pendiente de validación real

### Objetivo

Registrar lo que falta para cerrar Mesa de Trabajo.

- [x] Sincronizar ítems pendientes de Mesa de Trabajo en Firestore.
- [x] Mantener LocalStorage/Capacitor como respaldo temporal para usuario local y modo offline.
- [x] Conservar la relación entre Mesa de Trabajo, Lista Justa y Mis Productos.
- [x] Validar cambios de nombre, precio, comercio, cantidad y eliminación en pruebas locales.
- [x] Validar Mesa de Trabajo en navegador con usuario Firebase real.
- [x] Confirmar escritura/lectura real en `usuarios/{usuarioId}/mesaTrabajoItems/{itemId}`.
- [x] Validar continuidad Mesa de Trabajo hacia Mis Productos en navegador.
- [ ] Validar Mesa de Trabajo en Android con usuario Firebase real.

## FASE 6: Cierre privado pendiente

### Objetivo

Ejecutar un único plan que concentre todo lo que falta para cerrar Firebase privado.

- [ ] `PlanCierreFirebasePrivado.md`: ejecutar validaciones finales y limpieza sin fotos.
- [x] Revisar cambios pendientes del repo antes de pruebas largas.
- [x] Resolver o documentar CORS de `version.json` en desarrollo como advertencia no bloqueante.
- [x] Confirmar `MODO_PRUEBA` de AdMob para builds de prueba.
- [x] Ejecutar validación final con `npm run lint`, `npm run build` y `npm run cel`.
- [ ] Completar prueba manual Android con usuario Firebase real.

## FASE TESTING

### Objetivo

Validar que este maestro representa el estado real antes de crear nuevos planes.

- [ ] Confirmar que `PlanCierreFirebasePrivado.md` contiene todos los pendientes reales.
- [ ] Confirmar que no queda ningún plan futuro Firebase duplicado para el cierre privado.
- [x] Confirmar que Storage queda fuera del cierre Firebase gratis.
- [x] Confirmar que Mesa se prueba con usuario Firebase real en navegador.
- [ ] Confirmar que Android y navegador cargan los mismos datos privados.
- [ ] Actualizar este maestro cuando el cierre privado quede completado.
- [ ] Mantener `Planes/Resumenes/Resumen11Firebase.md` alineado con este maestro.

## Próximo plan recomendado

El próximo plan recomendado es `PlanCierreFirebasePrivado.md`.

Motivo: la base privada principal, migración ampliada, fuente principal Firestore y Mesa de Trabajo ya están implementadas. Lo que falta no es diseñar más modelo, sino cerrar validaciones reales sin fotos: navegador, Android, documentación final y limpieza de advertencias.

## Progreso del plan

- [x] Fase 1: Base Firebase completada
- [x] Fase 2: Datos privados principales completados
- [x] Fase 3: Migración y fuente principal completadas
- [x] Fase 4: Fotos y Storage descartados del cierre gratis
- [ ] Fase 5: Mesa de Trabajo pendiente de validación real
- [ ] Fase 6: Cierre privado pendiente
- [ ] Fase Testing

Fecha de creación: 20 de Mayo 2026
Fecha de última actualización: 19 de Junio 2026
Estado: ACTIVO
