# PLAN CIERRE FIREBASE PRIVADO

## Descripción del plan

Cerrar la integración privada de Firebase en Precio Justo antes de abrir nuevas funcionalidades. La app ya tiene Auth, Firestore privado, fuente principal Firestore, Storage de fotos en código y Mesa de Trabajo integrada, pero quedan validaciones reales y limpieza final para dar por estable el flujo privado.


## Objetivo principal

- Validar Firebase privado en navegador y Android con usuario real.
- Confirmar que Storage de fotos funciona con CORS aplicado al bucket real.
- Confirmar que Mesa de Trabajo sincroniza y recupera datos desde Firestore.
- Resolver advertencias que ensucian pruebas o pueden afectar publicación.
- Dejar planes, resúmenes y maestro alineados con el estado real.

## Reglas del plan

- No crear rutas Firestore fuera de `usuarios/{usuarioId}`.
- No crear bases públicas nuevas.
- No eliminar LocalStorage/Capacitor hasta completar pruebas reales en Android y navegador.
- No publicar la app con `MODO_PRUEBA` de AdMob activado.
- No dar por completa la fase de fotos hasta validar subida real a Storage.

## FASE 1: Cerrar cambios pendientes del repo

### Objetivo

Ordenar el estado actual antes de probar Firebase.

- [ ] Revisar cambios pendientes con `git status`.
- [ ] Confirmar si la carpeta `Recursos/` debe quedar versionada o ignorada.
- [x] Confirmar que las imágenes de `Recursos/Facebook` no son parte del build.
- [ ] Revisar el cambio de ruta de Mesa a `usuarios/{usuarioId}/mesaTrabajoItems/{itemId}`.
- [ ] Verificar que planes y resúmenes usan la misma ruta de Mesa.
- [x] Confirmar que no quedan referencias al flujo público descartado en planes ni código activo.
- [x] Ejecutar `npm run lint`.
- [x] Ejecutar `npm run build`.
- [ ] Crear commit antes de pruebas largas si todo queda coherente.

## FASE 2: Validar Mesa de Trabajo real

### Objetivo

Confirmar que Mesa de Trabajo funciona con Firebase real y no solo en validación local.

- [ ] Iniciar sesión en navegador con usuario Firebase real.
- [ ] Crear un ítem en Mesa de Trabajo.
- [ ] Editar nombre, precio, cantidad, moneda y comercio.
- [ ] Recargar la app y confirmar que el ítem sigue en Mesa.
- [ ] Confirmar en Firebase Console que existe en `usuarios/{usuarioId}/mesaTrabajoItems/{itemId}`.
- [ ] Enviar un ítem desde Lista Justa a Mesa de Trabajo.
- [ ] Confirmar que `mesaTrabajoItemId` queda consistente en Lista Justa.
- [ ] Guardar un ítem de Mesa en Mis Productos.
- [ ] Confirmar que se elimina de Mesa y queda en Mis Productos.
- [ ] Repetir el flujo en Android con el mismo usuario.

## FASE 3: Aplicar CORS real de Storage

### Objetivo

Preparar el bucket real para subir fotos desde navegador y Android.

- [ ] Confirmar el bucket activo de Firebase Storage.
- [ ] Confirmar que `FirebaseStorageCors.json` existe y contiene los orígenes necesarios.
- [ ] Aplicar CORS al bucket real con `firebase`, `gcloud` o `gsutil`.
- [ ] Confirmar que la CLI usada está autenticada con el proyecto correcto.
- [ ] Documentar el comando exacto usado.
- [ ] Reintentar subida de foto desde navegador.
- [ ] Confirmar que no aparece error CORS contra `firebasestorage.googleapis.com`.

## FASE 4: Validar fotos privadas

### Objetivo

Confirmar que Storage funciona de punta a punta para fotos privadas.

