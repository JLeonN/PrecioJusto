# RESUMEN 10 - LISTA JUSTA

## PROPÓSITO

`Lista Justa` es la sección de listas de compra de Precio Justo. Está pensada para usarla rápido en contexto real (supermercado), sin fricción, pero aprovechando datos de `Mis Productos`, `Mesa de trabajo` y precios mayoristas cuando están disponibles.

---

## ESTADO ACTUAL

- La pantalla principal de la app es `Lista Justa` (`/`)
- Hay detalle operativo por lista (`/lista-justa/:id`)
- Hay vista de comparación inteligente (`/lista-justa/:id/inteligente`)
- Se integra en header y drawer como sección principal
- Usa persistencia local con `ListaJustaService` + `ListaJustaStore`
- Permite alta manual y desde `Mis Productos` (con selección múltiple)
- Soporta edición inline, cantidad, comprado/no comprado y resumen de gasto
- Soporta `comercioActual` opcional y precios mayoristas por cantidad
- Puede derivar ítems a `Mesa de trabajo` y sincronizar su estado

---

## ARCHIVOS PRINCIPALES

### PÁGINAS

- `src/pages/ListaJusta/ListaJustaPage.vue`
- `src/pages/ListaJusta/DetalleListaJustaPage.vue`
- `src/pages/ListaJusta/DetalleListaJustaInteligentePage.vue`

### ESTADO Y PERSISTENCIA

- `src/almacenamiento/stores/ListaJustaStore.js`
- `src/almacenamiento/servicios/ListaJustaService.js`

### UTILIDADES CLAVE

- `src/utils/ListaJustaInteligenteUtils.js`

### COMPONENTES REUTILIZADOS

- `src/components/Compartidos/BotonAccionSticky.vue`
- `src/components/Compartidos/SelectorComercioDireccion.vue`
- `src/components/Formularios/FormularioProducto.vue`
- `src/components/Formularios/FormularioPrecio.vue`
- `src/components/Formularios/BloqueEscalasCantidad.vue`
- `src/components/Formularios/Dialogos/DialogoResultadosBusqueda.vue`
- `src/components/Scanner/EscaneadorCodigo.vue`

---

## MODELO DE DATOS

