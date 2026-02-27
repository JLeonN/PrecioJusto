# PLAN DE TRABAJO — ESCANEO DE PRODUCTOS CON CÁMARA

**Fecha:** 25 de Febrero 2026
**Estado:** En progreso

---

## PRINCIPIOS TRANSVERSALES

### Responsividad

- Nunca usar `px` fijos en contenedores — usar `min()`, `clamp()`, `%`, `vw/vh`
- Los diálogos usan `min-width` + `max-width` para adaptarse a cualquier pantalla
- Botones de acción siempre en footer fijo del dialog (nunca quedan cortados)
- Imágenes con `object-fit: cover` y dimensiones relativas

### Reutilización de componentes

- `EscaneadorCodigo.vue` es **100% reutilizable**: solo props + emits, sin lógica de negocio interna
  - Usos actuales: flujo de escaneo de productos
  - Usos futuros previstos: sección de Comercios (escanear QR o código de producto para buscar comercio), edición de foto de producto
- `FormularioEscaneo.vue` recibe los datos del item por props y emite eventos — no accede al store directamente
- Los componentes UI no conocen el store; el orquestador (padre) conecta store ↔ UI

---

## OBJETIVO

Implementar un flujo de escaneo rápido de productos mediante código de barras, con una bandeja de borradores persistente donde el usuario puede completar y guardar sus productos con calma.

---

## RESUMEN DEL FLUJO

```
[Ícono cámara en input código de barras]
  → Seleccionar comercio
  → Pantalla scanner activa
  → Escanear código de barras
      ├── Encontrado en API → Solo ingresar PRECIO
      └── No encontrado     → Ingresar PRECIO + NOMBRE
  → Botón "Siguiente" (escanea otro)
  → Botón "Enviar a bandeja" (disponible siempre)
  → [DRAWER] Bandeja de borradores
      → Ver / editar items (nombre, precio, foto, todos los campos)
      → Eliminar items individuales
      → Botón "Agregar todos a Mis Productos"
```

---

## FASE 1 — INSTALACIÓN DEL PLUGIN

### Plugin elegido: `@capacitor-mlkit/barcode-scanning`

- Usa Google ML Kit (mejor precisión en condiciones reales)
- Estándar actual para Capacitor

### Pasos:

1. `npm install @capacitor-mlkit/barcode-scanning`
2. `npx cap sync android`
3. Agregar permisos en `AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.CAMERA" />
   ```
4. Configurar en `android/app/build.gradle` si es necesario (ML Kit dependencies)

---

## FASE 2 — STORE DE SESIÓN DE ESCANEO

**Archivo nuevo:** `src/almacenamiento/stores/sesionEscaneoStore.js`

### Responsabilidades:

- Guardar el comercio seleccionado para la sesión activa
- Guardar el array de productos escaneados (borradores)
- Persistir en localStorage para sobrevivir cierres de app
- Nunca vaciarse automáticamente (solo el usuario lo vacía)

### Estado:

```javascript
{
  comercioActivo: null,       // { id, nombre, direccionId, direccionNombre }
  items: []                   // Array de ItemBorrador (ver estructura abajo)
}
```

### Estructura de ItemBorrador:

```javascript
{
  id: string,                 // UUID generado al escanear
  codigoBarras: string | null,
  nombre: string,             // Nombre mínimo requerido si no está en API
  marca: string | null,
  cantidad: number,
  unidad: string,
  imagen: string | null,      // base64 o URL de Open Food Facts
  precio: number,
  moneda: string,             // default 'UYU'
  origenApi: boolean,         // true si vino de Open Food Facts
  productoExistenteId: string | null // ID si ya existe en productosStore
}
```

### Getters:

- `cantidadItems`: número de items en la bandeja (para badge)
- `tieneItemsPendientes`: boolean

### Acciones:

- `iniciarSesion(comercio)`: setea el comercio activo
- `agregarItem(item)`: agrega un item al array
- `actualizarItem(id, cambios)`: edita un item existente
- `eliminarItem(id)`: elimina un item
- `limpiarTodo()`: vacía items y comercio (después de guardar o al descartar)

---

## FASE 3 — COMPONENTE SCANNER

**Archivo nuevo:** `src/components/Scanner/EscaneadorCodigo.vue`

### Comportamiento:

