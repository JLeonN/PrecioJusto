# PLAN ESCALAS POR CANTIDAD

## Descripción del plan

Definir e implementar una mecánica de precios por cantidad dentro del producto actual, manteniendo el precio base existente como referencia principal y agregando escalas editables para casos mayoristas o compras por volumen.

## Objetivo principal

- Mantener el precio base actual sin romper la lógica existente
- Agregar escalas por cantidad como una capacidad opcional por producto
- Mostrar en la interfaz cuando un producto mejora su precio al comprar más unidades
- Preparar la base para que la mecánica impacte también en comparaciones, historial y otras áreas relacionadas

## Reglas del plan

- El precio base actual sigue siendo el precio principal del producto
- No se permite crear una escala para 1 unidad porque ese caso ya corresponde al precio base
- Las escalas deben vivir dentro del mismo producto y no en una entidad separada
- Las escalas deben ordenarse automáticamente por cantidad mínima
- No se deben permitir escalas duplicadas ni configuraciones inconsistentes
- El detalle de escalas debe mostrarse en formato de lista simple
- El texto visible para activar esta mecánica debe ser `Activar precios mayoristas`
- El campo de precio existente debe reutilizarse como precio base de 1 unidad y no debe desaparecer al activar el switch
- El bloque de escalas debe comportarse como una pieza reutilizable en todos los formularios y modales donde se carguen precios
- Todo despliegue, expansión o reacomodo visual asociado a esta mecánica debe usar transiciones suaves y claras
- Esta mecánica funciona como registro de referencia de precios por comercio y no como simulador exacto de compra
- No es obligatorio calcular combinaciones como 8 unidades si el comercio solo informa escalones como 1, 3 o 6
- La tarjeta del producto debe seguir mostrando el mejor precio base disponible para 1 unidad
- Si otro comercio no gana en precio base pero sí ofrece una mejora por cantidad, la tarjeta debe destacarlo visualmente sin reemplazar el precio base mostrado
- Una escala menor que el precio base o menor que una escala anterior se considera mejora
- Una escala igual al precio base o igual a una escala anterior se considera neutral
- Una escala mayor que el precio base o mayor que una escala anterior se considera sospechosa
- Las escalas sospechosas se pueden guardar, pero no deben generar destaque visual en la tarjeta y deben marcarse como sospechosas en el histórico

## FASE 1: Definir estructura de datos y reglas de negocio

### Objetivo

Cerrar la estructura mínima de datos y las reglas operativas para soportar escalas por cantidad sin mezclar esta mecánica con packs ni promociones temporales.

- [ ] Definir la estructura de `escalasPorCantidad` dentro del producto
- [ ] Confirmar los campos mínimos de cada escala, incluyendo `cantidadMinima` y `precioUnitario`
- [ ] Establecer que la cantidad mínima permitida para una escala sea 2 o mayor
- [ ] Definir que cada escala se guarda como dato informado por el comercio y no como resultado de una simulación de compra
- [ ] Confirmar cómo se resuelve la prioridad entre precio base y escalas durante cálculos y visualización
- [ ] Definir cuándo una escala debe considerarse mejora, neutral o sospechosa
- [ ] Definir qué datos adicionales hacen falta para reflejar estado sospechoso en el histórico
- [ ] Dejar fuera de este plan cualquier lógica de packs o promociones temporales

## FASE 2: Diseñar validaciones y flujo de carga

### Objetivo

Definir cómo el usuario crea, edita y corrige escalas por cantidad dentro del flujo actual del producto.

- [ ] Definir si el formulario del producto usará un switch o check para habilitar escalas por cantidad
- [ ] Reutilizar el texto `Activar precios mayoristas` en todos los puntos donde se active esta mecánica
- [ ] Diseñar el bloque desplegable de escalas para no sobrecargar el formulario principal
- [ ] Reutilizar el mismo bloque de escalas en Agregar manual, Escaneo rápido, modal de Agregar precio y mesa de trabajo
- [ ] Mantener visible el campo de precio existente y relabelarlo como precio base de 1 unidad cuando el switch esté activo
- [ ] Establecer cómo agregar, editar y eliminar filas de escalas
- [ ] Crear la primera fila sugerida con cantidad mínima 3 cuando el usuario active el switch
- [ ] Permitir agregar más escalones con un botón `+` y ajustar la cantidad mínima con controles claros
- [ ] Permitir eliminar escalones individuales
- [ ] Validar que no se puedan repetir cantidades mínimas
- [ ] Validar que no se puedan guardar escalas con cantidad menor a 2
- [ ] Validar que no se puedan guardar precios vacíos, inválidos o inconsistentes
- [ ] Permitir guardar escalas sospechosas, pero marcarlas internamente para revisión posterior
- [ ] Implementar confirmación inline al desactivar el switch solo si el usuario ya editó escalas
- [ ] Hacer que la confirmación inline siga la misma lógica visual de confirmar o cancelar ya usada al borrar tarjetas en mesa de trabajo

## FASE 3: Definir visualización en tarjetas y detalle de producto

### Objetivo

