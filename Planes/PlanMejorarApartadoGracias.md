# Plan Mejorar Apartado Gracias

## Descripción del plan

Mejorar la pantalla de Gracias para que el usuario tenga dos formas claras de apoyar Precio Justo: mirar un video recompensado o compartir la app. La pantalla debe mantener un tono simple y humano, con mensajes variados, animación breve al agradecer, contadores visibles sin exceso de protagonismo y sincronización local-first con Firebase para analizar en el futuro qué forma de apoyo se usa más.

La revisión actual confirma que la app publicada en Play Store es `Precio Justo - Compara Precios`, usa el paquete `com.preciojusto.app`, declara que contiene anuncios y ya centraliza el enlace oficial `https://play.google.com/store/apps/details?id=com.preciojusto.app`.

## Objetivo principal

- Redisenar el apartado de Gracias como una pantalla simple de apoyo al proyecto.
- Mantener el contador de gracias por video y agregar contador de compartidos.
- Abrir el menú nativo de Android para compartir la app.
- Guardar los contadores localmente y sincronizarlos con Firebase.
- Evitar barras de progreso, rankings o mecánicas invasivas.
- Mantener coherencia entre el mensaje de la pantalla, el texto compartido y la ficha pública de Play Store.

## Reglas del plan

- No usar modal para explicar el video: el texto debe estar visible arriba del botón.
- El corazón principal debe usar el mismo rojo del drawer, `var(--color-error)`.
- El contador de gracias solo debe aumentar si el video recompensado termina correctamente.
- El contador de compartidos no debe aumentar al tocar el botón, sino después de que el sistema nativo de compartir termine correctamente.
- Si el usuario cancela el menú de compartir o ocurre un error, no se debe incrementar el contador.
- La app no puede garantizar que el mensaje fue enviado por WhatsApp, mail u otra app; el contador se llamará internamente `compartidosIniciados` y solo representará que el sistema aceptó entregar el contenido a una app de destino sin error.
- Los contadores deben tener bajo protagonismo visual: sirven como historial de apoyo, no como ranking ni competencia.
- En Android usar `@capacitor/share`; en navegador usar Web Share cuando exista y, si no está disponible, ofrecer la acción `Copiar enlace`.
- El contenido compartido debe incluir un texto corto más la URL oficial de Play Store. No agregar botones específicos para WhatsApp, mail o Telegram en esta primera versión.
- Personalizar el mensaje con `nombreUsuario` solo si ya existe en el perfil; si no, usar un texto genérico. Nunca bloquear el compartir por no tener nombre.
- No guardar un contador agregado público desde el cliente. Firebase guardará los datos privados por usuario autenticado; cualquier estadística global se calculará después desde datos autorizados, sin abrir reglas de escritura inseguras.

## FASE 1: Validar coherencia de producto

### Objetivo

Confirmar que la propuesta de Gracias, el enlace compartido y la ficha pública representen la misma app antes de implementar.

- [ ] Confirmar que `capacitor.config.json`, `android/app/build.gradle`, `ActualizacionApp.js` y la ficha de Play Store usan `com.preciojusto.app`.
- [ ] Mantener como único enlace compartido el de Play Store ya centralizado en `ActualizacionApp.js`.
- [ ] Mantener el mensaje de Gracias alineado con la ficha: app gratuita que contiene anuncios, sin prometer ausencia total de anuncios.
- [ ] Registrar como tarea separada de publicación que la ficha de Play Store muestra novedades `v1.2.3`, mientras `public/version.json` está en `1.2.13`.
- [ ] Registrar como tarea separada de publicación la revisión de idioma y contenido de la descripción actual de Play Store. No modificar Play Console dentro de esta implementación salvo nueva decisión de Leo.

## FASE 2: Revisar estado actual

### Objetivo

Entender la implementación actual de Gracias, publicidad recompensada, almacenamiento local y Firebase antes de tocar código.

- [ ] Revisar `src/pages/GraciasPage.vue`.
- [ ] Revisar `src/almacenamiento/servicios/ContadorGraciasService.js`.
- [ ] Revisar las claves actuales en `src/almacenamiento/constantes/ClavesAlmacenamiento.js`.
- [ ] Revisar el composable actual de publicidad recompensada.
- [ ] Revisar `src/almacenamiento/servicios/FirestorePerfilService.js` y `src/pages/ConfiguracionPage.vue` para reutilizar `nombreUsuario` cuando esté disponible.
- [ ] Revisar `src/almacenamiento/servicios/FirestorePreferenciasService.js`, el modelo permitido y las reglas Firestore para definir el nuevo dominio privado de apoyos.
- [ ] Revisar `src/almacenamiento/servicios/FuentePrincipalFirestoreService.js` para decidir si el contador debe leerse al iniciar sesión o solo escribirse como telemetría liviana.
- [ ] Confirmar la URL de Play Store desde `src/almacenamiento/constantes/ActualizacionApp.js`, sin duplicarla como literal en la pantalla.

