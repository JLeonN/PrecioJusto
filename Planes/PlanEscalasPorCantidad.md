# PLAN ESCALAS POR CANTIDAD

## Descripcion del plan

Definir e implementar una mecanica de precios por cantidad dentro del producto actual, manteniendo el precio base existente como referencia principal y agregando escalas editables para casos mayoristas o compras por volumen.

## Objetivo principal

- Mantener el precio base actual sin romper la logica existente
- Agregar escalas por cantidad como una capacidad opcional por producto
- Mostrar en la interfaz cuando un producto mejora su precio al comprar mas unidades
- Preparar la base para que la mecanica impacte tambien en calculos, historial y otras areas relacionadas

## Reglas del plan

- El precio base actual sigue siendo el precio principal del producto
- No se permite crear una escala para 1 unidad porque ese caso ya corresponde al precio base
- Las escalas deben vivir dentro del mismo producto y no en una entidad separada
- Las escalas deben ordenarse automaticamente por cantidad minima
- No se deben permitir escalas duplicadas ni configuraciones inconsistentes
- El detalle de escalas debe mostrarse en formato de lista simple
- El texto visible para activar esta mecanica debe ser `Activar precios mayoristas`
- El campo de precio existente debe reutilizarse como precio base de 1 unidad y no debe desaparecer al activar el switch
- El bloque de escalas debe comportarse como una pieza reutilizable en todos los formularios y modales donde se carguen precios
- Todo despliegue, expansion o reacomodo visual asociado a esta mecanica debe usar transiciones suaves y claras

## FASE 1: Definir estructura de datos y reglas de negocio

### Objetivo

Cerrar la estructura minima de datos y las reglas operativas para soportar escalas por cantidad sin mezclar esta mecanica con packs ni promociones temporales.

- [ ] Definir la estructura de `escalasPorCantidad` dentro del producto
- [ ] Confirmar los campos minimos de cada escala, incluyendo `cantidadMinima` y `precioUnitario`
- [ ] Establecer que la cantidad minima permitida para una escala sea 2 o mayor
- [ ] Definir como se interpreta la escala activa segun la cantidad comprada
- [ ] Confirmar como se resuelve la prioridad entre precio base y escalas durante calculos y visualizacion
- [ ] Dejar fuera de este plan cualquier logica de packs o promociones temporales

## FASE 2: Diseñar validaciones y flujo de carga

### Objetivo

Definir como el usuario crea, edita y corrige escalas por cantidad dentro del flujo actual del producto.

- [ ] Definir si el formulario del producto usara un switch o check para habilitar escalas por cantidad
- [ ] Reutilizar el texto `Activar precios mayoristas` en todos los puntos donde se active esta mecanica
- [ ] Diseñar el bloque desplegable de escalas para no sobrecargar el formulario principal
- [ ] Reutilizar el mismo bloque de escalas en Agregar manual, Escaneo rapido, modal de Agregar precio y mesa de trabajo
- [ ] Mantener visible el campo de precio existente y relabelarlo como precio base de 1 unidad cuando el switch este activo
- [ ] Establecer como agregar, editar y eliminar filas de escalas
- [ ] Crear la primera fila sugerida con cantidad minima 3 cuando el usuario active el switch
- [ ] Permitir agregar mas escalones con un boton `+` y ajustar la cantidad minima con controles claros
- [ ] Permitir eliminar escalones individuales
- [ ] Validar que no se puedan repetir cantidades minimas
- [ ] Validar que no se puedan guardar escalas con cantidad menor a 2
- [ ] Validar que no se puedan guardar precios vacios, invalidos o inconsistentes
- [ ] Confirmar si debe advertirse cuando una escala no mejora el precio base o una escala anterior
- [ ] Implementar confirmacion inline al desactivar el switch solo si el usuario ya edito escalas
- [ ] Hacer que la confirmacion inline siga la misma logica visual de confirmar o cancelar ya usada al borrar tarjetas en mesa de trabajo

## FASE 3: Definir visualizacion en tarjetas y detalle de producto

### Objetivo

Resolver como se informa en la interfaz que un producto tiene mejor precio por cantidad sin perder claridad en el precio base.

