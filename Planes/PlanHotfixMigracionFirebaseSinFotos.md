# Plan Hotfix Migracion Firebase Sin Fotos

## Descripcion del plan

Corregir el cierre de la app durante la migracion local a Firebase en produccion. El problema confirmado por logs es `OutOfMemoryError` al intentar procesar fotos en base64 durante la migracion. La solucion urgente es migrar datos privados a Firestore sin convertir ni subir fotos de usuario, mostrando feedback claro y evitando marcar la migracion como terminada si falla.

## Objetivo principal

- Evitar que la app se cierre al guardar datos locales en la nube.
- Migrar productos, precios, comercios, direcciones, listas, preferencias, confirmaciones y mesa de trabajo sin tocar fotos base64.
- Mantener las fotos locales en el dispositivo sin borrarlas.
- Mostrar feedback visible mientras la app guarda datos en la nube.
- Permitir reintentar la migracion si algo falla.
- Evitar que cualquier servicio intente usar Firebase Storage mientras esta etapa siga siendo gratis y sin fotos en la nube.

## Reglas del plan

- No usar Firebase Storage ni Blaze.
- No subir fotos base64 durante esta migracion.
- No convertir fotos base64 a `Blob`, `Uint8Array` ni usar `atob` en el flujo de migracion.
- No llamar `FirebaseStorageFotosService` desde la migracion ni desde guardados normales de productos, comercios o listas durante este hotfix.
- No borrar datos locales despues de migrar.
- Conservar imagenes externas de API cuando sean URL normales.
- Omitir solo imagenes/fotos base64 creadas o guardadas por el usuario.
- No marcar la migracion como completada si hubo error real.
- No guardar la decision local como `MIGRADA` si el resultado de migracion queda `PARCIAL`, `ERROR` o pendiente.
- Mantener textos de usuario simples: usar "nube" en la interfaz y evitar detalles tecnicos.

## FASE 1: Cortar fotos del flujo de migracion

### Objetivo

Quitar del hotfix cualquier procesamiento pesado de fotos para evitar el `OutOfMemoryError`.

- [x] Revisar `MigracionLocalFirebaseService.js` y ubicar todos los puntos donde se usa `FirebaseStorageFotosService`.
- [x] Quitar del flujo de migracion las llamadas a `subirFotoPrivada`.
- [x] Quitar o neutralizar imports de `FirebaseStorageFotosService` que queden sin uso en el flujo de migracion.
- [x] Evitar que productos, comercios, direcciones o items de lista pasen fotos base64 a Firestore.
- [x] Mantener URLs externas de imagen cuando empiecen con `http://` o `https://`.
- [x] Dejar las fotos base64 como dato local solamente, sin borrarlas del dispositivo.
- [x] Ajustar los conteos de migracion para que las fotos no cuenten como requisito de exito.
- [x] Revisar `ProductosService.js`, `ComerciosService.js` y `ListaJustaService.js` para impedir subidas automaticas a Storage en guardados normales.
- [x] Confirmar que los servicios Firestore conservan URLs externas y descartan base64 antes de escribir.

## FASE 2: Migrar por sectores y con menor carga de memoria

### Objetivo

Reducir el riesgo de memoria y dejar la migracion mas controlada.

- [x] Separar la migracion en sectores reales: productos, comercios, listas, preferencias, confirmaciones y mesa.
- [x] Evitar construir estructuras enormes con fotos base64 dentro del flujo de escritura a Firestore.
- [x] Procesar productos en tandas de 20 registros.
- [x] Procesar comercios en tandas de 20 registros, con sus direcciones sin incluir campos de foto base64.
- [x] Procesar listas en tandas de 20 registros, con sus items sin incluir campos de imagen base64.
- [x] Procesar confirmaciones en tandas de 20 registros.
- [x] Integrar la mesa de trabajo al flujo de `MigracionLocalFirebaseService.js` usando los datos locales de `SesionEscaneoService` o `InventarioMigracionFirebaseService`.
- [x] Procesar items de mesa de trabajo en tandas de 20 registros mediante `FirestoreMesaTrabajoService`.
- [x] Evitar que la mesa de trabajo escriba imagenes base64; conservar solo URLs externas cuando existan.
- [x] Confirmar que una falla en un sector no deja la migracion marcada como completada.

## FASE 3: Feedback visible para el usuario

### Objetivo

