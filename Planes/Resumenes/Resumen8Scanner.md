# SISTEMA DE ESCANEO - DOCUMENTACIÓN TÉCNICA

## PROPÓSITO
Sistema completo de escaneo de códigos de barras para cargar productos a la Mesa de trabajo. Tiene dos modos de escaneo y una vista de revisión/envío (Mesa de trabajo). El comercio se asigna al final, no al inicio.

---

## ARQUITECTURA GENERAL

```
FAB (FabAcciones.vue)
  ├── "Escaneo rápido" → Modo A
  ├── "Ráfaga"         → Modo B
  └── "Agregar manual" → DialogoAgregarProducto (flujo normal)

Modo A (Escaneo rápido)
  EscaneadorCodigo (activo, continuo=false)
    → detecta código → pausa cámara
    → busca en BD local + API (await)
    → TarjetaEscaneo (bottom sheet)
        → "Siguiente" → sesionEscaneoStore.agregarItem() → cámara reactiva
        → "Ir a mesa" → sesionEscaneoStore.agregarItem() → cierra cámara

Modo B (Ráfaga)
  EscaneadorCodigo (activo, continuo=true)
    → detecta código → cámara NUNCA para
    → busca en background (fire-and-forget)
    → cuando termina: sesionEscaneoStore.agregarItem() + tarjetita de aviso

Mesa de trabajo (MesaTrabajoPage.vue — ruta /mesa-trabajo)
  ← sesionEscaneoStore.items
  → edición, ordenamiento, selección múltiple, asignación de comercio en bloque
  → envío parcial → productosStore.agregarProducto() / agregarPrecioAProducto()
```

---

## COMPONENTES

### FabAcciones.vue (`src/components/Compartidos/`)
FAB genérico reutilizable en todas las páginas.

**Props:**
- `acciones[]`: `{ icono: Component, label: String, color: String, accion: Function }`
- `color`: color del botón principal
- `posicion`, `offset`: posicionamiento

**Comportamiento:**
- Si `acciones.length > 1`: renderiza `q-fab` (Speed Dial) con animación expand/collapse
- Si `acciones.length === 1`: renderiza `q-btn` directo
- `ejecutarAccion(fn)` usa `nextTick()` antes de llamar la función — necesario en Capacitor/Android para que los q-dialog abran correctamente después de que el FAB termina su animación de cierre
- Iconos Tabler en el slot de `q-fab-action`: requieren `text-color="white"` y `style="color: white"` para ser visibles en todos los colores de Quasar
- CSS `.fab-sticky`: `bottom: calc(18px + var(--safe-area-bottom, 0px))` + `z-index: 2000`

**Uso en MisProductosPage:**
```javascript
const accionesFab = [
  { icono: IconBolt, label: 'Ráfaga',         color: 'orange',    accion: iniciarRafaga },
  { icono: IconScan, label: 'Escaneo rápido', color: 'secondary', accion: iniciarEscaneoRapido },
  { icono: IconPlus, label: 'Agregar manual', color: 'primary',   accion: abrirDialogoAgregar },
]
```

---

### EscaneadorCodigo.vue (`src/components/Scanner/`)
Overlay nativo de cámara usando `@capacitor-mlkit/barcode-scanning`. En web/dev muestra un input manual de fallback.

**Props:**
- `activo: Boolean` — inicia/detiene el scanner
- `continuo: Boolean` — si true: modo Ráfaga (cámara no para)

**Eventos:** `@codigo-detectado(codigo)`, `@cerrar`

**Modo unitario** (`continuo=false`, default):
- `addListener('barcodeScanned')` → llama `detenerScaneo()` → emite `codigo-detectado`
- Usado en Modo A y en DialogoAgregarProducto

**Modo continuo** (`continuo=true`, para Ráfaga):
- La cámara NUNCA se detiene
- Debounce de 2 segundos por código (`codigosEnCooldown: Set`) para evitar detectar el mismo código múltiples veces
- Al cerrar: `codigosEnCooldown.clear()`

