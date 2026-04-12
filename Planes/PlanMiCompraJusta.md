# PLAN MI COMPRA JUSTA

## Descripcion del plan

Crear una nueva sección de la app llamada Mi Compra Justa para que el usuario pueda crear y gestionar listas de compras, elegir uno o más supermercados por lista, agregar productos desde Mis Productos o desde cero, marcar productos como comprados mientras está en el comercio y ver un total parcial o final según los precios disponibles.

## Objetivo principal

- Incorporar la nueva sección Mi Compra Justa en la navegación principal de la app
- Permitir crear listas reutilizables con supermercados asociados y productos editables
- Facilitar el uso de la lista durante la compra con checks, progreso y total de gasto

## Reglas del plan

- Usar el nombre visible `Mi Compra Justa` en la app
- La nueva sección debe aparecer en el drawer y en el header con los demás accesos rápidos
- Usar la línea visual verde de `Variables.css` con `--color-secundario` y `--color-secundario-oscuro`
- Mantener prioridad móvil vertical, pero con diseño responsive para tablet y pantallas más anchas
- Reutilizar la búsqueda actual de productos alineada con Mis Productos
- Permitir crear productos de lista desde Mis Productos o manualmente desde cero
- Guardar los supermercados seleccionados dentro de cada lista
- Si un comercio no existe, abrir el flujo de Agregar Comercio Rápido y guardarlo también en Mis Comercios
- El total de gasto visible dentro de la lista debe calcularse solo con productos marcados como comprados y usando el comercio seleccionado por el usuario
- Si faltan precios, mostrar total parcial y avisos amigables sin interrumpir el flujo
- Si un item manual queda completo, debe incorporarse automáticamente a Mis Productos
- Si un item manual sigue incompleto, debe poder derivarse a Mesa de trabajo
- Las acciones destructivas de listas e items deben poder resolverse con gesto de deslizamiento hacia la izquierda
- Un deslizamiento largo hacia la izquierda debe eliminar directamente listas o items
- Antes de eliminar por swipe largo debe existir feedback visual previo claro
- El botón principal para sumar artículos dentro de una lista debe ser sticky dentro del contenido
- El botón sticky debe respetar espacio de seguridad inferior para no tapar contenido ni gestos del sistema
- Las confirmaciones inline deben seguir el patrón actual del proyecto con cambio de acción a confirmar o cancelar con `X`
- Un item se considera completo solo si tiene nombre, precio, comercio, cantidad, gramos o litros, marca, código de barras y categoría
- Las tarjetas de listas deben mostrar hasta 3 comercios de forma visible y, si hay más, permitir scroll táctil interno sin barra nativa visible
- El icono principal de Mi Compra Justa debe ser `IconListDetails`
- El icono principal de Mis Productos debe actualizarse a `IconClipboardList`
- El swipe largo destructivo debe usar una interacción inspirada en patrones conocidos como Spotify: desplazamiento progresivo, feedback visual anticipado y ejecución solo al superar un umbral claro

## FASE 1: Definir estructura y navegación

### Objetivo

Preparar la base de datos local, la ruta, la entrada en drawer y header, y la estructura mínima de pantallas para Mi Compra Justa.

- [ ] Definir el modelo de datos de una lista de compras con nombre, supermercados seleccionados, productos, orden y estado general
- [ ] Definir el modelo de datos de cada item de lista con referencia opcional a producto existente, nombre visible, cantidad, estado comprado y campos faltantes relevantes
- [ ] Crear la nueva ruta de página para Mi Compra Justa dentro del enrutado principal
- [ ] Agregar la nueva opción al drawer siguiendo el patrón actual de navegación
- [ ] Agregar el nuevo acceso rápido al header siguiendo el patrón actual de iconos
- [ ] Usar `IconListDetails` como icono principal de Mi Compra Justa y mantener consistencia con el resto de la app
- [ ] Actualizar Mis Productos para usar `IconClipboardList` y mantener coherencia entre accesos principales

## FASE 2: Pantalla de listas del usuario

### Objetivo

Construir la primera escena donde el usuario ve sus listas guardadas o un estado vacío claro.

- [ ] Crear la pantalla principal de Mi Compra Justa con estilo visual basado en los colores verdes ya disponibles
- [ ] Mostrar tarjetas de listas guardadas con nombre, precio total visible cuando exista, cantidad de productos y cantidad de comercios
- [ ] Mostrar en cada tarjeta los comercios elegidos con nombre y dirección en tamaño secundario
- [ ] Limitar la vista directa a un máximo de 3 comercios por tarjeta y permitir scroll táctil interno si hay más
- [ ] Si la lista tiene productos sin precio, avisarlo en la tarjeta de forma clara
- [ ] Si la lista no tiene ningún producto con precio, avisarlo en la tarjeta de forma clara
- [ ] Mostrar un mensaje breve de estado vacío si no hay listas creadas
- [ ] Agregar un botón visible para crear una nueva lista aun cuando no existan listas previas
- [ ] Incluir la acción `Reutilizar` en cada lista como base para recrear una lista más adelante cambiando comercios
- [ ] Permitir gesto de deslizamiento hacia la izquierda sobre una lista para mostrar y ejecutar la acción de eliminar
- [ ] Permitir que un deslizamiento largo elimine una lista directamente
- [ ] Mostrar feedback visual previo durante el swipe antes de ejecutar la eliminación directa de una lista
- [ ] Implementar el swipe destructivo con desplazamiento progresivo y umbral claro, siguiendo una referencia de interacción tipo Spotify adaptada al estilo del proyecto
- [ ] Dejar preparada la pantalla para sumar más metadatos en otra iteración sin romper la estructura

