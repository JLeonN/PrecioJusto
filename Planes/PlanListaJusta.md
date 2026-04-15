# PLAN LISTA JUSTA

## Descripcion del plan

Crear una nueva sección de la app llamada Lista Justa para que el usuario pueda crear y usar listas de compras de forma simple, rápida y cómoda en el día a día. La base del apartado debe funcionar primero como lista de compras real, y luego aprovechar la información de Precio Justo para potenciarla con precios, comercios y recomendaciones.

## Objetivo principal

- Incorporar la nueva sección Lista Justa en la navegación principal de la app
- Permitir crear listas de compras simples y reutilizables
- Facilitar el uso de la lista durante la compra con checks, avisos de faltantes y control de gasto
- Preparar el apartado para sumar después inteligencia de precios y comercios sin romper el flujo principal

## Reglas del plan

- Usar el nombre visible `Lista Justa` en la app
- La nueva sección debe aparecer en el drawer y en el header con los demás accesos rápidos
- El icono principal de Lista Justa debe ser `IconListDetails`
- El icono principal de Mis Productos debe actualizarse a `IconClipboardList`
- No inventar colores nuevos para esta funcionalidad; usar exclusivamente variables existentes de `Variables.css`
- Prever desde el diseño y la implementación que la app tiene modo oscuro
- Mantener prioridad móvil vertical, pero con diseño responsive para tablet y pantallas más anchas
- El flujo principal de Lista Justa debe pensarse primero como lista de compras, no como comparador de comercios
- Reutilizar componentes, modales y servicios ya existentes del proyecto siempre que ayuden a mantener consistencia
- Si cambia un precio de un producto en Mis Productos, la lista debe reflejar automáticamente ese cambio
- Si un item manual queda completo, debe incorporarse automáticamente a Mis Productos
- Si un item manual sigue incompleto, debe poder derivarse a Mesa de trabajo
- Si un item fue enviado a Mesa de trabajo, la lista debe recordar ese estado y avisar cuando luego pase a Mis Productos
- Si un item ya pasó a Mis Productos, la lista no debe volver a ofrecer enviarlo a Mesa de trabajo
- Para usar un item dentro de la lista, los datos mínimos obligatorios deben ser nombre y cantidad
- El precio debe ser opcional dentro de la lista, pero importante para el control de gasto
- Si un producto entra desde Mis Productos, la lista debe mostrar toda la información disponible sin ocultarla innecesariamente
- Si el usuario agrega un producto por escaneo, se debe conservar también el código de barras cuando exista
- Un item se considera completo para pasar automáticamente a Mis Productos solo si tiene nombre, precio, comercio, cantidad, gramos o litros, marca, código de barras y categoría
- No se deben permitir productos duplicados dentro de la misma lista
- Si el usuario intenta agregar un duplicado, la app debe mostrar una notificación breve y no volver a agregarlo
- La edición inline con icono de lápiz debe permitir ajustar solo nombre y precio; la cantidad se cambia únicamente con los botones `+` y `-`
- Las acciones destructivas de listas e items deben poder resolverse con gesto de deslizamiento hacia la izquierda
- Un deslizamiento largo hacia la izquierda debe eliminar directamente listas o items
- Antes de eliminar por swipe largo debe existir feedback visual previo claro
- El feedback previo del swipe destructivo debe mostrar fondo rojo usando la paleta existente, icono de papelera y texto breve tipo pregunta como `¿Borrar?`
- El swipe largo destructivo debe usar una interacción inspirada en patrones conocidos como Spotify: desplazamiento progresivo, feedback visual anticipado y ejecución solo al superar un umbral claro
- El botón principal para sumar artículos dentro de una lista debe ser sticky dentro del contenido
- El botón sticky debe respetar espacio de seguridad inferior para no tapar contenido ni gestos del sistema
- Las confirmaciones inline deben seguir el patrón actual del proyecto con cambio de acción a confirmar o cancelar con `X`
- Los comercios deben integrarse como una capa de apoyo al flujo principal de compra y no como requisito obligatorio para poder usar la lista
- La acción principal de reutilización debe resolverse con `Reiniciar lista`; no hace falta una acción separada de `Reutilizar`
- Los productos nuevos deben agregarse siempre arriba del todo
- El total visible en tarjetas de listas debe mostrarse como `Estimado de la lista`, `Estimado parcial` o `Sin precios` según la información disponible
- Los comercios deben mostrarse como opción colapsada y opcional, sin romper el uso simple de la lista
- Si un producto escaneado ya existe en la lista, debe tratarse como duplicado y no aumentar cantidad automáticamente
- Un precio cargado manualmente dentro de Lista Justa no debe modificar Mis Productos
- La selección de comercio actual no debe guardarse al salir de la lista