- Ocupa pantalla completa (fullscreen) con overlay oscuro
- Muestra visor central con guías visuales (rectángulo de escaneo)
- Activa la cámara con `@capacitor-mlkit/barcode-scanning`
- Detecta código → emite evento `@codigo-detectado` y pausa cámara
- Botón X para cerrar/cancelar

### Props:

- `activo` (Boolean): controla si la cámara está encendida

### Eventos:

- `@codigo-detectado (codigo: string)`: emitido al escanear
- `@cerrar`: usuario cancela

### Consideraciones:

- Solo disponible en Android (en web mostrar input manual como fallback)
- Pedir permiso de cámara la primera vez con flujo amigable
- ✅ **Responsivo:** ventana de escaneo usa `min(280px, 80vw)` y `min(180px, 45vw)`
- ♻️ **Reutilizable en:** escaneo de productos, Comercios (futuro), edición de fotos (futuro)

---

## FASE 4 — COMPONENTE FORMULARIO DE ESCANEO

**Archivo nuevo:** `src/components/Scanner/FormularioEscaneo.vue`

### Modo RÁPIDO (producto encontrado en API):

- Muestra nombre + imagen del producto (solo lectura, referencia visual)
- Campo precio (autofocus)
- Selector moneda
- Botón "Siguiente" → guarda en store y vuelve al scanner
- Botón "Enviar todo a bandeja" → guarda en store y cierra el flujo

### Modo MÍNIMO (producto NO encontrado en API):

- Campo nombre (requerido, autofocus)
- Campo precio (requerido)
- Selector moneda
- Botón "Siguiente" → igual que arriba
- Botón "Enviar todo a bandeja" → igual que arriba

### En ambos modos:

- Botón "Eliminar este item" (ícono basura) para descartar el escaneo actual
- Indicador de cuántos items hay acumulados en la bandeja (ej: "3 en bandeja")

### Validación mínima:

- Precio > 0 obligatorio
- Nombre obligatorio solo si no vino de API
- ✅ **Responsivo:** componente dentro de `q-dialog` con `min-width` + `max-width`, campos al 100% del ancho disponible, botones en footer fijo
- ♻️ **Reutilizable:** recibe datos por props, comunica por emits — sin acceso directo al store

---

## FASE 5 — FLUJO DE ENTRADA (modificar componente existente)

**Archivo editado:** `src/components/Formularios/DialogoAgregarProducto.vue`

### Cambio:

El ícono de cámara en el input de código de barras, que actualmente es visual, ahora:

1. Abre un selector de comercio (q-dialog pequeño)
2. Al confirmar el comercio → abre `EscaneadorCodigo.vue`
3. Al detectar código → busca en Open Food Facts (servicio ya existente)
4. Según resultado → muestra `FormularioEscaneo.vue`

### Lógica al recibir el código escaneado:

```javascript
async function procesarCodigoEscaneado(codigo) {
  const producto = await openFoodFactsService.buscarPorCodigoBarras(codigo)
  const existente = productosStore.buscarPorCodigoBarras(codigo) // si existe tal método
  itemActual.value = {
    ...datosVaciosBorrador(),
    codigoBarras: codigo,
    productoExistenteId: existente?.id || null,
    ...(producto ? mapearDesdeApi(producto) : {}),
    origenApi: !!producto,
  }
  mostrarFormulario.value = true
}
```

---

## FASE 6 — BANDEJA DE BORRADORES

**Archivo nuevo:** `src/components/Bandeja/BandejaBorradores.vue`

### Ubicación: dentro del DRAWER en MainLayout.vue

### Estructura visual:

- Header con título "Bandeja" + nombre del comercio activo
- Lista de items con:
  - Imagen (o placeholder si no tiene)
  - Nombre del producto
  - Precio + moneda
  - Botón editar (ícono lápiz) → abre edición inline o dialogo
  - Botón eliminar (ícono basura)
- Footer fijo:
  - Botón "Agregar todos a Mis Productos" (si hay items)
  - Botón "Descartar todo" (con confirmación)

### Badge en DRAWER:

- Mostrar número de items pendientes junto al ítem del DRAWER
- Desaparece cuando la bandeja está vacía
- ✅ **Responsivo:** lista con scroll, imagen de item con tamaño fijo relativo, footer con botones al 100% del ancho del DRAWER

### Comportamiento al guardar ("Agregar todos"):

