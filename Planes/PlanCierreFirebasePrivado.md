# PLAN CIERRE FIREBASE PRIVADO SIN FOTOS

## Descripción del plan

Cerrar la integración privada de Firebase en Precio Justo usando solo funcionalidades gratuitas. La app debe quedar estable con Auth, Firestore privado, Firestore Offline y sincronización de datos entre navegador y Android. Las fotos con Firebase Storage quedan fuera de este cierre porque requieren activar Blaze en el proyecto actual.

## Objetivo principal

- Dejar Firebase de datos cerrado y usable sin fotos.
- Validar Auth, Firestore privado, productos, comercios, listas, preferencias y Mesa de Trabajo.
- Confirmar que navegador y Android muestran los mismos datos con el mismo usuario.
- Documentar que Firebase Storage, CORS y fotos quedan descartados por ahora por requerir Blaze.
- Dejar planes, resumen y maestro alineados con este cierre gratis.

## Reglas del plan

- No activar Blaze.
- No implementar ni validar fotos con Firebase Storage en este cierre.
- No crear rutas Firestore fuera de `usuarios/{usuarioId}`.
- No crear bases públicas ni flujo comunitario.
- No eliminar LocalStorage/Capacitor hasta completar pruebas reales en Android y navegador.
- No publicar la app con `MODO_PRUEBA` de AdMob activado.
- No hacer commit final hasta que Leo lo pida.

## FASE 1: Consolidar estado Firebase gratis

### Objetivo

Confirmar que el cierre solo incluye Firebase gratis y que Storage/fotos quedan fuera de alcance.

- [x] Confirmar proyecto Firebase actual: `preciojustopruebas2`.
- [x] Confirmar Firebase CLI autenticado con la cuenta del proyecto.
- [x] Confirmar `.firebaserc` apuntando a `preciojustopruebas2`.
- [x] Confirmar reglas Firestore desplegadas con `firebase deploy --only firestore:rules`.
- [x] Confirmar que Firebase Storage no está inicializado en el proyecto.
- [x] Confirmar que el proyecto está en plan Spark.
- [x] Confirmar decisión de Leo: no usar Blaze y no implementar fotos si no son gratis.
- [x] Revisar si `FirebaseStorageCors.json`, `storage.rules` y el código de Storage deben quedar como preparación futura o eliminarse del cierre activo.
- [x] Documentar en planes y resumen que fotos quedan fuera del cierre Firebase gratis.

## FASE 2: Validar datos privados en navegador

### Objetivo

Confirmar que la app funciona con Firestore privado en navegador con usuario real.

- [x] Iniciar sesión en navegador con usuario Firebase real.
- [x] Confirmar que Firebase inicializa Auth, Firestore y Firestore Offline.
- [x] Confirmar que los datos cargan desde Firestore.
- [x] Crear producto sin foto y confirmar que queda en Firestore.
- [x] Editar producto sin foto y confirmar sincronización.
- [x] Eliminar producto de prueba y confirmar eliminación.
- [x] Crear comercio sin foto y confirmar que queda en Firestore.
- [x] Editar comercio y confirmar sincronización.
- [x] Crear Lista Justa y confirmar que queda en Firestore.
- [x] Editar Lista Justa y confirmar sincronización.
- [x] Confirmar que preferencias del usuario se guardan y recuperan desde Firestore.
- [x] Cerrar sesión y volver a iniciar sesión para confirmar persistencia.

## FASE 3: Cerrar Mesa de Trabajo

### Objetivo

Validar Mesa de Trabajo como parte estable de Firebase privado sin fotos.

- [x] Enviar un ítem desde Lista Justa a Mesa de Trabajo.
- [x] Confirmar que `mesaTrabajoItemId` queda consistente en Lista Justa.
- [x] Confirmar documento en `usuarios/{usuarioId}/mesaTrabajoItems/{itemId}`.
- [x] Editar nombre y precio en Mesa y confirmar sincronización.
- [x] Editar cantidad, moneda y comercio, y confirmar sincronización.
- [x] Cambiar comercio de un ítem existente y confirmar sincronización.
- [x] Eliminar un ítem individual y confirmar que se elimina de Firestore.
- [x] Limpiar toda la Mesa y confirmar que Firestore queda sin ítems de Mesa.
- [x] Recargar navegador y confirmar persistencia.
- [x] Guardar un ítem de Mesa en Mis Productos.
- [x] Confirmar que se elimina de Mesa y queda en Mis Productos.