**CSS crítico (`src/css/app.css`):**
```css
/* Hace el webview transparente → la cámara nativa se ve detrás */
body.scanner-activo,
body.scanner-activo #q-app {
  background: transparent !important;
}
/* Oculta todo excepto el overlay del scanner y la tarjetita de aviso */
body.scanner-activo > *:not(.scanner-overlay):not(.aviso-escaneo) {
  visibility: hidden !important;
}
```
- `.scanner-overlay`: clase del overlay de EscaneadorCodigo (z-index 9999)
- `.aviso-escaneo`: clase de la tarjetita de feedback (z-index 10000) — debe estar en la excepción para ser visible durante el escaneo

**Formatos soportados:** EAN-13, EAN-8, UPC-A, UPC-E, Code128

---

### TarjetaEscaneo.vue (`src/components/Scanner/`)
Tarjeta post-escaneo del **Modo A**. `q-dialog` con `position="bottom"`.

**Props:** `modelValue: Boolean`, `item: Object`

**Eventos:** `@siguiente(itemActualizado)`, `@ir-a-mesa(itemActualizado)`, `@descartar`

**Funcionalidades:**
- Foto en tiempo real (usa `datosForm.imagen`, no `item.imagen`)
- Edición inline (lápiz → campos editables para nombre, marca, cantidad, unidad)
- Precio obligatorio (`formularioValido = datosForm.precio > 0`)
- Moneda: `datosForm.moneda` se inicializa con `preferenciasStore.moneda` (no hardcodeado). `alCambiarMoneda(val)` actualiza el form Y guarda en el store. El reset en `alCerrar()` también usa el store.
- Nombre NO es obligatorio (puede escanearse sin nombre)
- Foto opcional vía `useCamaraFoto` — botón de cámara en overlay (esquina inferior derecha)
- "Siguiente" → agrega a la mesa y reactiva cámara
- "Ir a mesa" → agrega a la mesa y cierra el flujo
- **Botón recuperar foto** (`IconRefresh`): aparece en overlay junto a la cámara, solo si `fotoModificada`
- **Botón recuperar datos** (`IconArrowBackUp`): aparece en el área de edición junto a "Listo", solo si `datosModificados`
- `datosOriginales`: computed derivado de `props.item.origenApi || props.item.productoExistenteId` — snapshot de nombre/marca/cantidad/unidad/imagen del item original; `null` si el producto es nuevo
- `fotoModificada` / `datosModificados`: computeds que comparan `datosForm` vs `datosOriginales` — los botones solo aparecen cuando hay diferencia real

---

### MesaTrabajoPage.vue (`src/pages/`)
Página propia con ruta `/mesa-trabajo`. Reemplaza a `MesaTrabajo.vue` (que era un `q-dialog full-screen` en `MainLayout`). El ícono en el drawer usa `to="/mesa-trabajo"` y muestra `IconBriefcase`.

**Acceso:**
- Drawer → ítem "Mesa de trabajo" (visible solo si `sesionEscaneoStore.tieneItemsPendientes`)
- Header global (`MainLayout.vue`) → acceso rápido con `IconBriefcase` (visible solo si `sesionEscaneoStore.tieneItemsPendientes`)
- Al vaciar la mesa (enviar todos o "Limpiar todo") → auto-navega a `/`
- Al acceder con mesa vacía → muestra estado vacío con botones "Mis Productos" y "Comercios"

**Funcionalidades:**
- Lista de `TarjetaProductoBorrador` con ordenamiento configurable
- Selector `SelectorComercioDireccion.vue` para asignación rápida en bottom sheet
- Contador "X / Y artículos listos para enviar"
- **Selección múltiple:** long-press → modo selección con checkboxes → "Asignar comercio" en bloque
- **Envío parcial:** solo los ítems completos (nombre + precio + comercio) tienen botón "Enviar" activo
- Confirmación antes de enviar
- "Limpiar todo" con confirmación

**Opciones de ordenamiento (5):**
1. Menos completo primero (default)
2. Más completo primero
3. Por comercio
4. Sin comercio asignado
5. Alfabético

---

### TarjetaProductoBorrador.vue (`src/components/Scanner/`)
Tarjeta expandible dentro de la Mesa de trabajo. Usa `TarjetaBase`.

