# PLAN MODELO COMUNITARIO FIREBASE

## Descripción del plan

Diseñar el modelo comunitario de Firebase para Precio Justo sin mezclarlo con la base privada del usuario. La app ya tiene datos privados bajo `usuarios/{usuarioId}`, Storage privado, migración guiada y Firestore como fuente principal para la experiencia privada. Este plan define cómo pasar de datos privados a datos compartidos con reglas, moderación y control de calidad.

El objetivo no es implementar comunidad directamente, sino dejar un modelo claro para que otra IA pueda construirlo sin exponer información privada ni crear una base pública insegura.

## Objetivo principal

- Definir qué datos pueden compartirse con la comunidad.
- Definir qué datos nunca deben compartirse.
- Crear un modelo Firestore comunitario separado de `usuarios/{usuarioId}`.
- Definir reglas públicas, semipúblicas y privadas.
- Definir flujo de publicación desde datos privados hacia comunidad.
- Definir moderación, reportes y calidad de datos.
- Definir confirmaciones comunitarias reales.
- Preparar fases posteriores de implementación por dominio.

## Reglas del plan

- No guardar datos comunitarios dentro de `usuarios/{usuarioId}`.
- No exponer listas privadas, preferencias, historial privado ni datos de cuenta.
- No publicar datos privados automáticamente.
- Toda publicación comunitaria debe ser una acción explícita del usuario.
- No compartir fotos privadas sin consentimiento explícito.
- No guardar email, nombre real ni identificadores sensibles en documentos públicos.
- No relajar las reglas privadas existentes.
- No confiar en el cliente para moderación definitiva.
- No implementar Cloud Functions hasta tener el modelo y las reglas definidos.
- Separar comunidad de backup privado en código, reglas y documentación.

## FASE 1: Auditar datos privados existentes

### Objetivo

Revisar qué datos ya existen y clasificar cuáles podrían tener valor comunitario.

- [ ] Revisar `Planes/PlanesFuturos/PlanMaestroFirebase.md`.
- [ ] Revisar `Planes/Resumenes/ModeloFirestoreMigracion.md`.
- [ ] Revisar `Planes/Resumenes/Resumen11Firebase.md`.
- [ ] Revisar modelo privado de productos.
- [ ] Revisar modelo privado de precios.
- [ ] Revisar modelo privado de comercios y direcciones.
- [ ] Revisar modelo privado de confirmaciones.
- [ ] Confirmar que Lista Justa queda fuera de comunidad por defecto.
- [ ] Confirmar que preferencias quedan fuera de comunidad.
- [ ] Confirmar que fotos privadas quedan fuera salvo publicación explícita.

## FASE 2: Clasificar datos compartibles y no compartibles

### Objetivo

Definir límites de privacidad antes de crear rutas públicas.

- [ ] Marcar productos como compartibles solo con campos normalizados y no sensibles.
- [ ] Marcar precios como compartibles si incluyen comercio, dirección aproximada o sucursal validada.
- [ ] Marcar comercios como compartibles si no contienen notas privadas del usuario.
- [ ] Marcar confirmaciones como compartibles solo como conteos o acciones anónimas/controladas.
- [ ] Marcar fotos como compartibles solo si el usuario las publica explícitamente.
- [ ] Marcar listas como no compartibles en esta etapa.
- [ ] Marcar preferencias como no compartibles.
- [ ] Marcar `usuarioId`, email, nombre, backups y sesión como no públicos.
- [ ] Documentar cada decisión en una tabla simple dentro del resumen técnico futuro.

## FASE 3: Diseñar rutas comunitarias Firestore

### Objetivo

Crear un árbol comunitario separado y consultable sin tocar el árbol privado.

- [ ] Definir colección `comunidadProductos`.
- [ ] Definir colección `comunidadComercios`.
- [ ] Definir subcolección o colección para `comunidadPrecios`.
- [ ] Definir colección para `comunidadConfirmaciones`.
- [ ] Definir colección para `comunidadReportes`.
- [ ] Definir colección para `comunidadModeracion` si hace falta.
- [ ] Definir IDs estables para evitar duplicados.
- [ ] Definir campos normalizados para búsqueda.
- [ ] Definir `estadoRevision`: `pendiente`, `aprobado`, `rechazado`, `oculto`.
- [ ] Definir `fechaCreacion`, `fechaActualizacion` y `fechaUltimaConfirmacion`.

## FASE 4: Diseñar modelo de producto comunitario

### Objetivo

Definir cómo se representa un producto compartido entre usuarios.

- [ ] Definir campos públicos mínimos: nombre, marca, categoría, código de barras, cantidad y unidad.
- [ ] Definir campos normalizados para búsqueda y deduplicación.
- [ ] Definir cómo se conserva el origen del dato sin exponer usuario real.
- [ ] Definir conteos agregados: precios, comercios, confirmaciones y reportes.
- [ ] Definir estado de revisión del producto.
- [ ] Definir relación con precios comunitarios.
- [ ] Definir relación opcional con foto pública validada.
- [ ] Confirmar que no se copia todo el producto privado al documento comunitario.