- [ ] Crear producto con foto desde navegador.
- [ ] Confirmar que Storage recibe el archivo en `usuarios/{usuarioId}/fotos`.
- [ ] Confirmar que Firestore guarda solo URL/ruta, no base64.
- [ ] Recargar la app y confirmar que la foto se muestra desde Firebase.
- [ ] Crear comercio o dirección con foto y repetir validación.
- [ ] Crear ítem de Lista Justa con foto si el flujo lo permite.
- [ ] Probar foto desde Android.
- [ ] Confirmar que la foto subida desde Android aparece en navegador.
- [ ] Probar sin conexión y verificar que la foto queda pendiente sin perderse.
- [ ] Volver online y confirmar que la foto pendiente se sincroniza.

## FASE 5: Limpiar advertencias de pruebas

### Objetivo

Reducir ruido y riesgos antes de dar por cerrada la integración privada.

- [ ] Revisar el CORS de `version.json` contra GitHub Pages en desarrollo.
- [ ] Corregir o silenciar el chequeo remoto de versión cuando se ejecuta en localhost.
- [ ] Revisar `MODO_PRUEBA` en `ConfigPublicidad.js`.
- [ ] Mantener `MODO_PRUEBA = true` solo para builds de prueba.
- [ ] Definir cómo cambiar a IDs reales antes de publicación.
- [ ] Revisar advertencia de chunks grandes del build y decidir si queda como pendiente no bloqueante.
- [ ] Revisar advertencia de Browserslist desactualizado y decidir si actualizar dependencias.

## FASE 6: Validar Android final

### Objetivo

Confirmar que el build móvil queda listo para prueba real.

- [ ] Ejecutar `npm run cel`.
- [ ] Confirmar que `androidReleaseConSimbolos` termina correctamente.
- [ ] Confirmar que `npx cap sync android` copia el build actual.
- [ ] Confirmar que se genera el bundle release.
- [ ] Confirmar que se empaquetan y verifican símbolos nativos.
- [ ] Abrir Android Studio.
- [ ] Instalar o generar APK de prueba.
- [ ] Probar login, productos, comercios, listas, preferencias, Mesa y fotos en celular.

## FASE 7: Actualizar documentación final

### Objetivo

Dejar los planes como fuente confiable del estado real.

- [ ] Actualizar `PlanMaestroFirebase.md` con checks reales.
- [ ] Actualizar `Resumen11Firebase.md` con resultado de pruebas reales.
- [ ] Actualizar `ModeloFirestoreMigracion.md` si cambia alguna ruta.
- [ ] Marcar `PlanFirestoreMesaTrabajo.md` como completado solo si pasa la prueba real.
- [ ] Marcar Storage/fotos como completado solo si pasa subida real.
- [ ] Registrar pendientes no bloqueantes en `TareasPendientes.md` si corresponde.
- [ ] Crear commit final de cierre.

## FASE TESTING

### Objetivo

Validar el cierre completo de Firebase privado.

- [ ] `npm run lint` pasa sin errores.
- [ ] `npm run build` pasa sin errores.
- [ ] `npm run cel` pasa sin errores.
- [ ] Navegador con usuario Firebase real carga datos desde Firestore.
- [ ] Android con el mismo usuario carga los mismos datos.
- [ ] Mesa de Trabajo persiste después de recargar y cambiar dispositivo.
- [ ] Fotos se suben a Storage y se ven después de recargar.
- [ ] Firestore no guarda base64.
- [ ] LocalStorage/Capacitor sigue funcionando para usuario local.
- [ ] No hay errores CORS de Storage.
- [ ] No hay errores nuevos relevantes en consola.
- [ ] El repo queda limpio después del commit final.

## Progreso del plan

- [ ] Fase 1: Cerrar cambios pendientes del repo
- [ ] Fase 2: Validar Mesa de Trabajo real
- [ ] Fase 3: Aplicar CORS real de Storage
- [ ] Fase 4: Validar fotos privadas
- [ ] Fase 5: Limpiar advertencias de pruebas
- [ ] Fase 6: Validar Android final
- [ ] Fase 7: Actualizar documentación final
- [ ] Fase Testing

Fecha de creación: 18 de Junio 2026
Fecha de última actualización: 18 de Junio 2026
Estado: ACTIVO