## FASE 1: Definir estructura y navegación

### Objetivo

Preparar la base de datos local, la ruta, la entrada en drawer y header, y la estructura mínima de pantallas para Lista Justa.

- [ ] Definir el modelo de datos de una lista de compras con nombre, productos, orden, estado general y metadatos mínimos reutilizables
- [ ] Definir el modelo de datos de cada item de lista con referencia opcional a producto existente, nombre visible, cantidad, precio opcional, estado comprado y banderas de datos faltantes
- [ ] Definir el estado interno de un item derivado a Mesa de trabajo y su transición posterior a Mis Productos
- [ ] Definir la lógica de detección de duplicados por referencia, código de barras o nombre normalizado según el origen del item
- [ ] Crear la nueva ruta de página para Lista Justa dentro del enrutado principal
- [ ] Agregar la nueva opción al drawer siguiendo el patrón actual de navegación
- [ ] Agregar el nuevo acceso rápido al header siguiendo el patrón actual de iconos
- [ ] Usar `IconListDetails` como icono principal de Lista Justa y actualizar Mis Productos a `IconClipboardList`
- [ ] Verificar que toda la nueva interfaz use solo colores existentes de `Variables.css` y funcione correctamente en modo oscuro

## FASE 2: Pantalla de listas del usuario

### Objetivo

Construir la primera escena donde el usuario ve sus listas guardadas o un estado vacío claro.

- [ ] Crear la pantalla principal de Lista Justa con estilo visual basado en los colores ya disponibles del proyecto
- [ ] Mostrar tarjetas de listas guardadas con nombre, cantidad de productos y señales de estimado disponible cuando corresponda
- [ ] Mostrar en cada tarjeta `Estimado de la lista` cuando haya información suficiente
- [ ] Mostrar `Estimado parcial` cuando falten precios para completar el cálculo
- [ ] Mostrar `Sin precios` cuando ningún item de la lista tenga precio
- [ ] Si la lista tiene productos sin precio, avisarlo en la tarjeta de forma clara
- [ ] Si la lista no tiene ningún producto con precio, avisarlo en la tarjeta de forma clara
- [ ] Mostrar un mensaje breve de estado vacío si no hay listas creadas
- [ ] Agregar un botón visible para crear una nueva lista aun cuando no existan listas previas
- [ ] Incluir la acción `Reiniciar lista` como base para volver a usar una lista existente sin perder sus items
- [ ] Permitir gesto de deslizamiento hacia la izquierda sobre una lista para mostrar y ejecutar la acción de eliminar
- [ ] Permitir que un deslizamiento largo elimine una lista directamente
- [ ] Mostrar feedback visual previo durante el swipe antes de ejecutar la eliminación directa de una lista

## FASE 3: Crear y editar listas

### Objetivo

Permitir que el usuario cree listas de forma simple y también pueda renombrarlas, reiniciarlas o eliminarlas después.

- [ ] Crear la interfaz de alta de lista con campo para nombre libre
- [ ] Agregar placeholder sugerente para el nombre de la lista con ejemplos variables de uso cotidiano o eventos
- [ ] Crear la lista vacía y redirigir al detalle de esa lista para empezar a cargar artículos
- [ ] Permitir editar una lista existente usando la misma interfaz de creación adaptada a modo edición
- [ ] Agregar en la edición de lista una opción para borrar la lista
- [ ] Hacer que borrar una lista desde edición use confirmación inline con el patrón actual del proyecto
- [ ] Agregar una acción `Reiniciar lista` para desmarcar checks y reutilizar la misma lista sin duplicarla
- [ ] Hacer que Reiniciar lista use confirmación inline con el patrón actual del proyecto