## FASE 5: Diseñar modelo de comercio comunitario

### Objetivo

Definir cómo se comparten comercios y sucursales sin duplicar cadenas de forma descontrolada.

- [ ] Definir campos públicos de comercio: nombre, tipo y nombre normalizado.
- [ ] Definir modelo de sucursal o dirección comunitaria.
- [ ] Definir si dirección exacta es pública o si se usa nivel aproximado.
- [ ] Definir deduplicación por nombre normalizado y ubicación.
- [ ] Definir conteos de uso y confirmaciones.
- [ ] Definir reportes por comercio o sucursal.
- [ ] Definir estado de revisión.
- [ ] Confirmar que notas privadas o preferencias del usuario no se copian.

## FASE 6: Diseñar modelo de precios comunitarios

### Objetivo

Definir cómo se publica y valida un precio compartido.

- [ ] Definir campos públicos: productoId comunitario, comercioId comunitario, valor, moneda y fecha.
- [ ] Definir campos opcionales: unidad, escalas por cantidad y observación controlada.
- [ ] Definir origen: usuario autenticado, importado, moderado o sistema.
- [ ] Definir estado del precio: activo, viejo, reportado, oculto.
- [ ] Definir cuándo un precio deja de ser vigente.
- [ ] Definir cómo se agregan confirmaciones comunitarias.
- [ ] Definir cómo se evita duplicar el mismo precio varias veces.
- [ ] Confirmar que no se publica historial privado completo sin consentimiento.

## FASE 7: Diseñar confirmaciones comunitarias reales

### Objetivo

Separar las confirmaciones privadas actuales de las confirmaciones públicas de calidad.

- [ ] Definir documento de confirmación comunitaria por usuario y precio.
- [ ] Definir ID estable para impedir doble confirmación.
- [ ] Definir si el documento guarda `usuarioId` privado o hash/control interno.
- [ ] Definir conteo agregado visible en el precio.
- [ ] Definir regla para que un usuario no confirme dos veces el mismo precio.
- [ ] Definir regla para impedir confirmar datos propios si se decide necesario.
- [ ] Definir flujo para deshacer confirmación si la app lo permite.
- [ ] Definir diferencia entre confirmar precio y reportar precio incorrecto.

## FASE 8: Diseñar reportes y moderación

### Objetivo

Crear mecanismos para controlar datos falsos, duplicados o abusivos.

- [ ] Definir tipos de reporte: precio falso, comercio duplicado, producto incorrecto, foto inapropiada.
- [ ] Definir colección de reportes comunitarios.
- [ ] Definir estado del reporte: abierto, revisado, aceptado, rechazado.
- [ ] Definir conteo de reportes por documento.
- [ ] Definir cuándo ocultar un dato automáticamente.
- [ ] Definir qué requiere revisión manual.
- [ ] Definir rol futuro de moderador.
- [ ] Definir si Cloud Functions será necesaria para agregados y límites.

## FASE 9: Diseñar reglas Firestore comunitarias

### Objetivo

Definir reglas seguras para lectura pública controlada y escritura autenticada.

- [ ] Mantener lectura privada bajo `usuarios/{usuarioId}` sin cambios.
- [ ] Definir qué colecciones comunitarias son legibles por usuarios autenticados.
- [ ] Definir si parte de comunidad puede ser leída sin sesión.
- [ ] Permitir creación solo a usuarios autenticados.
- [ ] Restringir actualización de campos sensibles desde cliente.
- [ ] Impedir que el cliente modifique conteos agregados directamente.
- [ ] Impedir escritura de campos no permitidos.
- [ ] Impedir que un usuario borre documentos comunitarios directamente.
- [ ] Preparar reglas para reportes y confirmaciones.
- [ ] Documentar pruebas de usuario A, usuario B y usuario sin sesión.

## FASE 10: Diseñar reglas Storage comunitarias

### Objetivo

Separar fotos privadas de fotos comunitarias y evitar exposición accidental.

- [ ] Mantener fotos privadas bajo `usuarios/{usuarioId}/fotos`.
- [ ] Definir ruta comunitaria separada para fotos públicas si se habilitan.
- [ ] Exigir autenticación para subir fotos comunitarias.
- [ ] Limitar tamaño y tipo MIME.
- [ ] Definir estado de revisión para foto comunitaria.
- [ ] Impedir sobrescritura de fotos de otros usuarios.
- [ ] Definir si las fotos públicas se leen desde URL pública o con reglas autenticadas.
- [ ] Confirmar que fotos privadas nunca se mueven automáticamente a comunidad.

## FASE 11: Diseñar flujo de publicación desde datos privados

### Objetivo

Definir cómo un usuario decide compartir un dato privado.