- [ ] Mantener el precio base siempre visible en la tarjeta del producto
- [ ] Definir un indicador visual breve para productos con escalas convenientes
- [ ] Evaluar el uso de color, badge o destaque sutil sin recurrir a animaciones invasivas
- [ ] Definir un texto corto de apoyo, por ejemplo desde cuantas unidades mejora el precio
- [ ] Definir donde se muestra el detalle de escalas dentro del producto
- [ ] Mostrar el detalle de escalas en una lista simple y legible en movil
- [ ] Hacer que la aparicion del bloque de precios mayoristas tenga una expansion suave y sin saltos bruscos del layout
- [ ] Proteger la interaccion del switch, inputs y controles de escalas para que la tarjeta de mesa de trabajo no se cierre al tocarlos

## FASE 4: Integrar la mecanica en calculos y comportamiento real

### Objetivo

Definir como las escalas impactan en el resto del sistema para que no queden solo como informacion visual.

- [ ] Identificar en que partes del flujo actual se calcula o usa el precio del producto
- [ ] Definir como aplicar la escala correcta segun la cantidad seleccionada o comparada
- [ ] Confirmar si la mecanica afecta comparaciones, historial y otras vistas relacionadas
- [ ] Definir como guardar o reflejar que un precio aplicado provino de una escala por cantidad
- [ ] Revisar si hace falta agregar datos auxiliares para auditoria o trazabilidad futura
- [ ] Detectar areas del sistema que puedan romperse si el producto empieza a tener escalas

## FASE 5: Implementacion incremental y ajustes

### Objetivo

Ejecutar la mecanica por etapas, reduciendo riesgo y permitiendo validar la experiencia antes de extenderla.

- [ ] Implementar primero el soporte base de datos y modelo del producto para escalas
- [ ] Implementar despues la carga y edicion de escalas en la interfaz
- [ ] Implementar luego la visualizacion en tarjeta y detalle
- [ ] Integrar finalmente la logica de calculo donde corresponda
- [ ] Revisar textos, etiquetas y consistencia visual en toda la experiencia
- [ ] Dejar documentadas las decisiones tomadas para futuras mecanicas como packs o promociones temporales

## FASE TESTING

### Objetivo

Validar de forma ejecutable por IA y revisable por humano que las escalas por cantidad funcionan bien en datos, interfaz y comportamiento real.

- [ ] Crear o editar un producto sin escalas y verificar que el comportamiento actual no cambie
- [ ] Crear un producto con una escala desde 3 unidades y verificar que se guarde correctamente
- [ ] Crear varias escalas, por ejemplo 3, 6 y 12 unidades, y verificar que se ordenen correctamente
- [ ] Intentar guardar cantidades duplicadas y verificar que el sistema lo impida
- [ ] Intentar guardar una escala para 1 unidad y verificar que el sistema la rechace
- [ ] Verificar que la tarjeta destaque el producto cuando exista una escala conveniente
- [ ] Verificar que el detalle del producto muestre las escalas en formato de lista simple
- [ ] Verificar que al activar el switch el campo de precio actual pase a representar el precio base de 1 unidad
- [ ] Verificar que al desactivar el switch sin haber editado escalas no aparezca confirmacion
- [ ] Verificar que al desactivar el switch con escalas editadas aparezca confirmacion inline y permita cancelar o confirmar el borrado
- [ ] Verificar que en mesa de trabajo la tarjeta no se cierre al interactuar con el switch ni con los controles del bloque de escalas
- [ ] Verificar que el sistema aplique la escala correcta segun la cantidad cuando la logica funcional quede integrada
- [ ] Verificar que historial, comparaciones u otras vistas relacionadas no queden inconsistentes cuando existan escalas

## Progreso del plan

- [ ] Fase 1: Definir estructura de datos y reglas de negocio
- [ ] Fase 2: Diseñar validaciones y flujo de carga
- [ ] Fase 3: Definir visualizacion en tarjetas y detalle de producto
- [ ] Fase 4: Integrar la mecanica en calculos y comportamiento real
- [ ] Fase 5: Implementacion incremental y ajustes
- [ ] Fase Testing

Fecha de creacion: 08 de Abril 2026
Fecha de ultima actualizacion: 08 de Abril 2026
Estado: BORRADOR