## FASE 4: Agregar productos a la lista

### Objetivo

Permitir que el usuario cargue productos a la lista desde distintas entradas, priorizando velocidad y consistencia con el resto de la app.

- [ ] Reutilizar el buscador actual de productos para buscar por nombre, marca, categoría o código de barras
- [ ] Agregar dentro de la lista un botón sticky siempre visible tipo `Agregar producto` que acompañe el scroll y permita sumar artículos en cualquier momento
- [ ] Reservar espacio inferior de seguridad para que el botón sticky no tape el último contenido de la lista
- [ ] Permitir agregar productos desde Mis Productos usando una tarjeta simplificada
- [ ] Permitir crear un artículo manual desde cero aunque no tenga foto ni precio
- [ ] Integrar la opción de escanear productos con Escaneo rápido
- [ ] Mantener en Escaneo rápido el flujo completo que ya existe hoy antes de agregar el producto a la lista
- [ ] Integrar la opción de escanear múltiples productos con Ráfaga
- [ ] Hacer que Ráfaga agregue productos directamente a la lista
- [ ] Guardar la cantidad como parte obligatoria del item de lista
- [ ] Agregar controles `-` y `+` dentro de la mini tarjeta para reducir o aumentar la cantidad sin abrir edición completa
- [ ] Permitir editar un item de lista aun después de agregado
- [ ] Permitir editar en la misma fila con icono de lápiz, siguiendo el patrón inline ya usado en ver historial o editar comercios
- [ ] Limitar la edición inline con lápiz a nombre y precio
- [ ] Mantener la cantidad editable solo con controles `-` y `+`
- [ ] Si un usuario intenta agregar un item repetido, mostrar notificación breve y no duplicarlo
- [ ] Permitir gesto de deslizamiento hacia la izquierda sobre un item para mostrar y ejecutar la acción de eliminar
- [ ] Permitir que un deslizamiento largo elimine un item directamente
- [ ] Mostrar feedback visual previo durante el swipe antes de ejecutar una eliminación directa

## FASE 5: Visualización y uso de la lista

### Objetivo

Hacer que la lista sea cómoda de usar dentro del supermercado mientras el usuario agrega, revisa y marca productos.

- [ ] Mostrar cada producto como mini tarjeta horizontal
- [ ] Priorizar visualmente foto, nombre y precio dentro de cada item
- [ ] Mostrar también marca, cantidad y otros datos útiles cuando existan
- [ ] Si faltan datos importantes como foto, nombre o precio, avisarlo dentro del item de forma clara
- [ ] Agregar un botón de lápiz para completar o corregir información faltante
- [ ] Hacer que la edición priorice mostrar lo que falta sin impedir editar el resto si hace falta
- [ ] Hacer que la edición inline en la misma fila permita ajustar campos rápidos sin sacar al usuario del flujo de compra
- [ ] Agregar un control visual de check a la derecha de cada item para marcarlo como comprado
- [ ] Al marcar un item como comprado, mostrar una transición suave y moverlo hacia la zona de comprados
- [ ] Mantener una breve ventana de arrepentimiento antes de dejar el item al final del bloque de comprados
- [ ] Permitir desmarcar un item comprado y devolverlo al estado pendiente
- [ ] Agregar filtro para ver pendientes, comprados o ambos
- [ ] Permitir reordenar productos manualmente dentro de la lista
- [ ] Mostrar un resumen de progreso tipo `X de Y comprados`
- [ ] Aplicar un estilo visual más gris o apagado a los items comprados sin perder legibilidad
- [ ] Mostrar un mensaje breve de estado vacío cuando la lista exista pero todavía no tenga productos

## FASE 6: Gasto y control durante la compra

### Objetivo

Dar al usuario una lectura clara de lo gastado hasta el momento y ayudarlo cuando faltan datos necesarios para calcular.