### Lista (v2)

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
  configuracionInteligente: {
    comercioBase: null | {
      id: string | null,
      nombre: string,
      direccionId: string | null,
      direccionNombre: string
    },
    comerciosComparacion: Array<{
      id: string | null,
      nombre: string,
      direccionId: string | null,
      direccionNombre: string
    }>,
    heredarComercioActual: boolean
  },
  items: [],
  metadatos: {
    version: 2
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

### Reglas clave del modelo

- Mínimo para agregar ítem: `nombre` + `cantidad` válida
- Cantidad inválida se normaliza a `1`
- `precioManual` en Lista Justa es opcional
- Duplicados por `productoId` o `codigoBarras`
- `comercioActual` es ayuda contextual, no requisito
- `configuracionInteligente` evita duplicados de comercios por clave
- `precioManual` de Lista Justa no pisa el histórico de `Mis Productos`

---

## FLUJO BASE

### ListaJustaPage.vue

- Muestra listas ordenadas por `fechaUltimoUso`
- Alta/edición/reinicio/eliminación
- Estimado por lista (`Estimado de la lista`, `Estimado parcial`, `Sin precios`)
- Resumen del comercio actual cuando existe

### DetalleListaJustaPage.vue

- Encabezado con progreso
- Filtros (`pendientes`, `comprados`, `todos`) sticky
- Bloque colapsable de `Comercio actual (opcional)`
- Edición inline de nombre/precio/moneda + mayoristas
- Cantidad por botones, check de comprado y swipe para borrar
- Resumen de total + banners por faltantes y monedas mezcladas
- Alta de productos desde Mis Productos o manual

---

## LISTA JUSTA INTELIGENTE

### Ruta y acceso

- Ruta: `/lista-justa/:id/inteligente`
- Se accede desde el detalle normal de la lista
- Mantiene navegación de vuelta al detalle (`/lista-justa/:id`)

### Qué resuelve

Permite comparar comercios para una lista ya armada y decidir:

1. Dónde comprar todo junto (ranking “todo en uno”)
2. Dónde conviene cada producto (optimización por producto)
3. Cuánto ahorro estimado hay contra comprar todo en el comercio base

### Bloques funcionales

- **Comercios a comparar**
  - Comercio base (`comercioBase`)
  - Comercios adicionales (`comerciosComparacion`)
  - Selector editable con acciones para cambiar/quitar
- **Resumen general**
  - Ranking por total ascendente
  - Estado por faltantes de precio
  - Aviso por mezcla de monedas
- **Compra optimizada por producto**
  - Recomendaciones agrupadas por comercio
  - Bloque de ahorro estimado
- **Detalle por producto**
  - Estado de comparación (`completo`, `parcial`, `unicoPrecio`, `sinDatos`)
  - Recomendación puntual
  - Precios por comercio con fallback claro cuando faltan datos

### Lógica de precios inteligente

Se apoya en `ListaJustaInteligenteUtils.js`:

- `obtenerPreciosVigentesProducto`: toma el precio más reciente por comercio
- `resolverPrecioProductoPorComercio`: resuelve precio por comercio/cantidad
- `aplicarPrecioPorCantidad`: aplica escalas mayoristas cuando corresponde
- `obtenerClaveComercioSeleccionado`: clave estable para mapear comparación
- `obtenerEtiquetaComercio`: etiqueta legible nombre + dirección

### Persistencia y sincronización

`ListaJustaStore` maneja:

- `actualizarConfiguracionInteligente(listaId, cambios)`
- `sincronizarComercioBaseInteligente(listaId)`
- herencia opcional desde `comercioActual` (`heredarComercioActual`)

---

## ALTA DE ARTÍCULOS

### Desde Mis Productos

- Selección múltiple dentro del diálogo
- Cantidad independiente por producto
- Evita duplicados
- Total de selección en tiempo real

### Manual

- Reutiliza `FormularioProducto` + `FormularioPrecio`
- Precio opcional
- Búsqueda híbrida local/API por código o nombre
- Escáner para autocompletar código
- Soporte de escalas mayoristas

---

## RELACIÓN CON MIS PRODUCTOS

### De Mis Productos → Lista Justa

- Ítems guardan `productoId`
- La lista recalcula usando precios vigentes
- Si se vuelve al precio original, limpia `usaPreciosLocales`

### De Lista Justa → Mis Productos

Un ítem manual se autoenvía solo si está “completo”:

- nombre
- precio
- comercio
- cantidad
- gramos/litros
- marca
- código de barras
- categoría

Si existe por código, se vincula; si no existe, crea producto.

---

## RELACIÓN CON MESA DE TRABAJO

- Deriva ítems cuando no corresponde autoenvío directo a Mis Productos
- Respeta moneda, mayoristas y comercio resuelto
- Sincroniza estado cuando el ítem sale de Mesa

---

## PRECIOS Y TOTALES

- `estimadoLista(lista)` para tarjetas de lista
- `resumenCompra(lista)` para detalle
- Banner de faltantes si hay comprados sin precio
- Banner de mezcla de monedas sin conversión
- Mayoristas activos solo con escalas válidas

---

## COMPONENTE REUTILIZABLE DESTACADO

### BotonAccionSticky.vue

Uso en:

- `ListaJustaPage.vue`
- `DetalleListaJustaPage.vue`
- `DetalleListaJustaInteligentePage.vue`

Ventaja:

- CTA fijo consistente con safe area inferior

---

## NAVEGACIÓN

### Rutas de Lista Justa

```javascript
{ path: '', component: ListaJustaPage }
{ path: 'lista-justa/:id', component: DetalleListaJustaPage }
{ path: 'lista-justa/:id/inteligente', component: DetalleListaJustaInteligentePage }
```

### Header y drawer

- Acceso rápido a Lista Justa desde `MainLayout.vue`
- Identidad visual `secondary`
- Mis Productos se mantiene como sección separada en `/mis-productos`

---

## PENDIENTES REALES

- Integración de escaneo rápido directo al flujo de alta de Lista Justa
- Integración de Ráfaga con alta directa a lista
- Reordenado manual de ítems
- Avisos más específicos por comercio sin precio
- Pruebas funcionales completas en móvil y tablet

---

## NOTAS PARA IA Y MANTENIMIENTO

- Si cambiás el modelo de lista, revisar normalización en `ListaJustaService`
- Si tocás comparación inteligente, revisar `ListaJustaInteligenteUtils` + `DetalleListaJustaInteligentePage`
- Si tocás precios, revisar `usaPreciosLocales`, restauración de precios y mayoristas
- Si cambiás rutas/accesos, actualizar también `Resumen1General.md`

---

**Última actualización:** 27 de Abril de 2026 — Se actualizó este resumen para reflejar el estado real de `Lista Justa` y `Lista Justa Inteligente`, incluyendo rutas actuales, modelo `v2`, configuración inteligente persistida, comparación por comercios y cálculo de ahorro estimado.