- Itera cada item del store
- Si `productoExistenteId` → usa `productosStore.agregarPrecio()` (función existente)
- Si no existe → usa `productosStore.agregarProducto()` (función existente)
- Asocia el precio al comercio de la sesión
- Al terminar → limpia el store y notificación de éxito

---

## FASE 7 — EDICIÓN DE NOMBRE Y FOTO EN HISTORIAL

**Archivos a identificar y editar:** componente de historial de precios (ver Resumen3DetalleProducto.md)

### Funcionalidad a agregar:

- Botón lápiz para activar modo edición (patrón ya existente en la app)
- **Editar nombre:** campo de texto editable, guarda en tiempo real (o al confirmar)
- **Editar foto:** dos opciones
  - Tomar foto con cámara (`@capacitor/camera`)
  - Quitar foto actual (dejar sin imagen)
- Cambios se reflejan en tiempo real en la tarjeta del producto
- Usa `productosStore` para persistir los cambios

### Consideraciones:

- `@capacitor/camera` ya podría estar instalado — verificar antes de instalar
- La foto se guarda como base64 en localStorage (igual que el resto de datos)
- ♻️ **Reutiliza `EscaneadorCodigo.vue`** para la captura de foto (mismo componente, distinto uso)
- ✅ **Responsivo:** imagen editable se muestra con tamaño fijo relativo, botones accesibles en mobile

---

## FASE 8 — MARCA EDITABLE Y EDICIÓN EXTENDIDA EN BANDEJA

### Parte A — Marca editable en página de detalle

**Archivo a editar:** `src/components/DetalleProducto/InfoProducto.vue`

#### Cambios en el layout de campos (nuevo orden):

1. Nombre _(editable inline — Fase 7)_
2. **Marca** _(nueva, editable con `CampoEditable`)_
3. Categoría _(editable con `CampoEditable` — ya existe)_
4. Código de barras _(movido debajo de categoría)_
5. Precio + comercio
6. Chip tendencia
7. Botón "Agregar precio"

#### Implementación:

- Agregar `CampoEditable` para `marca` con `IconBuildingStore` (o similar)
- Guardar con `productosStore.actualizarProducto(id, { marca })`
- Mover el bloque del código de barras debajo de `CampoEditable` de categoría

---

### Parte B — Edición extendida en BandejaBorradores

**Archivos a editar/crear:**

- `src/components/Scanner/BandejaBorradores.vue` _(editar)_
- `src/components/Scanner/DialogoEditarItemBandeja.vue` _(nuevo)_

#### Cambios en la lista de items:

- Mostrar `categoría` del item (si tiene) en la descripción
- Agregar botón lápiz por item que abre `DialogoEditarItemBandeja`

#### DialogoEditarItemBandeja (nuevo, dialog pequeño):

- Campos editables:
  - **Nombre** _(requerido)_
  - **Marca** _(opcional)_
  - **Categoría** _(opcional)_
- Botones: Cancelar / Guardar
- Guarda con `sesionEscaneoStore.actualizarItem(id, { nombre, marca, categoria })`
- ✅ **Responsivo:** dialog centrado con `min-width: 300px; max-width: 90vw`

---

---

## FASE 9 — MEJORAS POST-TESTING

### Bug A — Scanner se traba al detectar un producto duplicado

**Archivo a editar:** `src/components/Formularios/DialogoAgregarProducto.vue` (orquestador del flujo)

#### Comportamiento actual:
Cuando el usuario escanea un código que ya está en la bandeja, la app se detiene y no sigue escaneando.

#### Comportamiento esperado:
- Detectar el duplicado antes de abrir el formulario
- Mostrar toast discreto: "Este producto ya está en la bandeja"
- Continuar escaneando automáticamente sin interrumpir el flujo

---

### Bug B — Editar en bandeja no actualiza el producto ya guardado

**Archivo a editar:** `src/components/Scanner/BandejaBorradores.vue`

#### Comportamiento actual:
Si el item tiene `productoExistenteId`, al guardar desde la bandeja se agrega el precio correctamente,
pero los cambios de nombre/marca/categoría hechos en `DialogoEditarItemBandeja` no se propagan
al producto guardado en `productosStore`.

#### Solución:
En `guardarTodos()`, si el item tiene `productoExistenteId`, también llamar
`productosStore.actualizarProducto(id, { nombre, marca, categoria })` con los campos editados.

---

