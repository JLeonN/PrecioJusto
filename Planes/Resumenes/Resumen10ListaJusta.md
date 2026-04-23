# RESUMEN 10 - LISTA JUSTA

## PROPÓSITO

`Lista Justa` es la sección de listas de compras de Precio Justo. Su objetivo es acompañar el uso real en el supermercado sin obligar al usuario a completar todos los datos desde el principio. La prioridad es que la lista sea rápida de usar, clara en móvil y capaz de aprovechar el resto del ecosistema de la app cuando hay más información disponible.

---

## ESTADO ACTUAL

- La sección está disponible en `/lista-justa`
- Tiene vista de listas y vista de detalle por lista
- Se integra en header y drawer como acceso principal
- Usa persistencia local con `ListaJustaService` + `ListaJustaStore`
- Permite agregar artículos desde `Mis Productos` y también manualmente
- Soporta selección múltiple al agregar desde `Mis Productos`
- Soporta edición inline de nombre y precio
- Soporta control de cantidad con botones `-` y `+`
- Soporta check de comprado, filtros y resumen de gasto
- Puede usar comercio actual como contexto opcional de compra
- Puede derivar artículos a Mesa de trabajo y reflejar luego su paso a Mis Productos
- Ya maneja precios mayoristas por cantidad dentro de la lista

---

## ARCHIVOS PRINCIPALES

### PÁGINAS

- `src/pages/ListaJusta/ListaJustaPage.vue`
- `src/pages/ListaJusta/DetalleListaJustaPage.vue`

### ESTADO Y PERSISTENCIA

- `src/almacenamiento/stores/ListaJustaStore.js`
- `src/almacenamiento/servicios/ListaJustaService.js`

### COMPONENTES Y REUTILIZACIÓN

- `src/components/Compartidos/BotonAccionSticky.vue`
- `src/components/Compartidos/SelectorComercioDireccion.vue`
- `src/components/Formularios/FormularioProducto.vue`
- `src/components/Formularios/FormularioPrecio.vue`
- `src/components/Formularios/BloqueEscalasCantidad.vue`
- `src/components/Formularios/Dialogos/DialogoResultadosBusqueda.vue`
- `src/components/Scanner/EscaneadorCodigo.vue`

### INTEGRACIONES RELACIONADAS

- `src/layouts/MainLayout.vue`
- `src/router/routes.js`
- `src/almacenamiento/stores/productosStore.js`
- `src/almacenamiento/stores/sesionEscaneoStore.js`
- `src/almacenamiento/stores/preferenciasStore.js`

---

## MODELO DE DATOS

### Lista

Cada lista se persiste bajo la clave `lista_justa` y usa esta estructura base:

```javascript
{
  id: string,
  nombre: string,
  orden: number,
  estadoGeneral: 'activa',
  preferenciaPrecioFaltante: 'preguntar' | 'avisar' | 'nunca',
  fechaCreacion: string,
  fechaActualizacion: string,
  fechaUltimoUso: string,
  comercioActual: null | {
    id: string,
    nombre: string,
    direccionId: string,
    direccionNombre: string
  },
  items: [],
  metadatos: {
    version: 1
  }
}
```

### Item de Lista Justa

```javascript
{
  id: string,
  productoId: string | null,
  origen: 'manual' | 'misProductos',
  nombre: string,
  cantidad: number,
  precioManual: number | null,
  moneda: string,
  comprado: boolean,
  codigoBarras: string | null,
  marca: string | null,
  categoria: string | null,
  gramosOLitros: string | null,
  comercio: string | null,
  unidad: string,
  imagen: string | null,
  usaPreciosLocales: boolean,
  activarPreciosMayoristas: boolean,
  escalasPorCantidad: Array,
  estadoDerivacion: 'ninguno' | 'enMesa' | 'enMisProductos',
  mesaTrabajoItemId: string | null,
  creadoEn: string,
  actualizadoEn: string,
  origenEscaneo: string | null,
  advertencias: {
    sinNombre: boolean,
    sinPrecio: boolean
  }
}
```

### Reglas importantes del modelo

