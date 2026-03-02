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

## ✅ FASE 1: MODELO DE DATOS 📦 [COMPLETADA]

### ComerciosService.js

[x] Agregar campo `foto: null` dentro del objeto `direccion` al crear una dirección nueva
[x] Verificar que `guardarComercio()` persiste el campo `foto` correctamente
[x] Agregar método `actualizarFotoDireccion(comercioId, direccionId, base64)`:
[x] - Busca el comercio por id
[x] - Busca la dirección por direccionId dentro de `direcciones[]`
[x] - Actualiza `direccion.foto` con el base64 recibido (o null para quitar)
[x] - Persiste via AlmacenamientoService

### comerciosStore.js

[x] Agregar acción `actualizarFotoDireccion(comercioId, direccionId, base64)`
[x] Conectar con `ComerciosService.actualizarFotoDireccion()`
[x] Actualizar estado reactivo local tras guardar

### Notas de modelo

- El campo `foto` vive en: `comercio.direcciones[n].foto`
- Valor: `null` (sin foto) o `"data:image/jpeg;base64,..."` (con foto)
- Las direcciones existentes sin el campo `foto` se tratan como `foto: null` — sin migración especial

═══════════════════════════════════════════════════════════════

## ✅ FASE 2: COMPOSABLE DE CÁMARA 📷 [COMPLETADA]

### Crear src/composables/useCamaraFoto.js

[x] Extraer y adaptar lógica de cámara de `InfoProducto.vue`
[x] Importar `Camera`, `CameraResultType`, `CameraSource` de `@capacitor/camera`
[x] Importar `Capacitor` de `@capacitor/core`
[x] Exponer `inputArchivoRef` (ref para el input hidden del fallback web)
[x] Exponer función `tomarFoto()`:
[x] - En plataforma nativa: usa `Camera.getPhoto()` con `quality: 70`, `resultType: Base64`
[x] - En web: dispara click en `inputArchivoRef`
[x] - Retorna `Promise<string|null>` — base64 o null si el usuario cancela
[x] - Maneja el error de cancelación silenciosamente (no notificar)
[x] Exponer función `leerArchivo(event)`:
[x] - Lee el archivo seleccionado via `FileReader`
[x] - Retorna Promise con el base64 resultante
[x] - Limpia el value del input para permitir reselección
[x] No tiene lógica de persistencia — solo captura y devuelve el base64

═══════════════════════════════════════════════════════════════

## ✅ FASE 3: DIALOGO AGREGAR COMERCIO RÁPIDO 🚀 [COMPLETADA]

### DialogoAgregarComercioRapido.vue

Contexto: es un flujo de velocidad — el botón debe ser discreto y no interrumpir

[x] Importar `useCamaraFoto`
[x] Agregar ref local `fotoTemporal` (null por defecto) para guardar base64 antes de crear
[x] Agregar botón discreto de foto debajo de los campos de dirección:
[x] - Si no hay foto: botón outline pequeño con ícono cámara + texto "Foto del local (opcional)"
[x] - Si hay foto: miniatura + botón para cambiar foto
[x] Agregar mensaje informativo debajo del botón:
[x] - Texto: "Podés cambiarla o quitarla después desde el detalle del comercio"
[x] Al tocar el botón de foto: llamar a `tomarFoto()` y guardar resultado en `fotoTemporal`
[x] Al confirmar y crear el comercio: incluir `fotoTemporal` en el objeto `direccion` a guardar
[x] Agregar `<input ref="inputArchivoRef" type="file" accept="image/*" class="input-archivo-oculto" @change="leerArchivo">` en template

═══════════════════════════════════════════════════════════════

## ✅ FASE 4: FORMULARIO COMERCIO COMPLETO 📝 [COMPLETADA]

### FormularioComercio.vue

Contexto: el botón ya existe pero está deshabilitado — solo hay que activarlo

[x] Importar `useCamaraFoto`
[x] Agregar ref local `fotoTemporal` (null por defecto)
[x] Reemplazar el botón deshabilitado actual por botón activo:
[x] - Si no hay foto: botón con ícono cámara + "Agregar foto del local"
[x] - Si hay foto: miniatura + texto "Cambiar foto"
[x] Quitar el párrafo "Próximamente: podrás agregar fotos del comercio"
[x] Agregar mensaje informativo:
[x] - Texto: "Opcional. Podés cambiarla o quitarla después desde el detalle del comercio"
[x] Al tocar el botón: llamar a `tomarFoto()` y guardar en `fotoTemporal`
[x] Incluir `fotoTemporal` en los datos emitidos al evento 'guardar'
[x] `DialogoAgregarComercio.vue`: pasar `foto` al crear la dirección en el store
[x] Agregar `<input>` oculto para fallback web

═══════════════════════════════════════════════════════════════

## ✅ FASE 5: EDITAR COMERCIO 🖊️ [COMPLETADA]

### EditarComercioPage.vue

Contexto: el comercio ya existe — se guarda inmediatamente en el store

[x] Importar `useCamaraFoto`
[x] Importar `actualizarFotoDireccion` del store
[x] Reemplazar el placeholder `<!-- SECCIÓN: FOTO (placeholder futuro) -->` con UI real:
[x] - Si `direccionSeleccionada.foto` es null: mostrar placeholder con ícono + "Sin foto"
[x] - Si hay foto: mostrar `q-img` con la foto (ratio 16/9 o similar)
[x] Agregar botón "Tomar foto" (siempre visible):
[x] - Al tocar: llama `tomarFoto()` → guarda directo en store via `actualizarFotoDireccion()`
[x] - Muestra notificación de éxito/error
[x] Agregar botón "Quitar foto" (solo visible si `direccionSeleccionada.foto !== null`):
[x] - Al tocar: llama `actualizarFotoDireccion(id, dirId, null)`
[x] - Muestra notificación de confirmación
[x] Agregar `<input>` oculto para fallback web

═══════════════════════════════════════════════════════════════

## 🧪 FASE TESTING: PRUEBAS EN APK [PENDIENTE]

### T.A — Composable useCamaraFoto

[ ] Funciona en APK (cámara nativa se abre)
[x] Funciona en navegador desktop (abre selector de archivos)
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

## 📊 PROGRESO GENERAL: 90% — EN DESARROLLO

✅ Fase 1: Modelo de datos
✅ Fase 2: Composable de cámara
✅ Fase 3: Dialogo agregar rápido
✅ Fase 4: Formulario completo
✅ Fase 5: Editar comercio
⏳ Fase Testing

═══════════════════════════════════════════════════════════════

**ÚLTIMA ACTUALIZACIÓN:** Marzo 2026 - Fases 3, 4 y 5 completadas
**ESTADO:** 🚧 EN DESARROLLO
