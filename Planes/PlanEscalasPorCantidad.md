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

- [x] Definir la estructura de `escalasPorCantidad` dentro del producto
- [x] Confirmar los campos mínimos de cada escala, incluyendo `cantidadMinima` y `precioUnitario`
- [x] Establecer que la cantidad mínima permitida para una escala sea 2 o mayor
- [x] Definir que cada escala se guarda como dato informado por el comercio y no como resultado de una simulación de compra
- [x] Confirmar cómo se resuelve la prioridad entre precio base y escalas durante cálculos y visualización
- [x] Definir cuándo una escala debe considerarse mejora, neutral o sospechosa
- [x] Definir qué datos adicionales hacen falta para reflejar estado sospechoso en el histórico
- [x] Dejar fuera de este plan cualquier lógica de packs o promociones temporales

## FASE 2: Diseñar validaciones y flujo de carga

### Objetivo

Definir cómo el usuario crea, edita y corrige escalas por cantidad dentro del flujo actual del producto.

- [x] Definir si el formulario del producto usará un switch o check para habilitar escalas por cantidad
- [x] Reutilizar el texto `Activar precios mayoristas` en todos los puntos donde se active esta mecánica
- [x] Diseñar el bloque desplegable de escalas para no sobrecargar el formulario principal
- [x] Reutilizar el mismo bloque de escalas en Agregar manual, Escaneo rápido, modal de Agregar precio y mesa de trabajo
- [x] Mantener visible el campo de precio existente y relabelarlo como precio base de 1 unidad cuando el switch esté activo
- [x] Establecer cómo agregar, editar y eliminar filas de escalas
- [x] Crear la primera fila sugerida con cantidad mínima 3 cuando el usuario active el switch
- [x] Permitir agregar más escalones con un botón `+` y ajustar la cantidad mínima con controles claros
- [x] Permitir eliminar escalones individuales
- [x] Validar que no se puedan repetir cantidades mínimas
- [x] Validar que no se puedan guardar escalas con cantidad menor a 2
- [x] Validar que no se puedan guardar precios vacíos, inválidos o inconsistentes
- [x] Permitir guardar escalas sospechosas, pero marcarlas internamente para revisión posterior
- [x] Implementar confirmación inline al desactivar el switch solo si el usuario ya editó escalas
- [x] Hacer que la confirmación inline siga la misma lógica visual de confirmar o cancelar ya usada al borrar tarjetas en mesa de trabajo

## FASE 3: Definir visualización en tarjetas y detalle de producto

### Objetivo

Resolver cómo se informa en la interfaz que un producto tiene mejor precio por cantidad sin perder claridad en el precio base.

- [x] Mantener el precio base siempre visible en la tarjeta del producto
- [x] Definir un indicador visual breve para productos con escalas convenientes en otro comercio aunque no ganen en precio base
- [x] Evaluar el uso de color, badge o destaque sutil sin recurrir a animaciones invasivas
- [x] Definir un texto corto de apoyo para explicar que existe precio mayorista o mejor precio por cantidad
- [x] Definir dónde se muestra el detalle de escalas dentro del producto
- [x] Mostrar el detalle de escalas en una lista simple y legible en móvil
- [x] Hacer que la aparición del bloque de precios mayoristas tenga una expansión suave y sin saltos bruscos del layout
- [x] Proteger la interacción del switch, inputs y controles de escalas para que la tarjeta de mesa de trabajo no se cierre al tocarlos
- [x] Definir cómo se muestra al usuario que el brillo o destaque de la tarjeta responde a una ventaja por cantidad y no a un mejor precio base
- [x] Evitar que las escalas sospechosas generen destaque visual en la tarjeta principal

## FASE 4: Integrar la mecánica en cálculos y comportamiento real

### Objetivo

Definir cómo las escalas impactan en el resto del sistema para que no queden solo como información visual.

- [x] Identificar en qué partes del flujo actual se calcula o usa el precio del producto
- [x] Confirmar si la mecánica afecta comparaciones, historial y otras vistas relacionadas
- [x] Definir cómo guardar o reflejar que un precio registrado provino de una escala por cantidad
- [x] Definir cómo guardar o reflejar que una escala quedó marcada como sospechosa
- [ ] Revisar si hace falta agregar datos auxiliares para auditoría o trazabilidad futura
- [ ] Detectar áreas del sistema que puedan romperse si el producto empieza a tener escalas
- [x] Definir en qué vistas alcanza con informar la existencia de escalas y en cuáles hace falta usarlas para cálculos reales

## FASE 5: Implementación incremental y ajustes

### Objetivo

Ejecutar la mecánica por etapas, reduciendo riesgo y permitiendo validar la experiencia antes de extenderla.

- [x] Implementar primero el soporte base de datos y modelo del producto para escalas
- [x] Implementar después la carga y edición de escalas en la interfaz
- [x] Implementar luego la visualización en tarjeta y detalle
- [x] Integrar finalmente la lógica en comparaciones, historial o puntos donde realmente aporte valor
- [x] Implementar la marca visual o semántica de sospecha en el histórico
- [x] Revisar textos, etiquetas y consistencia visual en toda la experiencia
- [ ] Dejar documentadas las decisiones tomadas para futuras mecánicas como packs o promociones temporales

## FASE TESTING

### Objetivo

Validar de forma ejecutable por IA y revisable por humano que las escalas por cantidad funcionan bien en datos, interfaz y comportamiento real.

- [ ] Crear o editar un producto sin escalas y verificar que el comportamiento actual no cambie
- [x] Crear un producto con una escala desde 3 unidades y verificar que se guarde correctamente
- [x] Crear varias escalas, por ejemplo 3, 6 y 12 unidades, y verificar que se ordenen correctamente
- [ ] Intentar guardar cantidades duplicadas y verificar que el sistema lo impida
- [ ] Intentar guardar una escala para 1 unidad y verificar que el sistema la rechace
- [x] Verificar que la tarjeta siga mostrando el mejor precio base disponible para 1 unidad
- [x] Verificar que la tarjeta se destaque cuando exista una ventaja por cantidad aunque ese comercio no gane en precio base
- [ ] Verificar que una escala neutral no genere destaque visual por sí sola
- [ ] Verificar que una escala sospechosa se guarde pero quede marcada como sospechosa en el histórico
- [ ] Verificar que una escala sospechosa no genere destaque visual en la tarjeta principal
- [x] Verificar que el detalle del producto muestre las escalas en formato de lista simple
- [x] Verificar que al activar el switch el campo de precio actual pase a representar el precio base de 1 unidad
- [x] Verificar que al desactivar el switch sin haber editado escalas no aparezca confirmación
- [x] Verificar que al desactivar el switch con escalas editadas aparezca confirmación inline y permita cancelar o confirmar el borrado
- [ ] Verificar que en mesa de trabajo la tarjeta no se cierre al interactuar con el switch ni con los controles del bloque de escalas
- [ ] Verificar que historial, comparaciones u otras vistas relacionadas no queden inconsistentes cuando existan escalas
- [x] Ejecutar `npm run build` y verificar compilación exitosa sin errores

## Progreso del plan

- [x] Fase 1: Definir estructura de datos y reglas de negocio
- [x] Fase 2: Diseñar validaciones y flujo de carga
- [x] Fase 3: Definir visualización en tarjetas y detalle de producto
- [ ] Fase 4: Integrar la mecánica en cálculos y comportamiento real
- [ ] Fase 5: Implementación incremental y ajustes
- [ ] Fase Testing

Fecha de creación: 08 de Abril 2026
Fecha de última actualización: 10 de abril 2026
Estado: EN PROCESO


