# PLAN DE TRABAJO - FOTOS DE COMERCIOS
Proyecto: Precio Justo
Fecha inicio: Marzo 2026
Responsable: Leo + CH

═══════════════════════════════════════════════════════════════

## 📖 DESCRIPCIÓN DEL PLAN

Implementar la posibilidad de agregar una foto del local físico de cada sucursal
de comercio. La foto es opcional en todos los puntos de la app y el usuario puede
cambiarla o eliminarla en cualquier momento desde la pantalla de edición.

### OBJETIVOS PRINCIPALES:
- Reutilizar la lógica de cámara ya implementada para productos
- Foto por sucursal (por objeto `direccion`), no por cadena/comercio raíz
- Integrar en los 3 puntos de entrada: agregar rápido, agregar completo, editar
- No alterar en ningún momento la funcionalidad de productos

### CARACTERÍSTICAS CLAVE:
- Foto opcional — nunca bloquea el flujo del usuario
- Mensaje informativo: "Podés cambiarla o quitarla después desde el detalle"
- Botón discreto en flujo rápido, más visible en formulario completo y edición
- Botón "Quitar foto" solo visible si hay una foto cargada
- Fallback automático: cámara en APK, selector de archivo en web/desktop
- Almacenamiento Base64 en objeto `direccion`, igual que productos con `imagen`

### TECNOLOGÍAS:
- `@capacitor/camera` (ya instalado)
- `Capacitor.isNativePlatform()` (ya en uso)
- Vue 3 Composition API — nuevo composable `useCamaraFoto.js`
- Pinia (comerciosStore) — nueva acción `actualizarFotoDireccion()`
- Quasar: q-img, q-btn, q-menu

### ARCHIVOS A CREAR:
- `src/composables/useCamaraFoto.js` — lógica reutilizable de cámara

### ARCHIVOS A MODIFICAR:
- `src/almacenamiento/servicios/ComerciosService.js`
- `src/almacenamiento/stores/comerciosStore.js`
- `src/components/Formularios/Dialogos/DialogoAgregarComercioRapido.vue`
- `src/components/Formularios/FormularioComercio.vue`
- `src/pages/EditarComercioPage.vue`

═══════════════════════════════════════════════════════════════

## ⏳ FASE 1: MODELO DE DATOS 📦 [PENDIENTE]

### ComerciosService.js
[ ] Agregar campo `foto: null` dentro del objeto `direccion` al crear una dirección nueva
[ ] Verificar que `guardarComercio()` persiste el campo `foto` correctamente
[ ] Agregar método `actualizarFotoDireccion(comercioId, direccionId, base64)`:
  [ ] - Busca el comercio por id
  [ ] - Busca la dirección por direccionId dentro de `direcciones[]`
  [ ] - Actualiza `direccion.foto` con el base64 recibido (o null para quitar)
  [ ] - Persiste via AlmacenamientoService

### comerciosStore.js
[ ] Agregar acción `actualizarFotoDireccion(comercioId, direccionId, base64)`
[ ] Conectar con `ComerciosService.actualizarFotoDireccion()`
[ ] Actualizar estado reactivo local tras guardar

### Notas de modelo
- El campo `foto` vive en: `comercio.direcciones[n].foto`
- Valor: `null` (sin foto) o `"data:image/jpeg;base64,..."` (con foto)
- Las direcciones existentes sin el campo `foto` se tratan como `foto: null` — sin migración especial

═══════════════════════════════════════════════════════════════

## ⏳ FASE 2: COMPOSABLE DE CÁMARA 📷 [PENDIENTE]