## FASE 3: Crear lista nueva

### Objetivo

Permitir que el usuario cree una lista de forma simple antes de empezar a cargar productos.

- [ ] Crear la interfaz de alta de lista con campo para nombre libre
- [ ] Agregar placeholder sugerente para el nombre de la lista con ejemplos variables de uso cotidiano o eventos
- [ ] Permitir seleccionar uno o más supermercados guardados para la lista
- [ ] Detectar cuando el usuario necesita un comercio que no existe en sus guardados
- [ ] Abrir el modal de Agregar Comercio Rápido cuando el comercio no exista y continuar el flujo al terminar
- [ ] Guardar el comercio nuevo en Mis Comercios y permitir seleccionarlo en la lista en creación
- [ ] Crear la lista vacía y redirigir al detalle de esa lista para empezar a cargar artículos
- [ ] Permitir editar una lista existente usando la misma interfaz de creación adaptada a modo edición
- [ ] Agregar en la edición de lista una opción para borrar la lista

## FASE 4: Agregar y editar productos dentro de la lista

### Objetivo

Permitir que el usuario complete la lista con productos existentes o manuales sin trabar el flujo.

- [ ] Reutilizar el buscador actual de productos para buscar por nombre, marca, categoría o código de barras
- [ ] Agregar dentro de la lista un botón sticky siempre visible tipo `Agregar producto` que acompañe el scroll y permita sumar artículos en cualquier momento
- [ ] Reservar espacio inferior de seguridad para que el botón sticky no tape el último contenido de la lista
- [ ] Permitir agregar productos desde Mis Productos usando una tarjeta simplificada con nombre, foto y acción de carrito
- [ ] Permitir crear un artículo manual desde cero aunque no tenga foto ni precio
- [ ] Guardar la cantidad como parte obligatoria del item de lista
- [ ] Permitir editar un item de lista aun después de agregado
- [ ] Permitir gesto de deslizamiento hacia la izquierda sobre un item para mostrar y ejecutar la acción de eliminar
- [ ] Permitir que un deslizamiento largo elimine un item directamente
- [ ] Mostrar feedback visual previo durante el swipe antes de ejecutar una eliminación directa
- [ ] Implementar el swipe destructivo con desplazamiento progresivo y umbral claro, siguiendo una referencia de interacción tipo Spotify adaptada al estilo del proyecto
- [ ] Si faltan datos útiles como precio, marca, gramos, litros o foto, mostrar un aviso amigable dentro del item
- [ ] Agregar un botón de lápiz para completar o corregir información faltante
- [ ] Hacer que la edición priorice mostrar lo que falta sin impedir editar el resto si hace falta
- [ ] Si un item manual queda completo, enviarlo automáticamente a Mis Productos
- [ ] Considerar un item manual como completo solo si tiene nombre, precio, comercio, cantidad, gramos o litros, marca, código de barras y categoría
- [ ] Si un item manual queda incompleto, permitir derivarlo a Mesa de trabajo mediante una acción secundaria poco invasiva

## FASE 5: Uso de la lista durante la compra

### Objetivo

Hacer que la lista sea cómoda de usar dentro del supermercado mientras el usuario va cargando productos al carrito.

- [ ] Agregar un control visual de check a la derecha de cada item para marcarlo como comprado
- [ ] Al marcar un item como comprado, mostrar una transición suave y moverlo hacia la zona de comprados
- [ ] Mantener una breve ventana de arrepentimiento antes de dejar el item al final del bloque de comprados
- [ ] Permitir desmarcar un item comprado y devolverlo al estado pendiente
- [ ] Agregar filtro para ver pendientes, comprados o ambos
- [ ] Permitir reordenar productos manualmente dentro de la lista
- [ ] Mostrar un resumen de progreso tipo `X de Y comprados`
- [ ] Aplicar un estilo visual más gris o apagado a los items comprados sin perder legibilidad
- [ ] Mostrar un mensaje breve de estado vacío cuando la lista exista pero todavía no tenga productos

## FASE 6: Totales y mensajes de apoyo

### Objetivo

Dar al usuario una lectura clara de cuánto gastó y qué parte del cálculo está incompleta.