**Estado colapsado — slot `#tipo`:**
- Fila 1: chips de completitud (Nombre / Precio / Comercio) — verde si completo, gris si falta
- Fila 2: `IconBuildingStore` + nombre del comercio — `v-if="item.comercio"`
- Fila 3: `IconMapPin` + dirección — `v-if="item.comercio?.direccionNombre"`
- Info inferior: código de barras con `IconBarcode`, clickeable para copiar (`copyToClipboard`)

**Estado expandido — edición inline:**
- Campos: nombre, precio + moneda, comercio/dirección (`SelectorComercioDireccion`), cantidad + unidad
- Marca editable en el bloque de edición
- Gestión de foto: botón flotante en el recuadro de imagen + `q-menu` con opciones (cámara nativa, galería, quitar)
- **Botón recuperar foto** (`IconRefresh :size="22"`): junto a la cámara, `v-if="fotoModificada"`
- **Botón recuperar datos** (`IconArrowBackUp`): extremo derecho, `v-if="datosModificados"`
- Botón `Eliminar` visible en el header derecho con estilo destacado
- `datosOriginales`: `ref` inicializado una sola vez con `props.item.datosOriginales` (snapshot guardado por el store). **No puede ser `computed`** porque `props.item` muta con cada edición (store round-trip)
- `recuperarDatos()`: restaura nombre, marca, cantidad, unidad (no toca precio ni imagen)

**Botón "Enviar":** activo solo si nombre + precio + comercio están completos.

**Prevención de cierre al editar:** el div expandido tiene `@click.stop` para que los clicks en inputs/selects no colapsen la tarjeta.

**Moneda:** cuando el usuario cambia la moneda del ítem en edición, `actualizar('moneda', val)` también llama `preferenciasStore.guardarMoneda(val)` — la preferencia queda guardada automáticamente.

---

## STORE: sesionEscaneoStore.js

Ver documentación completa en Resumen7LocalStorage.md y Resumen1General.md (sección stores).

**Estructura de un ítem:**
```javascript
{
  id: 'escaneo_1234567_abc12',  // generado internamente
  codigoBarras: '7790742005526',
  nombre: 'Sprite Sabor Naranja',
  marca: 'Coca-Cola',
  cantidad: 500,
  unidad: 'mililitro',
  imagen: 'data:image/...',     // base64 o URL
  precio: 0,                   // null hasta que el usuario lo ingrese
  moneda: 'UYU',
  origenApi: true,
  fuenteDato: 'Open Food Facts',
  productoExistenteId: 'prod_xyz', // ID en BD local (null si es nuevo)
  comercio: null,              // { id, nombre, direccionId, direccionNombre } o null
  datosOriginales: {           // snapshot inmutable; null si el producto es nuevo (sin origenApi ni productoExistenteId)
    nombre: 'Sprite Sabor Naranja',
    marca: 'Coca-Cola',
    cantidad: 500,
    unidad: 'mililitro',
    imagen: 'data:image/...',
  },
}
```

---

## FLUJO MODO A — ESCANEO RÁPIDO

```
iniciarEscaneoRapido()
  → modoEscaneo = 'rapido'
  → scannerActivo = true

EscaneadorCodigo detecta código
  → procesarCodigoEscaneado(codigo)
      ↓
  ¿Duplicado en sesión?
    SÍ → mostrarAvisoEscaneo('duplicado') + restart scanner
    NO ↓
  → await _buscarProducto(codigo)   ← BD local + API (cámara pausada aquí)
  → scannerActivo = false
  → itemActual = nuevoItem
  → tarjetaEscaneoAbierta = true

TarjetaEscaneo
  → "Siguiente" → sesionStore.agregarItem() + scannerActivo = true
  → "Ir a mesa" → sesionStore.agregarItem() + scannerActivo = false
  → "Descartar"  → scannerActivo = true (vuelve a escanear)
```

---

## FLUJO MODO B — RÁFAGA

