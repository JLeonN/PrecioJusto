# PLAN LISTA JUSTA INTELIGENTE

## Descripcion del plan

Agregar una vista inteligente dentro de cada lista de `Lista Justa` para ayudar al usuario a decidir dónde comprar según los precios base ya registrados en los comercios. La nueva vista debe convivir con la lista normal, reutilizar al máximo la lógica y componentes actuales, heredar el comercio actual cuando exista y permitir comparar varios comercios para mostrar tanto el costo total por comercio como una recomendación optimizada por producto.

## Objetivo principal

- Incorporar una vista `Lista Justa Inteligente` dentro de cada lista existente sin duplicar la lista base ni sus productos
- Permitir comparar comercios seleccionados por el usuario usando siempre el precio base mínimo disponible
- Mostrar resultados claros para decidir entre comprar todo en un solo comercio o dividir la compra por producto
- Informar de forma explícita cuando falten precios y cuando una comparación sea parcial

## Reglas del plan

- Reutilizar todo lo posible de `Lista Justa`, sus componentes, su lógica y sus estilos actuales
- Si para reutilizar mejor hay que ajustar código existente de `Lista Justa`, hacerlo en lugar de duplicar estructuras
- Mantener los colores y la identidad visual que ya usa el apartado `Lista Justa`
- Resolver la interfaz con criterio responsive en web, tablet y celular, tanto en vertical como en horizontal
- La vista inteligente trabaja sobre la misma lista base y los mismos items existentes
- El comercio actual de la lista normal debe heredarse como comercio base inicial si existe
- El comercio base debe poder cambiarse dentro de la vista inteligente
- La comparación usa siempre precios base disponibles; no inventar datos faltantes
- El tema de umbrales de ahorro queda fuera de este plan y se resolverá en un plan futuro

## FASE 1: Definir acceso y estructura de la vista inteligente

### Objetivo

Integrar la entrada a la nueva experiencia sin romper el flujo actual de `Lista Justa`.

- [x] Identificar en `ListaJustaPage.vue` el punto correcto para agregar un botón nuevo hacia la vista inteligente de cada lista
- [x] Definir la ruta o navegación de la vista inteligente respetando la estructura actual de `Lista Justa`
- [x] Confirmar que cada lista tenga su propia vista inteligente asociada a su mismo `id`
- [x] Definir qué datos nuevos deben persistirse por lista para la configuración inteligente sin duplicar `items`
- [x] Verificar cómo se hereda `comercioActual` como comercio base inicial cuando el usuario entra al modo inteligente

## FASE 2: Modelar configuración y persistencia de la inteligencia

### Objetivo

Guardar por lista la configuración necesaria para comparar comercios y recalcular resultados de forma consistente.

- [x] Extender el modelo de la lista para soportar datos de `Lista Justa Inteligente` sin romper listas ya guardadas
- [x] Definir persistencia del comercio base editable dentro de la vista inteligente
- [x] Definir persistencia de comercios adicionales seleccionados usando el selector existente de comercio y dirección
- [x] Asegurar migración o valores por defecto para listas existentes que todavía no tengan configuración inteligente
- [x] Revisar `ListaJustaStore` y `ListaJustaService` para mantener compatibilidad con el almacenamiento actual

## FASE 3: Resolver formulario y selección de comercios

### Objetivo

Permitir que el usuario configure de forma simple los comercios que quiere comparar.

- [x] Reutilizar `SelectorComercioDireccion.vue` o la lógica asociada para elegir el comercio base y los comercios a comparar
- [x] Permitir cambiar el comercio base heredado dentro de la vista inteligente
- [x] Permitir agregar múltiples comercios adicionales a la comparación
- [x] Validar que la interfaz explique claramente qué comercio es base y cuáles son comercios adicionales
- [x] Definir mensajes claros cuando faltan comercios suficientes para una comparación útil

## FASE 4: Implementar motor de comparación por precios base

### Objetivo

Calcular resultados comparables usando solo precios base disponibles por producto y por comercio.

- [x] Identificar de dónde se obtiene el precio base por producto y por comercio dentro de la arquitectura actual
- [x] Calcular cuánto costaría comprar toda la lista en cada comercio seleccionado
- [x] Calcular la recomendación optimizada por producto tomando siempre el precio base más bajo disponible
- [x] Usar el comercio base heredado o seleccionado como referencia principal para comparar ahorro estimado
- [x] Preparar estructura de resultados para agrupar productos por comercio recomendado
- [x] Excluir del cálculo comparativo los productos sin datos suficientes y marcarlos como casos a informar