- El mínimo real para agregar un item es `nombre` y una `cantidad` válida
- Si la cantidad no es válida, se normaliza a `1`
- El precio es opcional dentro de la lista
- Los duplicados se frenan por `productoId` o `codigoBarras`
- No se usa nombre parecido como criterio de duplicado
- `comercioActual` vive en la lista, se persiste en storage y se limpia al reiniciar la lista
- `precioManual` dentro de Lista Justa no debe sobrescribir los precios de `Mis Productos`

---

## FLUJO DE LISTAS

### ListaJustaPage.vue

Pantalla principal de listas guardadas.

#### Lo que resuelve

- Muestra estado vacío con CTA claro
- Lista tarjetas ordenadas por último uso
- Permite crear una lista nueva
- Permite editar nombre de una lista existente
- Permite reiniciar una lista
- Permite borrar una lista con swipe
- Muestra estimado resumido por lista
- Muestra resumen del comercio actual si la lista tiene uno asignado

#### Datos visibles en cada tarjeta

- Nombre de la lista
- Cantidad de productos
- Etiqueta de total:
  - `Estimado de la lista`
  - `Estimado parcial`
  - `Sin precios`
- Comercio actual resumido si existe

#### Interacciones clave

- `Abrir` navega a `/lista-justa/:id`
- `Reiniciar` desmarca checks, reinicia preferencia de precio faltante y limpia `comercioActual`
- Swipe a la izquierda elimina la lista

---

## FLUJO DE DETALLE

### DetalleListaJustaPage.vue

Es la pantalla operativa de compra.

#### Lo que ya resuelve

- Encabezado con progreso de compra
- Filtro por estado: pendientes, comprados o ambos
- Bloque colapsable de `Comercio actual (opcional)`
- Lista de items con swipe para borrar
- Edición inline de nombre y precio
- Soporte de moneda y precios mayoristas
- Controles de cantidad visibles sin entrar a edición
- Check de comprado por item
- Resumen de total comprado
- Banner cuando faltan precios
- Banner cuando hay mezcla de monedas
- Botón sticky para agregar productos

### Qué puede pasar con cada item

- Ajustar cantidad con `-` y `+`
- Editar nombre y precio en línea
- Restaurar el precio original si el item viene de `Mis Productos`
- Marcar o desmarcar como comprado
- Ver subtotales por cantidad
- Expandir detalle de escalas mayoristas
- Enviar a Mesa de trabajo cuando corresponde

---

## ALTA DE ARTÍCULOS

### Desde Mis Productos

- Usa selección múltiple dentro del diálogo
- Cada producto puede llevar cantidad independiente
- Si hay duplicados, no se agregan
- El diálogo muestra un total resumido de la selección
- El precio base toma la referencia actual del producto

### Manual

- Reutiliza `FormularioProducto` y `FormularioPrecio`
- El precio es opcional
- La validación exige como mínimo el nombre
- Puede buscar por código o nombre usando `BusquedaProductosHibridaService`
- Puede ampliar búsqueda a fuentes externas según la política híbrida
- Puede abrir escáner de código para autocompletar la búsqueda
- Soporta carga de precios mayoristas desde el mismo formulario

---

## RELACIÓN CON MIS PRODUCTOS

### De Mis Productos hacia Lista Justa

- Un item agregado desde `Mis Productos` guarda `productoId`
- La lista puede recalcular importes cuando cambia el producto relacionado
- Se puede detectar si el usuario volvió al precio original y limpiar el estado local

### De Lista Justa hacia Mis Productos

- Solo los items manuales completos pueden pasar automáticamente
- Un item manual se considera completo si tiene:
  - nombre
  - precio
  - comercio
  - cantidad
  - gramos o litros
  - marca
  - código de barras
  - categoría
- Si ya existe un producto con ese código, se vincula
- Si no existe, se crea un producto nuevo y el item pasa a `enMisProductos`

### Regla clave

- `Lista Justa` no debe modificar los datos base de `Mis Productos`
- Si el usuario cambia precios dentro de la lista, eso se considera precio local de la lista

---

## RELACIÓN CON MESA DE TRABAJO

### Cuándo deriva un item

- Si el item no está completo para pasar a `Mis Productos`
- Si todavía no quedó vinculado como producto existente
- Si corresponde mantenerlo visible pero pendiente de completar