- [ ] Agregar concepto de acción explícita `Compartir con comunidad`.
- [ ] Definir previsualización de datos que se van a compartir.
- [ ] Permitir excluir campos antes de publicar.
- [ ] Confirmar consentimiento antes de enviar.
- [ ] Crear documento comunitario separado, no mover el documento privado.
- [ ] Guardar relación local opcional hacia documento comunitario publicado.
- [ ] Definir qué pasa si el dato comunitario ya existe.
- [ ] Definir mensaje claro si queda pendiente de revisión.

## FASE 12: Diseñar búsqueda y consumo de datos comunitarios

### Objetivo

Definir cómo la app usará datos compartidos sin reemplazar la base privada.

- [ ] Definir búsqueda comunitaria de productos por código de barras.
- [ ] Definir búsqueda comunitaria de productos por nombre normalizado.
- [ ] Definir consulta de precios comunitarios por producto.
- [ ] Definir consulta de comercios comunitarios cercanos o por nombre.
- [ ] Definir cómo importar un dato comunitario a la base privada del usuario.
- [ ] Mantener datos comunitarios como sugerencias, no como edición automática privada.
- [ ] Definir indicadores visuales para datos comunitarios.
- [ ] Definir fallback si no hay conexión o no hay resultados.

## FASE 13: Definir límites, índices y costos

### Objetivo

Evitar un modelo comunitario caro o lento desde el primer diseño.

- [ ] Definir límites por consulta.
- [ ] Definir paginación.
- [ ] Definir índices necesarios por búsqueda.
- [ ] Definir límites de publicaciones por usuario.
- [ ] Definir límites de confirmaciones por período.
- [ ] Definir si algunos agregados requieren Cloud Functions.
- [ ] Definir limpieza de datos viejos o reportados.
- [ ] Estimar impacto de lecturas frecuentes en Firestore.

## FASE 14: Dividir implementación futura

### Objetivo

Separar el modelo comunitario en planes ejecutables más pequeños.

- [ ] Crear plan futuro para reglas comunitarias Firestore.
- [ ] Crear plan futuro para productos comunitarios.
- [ ] Crear plan futuro para precios comunitarios.
- [ ] Crear plan futuro para comercios comunitarios.
- [ ] Crear plan futuro para confirmaciones comunitarias.
- [ ] Crear plan futuro para reportes y moderación.
- [ ] Crear plan futuro para UI de compartir/importar.
- [ ] Definir orden recomendado de implementación.

## FASE 15: Actualizar documentación

### Objetivo

Mantener el mapa Firebase alineado con la decisión comunitaria.

- [ ] Actualizar `Planes/Resumenes/ModeloFirestoreMigracion.md`.
- [ ] Actualizar `Planes/Resumenes/Resumen11Firebase.md`.
- [ ] Actualizar `Planes/PlanesFuturos/PlanMaestroFirebase.md` cuando el plan quede completado.
- [ ] Documentar rutas comunitarias propuestas.
- [ ] Documentar datos prohibidos en comunidad.
- [ ] Documentar reglas de privacidad y moderación.

## FASE TESTING

### Objetivo

Validar el diseño antes de implementar código comunitario.

- [ ] Revisar que ninguna ruta comunitaria quede dentro de `usuarios/{usuarioId}`.
- [ ] Revisar que ninguna regla propuesta exponga datos privados.
- [ ] Revisar que ningún campo sensible se proponga como público.
- [ ] Revisar que cada escritura comunitaria requiera usuario autenticado.
- [ ] Revisar que conteos agregados no dependan solo del cliente.
- [ ] Revisar que haya flujo de reporte y moderación.
- [ ] Revisar que la publicación comunitaria sea explícita y reversible en la UI privada.
- [ ] Revisar que el modelo permita importar datos comunitarios a privado sin modificar el original público.
- [ ] Revisar que el costo de consultas tenga límites y paginación.
- [ ] Revisar que el plan quede dividido en implementaciones pequeñas.

## Progreso del plan

- [ ] Fase 1: Auditar datos privados existentes
- [ ] Fase 2: Clasificar datos compartibles y no compartibles
- [ ] Fase 3: Diseñar rutas comunitarias Firestore
- [ ] Fase 4: Diseñar modelo de producto comunitario
- [ ] Fase 5: Diseñar modelo de comercio comunitario
- [ ] Fase 6: Diseñar modelo de precios comunitarios
- [ ] Fase 7: Diseñar confirmaciones comunitarias reales
- [ ] Fase 8: Diseñar reportes y moderación
- [ ] Fase 9: Diseñar reglas Firestore comunitarias
- [ ] Fase 10: Diseñar reglas Storage comunitarias
- [ ] Fase 11: Diseñar flujo de publicación desde datos privados
- [ ] Fase 12: Diseñar búsqueda y consumo de datos comunitarios
- [ ] Fase 13: Definir límites, índices y costos
- [ ] Fase 14: Dividir implementación futura
- [ ] Fase 15: Actualizar documentación
- [ ] Fase Testing

Fecha de creación: 21 de Mayo 2026
Fecha de última actualización: 21 de Mayo 2026
Estado: BORRADOR