### Feature A — Auto-fetch al detectar conexión

**Archivo a editar:** `src/components/Scanner/BandejaBorradores.vue`

#### Descripción:
Cuando la app detecta que recuperó internet, busca automáticamente en la API los items de la bandeja
que tienen `codigoBarras` pero `origenApi === false` (escaneados sin conexión).

#### Implementación:
- `window.addEventListener('online', handler)` en `onMounted` / `onUnmounted`
- Filtra items donde `origenApi === false && codigoBarras !== null`
- Llama `OpenFoodFactsService.buscarPorCodigoBarras()` por cada uno
- Si encuentra datos: `sesionEscaneoStore.actualizarItem(id, { nombre, marca, categoria, imagen, origenApi: true })`
- Toast discreto: "X productos actualizados desde la API"

---

### Feature B — Botón para restaurar datos desde la API

**Archivos a editar:** `src/components/DetalleProducto/InfoProducto.vue`, `src/components/Scanner/DialogoEditarItemBandeja.vue`

#### Descripción:
Si el producto tiene `codigoBarras`, mostrar un botón de restaurar que vuelve a buscar en la API
y sobreescribe nombre/marca/categoría/imagen con los datos originales. No hace falta guardar
nada adicional — con el código de barras alcanza para re-fetchear.

- Solo visible si `codigoBarras !== null`
- En `InfoProducto.vue`: botón al lado opuesto del ícono de cámara en la foto
- En `DialogoEditarItemBandeja.vue`: botón "Restaurar desde API" en el footer
- Llama `OpenFoodFactsService.buscarPorCodigoBarras(codigoBarras)` al presionar
- Requiere conexión — mostrar error si no hay internet

---

## DEPENDENCIAS Y SERVICIOS REUTILIZABLES

| Elemento                            | Estado       | Notas                               |
| ----------------------------------- | ------------ | ----------------------------------- |
| `OpenFoodFactsService.js`           | ✅ Existe    | Búsqueda por código de barras lista |
| `productosStore.agregarProducto()`  | ✅ Existe    | Lógica de guardado completa         |
| `comerciosStore`                    | ✅ Existe    | Selector de comercio reutilizable   |
| `@capacitor-mlkit/barcode-scanning` | ✅ Instalado | v8.0.1 — Fase 1 completa            |
| `@capacitor/camera`                 | ✅ Instalado | v8.x — Fase 7 completa              |
| `sesionEscaneoStore.js`             | ✅ Creado    | Fase 2 completa                     |
| `EscaneadorCodigo.vue`              | ✅ Creado    | Fase 3 completa — ♻️ reutilizable   |
| `FormularioEscaneo.vue`             | ✅ Creado    | Fase 4 completa                     |
| `BandejaBorradores.vue`             | ✅ Creado    | Fase 6 completa                     |
| `DialogoEditarItemBandeja.vue`      | ✅ Creado    | Fase 8 parte B                      |

---

## ARCHIVOS NUEVOS

```
src/
  almacenamiento/
    stores/
      sesionEscaneoStore.js           (NUEVO — ✅ Fase 2)
  components/
    Scanner/
      EscaneadorCodigo.vue            (NUEVO — ✅ Fase 3)
      FormularioEscaneo.vue           (NUEVO — ✅ Fase 4)
      BandejaBorradores.vue           (NUEVO — ✅ Fase 6)
      DialogoEditarItemBandeja.vue    (NUEVO — ✅ Fase 8B)
```

## ARCHIVOS EDITADOS

```
src/
  components/
    Formularios/
      Dialogos/
        DialogoAgregarProducto.vue    (EDITAR — ✅ Fase 5)
    DetalleProducto/
      InfoProducto.vue                (EDITAR — ✅ Fase 7 / ✅ Fase 8A / ⏳ Fase 9B)
    Scanner/
      BandejaBorradores.vue           (EDITAR — ✅ Fase 8B / ⏳ Fase 9A / ⏳ Fase 9B)
      DialogoEditarItemBandeja.vue    (EDITAR — ⏳ Fase 9B)
  layouts/
    MainLayout.vue                    (EDITAR — ✅ Fase 6)
```

---

## FASE TESTING

### T.A Permisos y cámara