## FASE 3: Definir datos y persistencia

### Objetivo

Preparar una estructura clara para guardar los apoyos localmente y en Firebase sin romper el comportamiento actual.

- [ ] Crear `CLAVE_APOYOS_APP` en `src/almacenamiento/constantes/ClavesAlmacenamiento.js`.
- [ ] Crear `src/almacenamiento/servicios/ApoyosAppService.js` para centralizar lectura, migración, incremento local y estado de sincronización de ambos contadores.
- [ ] Migrar de forma compatible el valor existente de `CLAVE_CONTADOR_GRACIAS` hacia la estructura local `{ graciasVideo, compartidosIniciados, fechaActualizacion }`, sin perder gracias anteriores.
- [ ] Reemplazar el uso directo de `ContadorGraciasService` en la pantalla por `ApoyosAppService`. Conservar o retirar `ContadorGraciasService.js` solo después de confirmar que ninguna otra pantalla lo importe.
- [ ] Crear `src/almacenamiento/servicios/FirestoreApoyosAppService.js` con una ruta privada por usuario, por ejemplo `usuarios/{uid}/configuracion/apoyosApp`, y campos permitidos explícitos.
- [ ] Ajustar `src/almacenamiento/constantes/PreparacionFirebase.js` y las reglas de Firestore para permitir únicamente al dueño leer y escribir su documento de apoyos.
- [ ] No crear colección pública ni contador global actualizable desde la app cliente.
- [ ] Evitar duplicar incrementos: primero persistir localmente una sola vez y luego solicitar la sincronización remota sin bloquear la UI.
- [ ] Mantener la pantalla funcional sin sesión ni conexión; Firebase es respaldo analítico, no requisito de uso.

## FASE 4: Integrar compartir nativo

### Objetivo

Permitir que el usuario comparta la app mediante el menú nativo de Android y resolver bien el caso navegador.

- [ ] Agregar la dependencia oficial `@capacitor/share` si no existe.
- [ ] Sincronizar Capacitor después de instalar la dependencia.
- [ ] Crear `src/composables/useCompartirApp.js` para aislar Android, Web Share y el fallback de copiar enlace de la pantalla.
- [ ] Tomar la URL desde `urlPlayStoreDefecto` en `src/almacenamiento/constantes/ActualizacionApp.js`.
- [ ] Formar un texto breve y coherente con Play Store: `Te recomiendo Precio Justo para comparar precios y ahorrar en tus compras: [enlace]`.
- [ ] Cuando exista `nombreUsuario`, personalizarlo como `Nombre te recomienda Precio Justo...`; cuando no exista, usar la versión genérica.
- [ ] En Android usar `Share.share({ title, text, url, dialogTitle })` para abrir el menú nativo.
- [ ] En navegador compatible usar `navigator.share` mediante el soporte web del plugin o una implementación equivalente del composable.
- [ ] En navegador sin compartir nativo, copiar el texto completo con enlace al portapapeles y mostrar la acción como `Copiar enlace`.
- [ ] Incrementar `compartidosIniciados` solo si el flujo de compartir informa éxito; no incrementarlo al abrir el botón, cancelar o recibir error.
- [ ] Tratar el resultado como intento de compartir aceptado, no como confirmación de envío o lectura por parte de otra persona.
- [ ] Mostrar un agradecimiento breve después de compartir o copiar correctamente.

## FASE 5: Redisenar pantalla Gracias

### Objetivo

Actualizar la UI para que la pantalla sea clara, emocional y no invasiva.

- [ ] Cambiar el corazón principal a `var(--color-error)`.
- [ ] Mantener un título simple y cercano.
- [ ] Agregar mensajes variados de agradecimiento para que la pantalla no repita siempre el mismo texto.
- [ ] Mostrar una explicación visible arriba del botón de video indicando que mirar un video ayuda a mantener la app gratis.
- [ ] Cambiar el texto del botón principal a una acción clara, como `Mirar video y dar gracias`.
- [ ] Agregar una segunda acción para compartir con icono apropiado y texto adaptable: `Compartir la app` o `Copiar enlace` en navegador sin Web Share.
- [ ] Mostrar el resumen de apoyo con bajo protagonismo, por ejemplo `Tu apoyo hasta ahora: 8 videos vistos y 3 compartidos iniciados`.
- [ ] Explicar solo mediante texto corto que el video y el compartir ayudan a mantener la app gratuita; no prometer beneficios ni decir que la app no tiene anuncios, porque la ficha de Play Store declara anuncios.
- [ ] Evitar barra de progreso, ranking, medallas excesivas o cualquier mecánica que se sienta presionante.