- [ ] Mostrar abajo del todo cuánto lleva gastado el usuario hasta el momento
- [ ] Calcular el gasto usando solo los productos marcados como comprados
- [ ] Si el usuario marca un producto sin precio, permitir una preferencia simple por lista para preguntar siempre, solo avisar o no volver a preguntar hasta que esa lista se reinicie
- [ ] Mostrar `total parcial` cuando existan productos comprados sin precio
- [ ] Avisar de forma visible pero no invasiva que hay productos sin precio registrado
- [ ] Mostrar un texto aclaratorio tipo estimación de precios para indicar que los valores pueden variar
- [ ] Si la lista tiene suficiente información, mostrar el total visible también en la tarjeta resumen de la lista como estimado
- [ ] Mantener cualquier precio cargado manualmente dentro de la lista sin sobrescribir los datos de Mis Productos

## FASE 7: Integración con Mesa de trabajo y Mis Productos

### Objetivo

Resolver el flujo de productos incompletos sin romper la experiencia principal de compra.

- [ ] Si un item manual queda completo, enviarlo automáticamente a Mis Productos
- [ ] Si un item manual queda incompleto, permitir derivarlo a Mesa de trabajo mediante una acción secundaria poco invasiva
- [ ] Si un item fue enviado a Mesa de trabajo, guardar ese estado dentro de la lista
- [ ] Si luego ese item pasa a Mis Productos, reflejarlo en la lista y desactivar la acción de enviar a Mesa de trabajo
- [ ] Mantener el item visible en la lista aunque haya sido derivado a Mesa de trabajo
- [ ] Verificar que si cambia un precio relacionado en Mis Productos la lista actualiza automáticamente sus importes y referencias

## FASE 8: Comercios como capa de apoyo

### Objetivo

Integrar la información de comercios sin convertirla en una barrera para usar la lista como lista de compras común.

- [ ] Agregar una opción simple cerca del total para indicar en qué comercio está comprando el usuario en ese momento
- [ ] Mantener esa opción de comercio colapsada y opcional para no ensuciar el flujo principal
- [ ] Hacer que esa selección afecte el gasto mostrado cuando exista precio asociado a ese comercio
- [ ] No guardar la selección de comercio actual al salir de la lista
- [ ] Permitir que el usuario tenga una lista común aun si no configuró comercio actual
- [ ] Si un producto no tiene precio en el comercio activo pero sí en otro, mostrar un aviso simple que lo indique
- [ ] Crear un bloque `Sin precio` para productos que no tengan precio disponible donde corresponda
- [ ] Reutilizar el modal de precio ya existente en las tarjetas de Mesa de trabajo para una futura acción `Comprobar precio`

## FASE 9: Evolución futura de recomendaciones

### Objetivo

Dejar preparado el camino para potenciar la lista con inteligencia de precios sin mezclar esa complejidad en la primera implementación.

- [ ] Dejar documentado que más adelante la app podrá recomendar dónde conviene comprar cada producto
- [ ] Dejar documentado que más adelante el usuario podrá limitar las recomendaciones a comercios elegidos por comodidad o preferencia
- [ ] Dejar documentado que más adelante la app podrá estimar ahorro si el usuario sigue la recomendación
- [ ] Evitar que esta fase futura complique o bloquee la implementación del flujo base de lista de compras

## FASE TESTING

### Objetivo

Validar de forma ejecutable por IA y revisable por humano el flujo base de Lista Justa en móvil y tablet.