### Crear src/composables/useCamaraFoto.js
[ ] Extraer y adaptar lógica de cámara de `InfoProducto.vue`
[ ] Importar `Camera`, `CameraResultType`, `CameraSource` de `@capacitor/camera`
[ ] Importar `Capacitor` de `@capacitor/core`
[ ] Exponer `inputArchivoRef` (ref para el input hidden del fallback web)
[ ] Exponer función `tomarFoto()`:
  [ ] - En plataforma nativa: usa `Camera.getPhoto()` con `quality: 70`, `resultType: Base64`
  [ ] - En web: dispara click en `inputArchivoRef`
  [ ] - Retorna `Promise<string|null>` — base64 o null si el usuario cancela
  [ ] - Maneja el error de cancelación silenciosamente (no notificar)
[ ] Exponer función `leerArchivo(event)`:
  [ ] - Lee el archivo seleccionado via `FileReader`
  [ ] - Retorna Promise con el base64 resultante
  [ ] - Limpia el value del input para permitir reselección
[ ] No tiene lógica de persistencia — solo captura y devuelve el base64

═══════════════════════════════════════════════════════════════

## ⏳ FASE 3: DIALOGO AGREGAR COMERCIO RÁPIDO 🚀 [PENDIENTE]

### DialogoAgregarComercioRapido.vue
Contexto: es un flujo de velocidad — el botón debe ser discreto y no interrumpir

[ ] Importar `useCamaraFoto`
[ ] Agregar ref local `fotoTemporal` (null por defecto) para guardar base64 antes de crear
[ ] Agregar botón discreto de foto debajo de los campos de dirección:
  [ ] - Si no hay foto: botón outline pequeño con ícono cámara + texto "Foto del local (opcional)"
  [ ] - Si hay foto: miniatura + botón para cambiar foto
[ ] Agregar mensaje informativo debajo del botón:
  [ ] - Texto: "Podés cambiarla o quitarla después desde el detalle del comercio"
[ ] Al tocar el botón de foto: llamar a `tomarFoto()` y guardar resultado en `fotoTemporal`
[ ] Al confirmar y crear el comercio: incluir `fotoTemporal` en el objeto `direccion` a guardar
[ ] Agregar `<input ref="inputArchivoRef" type="file" accept="image/*" class="input-archivo-oculto" @change="leerArchivo">` en template

═══════════════════════════════════════════════════════════════

## ⏳ FASE 4: FORMULARIO COMERCIO COMPLETO 📝 [PENDIENTE]

### FormularioComercio.vue
Contexto: el botón ya existe pero está deshabilitado — solo hay que activarlo

[ ] Importar `useCamaraFoto`
[ ] Agregar ref local `fotoTemporal` (null por defecto)
[ ] Reemplazar el botón deshabilitado actual por botón activo:
  [ ] - Si no hay foto: botón con ícono cámara + "Agregar foto del local"
  [ ] - Si hay foto: miniatura + texto "Cambiar foto"
[ ] Quitar el párrafo "Próximamente: podrás agregar fotos del comercio"
[ ] Agregar mensaje informativo:
  [ ] - Texto: "Opcional. Podés cambiarla o quitarla después desde el detalle del comercio"
[ ] Al tocar el botón: llamar a `tomarFoto()` y guardar en `fotoTemporal`
[ ] Incluir `fotoTemporal` en los datos emitidos al evento 'guardar'
[ ] `DialogoAgregarComercio.vue`: pasar `foto` al crear la dirección en el store
[ ] Agregar `<input>` oculto para fallback web

═══════════════════════════════════════════════════════════════

## ⏳ FASE 5: EDITAR COMERCIO 🖊️ [PENDIENTE]

### EditarComercioPage.vue
Contexto: el comercio ya existe — se guarda inmediatamente en el store

[ ] Importar `useCamaraFoto`
[ ] Importar `actualizarFotoDireccion` del store
[ ] Reemplazar el placeholder `<!-- SECCIÓN: FOTO (placeholder futuro) -->` con UI real:
  [ ] - Si `direccionSeleccionada.foto` es null: mostrar placeholder con ícono + "Sin foto"
  [ ] - Si hay foto: mostrar `q-img` con la foto (ratio 16/9 o similar)