Resolver cómo se informa en la interfaz que un producto tiene mejor precio por cantidad sin perder claridad en el precio base.

- [ ] Mantener el precio base siempre visible en la tarjeta del producto
- [ ] Definir un indicador visual breve para productos con escalas convenientes en otro comercio aunque no ganen en precio base
- [ ] Evaluar el uso de color, badge o destaque sutil sin recurrir a animaciones invasivas
- [ ] Definir un texto corto de apoyo para explicar que existe precio mayorista o mejor precio por cantidad
- [ ] Definir dónde se muestra el detalle de escalas dentro del producto
- [ ] Mostrar el detalle de escalas en una lista simple y legible en móvil
- [ ] Hacer que la aparición del bloque de precios mayoristas tenga una expansión suave y sin saltos bruscos del layout
- [ ] Proteger la interacción del switch, inputs y controles de escalas para que la tarjeta de mesa de trabajo no se cierre al tocarlos
- [ ] Definir cómo se muestra al usuario que el brillo o destaque de la tarjeta responde a una ventaja por cantidad y no a un mejor precio base
- [ ] Evitar que las escalas sospechosas generen destaque visual en la tarjeta principal

## FASE 4: Integrar la mecánica en cálculos y comportamiento real

### Objetivo

Definir cómo las escalas impactan en el resto del sistema para que no queden solo como información visual.

- [ ] Identificar en qué partes del flujo actual se calcula o usa el precio del producto
- [ ] Confirmar si la mecánica afecta comparaciones, historial y otras vistas relacionadas
- [ ] Definir cómo guardar o reflejar que un precio registrado provino de una escala por cantidad
- [ ] Definir cómo guardar o reflejar que una escala quedó marcada como sospechosa
- [ ] Revisar si hace falta agregar datos auxiliares para auditoría o trazabilidad futura
- [ ] Detectar áreas del sistema que puedan romperse si el producto empieza a tener escalas
- [ ] Definir en qué vistas alcanza con informar la existencia de escalas y en cuáles hace falta usarlas para cálculos reales

## FASE 5: Implementación incremental y ajustes

### Objetivo

Ejecutar la mecánica por etapas, reduciendo riesgo y permitiendo validar la experiencia antes de extenderla.

- [ ] Implementar primero el soporte base de datos y modelo del producto para escalas
- [ ] Implementar después la carga y edición de escalas en la interfaz
- [ ] Implementar luego la visualización en tarjeta y detalle
- [ ] Integrar finalmente la lógica en comparaciones, historial o puntos donde realmente aporte valor
- [ ] Implementar la marca visual o semántica de sospecha en el histórico
- [ ] Revisar textos, etiquetas y consistencia visual en toda la experiencia
- [ ] Dejar documentadas las decisiones tomadas para futuras mecánicas como packs o promociones temporales

## FASE TESTING

### Objetivo

Validar de forma ejecutable por IA y revisable por humano que las escalas por cantidad funcionan bien en datos, interfaz y comportamiento real.

- [ ] Crear o editar un producto sin escalas y verificar que el comportamiento actual no cambie
- [ ] Crear un producto con una escala desde 3 unidades y verificar que se guarde correctamente
- [ ] Crear varias escalas, por ejemplo 3, 6 y 12 unidades, y verificar que se ordenen correctamente
- [ ] Intentar guardar cantidades duplicadas y verificar que el sistema lo impida
- [ ] Intentar guardar una escala para 1 unidad y verificar que el sistema la rechace
- [ ] Verificar que la tarjeta siga mostrando el mejor precio base disponible para 1 unidad
- [ ] Verificar que la tarjeta se destaque cuando exista una ventaja por cantidad aunque ese comercio no gane en precio base
- [ ] Verificar que una escala neutral no genere destaque visual por sí sola
- [ ] Verificar que una escala sospechosa se guarde pero quede marcada como sospechosa en el histórico
- [ ] Verificar que una escala sospechosa no genere destaque visual en la tarjeta principal
- [ ] Verificar que el detalle del producto muestre las escalas en formato de lista simple
- [ ] Verificar que al activar el switch el campo de precio actual pase a representar el precio base de 1 unidad
- [ ] Verificar que al desactivar el switch sin haber editado escalas no aparezca confirmación
- [ ] Verificar que al desactivar el switch con escalas editadas aparezca confirmación inline y permita cancelar o confirmar el borrado
- [ ] Verificar que en mesa de trabajo la tarjeta no se cierre al interactuar con el switch ni con los controles del bloque de escalas
- [ ] Verificar que historial, comparaciones u otras vistas relacionadas no queden inconsistentes cuando existan escalas

## Progreso del plan

- [ ] Fase 1: Definir estructura de datos y reglas de negocio
- [ ] Fase 2: Diseñar validaciones y flujo de carga
- [ ] Fase 3: Definir visualización en tarjetas y detalle de producto
- [ ] Fase 4: Integrar la mecánica en cálculos y comportamiento real
- [ ] Fase 5: Implementación incremental y ajustes
- [ ] Fase Testing

Fecha de creación: 08 de Abril 2026
Fecha de última actualización: 08 de Abril 2026
Estado: BORRADOR
