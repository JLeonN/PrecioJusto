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
    origenApi: !!producto
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

## DEPENDENCIAS Y SERVICIOS REUTILIZABLES

| Elemento | Estado | Notas |
|----------|--------|-------|
| `OpenFoodFactsService.js` | ✅ Existe | Búsqueda por código de barras lista |
| `productosStore.agregarProducto()` | ✅ Existe | Lógica de guardado completa |
| `comerciosStore` | ✅ Existe | Selector de comercio reutilizable |
| `@capacitor-mlkit/barcode-scanning` | ✅ Instalado | v8.0.1 — Fase 1 completa |
| `@capacitor/camera` | ⚠️ Verificar | Para fotos en Fase 7 |
| `sesionEscaneoStore.js` | ✅ Creado | Fase 2 completa |
| `EscaneadorCodigo.vue` | ✅ Creado | Fase 3 completa — ♻️ reutilizable |
| `FormularioEscaneo.vue` | ⏳ Crear | Fase 4 |
| `BandejaBorradores.vue` | ⏳ Crear | Fase 6 |

---

## ARCHIVOS NUEVOS

```
src/
  almacenamiento/
    stores/
      sesionEscaneoStore.js           (NUEVO)
  components/
    Scanner/
      EscaneadorCodigo.vue            (NUEVO)
      FormularioEscaneo.vue           (NUEVO)
    Bandeja/
      BandejaBorradores.vue           (NUEVO)
```

## ARCHIVOS EDITADOS

```
src/
  components/
    Formularios/
      Dialogos/
        DialogoAgregarProducto.vue    (EDITAR - activar ícono cámara)
  layouts/
    MainLayout.vue                    (EDITAR - agregar bandeja + badge en drawer)
  [historial de precios]              (EDITAR - agregar edición nombre/foto)
```

---

## FASE TESTING

### T.A Permisos y cámara
- [ ] Primera vez: solicita permiso de cámara y muestra mensaje amigable
- [ ] Usuario deniega permiso: muestra mensaje explicativo y opción de ir a configuración
- [ ] Usuario revoca permiso desde configuración del sistema: app no crashea
- [ ] Cámara se abre correctamente desde el ícono en `DialogoAgregarProducto`

### T.B Escaneo de código de barras
- [ ] Escaneo exitoso de código EAN-13 válido
- [ ] Escaneo exitoso de código EAN-8 válido
- [ ] Código dañado o con poca luz: cámara sigue intentando sin congelar la app
- [ ] Cancelar escaneo con botón X: vuelve al estado anterior sin efectos
- [ ] Escanear el mismo código dos veces seguidas: detecta duplicado y avisa al usuario
- [ ] Escanear múltiples productos distintos en secuencia sin cerrar el flujo

### T.C Búsqueda en Open Food Facts
- [ ] Código encontrado en API → formulario modo rápido (solo precio, nombre precargado)
- [ ] Código no encontrado en API → formulario modo mínimo (precio + nombre vacío)
- [ ] Sin conexión a internet → mensaje de error, permite ingresar datos manualmente
- [ ] Timeout de API → no congela la UI, muestra error y continúa

### T.D Formulario de escaneo (FormularioEscaneo)
- [ ] Modo rápido: autofocus en campo precio al abrirse
- [ ] Modo mínimo: autofocus en campo nombre al abrirse
- [ ] Validación: precio 0 o vacío → botón "Siguiente" deshabilitado
- [ ] Validación: nombre vacío en modo mínimo → botón "Siguiente" deshabilitado
- [ ] Botón "Siguiente": guarda item en store y vuelve al scanner activo
- [ ] Botón "Enviar todo a bandeja": guarda item actual + cierra flujo completo
- [ ] Botón eliminar (basura): descarta el escaneo actual y vuelve al scanner
- [ ] Indicador de cantidad de items en bandeja se actualiza en tiempo real

### T.E Persistencia del store (sesionEscaneoStore)
- [ ] Cerrar app con items en bandeja y reabrir: items siguen ahí
- [ ] El comercio seleccionado persiste junto con los items
- [ ] Datos se guardan correctamente en localStorage
- [ ] Store no se corrompe al agregar/eliminar items repetidamente

### T.F Bandeja de borradores
- [ ] Badge en DRAWER muestra la cantidad correcta de items
- [ ] Badge desaparece cuando la bandeja está vacía
- [ ] Lista de items muestra imagen, nombre y precio correctamente
- [ ] Item sin imagen muestra placeholder visual
- [ ] Editar item: cambios se reflejan de inmediato en la lista
- [ ] Eliminar item individual: desaparece de la lista y badge se actualiza
- [ ] Descartar todo: pide confirmación antes de vaciar
- [ ] Descartar todo: cancela la confirmación → nada cambia
- [ ] Bandeja vacía: muestra estado vacío con mensaje amigable

### T.G Guardar desde la bandeja ("Agregar todos a Mis Productos")
- [ ] Producto nuevo (no existe en app): se crea correctamente en `productosStore`
- [ ] Producto existente (mismo código de barras): agrega precio al historial, NO duplica el producto
- [ ] Precio se asocia correctamente al comercio de la sesión
- [ ] Precio se asocia correctamente a la dirección/sucursal seleccionada
- [ ] Al guardar todo: bandeja se vacía y badge desaparece
- [ ] Al guardar todo: notificación de éxito visible
- [ ] Los productos guardados aparecen en "Mis Productos" inmediatamente

### T.H Edición de nombre y foto en historial (Fase 7)
- [ ] Botón lápiz activa modo edición correctamente
- [ ] Editar nombre: cambio visible en tiempo real en la tarjeta
- [ ] Editar nombre: persiste al cerrar y reabrir la app
- [ ] Tomar foto con cámara: imagen se muestra en la tarjeta inmediatamente
- [ ] Foto guardada correctamente en localStorage (base64)
- [ ] Quitar foto: vuelve al placeholder sin errores
- [ ] Cambio de foto desde Open Food Facts a foto propia: funciona sin conflictos
- [ ] Cancelar edición: no guarda cambios no confirmados

### T.I Casos extremos (edge cases)
- [ ] Bandeja con 20+ items: no hay lag visible al scrollear
- [ ] Foto de producto muy grande: no rompe localStorage ni crashea la app
- [ ] Iniciar flujo de escaneo sin internet: avisa antes de abrir el scanner
- [ ] Cambiar orientación del dispositivo durante el escaneo: cámara no se congela
- [ ] Interrumpir escaneo con llamada telefónica: al volver, estado se recupera correctamente

---

## ORDEN DE IMPLEMENTACIÓN SUGERIDO

1. **Fase 1** — Instalar plugin y verificar permisos Android
2. **Fase 2** — Crear `sesionEscaneoStore` con persistencia
3. **Fase 3** — Componente `EscaneadorCodigo` (solo la cámara)
4. **Fase 4** — Componente `FormularioEscaneo` (rápido/mínimo)
5. **Fase 5** — Conectar todo desde `DialogoAgregarProducto`
6. **Fase 6** — `BandejaBorradores` + badge en DRAWER
7. **Fase 7** — Edición nombre/foto en historial (independiente, se puede hacer en paralelo)
8. **Fase Testing** — Testing completo según checklist