[ ] Agregar botón "Tomar foto" (siempre visible):
  [ ] - Al tocar: llama `tomarFoto()` → guarda directo en store via `actualizarFotoDireccion()`
  [ ] - Muestra notificación de éxito/error
[ ] Agregar botón "Quitar foto" (solo visible si `direccionSeleccionada.foto !== null`):
  [ ] - Al tocar: llama `actualizarFotoDireccion(id, dirId, null)`
  [ ] - Muestra notificación de confirmación
[ ] Agregar `<input>` oculto para fallback web

═══════════════════════════════════════════════════════════════

## 🧪 FASE TESTING: PRUEBAS EN APK [PENDIENTE]

### T.A — Composable useCamaraFoto
[ ] Funciona en APK (cámara nativa se abre)
[ ] Funciona en navegador desktop (abre selector de archivos)
[ ] Cancelar la cámara no genera error ni notificación
[ ] Retorna base64 válido en ambas plataformas

### T.B — Agregar Comercio Rápido
[ ] Botón de foto visible pero discreto en el flujo
[ ] Al tocar botón: abre cámara correctamente
[ ] Miniatura se muestra tras tomar foto
[ ] Al confirmar sin foto: el comercio se crea con `direccion.foto = null`
[ ] Al confirmar con foto: el comercio se crea con la foto en `direccion.foto`
[ ] Mensaje informativo visible debajo del botón
[ ] Flujo de velocidad no se interrumpe si el usuario ignora la foto

### T.C — Formulario Comercio Completo
[ ] Botón activo (no deshabilitado)
[ ] Al tocar botón: abre cámara correctamente
[ ] Miniatura visible tras captura
[ ] Al guardar: foto incluida en `direccion.foto`
[ ] Mensaje informativo visible

### T.D — Editar Comercio
[ ] Placeholder reemplazado por UI real
[ ] Si no hay foto: se muestra placeholder correcto
[ ] Si hay foto: se muestra la imagen correctamente con q-img
[ ] Botón "Tomar foto": abre cámara y guarda inmediatamente
[ ] Notificación de éxito al guardar
[ ] Botón "Quitar foto": solo visible si hay foto
[ ] Al quitar foto: imagen desaparece, vuelve el placeholder
[ ] Notificación de confirmación al quitar

### T.E — Persistencia y datos
[ ] La foto sobrevive a cerrar y reabrir la app
[ ] Fotos de sucursales distintas son independientes (foto en sucursal A no afecta sucursal B)
[ ] Comercios sin campo `foto` en datos legacy funcionan sin errores (tratados como null)
[ ] El storage no supera límites con fotos en base64 (verificar tamaño aproximado)

═══════════════════════════════════════════════════════════════

## NOTAS IMPORTANTES 📌

- La foto NO es obligatoria en ningún flujo
- La lógica de cámara de `InfoProducto.vue` NO se modifica — sigue funcionando igual
- `useCamaraFoto.js` es un composable nuevo, no reemplaza nada existente
- En los formularios de creación la foto es temporal hasta confirmar
- En edición la foto se guarda inmediatamente (el comercio ya existe)
- El campo `foto` vive en `direccion`, no en el comercio raíz
- Calidad de foto: 70 (igual que productos, buen equilibrio tamaño/calidad)
- Probar tamaño promedio de foto Base64 antes de aprobar — si es muy grande, considerar
  reducir resolución máxima en Camera.getPhoto()

═══════════════════════════════════════════════════════════════

## 📊 PROGRESO GENERAL: 0% — EN DESARROLLO

⏳ Fase 1: Modelo de datos
⏳ Fase 2: Composable de cámara
⏳ Fase 3: Dialogo agregar rápido
⏳ Fase 4: Formulario completo
⏳ Fase 5: Editar comercio
⏳ Fase Testing

═══════════════════════════════════════════════════════════════

**ÚLTIMA ACTUALIZACIÓN:** Marzo 2026 - PLAN CREADO
**ESTADO:** ⏳ PENDIENTE DE IMPLEMENTACIÓN