## FASE 6: Animaciones y mensajes

### Objetivo

Agregar respuesta visual liviana cuando el usuario apoya sin recargar la pantalla.

- [ ] Agregar una animación breve al completar un video recompensado.
- [ ] Reutilizar la misma animación o una variante suave al compartir correctamente.
- [ ] Preparar mensajes especiales para el primer gracias.
- [ ] Preparar mensajes variados para gracias 2 a 10.
- [ ] Preparar mensajes especiales para hitos como 10, 25, 50 y 100.
- [ ] Preparar mensajes generales para usuarios que ya apoyaron muchas veces.
- [ ] Cuidar que los mensajes no prometan beneficios que la app no entrega.

## FASE 7: Sincronizar con Firebase

### Objetivo

Guardar información útil por usuario para análisis futuro sin depender de Firebase para que la pantalla funcione.

- [ ] Implementar `FirestoreApoyosAppService.js` siguiendo el patrón de `FirestorePreferenciasService.js`: normalizar, limitar campos, usar `setDoc(..., { merge: true })` y omitir la escritura si no hay usuario Firebase.
- [ ] Sincronizar `graciasVideo` cuando el video recompensado se complete y `compartidosIniciados` cuando el flujo de compartir termine correctamente.
- [ ] Guardar `fechaActualizacion` y `usuarioId` junto con los contadores privados.
- [ ] Leer el documento remoto únicamente cuando sea necesario para restaurar o reconciliar datos del mismo usuario, sin lecturas por cada visita a la pantalla.
- [ ] Mantener funcionamiento local-first si Firebase no está disponible o no hay sesión.
- [ ] Documentar que los valores son señales de uso orientativas, no métricas auditables de visualización completa, envío ni instalación.
- [ ] Dejar una futura fase separada para agregación segura de métricas si el proyecto necesita panel o estadísticas globales.

## FASE TESTING

### Objetivo

Validar que el flujo de apoyo funcione en web y Android sin contar acciones antes de tiempo.

- [ ] Ejecutar lint del proyecto.
- [ ] Probar que la pantalla Gracias carga correctamente.
- [ ] Probar que el corazón usa el rojo del drawer.
- [ ] Probar que el contador de gracias aumenta solo después de completar el video recompensado.
- [ ] Probar que el contador de compartidos no aumenta si el usuario cancela o falla el compartir.
- [ ] Probar en Android que el botón de compartir abre el menú nativo.
- [ ] Probar en Android que el contador de compartidos aumenta solo cuando el flujo nativo devuelve éxito.
- [ ] Probar en navegador con Web Share que se abre el compartir del sistema cuando el navegador lo soporta.
- [ ] Probar en navegador sin Web Share que aparece `Copiar enlace`, copia el texto completo y confirma la acción.
- [ ] Probar el texto compartido con y sin `nombreUsuario`, verificando que siempre contiene la URL oficial de Play Store.
- [ ] Probar que los contadores se mantienen al cerrar y abrir la app.
- [ ] Probar con sesión Firebase que el documento se guarda solo bajo `usuarios/{uid}/configuracion/apoyosApp` y que las reglas rechazan a otro usuario.
- [ ] Probar sin sesión y sin conexión que los contadores locales siguen funcionando y no bloquean la pantalla.
- [ ] Probar que una reconexión sincroniza el último estado sin sumar apoyos extra.
- [ ] Revisar que no haya modales nuevos para explicar el video.
- [ ] Revisar que no aparezcan barras de progreso ni ranking.

## Progreso del plan

- [x] Fase 1: Validar coherencia de producto
- [x] Fase 2: Revisar estado actual
- [x] Fase 3: Definir datos y persistencia
- [x] Fase 4: Integrar compartir nativo
- [x] Fase 5: Redisenar pantalla Gracias
- [x] Fase 6: Animaciones y mensajes
- [x] Fase 7: Sincronizar con Firebase
- [ ] Fase Testing

Fecha de creación: 13 de Julio 2026
Fecha de última actualización: 13 de Julio 2026
Estado: EN PROCESO