- [ ] Permitir seleccionar el comercio activo sobre el que se calcula el gasto dentro de la lista usando chips visibles en la parte superior
- [ ] Calcular el total usando solo los productos marcados como comprados
- [ ] Usar el último precio registrado del producto en el comercio seleccionado
- [ ] Excluir del total los productos sin precio disponible
- [ ] Mostrar `total parcial` cuando existan productos comprados sin precio
- [ ] Avisar de forma visible pero no invasiva que hay productos sin precio registrado
- [ ] Si un producto no tiene precio en el comercio activo pero sí en otro comercio de la lista, mostrar un mensaje que lo indique
- [ ] Mostrar un texto aclaratorio tipo estimación de precios para indicar que los valores pueden variar
- [ ] Agregar una acción `Reiniciar compra` para desmarcar checks y reutilizar la misma lista sin duplicarla
- [ ] Si la lista tiene un solo comercio seleccionado, mostrar en la tarjeta de lista el precio total de ese comercio
- [ ] Si la lista tiene dos o más comercios seleccionados, mostrar junto a cada nombre de comercio su precio correspondiente dentro de la tarjeta de lista
- [ ] Hacer que Reiniciar compra use confirmación inline con el patrón actual del proyecto

## FASE 7: Reutilizar lista

### Objetivo

Preparar una forma rápida de volver a usar una lista anterior adaptándola a una nueva compra.

- [ ] Definir la acción `Reutilizar` desde la vista de listas guardadas
- [ ] Crear un flujo para copiar estructura y productos de una lista existente
- [ ] Permitir cambiar los comercios asociados durante la reutilización
- [ ] Reiniciar el estado de comprado de todos los items en la nueva lista reutilizada
- [ ] Confirmar que la nueva lista reutilizada no modifique la lista original
- [ ] Hacer que borrar una lista desde edición use confirmación inline con el patrón actual del proyecto

## FASE TESTING

### Objetivo

Validar de forma ejecutable por IA y revisable por humano el flujo base de listas de compra en móvil y tablet.

- [ ] Verificar que Mi Compra Justa aparece en drawer y header y navega correctamente
- [ ] Verificar que el estado vacío muestra mensaje breve y botón para crear lista
- [ ] Crear una lista nueva con uno o más supermercados y comprobar que se guarda correctamente
- [ ] Editar una lista existente y verificar que permite cambiar nombre, comercios y borrar la lista
- [ ] Intentar agregar un comercio no existente y validar que se abre Agregar Comercio Rápido y luego queda disponible
- [ ] Agregar productos desde Mis Productos y también crear al menos un item manual desde cero
- [ ] Verificar que el botón `Agregar producto` queda siempre accesible dentro de la lista
- [ ] Verificar que el botón `Agregar producto` se mantiene sticky dentro del contenido
- [ ] Verificar que el botón sticky respeta espacio de seguridad inferior y no tapa contenido ni gestos del sistema
- [ ] Confirmar que la búsqueda reutilizada encuentra productos por nombre, marca, categoría y código de barras
- [ ] Eliminar un item con gesto de deslizamiento y validar que la acción responde como se espera
- [ ] Eliminar una lista con gesto de deslizamiento y validar que la acción responde como se espera
- [ ] Verificar que un swipe largo elimina directamente items y listas
- [ ] Verificar que el swipe muestra feedback visual previo antes de eliminar
- [ ] Verificar que el swipe destructivo exige un umbral claro antes de eliminar y no se dispara por gestos cortos accidentales
- [ ] Marcar y desmarcar productos como comprados y validar transición, cambio visual y reubicación
- [ ] Verificar que el progreso de compra se actualiza correctamente
- [ ] Verificar que una lista vacía muestra su mensaje y llamada a acción correspondiente
- [ ] Verificar que el total usa solo productos comprados del comercio seleccionado
- [ ] Verificar que el selector de comercio activo se muestra arriba en formato chip
- [ ] Verificar que la tarjeta de lista muestra un único total si hay un solo comercio y un total por comercio si hay varios
- [ ] Verificar que la tarjeta muestra hasta 3 comercios visibles y permite scroll táctil interno si hay más
- [ ] Verificar que cuando faltan precios se muestra total parcial y aviso amigable
- [ ] Verificar que cuando un producto no tiene precio en el comercio activo pero sí en otro se informa correctamente
- [ ] Verificar que un item manual completo pasa automáticamente a Mis Productos
- [ ] Verificar que el criterio de item completo exige nombre, precio, comercio, cantidad, gramos o litros, marca, código de barras y categoría
- [ ] Verificar que un item manual incompleto puede derivarse a Mesa de trabajo mediante su acción secundaria
- [ ] Verificar que la acción Reiniciar compra deja la lista reutilizable sin perder sus items y usa confirmación inline
- [ ] Verificar que la acción Reutilizar crea una nueva lista sin alterar la original
- [ ] Verificar que la interfaz responde correctamente en móvil vertical y en tablet sin depender de columnas fijas por supermercado

## Progreso del plan

- [ ] Fase 1: Definir estructura y navegación
- [ ] Fase 2: Pantalla de listas del usuario
- [ ] Fase 3: Crear lista nueva
- [ ] Fase 4: Agregar y editar productos dentro de la lista
- [ ] Fase 5: Uso de la lista durante la compra
- [ ] Fase 6: Totales y mensajes de apoyo
- [ ] Fase 7: Reutilizar lista
- [ ] Fase Testing

Fecha de creacion: 11 de Abril 2026
Fecha de ultima actualizacion: 12 de Abril 2026
Estado: BORRADOR