- [x] Primera vez: solicita permiso de cámara y muestra mensaje amigable
- [x] Usuario deniega permiso: muestra mensaje explicativo y opción de ir a configuración
- [x] Usuario revoca permiso desde configuración del sistema: app no crashea
- [x] Cámara se abre correctamente desde el ícono en `DialogoAgregarProducto`

### T.B Escaneo de código de barras

- [x] Escaneo exitoso de código EAN-13 válido
- [x] Escaneo exitoso de código EAN-8 válido
- [x] Código dañado o con poca luz: cámara sigue intentando sin congelar la app
- [x] Cancelar escaneo con botón X: vuelve al estado anterior sin efectos
- [x] Escanear el mismo código dos veces seguidas: detecta duplicado y avisa al usuario
- [x] Escanear múltiples productos distintos en secuencia sin cerrar el flujo

### T.C Búsqueda en Open Food Facts

- [x] Código encontrado en API → formulario modo rápido (solo precio, nombre precargado)
- [x] Código no encontrado en API → formulario modo mínimo (precio + nombre vacío)
- [x] Sin conexión a internet → mensaje de error, permite ingresar datos manualmente
- [x] Timeout de API → no congela la UI, muestra error y continúa

### T.D Formulario de escaneo (FormularioEscaneo)

- [ ] Modo rápido: autofocus en campo precio al abrirse
- [ ] Modo mínimo: autofocus en campo nombre al abrirse
- [x] Validación: precio 0 o vacío → botón "Siguiente" deshabilitado
- [x] Validación: nombre vacío en modo mínimo → botón "Siguiente" deshabilitado
- [x] Botón "Siguiente": guarda item en store y vuelve al scanner activo
- [x] Botón "Enviar todo a bandeja": guarda item actual + cierra flujo completo
- [x] Botón eliminar (basura): descarta el escaneo actual y vuelve al scanner
- [x] Indicador de cantidad de items en bandeja se actualiza en tiempo real

### T.E Persistencia del store (sesionEscaneoStore)

- [x] Cerrar app con items en bandeja y reabrir: items siguen ahí
- [x] El comercio seleccionado persiste junto con los items
- [x] Datos se guardan correctamente en localStorage
- [x] Store no se corrompe al agregar/eliminar items repetidamente

### T.F Bandeja de borradores

- [x] Badge en DRAWER muestra la cantidad correcta de items
- [x] Badge desaparece cuando la bandeja está vacía
- [x] Lista de items muestra imagen, nombre y precio correctamente
- [x] Item sin imagen muestra placeholder visual
- [x] Editar item: cambios se reflejan de inmediato en la lista
- [x] Eliminar item individual: desaparece de la lista y badge se actualiza
- [Donde?] Descartar todo: pide confirmación antes de vaciar
- [Donde?] Descartar todo: cancela la confirmación → nada cambia
- [x] Bandeja vacía: muestra estado vacío con mensaje amigable

### T.G Guardar desde la bandeja ("Agregar todos a Mis Productos")

- [x] Producto nuevo (no existe en app): se crea correctamente en `productosStore`
- [x] Producto existente (mismo código de barras): agrega precio al historial, NO duplica el producto
- [x] Precio se asocia correctamente al comercio de la sesión
- [x] Precio se asocia correctamente a la dirección/sucursal seleccionada
- [x] Al guardar todo: bandeja se vacía y badge desaparece
- [x] Al guardar todo: notificación de éxito visible
- [x] Los productos guardados aparecen en "Mis Productos" inmediatamente

### T.H Edición de nombre y foto en historial (Fase 7)

- [x] Botón lápiz activa modo edición correctamente
- [x] Editar nombre: cambio visible en tiempo real en la tarjeta
- [x] Editar nombre: persiste al cerrar y reabrir la app
- [x] Tomar foto con cámara: imagen se muestra en la tarjeta inmediatamente
- [x] Foto guardada correctamente en localStorage (base64)
- [x] Quitar foto: vuelve al placeholder sin errores
- [x] Cambio de foto desde Open Food Facts a foto propia: funciona sin conflictos
- [x] Cancelar edición: no guarda cambios no confirmados

### T.J Marca editable y edición extendida en bandeja (Fase 8)