```
iniciarRafaga()
  → modoEscaneo = 'rafaga'
  → scannerActivo = true
  (EscaneadorCodigo recibe :continuo="true" → nunca para)

EscaneadorCodigo detecta código (debounce 2s por código)
  → procesarCodigoEscaneado(codigo)
      ↓
  ¿Duplicado en sesión (yaEnSesion)?
    SÍ → mostrarAvisoEscaneo('duplicado') → return (cámara sigue)
  ¿Duplicado en procesamiento (codigosProcesando)?
    SÍ → mostrarAvisoEscaneo('duplicado') → return
  NO ↓
  → codigosProcesando.add(codigo)
  → _buscarYAgregarRafaga(codigo)  ← fire-and-forget (sin await)
  → return  (cámara sigue activa)

_buscarYAgregarRafaga(codigo) [background]
  → await _buscarProducto(codigo)   ← BD local + API
  → sesionStore.agregarItem(nuevoItem)
  → mostrarAvisoEscaneo('exito', ...)
  → codigosProcesando.delete(codigo)
```

---

## TARJETITA DE AVISO SOBRE LA CÁMARA

Componente inline en `MisProductosPage.vue` usando `<Teleport to="body">`.

**Por qué Teleport:** el overlay de cámara tiene `z-index: 9999`. La tarjetita necesita `z-index: 10000`. Usando Teleport se convierte en hijo directo de `<body>` y no hereda ningún stacking context.

**Por qué la excepción en app.css:** el CSS `body.scanner-activo > *:not(.scanner-overlay)` ocultaría la tarjetita. Se agrega `:not(.aviso-escaneo)` para excluirla.

**Estado reactivo:**
```javascript
const avisoEscaneo = reactive({
  visible: false,
  tipo: 'exito',      // 'exito' | 'duplicado'
  nombre: '',
  codigo: '',
  imagen: null,
})
```

**Comportamiento:**
- Se muestra al detectar código nuevo (éxito) o duplicado
- Persiste hasta que el usuario escanea otro código (lo reemplaza) o toca el botón ✕
- Verde para éxito, naranja para duplicado
- Muestra: miniatura de foto (si existe) + nombre + código + etiqueta

---

## PATRONES IMPORTANTES

### nextTick en Capacitor/Android
Múltiples lugares requieren `await nextTick()` antes de abrir dialogs:
- `FabAcciones.ejecutarAccion()`: nextTick antes de llamar la función del FAB
- `DialogoAgregarProducto.alDetectarCodigo()`: nextTick entre cierre de scanner y apertura del diálogo de resultados
- Modo A (duplicado): nextTick entre `scannerActivo=false` y `scannerActivo=true`

Sin el nextTick, el webview no termina de restaurarse y los q-dialog fallan al abrir.

### fire-and-forget en Ráfaga
```javascript
_buscarYAgregarRafaga(codigo) // sin await
// La función es async pero no se espera su resultado
// El error se maneja internamente con try/finally
// codigosProcesando.delete(codigo) siempre se ejecuta en finally
```

### Prevención de dobles detecciones en Ráfaga
Dos niveles de protección:
1. **EscaneadorCodigo** (nivel de hardware): `codigosEnCooldown` — ignora el mismo código por 2s
2. **MisProductosPage** (nivel de lógica): `codigosProcesando` Set — evita iniciar dos búsquedas del mismo código en paralelo

---

## ARCHIVOS INVOLUCRADOS

| Archivo | Rol |
|---------|-----|
| `src/components/Compartidos/FabAcciones.vue` | FAB con las 3 acciones |
| `src/components/Compartidos/SelectorComercioDireccion.vue` | Selector comercio + dirección reutilizable |
| `src/components/Scanner/EscaneadorCodigo.vue` | Overlay nativo de cámara |
| `src/components/Scanner/TarjetaEscaneo.vue` | Post-escaneo Modo A |
| `src/components/Scanner/TarjetaProductoBorrador.vue` | Tarjeta en Mesa de trabajo |
| `src/pages/MesaTrabajoPage.vue` | Página Mesa de trabajo (`/mesa-trabajo`) |
| `src/almacenamiento/stores/sesionEscaneoStore.js` | Estado persistente |
| `src/pages/MisProductosPage.vue` | Orquestador del flujo |
| `src/css/app.css` | CSS crítico del scanner (visibility + background) |

---

**Última actualización:** 26 de Marzo 2026 — acceso a Mesa documentado también desde el header global (además del drawer) y edición rápida de la tarjeta de Mesa con marca, foto reubicada y eliminación en header.