- [ ] Verificar que Lista Justa aparece en drawer y header y navega correctamente
- [ ] Verificar que Mis Productos usa `IconClipboardList`
- [ ] Verificar que el estado vacío muestra mensaje breve y botón para crear lista
- [ ] Crear una lista nueva y comprobar que se guarda correctamente
- [ ] Editar una lista existente y verificar que permite cambiar nombre y borrar la lista
- [ ] Verificar que la interfaz usa solo colores existentes del proyecto y responde bien en modo oscuro
- [ ] Agregar productos desde Mis Productos, manualmente, con Escaneo rápido y con Ráfaga
- [ ] Verificar que Ráfaga agrega productos directo a la lista
- [ ] Verificar que Escaneo rápido mantiene su proceso actual antes de agregar a la lista
- [ ] Verificar que los datos mínimos obligatorios en lista son nombre y cantidad
- [ ] Verificar que el precio sigue siendo opcional para usar la lista
- [ ] Verificar que el botón `Agregar producto` queda siempre accesible dentro de la lista
- [ ] Verificar que el botón `Agregar producto` se mantiene sticky dentro del contenido
- [ ] Verificar que el botón sticky respeta espacio de seguridad inferior y no tapa contenido ni gestos del sistema
- [ ] Confirmar que la búsqueda reutilizada encuentra productos por nombre, marca, categoría y código de barras
- [ ] Verificar que los items se muestran como mini tarjetas horizontales con prioridad visual en foto, nombre y precio
- [ ] Verificar que los controles `-` y `+` ajustan cantidad sin abrir edición completa
- [ ] Verificar que el icono de lápiz permite edición inline en la misma fila
- [ ] Verificar que la edición inline con lápiz solo permite cambiar nombre y precio
- [ ] Verificar que la cantidad no se edita inline y solo cambia con `-` y `+`
- [ ] Verificar que un intento de agregar producto duplicado muestra notificación breve y no duplica el item
- [ ] Verificar que un producto escaneado repetido también se trata como duplicado y no aumenta cantidad automáticamente
- [ ] Verificar que si faltan datos importantes el item lo informa de forma clara
- [ ] Eliminar un item con gesto de deslizamiento y validar que la acción responde como se espera
- [ ] Eliminar una lista con gesto de deslizamiento y validar que la acción responde como se espera
- [ ] Verificar que un swipe largo elimina directamente items y listas
- [ ] Verificar que el swipe muestra fondo rojo, papelera y texto `¿Borrar?` usando colores existentes
- [ ] Verificar que el swipe destructivo exige un umbral claro antes de eliminar y no se dispara por gestos cortos accidentales
- [ ] Marcar y desmarcar productos como comprados y validar transición, cambio visual y reubicación
- [ ] Verificar que el progreso de compra se actualiza correctamente
- [ ] Verificar que una lista vacía muestra su mensaje y llamada a acción correspondiente
- [ ] Verificar que el total usa solo productos comprados
- [ ] Verificar que si un producto marcado no tiene precio, la app respeta la preferencia por lista entre preguntar siempre, solo avisar o no volver a preguntar hasta reiniciar la lista
- [ ] Verificar que al reiniciar la lista también se reinicia esa preferencia
- [ ] Verificar que cuando faltan precios se muestra total parcial y aviso amigable
- [ ] Verificar que la tarjeta de lista usa `Estimado de la lista`, `Estimado parcial` o `Sin precios` según corresponda
- [ ] Verificar que un precio cargado manualmente en Lista Justa no modifica Mis Productos
- [ ] Verificar que un item manual completo pasa automáticamente a Mis Productos
- [ ] Verificar que el criterio de item completo para pasar a Mis Productos exige nombre, precio, comercio, cantidad, gramos o litros, marca, código de barras y categoría
- [ ] Verificar que un item manual incompleto puede derivarse a Mesa de trabajo mediante su acción secundaria y permanece en la lista como pendiente
- [ ] Verificar que un item enviado a Mesa de trabajo conserva ese estado en la lista
- [ ] Verificar que cuando ese item pasa a Mis Productos la lista lo informa y desactiva el envío a Mesa de trabajo
- [ ] Verificar que la acción Reiniciar lista deja la lista reutilizable sin perder sus items y usa confirmación inline
- [ ] Verificar que si cambia un precio relacionado en Mis Productos la lista actualiza automáticamente sus importes y referencias
- [ ] Verificar que la selección de comercio actual se pierde al salir de la lista
- [ ] Verificar que la interfaz responde correctamente en móvil vertical y en tablet

## Progreso del plan

- [ ] Fase 1: Definir estructura y navegación
- [ ] Fase 2: Pantalla de listas del usuario
- [ ] Fase 3: Crear y editar listas
- [ ] Fase 4: Agregar productos a la lista
- [ ] Fase 5: Visualización y uso de la lista
- [ ] Fase 6: Gasto y control durante la compra
- [ ] Fase 7: Integración con Mesa de trabajo y Mis Productos
- [ ] Fase 8: Comercios como capa de apoyo
- [ ] Fase 9: Evolución futura de recomendaciones
- [ ] Fase Testing

Fecha de creacion: 11 de Abril 2026
Fecha de ultima actualizacion: 15 de Abril 2026
Estado: BORRADOR