- [x] Marca visible en `InfoProducto` (página de detalle)
- [x] Marca editable con `CampoEditable`: guardar y persistir correctamente
- [x] Código de barras aparece debajo de categoría (nuevo orden de campos)
- [x] Botón lápiz por item en `BandejaBorradores` abre `DialogoEditarItemBandeja`
- [x] Editar nombre en bandeja: cambio se refleja inmediatamente en la lista
- [x] Editar marca en bandeja: se guarda correctamente en el store
- [x] Editar categoría en bandeja: se muestra en la tarjeta del item
- [x] Categoría visible en la lista de items de la bandeja
- [x] Cancelar edición en diálogo: no guarda ningún cambio
- [x] Guardar con nombre vacío: botón deshabilitado

### T.K Mejoras post-testing (Fase 9)

- [ ] Scanner detecta duplicado: muestra aviso y continúa escaneando sin trabarse
- [ ] Scanner detecta duplicado: NO abre el formulario para el código repetido
- [ ] Al reconectar internet, los items sin datos de API se actualizan automáticamente
- [ ] El toast de "X productos actualizados" aparece solo si se actualizó al menos uno
- [ ] Si todos los items ya tenían `origenApi: true`, no lanza requests innecesarios
- [ ] Editar nombre/marca/categoría en bandeja de un producto existente: el cambio se refleja en Mis Productos al guardar
- [ ] Botón "restaurar desde API" visible solo en productos con código de barras
- [ ] Botón "restaurar desde API" sin internet: muestra error sin crashear
- [ ] Restaurar datos sobreescribe correctamente nombre, marca, categoría e imagen

### T.I Casos extremos (edge cases)

- [ ] Bandeja con 20+ items: no hay lag visible al scrollear
- [x] Foto de producto muy grande: no rompe localStorage ni crashea la app
- [No me aparecio ningun mensaje] Iniciar flujo de escaneo sin internet: avisa antes de abrir el scanner
- [x] Cambiar orientación del dispositivo durante el escaneo: cámara no se congela
- [x] Interrumpir escaneo con llamada telefónica: al volver, estado se recupera correctamente

---

### Bugs encontrados durante el testing

- **[Bug]** Escanear múltiples productos distintos en secuencia sin cerrar el flujo
  Si el usuario está escaneando y accidentalmente escanea un código que ya está en la bandeja,
  el flujo se traba y la cámara deja de detectar. Tendría que seguir escaneando, mostrar un aviso
  de que el producto ya está en la bandeja, y continuar el flujo normalmente cuando detecte uno nuevo.
  → **Planificado en Fase 9 — Bug A**

- **[Bug]** Editar un item en la bandeja no actualiza el producto si ya existe en Mis Productos.
  Si el producto ya estaba guardado en la app, los cambios de nombre/marca/categoría hechos desde
  la bandeja de borradores no se propagan al producto guardado. Solo se agrega el precio.
  → **Planificado en Fase 9 — Bug B**

### Features para próximas fases

- **[Feature]** Cuando la app detecte que recuperó conexión a internet, debería buscar automáticamente
  en la API los productos de la bandeja que fueron escaneados sin internet (sin nombre ni imagen).
  Sin botón de reintento — completamente automático.
  → **Planificado en Fase 9 — Feature A**

- **[Feature]** Botón para restaurar los datos originales de la API en los campos editados.
  Como ya tenemos el código de barras guardado, no es necesario guardar los datos originales:
  simplemente volver a buscar en la API y sobreescribir nombre/marca/categoría/imagen.
  El botón solo aparece si el producto tiene código de barras.
  Ubicaciones: en la foto (lado opuesto al ícono de cámara) y en el diálogo de edición de la bandeja.
  → **Planificado en Fase 9 — Feature B**

## ORDEN DE IMPLEMENTACIÓN SUGERIDO

1. **Fase 1** — Instalar plugin y verificar permisos Android ✅
2. **Fase 2** — Crear `sesionEscaneoStore` con persistencia ✅
3. **Fase 3** — Componente `EscaneadorCodigo` (solo la cámara) ✅
4. **Fase 4** — Componente `FormularioEscaneo` (rápido/mínimo) ✅
5. **Fase 5** — Conectar todo desde `DialogoAgregarProducto` ✅
6. **Fase 6** — `BandejaBorradores` + badge en DRAWER ✅
7. **Fase 7** — Edición nombre/foto en historial ✅
8. **Fase 8** — Marca editable en detalle + edición extendida en bandeja ✅
9. **Fase 9** — Mejoras post-testing (2 bugs + 2 features) ⏳
10. **Fase Testing** — Testing completo según checklist