Evitar que el usuario piense que la app no hizo nada mientras se guardan los datos.

- [x] Mostrar un estado de carga al tocar `Guardar en la nube`.
- [x] Bloquear el boton mientras la migracion esta en proceso.
- [x] Mostrar un texto claro: `Guardando tus datos en la nube...`.
- [x] Actualizar el texto de progreso por sector, por ejemplo `Guardando productos...`, `Guardando comercios...`, `Guardando listas...`.
- [x] Mostrar progreso tambien para `Guardando mesa de trabajo...` cuando existan items locales.
- [x] Reutilizar el mismo feedback en el modal inicial y en Configuracion.
- [x] Mostrar mensaje de exito cuando termine.
- [x] Mostrar mensaje de error si falla y explicar que puede reintentarlo desde Configuracion.
- [x] Evitar que el modal o pantalla deje al usuario sin contexto mientras la migracion trabaja.

## FASE 4: Estado de migracion y reintento

### Objetivo

Hacer que el estado guardado sea confiable y no oculte errores.

- [x] Revisar donde se guarda la decision de migracion local preguntada.
- [x] Guardar estado completado solo si la migracion termino correctamente.
- [x] En `MainLayout.vue`, guardar decision `MIGRADA` solo si `iniciarMigracion` devuelve estado `COMPLETADA`.
- [x] En `ConfiguracionPage.vue`, guardar decision `MIGRADA` solo si `iniciarMigracion` devuelve estado `COMPLETADA`.
- [x] Si la migracion queda `PARCIAL`, mostrar aviso y mantener disponible el reintento.
- [x] Si falla por error o memoria, mantener la posibilidad de reintentar.
- [x] Si el usuario elige no guardar ahora, mantener el comportamiento actual sin mezclar datos locales con la cuenta.
- [x] Confirmar que los datos locales siguen en el dispositivo despues de un intento fallido.

## FASE 5: Ajustes de Configuracion

### Objetivo

Dejar el apartado de sincronizacion claro para usuarios reales.

- [x] Revisar el boton `Guardar en la nube` de Configuracion.
- [x] Aplicar el mismo feedback de carga que en el modal inicial.
- [x] Informar que las fotos guardadas en el dispositivo no se suben en esta version.
- [x] Mantener la accion manual de guardar datos locales en la nube.
- [x] Evitar palabras tecnicas innecesarias como `Firebase`, `Storage`, `base64`, `migracion` o `backup` en textos visibles al usuario normal.
- [x] Revisar textos visibles de Configuracion, modal inicial y notificaciones para reemplazar detalles tecnicos por mensajes simples.

## FASE TESTING

### Objetivo

Validar que el hotfix resuelve el cierre en celular y no rompe la sincronizacion Firebase.

- [x] Ejecutar `npm run lint`.
- [x] Ejecutar `npm run build`.
- [ ] Instalar en celular con el flujo Android correspondiente.
- [ ] Probar con una cuenta Firebase nueva y datos locales existentes.
- [ ] Tocar `Guardar en la nube` y confirmar que aparece feedback de carga.
- [ ] Confirmar que la app no se cierra.
- [ ] Confirmar que productos, precios, comercios, direcciones, listas, preferencias, confirmaciones y mesa se guardan en Firestore.
- [ ] Confirmar que fotos base64 no se suben ni bloquean la migracion.
- [ ] Confirmar que productos, comercios, listas y mesa no intentan usar Firebase Storage al guardar datos nuevos.
- [ ] Confirmar que una imagen externa de API se conserva como URL si corresponde.
- [ ] Confirmar que al cerrar sesion e iniciar de nuevo los datos aparecen desde Firebase.
- [ ] Confirmar que una migracion parcial no queda marcada como `MIGRADA` y permite reintento.
- [ ] Revisar logs ADB y confirmar que no aparece `OutOfMemoryError`.
- [ ] Probar el boton manual `Guardar en la nube` desde Configuracion.

## Progreso del plan

- [x] Fase 1: Cortar fotos del flujo de migracion
- [x] Fase 2: Migrar por sectores y con menor carga de memoria
- [x] Fase 3: Feedback visible para el usuario
- [x] Fase 4: Estado de migracion y reintento
- [x] Fase 5: Ajustes de Configuracion
- [ ] Fase Testing

Fecha de creacion: 29 de Junio 2026
Fecha de ultima actualizacion: 29 de Junio 2026
Estado: EN PROCESO
