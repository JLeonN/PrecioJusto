# PLAN RESUMEN DE PRECIOS LISTA JUSTA

## Descripcion del plan

Ordenar y corregir el resumen de precios mostrado en las tarjetas de Lista Justa para que sea consistente con el detalle de cada lista. El resumen debe respetar el comercio seleccionado, no usar precios globales cuando la lista tiene un comercio definido y no mostrar estimados cuando la lista todavia no tiene comercio.

## Objetivo principal

- Unificar la regla de calculo de precios entre el listado de listas y el detalle de lista.
- Mostrar un bloque visual claro para total, estado del calculo y precios faltantes.
- Evitar estimados engañosos cuando no hay comercio seleccionado.

## Reglas del plan

- Si una lista tiene comercio por defecto, calcular el total solo con precios de ese comercio y direccion cuando corresponda.
- Si un producto no tiene precio en el comercio de la lista, no reemplazarlo por el mejor precio global.
- Si la lista tiene comercio pero no direccion, aceptar precios de cualquier direccion de ese comercio, igual que hace el detalle actual.
- Si un item es manual o usa precios locales, usar su `precioManual` solo cuando la lista tenga comercio seleccionado.
- Si faltan precios, mostrar aviso amarillo indicando que el total es parcial.
- Si la lista no tiene comercio por defecto, mostrar total $0 y un mensaje para agregar comercio.
- No usar `producto.precioMejor` para el resumen de tarjetas de Lista Justa.
- Mantener nombres en español y respetar los patrones actuales del modulo Lista Justa.

## FASE 1: Revisar calculos actuales

### Objetivo

Identificar todas las reglas actuales de precio para decidir que logica debe quedar como fuente unica.

- [ ] Revisar `estimadoLista` en `src/almacenamiento/stores/ListaJustaStore.js`.
- [ ] Revisar `precioVisualDetallado`, `resolverPrecioProducto` y filtros por comercio en `src/pages/ListaJusta/DetalleListaJustaPage.vue`.
- [ ] Revisar `resolverPrecioProductoPorComercio` en `src/utils/ListaJustaInteligenteUtils.js` y confirmar si sirve tal cual o si hay que ajustarlo para coincidir con el detalle.
- [ ] Confirmar como se guarda `comercioActual` en cada lista.
- [ ] Confirmar como se comportan los items manuales y los items con `usaPreciosLocales`.
- [ ] Detectar si la logica de precios debe quedar en un helper reutilizable en `src/utils` antes que duplicarse en la pagina.

## FASE 2: Crear resumen unico de precios

### Objetivo

Construir una funcion unica que devuelva un resumen completo y honesto para usar en el listado.

- [ ] Crear o adaptar una funcion que reciba una lista y devuelva total, estado, productos con precio y productos sin precio.
- [ ] Soportar estado `sinComercio` con total 0 y mensaje para elegir comercio.
- [ ] Soportar estado `parcial` cuando faltan precios del comercio seleccionado.
- [ ] Soportar estado `completo` cuando todos los productos tienen precio en el comercio seleccionado.
- [ ] Resolver productos de Mis Productos con precios filtrados por `lista.comercioActual`.
- [ ] Resolver items manuales con `precioManual` solo si hay comercio seleccionado.
- [ ] Mantener la misma regla de direccion que el detalle: si hay `direccionId`, filtrar por direccion; si no hay `direccionId`, aceptar cualquier precio del comercio.
- [ ] Evitar usar `producto.precioMejor` como reemplazo en el resumen.
- [ ] Reemplazar el uso de `listaJustaStore.estimadoLista(lista)` en `src/pages/ListaJusta/ListaJustaPage.vue` por el nuevo resumen.

## FASE 3: Rediseñar bloque de precios

### Objetivo

Agrupar los datos de precio en un recuadro dentro de cada tarjeta para que se entienda que toda esa informacion pertenece al estimado.

- [ ] Reemplazar la fila simple de estimado por un bloque visual de resumen de precios.
- [ ] Mostrar etiqueta principal, monto y estado del calculo dentro del mismo bloque.
- [ ] Mostrar contador del tipo `8 de 13 productos con precio` cuando aplique.
- [ ] Mostrar mensaje amarillo `Faltan precios para completar el total.` cuando el total sea parcial.
- [ ] Mostrar mensaje de accion cuando falte comercio, por ejemplo `Agrega un comercio para calcular el estimado.`.
- [ ] Mostrar el nombre del comercio cuando el estado sea completo o parcial, por ejemplo `Estimado en Nombre del comercio`.
- [ ] Mantener el diseño compacto para que las tarjetas no crezcan demasiado.

## FASE 4: Ajustar textos y estados

### Objetivo

Dejar textos claros para cada caso sin que parezcan errores falsos.

- [ ] Definir texto para lista sin comercio.
- [ ] Definir texto para lista con comercio y precios completos.
- [ ] Definir texto para lista con comercio y precios parciales.
- [ ] Definir texto para lista vacia o sin productos con precio.
- [ ] Definir texto para lista con comercio seleccionado pero sin ningun producto con precio en ese comercio.
- [ ] Validar que el aviso amarillo solo aparezca cuando realmente falten precios.

## FASE TESTING

### Objetivo

Validar que el listado de Lista Justa muestre importes consistentes y entendibles.

- [ ] Probar una lista sin comercio y verificar que muestra $0 con mensaje para agregar comercio.
- [ ] Probar una lista con comercio y todos los productos con precio en ese comercio.
- [ ] Probar una lista con comercio y algunos productos sin precio en ese comercio.
- [ ] Probar una lista con comercio donde el producto tenga precio global pero no precio para ese comercio.
- [ ] Probar una lista con comercio sin direccion y confirmar que acepta precios de cualquier direccion del mismo comercio.
- [ ] Probar una lista con comercio y direccion y confirmar que solo acepta precios de esa direccion.
- [ ] Probar un item manual con `precioManual` dentro de una lista con comercio.
- [ ] Probar una lista sin comercio que tenga items manuales con precio y confirmar que igualmente muestra $0.
- [ ] Comparar el total del listado contra lo que muestra el detalle de la misma lista.
- [ ] Comparar los avisos del listado contra el detalle cuando falten precios.
- [ ] Ejecutar `npm run lint`.

## Progreso del plan

- [ ] Fase 1: Revisar calculos actuales
- [ ] Fase 2: Crear resumen unico de precios
- [ ] Fase 3: Rediseñar bloque de precios
- [ ] Fase 4: Ajustar textos y estados
- [ ] Fase Testing

Fecha de creacion: 8 de Julio 2026
Fecha de ultima actualizacion: 8 de Julio 2026
Estado: BORRADOR