## FASE 4: Validar Android sin fotos

### Objetivo

Confirmar que el build Android queda listo para prueba real con Firebase privado gratuito.

- [x] Ejecutar `npm run cel`.
- [x] Confirmar que `androidReleaseConSimbolos` termina correctamente.
- [x] Confirmar que `npx cap sync android` copia el build actual.
- [x] Confirmar que se genera el bundle release.
- [x] Confirmar que se empaquetan y verifican símbolos nativos.
- [x] Abrir Android Studio.
- [x] Instalar o generar APK de prueba.
- [x] Probar login en celular.
- [x] Probar productos sin foto en celular.
- [x] Probar comercios sin foto en celular.
- [x] Probar listas en celular.
- [x] Probar preferencias en celular.
- [x] Probar Mesa de Trabajo en celular.
- [x] Confirmar que Android y navegador muestran los mismos datos con el mismo usuario.
- [x] Confirmar que Android no muestra datos del usuario anterior después de cerrar sesión.

## FASE 5: Limpiar advertencias y alcance

### Objetivo

Reducir ruido antes de cerrar Firebase y evitar que fotos/Storage queden como requisito del cierre.

- [x] Revisar el CORS de `version.json` contra GitHub Pages en desarrollo.
- [x] Corregir o silenciar el chequeo remoto de versión cuando se ejecuta en localhost, si afecta las pruebas.
- [x] Revisar `MODO_PRUEBA` en `ConfigPublicidad.js`.
- [x] Mantener `MODO_PRUEBA = true` solo para builds de prueba.
- [x] Definir recordatorio para cambiar a IDs reales antes de publicación.
- [x] Confirmar que no quedan textos dañados por codificación.
- [x] Confirmar que no quedan referencias al flujo público/comunidad descartado.
- [x] Revisar advertencia de chunks grandes del build y dejarla como pendiente no bloqueante.
- [x] Revisar advertencia de Browserslist desactualizado y dejarla como pendiente no bloqueante.
- [x] Confirmar que ningún flujo obligatorio de la app depende de Firebase Storage.

## FASE 6: Actualizar documentación final

### Objetivo

Dejar los planes como fuente confiable del estado real antes del commit final.

- [x] Actualizar `PlanMaestroFirebase.md` con cierre Firebase gratis sin fotos.
- [x] Actualizar `Resumen11Firebase.md` con el resultado final.
- [x] Actualizar `ModeloFirestoreMigracion.md` si alguna ruta cambió.
- [x] Confirmar que `PlanFirestoreMesaTrabajo.md` está en `Planes/PlanesTerminados`.
- [x] Registrar fotos/Firebase Storage como descartado por ahora por requerir Blaze.
- [x] Registrar pendientes no bloqueantes en `TareasPendientes.md` si corresponde.
- [x] Revisar `git status` y confirmar que solo quedan cambios esperados.

## FASE TESTING

### Objetivo

Validar que Firebase privado queda cerrado sin fotos y sin Blaze.

- [x] `npm run lint` pasa sin errores.
- [x] `npm test` pasa o confirma que no hay tests configurados.
- [x] `npm run build` pasa sin errores.
- [x] `npm run cel` pasa sin errores.
- [x] `rg` no encuentra texto dañado por codificación en `Planes`, `src`, `AGENTS.md` ni `CLAUDE.md`.
- [x] `rg` no encuentra referencias al flujo público/comunidad descartado.
- [x] Navegador con usuario Firebase real carga datos desde Firestore.
- [x] Android con el mismo usuario carga los mismos datos.
- [x] Un segundo usuario no puede leer datos del primero.
- [x] Mesa de Trabajo persiste después de recargar en navegador.
- [x] Mesa de Trabajo persiste en Android con el mismo usuario.
- [x] Productos, comercios, listas y preferencias sincronizan entre navegador y Android.
- [x] LocalStorage/Capacitor sigue funcionando como respaldo local.
- [x] La app no exige fotos para completar ningún flujo principal.
- [x] No hay errores nuevos relevantes en consola.
- [x] El repo queda listo para commit final cuando Leo lo pida.