## FASE 5: Diseñar manejo de precios faltantes y comparación parcial

### Objetivo

Mostrar recomendaciones honestas cuando la información esté incompleta.

- [x] Definir regla `Sin precios para comparar` cuando un producto no tenga precio en ninguno de los comercios elegidos
- [x] Definir regla `Solo hay precio en X comercio` cuando un producto tenga precio en un único comercio seleccionado
- [x] Definir comparación parcial cuando un producto tenga precio en algunos comercios seleccionados pero no en todos
- [x] Mostrar recomendación provisoria basada solo en los comercios con precio disponible
- [x] Agregar avisos generales de faltantes en el resumen de la pantalla
- [x] Agregar avisos por producto para que el usuario sepa cuándo la comparación no es exacta

## FASE 6: Construir la interfaz de resultados inteligentes

### Objetivo

Presentar la comparación de forma clara, útil y alineada visualmente con `Lista Justa`.

- [x] Diseñar un bloque de resumen con comercio base, total del comercio base, mejor total detectado y ahorro estimado
- [x] Diseñar un bloque con ranking de `comprar todo en un solo comercio`
- [x] Diseñar un bloque de `compra optimizada por producto` agrupando productos por comercio recomendado
- [x] Destacar diferencias importantes por producto cuando la comparación muestre oportunidades claras de ahorro
- [x] Mantener consistencia visual con colores, tipografía, espaciados y componentes existentes de `Lista Justa`
- [x] Resolver visualización cómoda en web, tablet y celular, tanto en vertical como en horizontal

## FASE 7: Integrar navegación, reutilización y coherencia funcional

### Objetivo

Cerrar la integración completa sin duplicar lógica innecesaria y manteniendo el comportamiento actual estable.

- [x] Revisar si conviene extraer bloques reutilizables desde la lista normal para compartirlos con la vista inteligente
- [x] Evitar duplicación de lógica de totales, encabezados, estados vacíos y componentes visuales cuando ya exista una base reutilizable
- [ ] Verificar que la lista normal siga funcionando igual después de integrar la vista inteligente
- [x] Confirmar que el botón nuevo y la nueva vista no rompan rutas, accesos rápidos ni persistencia actual
- [ ] Actualizar la documentación relacionada si cambian flujos, modelo o navegación de `Lista Justa`

## FASE TESTING

### Objetivo

Validar de forma ejecutable por IA y revisable por humano que la vista inteligente funcione bien y sea usable en todos los formatos relevantes.

- [ ] Crear una lista con comercio actual definido y verificar que la vista inteligente herede ese comercio como base inicial
- [ ] Cambiar el comercio base dentro de la vista inteligente y verificar que los cálculos se actualicen correctamente
- [ ] Seleccionar varios comercios y verificar que se muestre el total de comprar toda la lista en cada uno
- [ ] Verificar que la compra optimizada por producto use siempre el precio base mínimo disponible
- [ ] Probar productos sin precio en ningún comercio y verificar que se muestren como `Sin precios para comparar`
- [ ] Probar productos con precio en un solo comercio y verificar que se informe de forma explícita
- [ ] Probar productos con comparación parcial y verificar que se muestre recomendación provisoria con aviso de faltantes
- [ ] Verificar que la vista mantenga la identidad visual de `Lista Justa` y reutilice componentes donde corresponda
- [ ] Probar la interfaz en web, tablet y celular, en vertical y horizontal, revisando legibilidad, desbordes y acciones táctiles
- [ ] Verificar que la lista normal siga operativa y que la integración no rompa persistencia ni navegación existente

## Progreso del plan

- [x] Fase 1: Definir acceso y estructura de la vista inteligente
- [x] Fase 2: Modelar configuración y persistencia de la inteligencia
- [x] Fase 3: Resolver formulario y selección de comercios
- [x] Fase 4: Implementar motor de comparación por precios base
- [x] Fase 5: Diseñar manejo de precios faltantes y comparación parcial
- [x] Fase 6: Construir la interfaz de resultados inteligentes
- [ ] Fase 7: Integrar navegación, reutilización y coherencia funcional
- [ ] Fase Testing

Fecha de creacion: 25 de Abril 2026
Fecha de ultima actualizacion: 26 de Abril 2026
Estado: EN PROCESO