### Qué se envía

- Datos del item
- Moneda real
- Escalas mayoristas
- Origen `Lista Justa`
- Comercio resuelto desde `lista.comercioActual` o desde `item.comercio`

### Sincronización posterior

- Si el item desaparece de Mesa y ya tiene `productoId`, pasa a `enMisProductos`
- Si desaparece de Mesa y no tiene `productoId`, vuelve a `ninguno`
- Si un producto termina existiendo en `Mis Productos`, la lista puede vincularse automáticamente por código de barras

---

## COMERCIO ACTUAL

`Lista Justa` incorpora el comercio como ayuda, no como requisito.

### Comportamiento

- El bloque está siempre visible en estado colapsado
- Usa `SelectorComercioDireccion`
- La selección afecta el contexto de compra actual
- Se muestra un resumen compacto del comercio elegido
- Al enviar items a Mesa, ese comercio se reutiliza si existe

### Regla funcional

- El comercio actual no debe transformarse en fricción para usar la lista
- La lista debe seguir funcionando aunque el usuario no seleccione comercio

---

## PRECIOS Y TOTALES

### Niveles de cálculo

- `estimadoLista(lista)` calcula el estimado general de la tarjeta
- `resumenCompra(lista)` calcula progreso y total de comprados
- En detalle se muestra `Total` o `Total parcial` según falten precios

### Consideraciones actuales

- Si ningún item tiene precio, la lista se marca como `Sin precios`
- Si algunos lo tienen y otros no, se muestra `Estimado parcial`
- Si hay productos comprados sin precio, se muestra un banner
- Si hay monedas mezcladas, se avisa explícitamente que no hay conversión

### Mayoristas

- `activarPreciosMayoristas` solo aplica si hay `escalasPorCantidad`
- Las escalas se normalizan y filtran
- Se pueden editar inline en la tarjeta del item
- La UI ya fue pulida para móvil vertical y lectura rápida

---

## COMPONENTE REUTILIZABLE DESTACADO

### BotonAccionSticky.vue

Se creó como componente compartido para no repetir el mismo patrón de CTA fijo.

#### Props

- `etiqueta`
- `icono`
- `color`
- `deshabilitado`
- `cargando`

#### Uso actual

- `ListaJustaPage.vue`
- `DetalleListaJustaPage.vue`

#### Ventaja

- Centraliza el patrón sticky con safe area inferior y mantiene consistencia visual

---

## NAVEGACIÓN

### Rutas

```javascript
{ path: 'lista-justa', component: ListaJustaPage }
{ path: 'lista-justa/:id', component: DetalleListaJustaPage }
```

### Header y drawer

- `MainLayout.vue` agrega acceso rápido a `Lista Justa`
- Usa `IconListDetails`
- La sección usa color `secondary` como identidad visual
- `Mis Productos` pasó a usar `IconClipboardList`

---

## PENDIENTES REALES

Pendientes que siguen apareciendo en el plan o en el código:

- Integración completa de escaneo rápido dentro del flujo de alta en Lista Justa
- Integración completa de Ráfaga agregando directo a la lista
- Reordenado manual de items
- Avisos específicos cuando el comercio actual no tiene precio pero otro comercio sí
- Posible bloque futuro de `Sin precio`
- Testing funcional detallado en móvil y tablet

---

## NOTAS PARA IA Y MANTENIMIENTO

- Si cambias `ListaJustaStore`, revisa siempre sincronización con `productosStore` y `sesionEscaneoStore`
- Si tocas el modelo de item, revisa alta manual, alta desde Mis Productos, persistencia y derivación a Mesa
- Si tocas precios, revisa `usaPreciosLocales`, restauración de precio original y mayoristas
- Si agregas nuevos CTA sticky, reutiliza `BotonAccionSticky.vue`
- Si cambias navegación o accesos rápidos, actualiza también `Resumen1General.md`

---

**Última actualización:** 23 de Abril de 2026 — Se consolidó la documentación de `Lista Justa` tras su implementación funcional, los ajustes de UI móvil, la integración con Mesa de trabajo y el soporte de precios mayoristas por cantidad.