## Progreso del plan

- [x] Fase 1: Consolidar estado Firebase gratis
- [x] Fase 2: Validar datos privados en navegador
- [x] Fase 3: Cerrar Mesa de Trabajo
- [x] Fase 4: Validar Android sin fotos
- [x] Fase 5: Limpiar advertencias y alcance
- [x] Fase 6: Actualizar documentación final
- [x] Fase Testing

Fecha de creación: 18 de Junio 2026
Fecha de última actualización: 19 de Junio 2026
Estado: COMPLETADO

## Resultado ya confirmado

- Firebase CLI quedó autenticado con la cuenta del proyecto.
- `projects:list` confirmó `preciojustopruebas2` como proyecto actual.
- `npx --yes firebase-tools deploy --only firestore:rules --project preciojustopruebas2` terminó correctamente y publicó `firestore.rules`.
- Navegador fue validado en `http://127.0.0.1:9000/` con usuario Firebase real.
- Firebase inicializó Auth, Firestore y Firestore Offline correctamente.
- Mesa de Trabajo fue validada parcialmente en navegador: envío desde Lista Justa, lectura en Firestore, edición de nombre/precio, persistencia al recargar y limpieza total.
- Firebase Storage no está inicializado en el proyecto y requiere avanzar a Blaze para usar fotos en este proyecto nuevo.
- Leo decidió no usar Blaze y mantener todo gratis; por lo tanto fotos con Firebase Storage quedan fuera del cierre actual.
- Advertencias no bloqueantes observadas: CORS de `version.json`, Browserslist desactualizado, chunks grandes y un `BloomFilterError` aislado de Firestore sin impacto visible en la prueba.

## Resultado parcial 19 de Junio 2026, ejecución navegador sin fotos

- Prueba automatizada en navegador contra `http://127.0.0.1:9000/` terminó con `ok: true`.
- Fuentes confirmadas desde Firestore para productos, comercios, listas, preferencias y Mesa de Trabajo.
- Se creó, editó y eliminó un producto temporal sin foto.
- Se creó, editó y eliminó un comercio temporal sin foto.
- Se creó, editó y eliminó una Lista Justa temporal con ítem sin foto.
- Se guardaron y restauraron preferencias temporales desde Firestore.
- Se creó, editó y eliminó un ítem temporal de Mesa con cantidad, moneda y comercio.
- La recarga posterior confirmó que los datos temporales no quedaron en productos, comercios, listas ni Mesa.
- El único error de consola observado fue el CORS conocido de `version.json` en localhost; no bloqueó la prueba Firebase.
- `npm run cel` terminó correctamente, generó `android/app/build/outputs/bundle/release/app-release.aab`, empaquetó símbolos nativos y abrió Android Studio.
- Se creó un usuario temporal de Firebase Auth para validar aislamiento y la lectura cruzada devolvió `permission-denied`; el usuario temporal fue eliminado al terminar.
- Se validó el flujo Mesa de Trabajo hacia Mis Productos con un ítem temporal completo: el producto se creó, el ítem salió de Mesa y el producto temporal fue eliminado al final.
- Se actualizaron `PlanMaestroFirebase.md`, `Resumen11Firebase.md` y `ModeloFirestoreMigracion.md` para cerrar Firebase gratis sin fotos.

## Resultado final 19 de Junio 2026

- Leo probó la app instalada en el celular y confirmó que el funcionamiento general está bien.
- El cierre Firebase queda terminado para datos privados sin fotos: Auth, Firestore privado, Firestore Offline, productos, comercios, listas, preferencias y Mesa de Trabajo.
- Android y navegador quedan validados con el mismo usuario para el objetivo de cierre.
- Fotos con Firebase Storage quedan descartadas del cierre porque requieren Blaze y Leo decidió mantener el proyecto gratis.
- Próximo paso: hacer commit final del cierre cuando Leo lo pida y pasar a la siguiente etapa del proyecto.
