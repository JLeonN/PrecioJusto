# PLAN DE TRABAJO - PUBLICIDAD ADMOB

Proyecto: Precio Justo
Fecha inicio: Marzo 2026
Responsable: Leo + CH

═══════════════════════════════════════════════════════════════

## 📖 DESCRIPCIÓN DEL PLAN

Integrar publicidad AdMob en la app con una arquitectura limpia y centralizada.
Un solo archivo de configuración controla si la app usa IDs de prueba o producción.
El banner es siempre visible en todas las pantallas. El video recompensado
se accede desde el Drawer (botón "Gracias"). El interstitial queda preparado
para la futura página de estadísticas.

### OBJETIVOS PRINCIPALES:

- Instalar el plugin `@capacitor-community/admob`
- Crear un archivo de config con `MODO_PRUEBA` (true/false) bien visible
- Banner siempre visible en la parte inferior, tamaño mínimo
- Ajustar el padding de la app para que el banner nunca tape contenido
- Botón "Gracias" en el Drawer → video recompensado + contador de gracias
- Interstitial preparado para cuando exista la página de estadísticas
- La publicidad solo se activa en plataforma nativa (no en web/dev)

### ⚠️ ANTES DE GENERAR EL AAB DE PRODUCCIÓN:

- Completar los IDs reales en `ConfigPublicidad.js` (sección IDS_PRODUCCION)
- Cambiar `MODO_PRUEBA = false`
- Verificar en APK de staging que los anuncios reales cargan correctamente

### IDS PENDIENTES (completar cuando la app esté en producción):

- App ID de AdMob: `PENDIENTE`
- Ad Unit ID — Banner: `PENDIENTE`
- Ad Unit ID — Interstitial: `PENDIENTE`
- Ad Unit ID — Recompensado: `PENDIENTE`

### TECNOLOGÍAS:

- `@capacitor-community/admob` (por instalar)
- `Capacitor.isNativePlatform()` (ya en uso en el proyecto)
- Vue 3 Composition API — nuevo composable `usePublicidad.js`
- LocalStorage — contador de gracias (sin store dedicado)
- Quasar: q-page-container padding dinámico

### ARCHIVOS A CREAR:

- `src/almacenamiento/constantes/ConfigPublicidad.js`
- `src/composables/usePublicidad.js`
- `src/pages/GraciasPage.vue`

### ARCHIVOS A MODIFICAR:

- `android/app/src/main/AndroidManifest.xml`
- `src/layouts/MainLayout.vue`
- `src/router/routes.js`

═══════════════════════════════════════════════════════════════

## 📋 FASE 1: INSTALACIÓN DEL PLUGIN 🔧 [PENDIENTE]

### Objetivo

Instalar `@capacitor-community/admob` y registrar el App ID en Android
para que la app no crashee al iniciar.

### 1.1 — Instalar el paquete

[ ] Ejecutar:
```
npm install @capacitor-community/admob
npx cap sync android
```

### 1.2 — Registrar App ID en AndroidManifest.xml

**Archivo:** `android/app/src/main/AndroidManifest.xml`

[ ] Agregar dentro del tag `<application>`:
```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="PENDIENTE — reemplazar con App ID real" />
```

### ⚠️ Nota crítica

Sin este meta-data la app **crashea al arrancar** en APK.
Aunque estés en modo prueba, el App ID real de AdMob es obligatorio aquí.
En modo prueba el App ID oficial de Google para testing es:
`ca-app-pub-3940256099942544~3347511713` — usarlo hasta tener el real.

═══════════════════════════════════════════════════════════════

## 📋 FASE 2: ARCHIVO DE CONFIGURACIÓN ⚙️ [PENDIENTE]

### Objetivo

Crear el único lugar donde se cambia entre modo prueba y producción.
Bien comentado y fácil de encontrar.

### Archivo a crear

[ ] `src/almacenamiento/constantes/ConfigPublicidad.js`

### Contenido

```javascript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODO PRUEBA — cambiar a false antes de publicar
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const MODO_PRUEBA = true

// IDs de prueba oficiales de Google (siempre funcionan en APK)
const IDS_PRUEBA = {
  appId: 'ca-app-pub-3940256099942544~3347511713',
  banner: 'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  recompensado: 'ca-app-pub-3940256099942544/5224354917',
}

// IDs reales — completar cuando la app esté en producción
const IDS_PRODUCCION = {
  appId: 'PENDIENTE',
  banner: 'PENDIENTE',
  interstitial: 'PENDIENTE',
  recompensado: 'PENDIENTE',
}

export const CONFIG_PUBLICIDAD = MODO_PRUEBA ? IDS_PRUEBA : IDS_PRODUCCION
```

═══════════════════════════════════════════════════════════════

## 📋 FASE 3: COMPOSABLE usePublicidad 🎯 [PENDIENTE]

### Objetivo

Centralizar toda la lógica de AdMob en un composable reutilizable.
Cualquier componente puede importarlo para mostrar un interstitial o rewarded.
Expone `altoBanner` para que el layout aplique el padding correcto.

### Archivo a crear

[ ] `src/composables/usePublicidad.js`

### Lógica

[ ] Importar `AdMob`, `BannerAdSize`, `BannerAdPosition` de `@capacitor-community/admob`
[ ] Importar `Capacitor` de `@capacitor/core`
[ ] Importar `CONFIG_PUBLICIDAD` de `ConfigPublicidad.js`
[ ] `altoBanner`: ref(0) — altura en px del banner (reactiva, para padding)
[ ] `interstitialListo`: ref(false) — indica si hay un interstitial precargado

### Función `inicializar()`

[ ] Guard: si no es nativo (`!Capacitor.isNativePlatform()`), salir sin hacer nada
[ ] Llamar a `AdMob.initialize({ requestTrackingAuthorization: false })`
[ ] Registrar listener `bannerAdLoaded` → actualizar `altoBanner` con la altura real del banner
[ ] Registrar listener `bannerAdFailedToLoad` → `altoBanner = 0` (no ocupar espacio si falla)

### Función `mostrarBanner()`

[ ] Guard: si no es nativo, salir
[ ] Llamar a `AdMob.showBanner()` con:
  - `adId`: `CONFIG_PUBLICIDAD.banner`
  - `adSize`: `BannerAdSize.BANNER` (320x50 — el más pequeño)
  - `position`: `BannerAdPosition.BOTTOM_CENTER`
  - `margin`: 0
  - `isTesting`: `MODO_PRUEBA`

### Función `ocultarBanner()`

[ ] Guard: si no es nativo, salir
[ ] Llamar a `AdMob.hideBanner()`
[ ] `altoBanner = 0`

### Función `precargarInterstitial()`

[ ] Guard: si no es nativo, salir
[ ] Llamar a `AdMob.prepareInterstitial({ adId: CONFIG_PUBLICIDAD.interstitial, isTesting: MODO_PRUEBA })`
[ ] Al completar: `interstitialListo = true`

### Función `mostrarInterstitial()`

[ ] Guard: si no es nativo o `!interstitialListo`, salir
[ ] Llamar a `AdMob.showInterstitial()`
[ ] `interstitialListo = false` (se consume al mostrar)

### Función `mostrarRecompensado()`

[ ] Guard: si no es nativo, retornar `false`
[ ] Llamar a `AdMob.prepareRewardVideoAd({ adId: CONFIG_PUBLICIDAD.recompensado, isTesting: MODO_PRUEBA })`
[ ] Llamar a `AdMob.showRewardVideoAd()`
[ ] Retornar `true` si el usuario completó el video, `false` si lo cerró antes
[ ] Manejar error silenciosamente (retornar `false`)

═══════════════════════════════════════════════════════════════

## 📋 FASE 4: BANNER EN MAINLAYOUT 📐 [PENDIENTE]

### Objetivo

Mostrar el banner siempre en la parte inferior de la app, sin tapar
ningún botón, texto ni contenido de scroll. El padding se aplica
dinámicamente según la altura real reportada por AdMob.
Agregar un indicador visual claro cuando `MODO_PRUEBA = true`.

### Archivo a modificar

[ ] `src/layouts/MainLayout.vue`

### Cambios — Banner

[ ] Importar `usePublicidad` del composable
[ ] Importar `onMounted`
[ ] Desestructurar `{ inicializar, mostrarBanner, altoBanner }` del composable
[ ] En `onMounted`: llamar `await inicializar()` → luego `mostrarBanner()`
[ ] En `q-page-container`: agregar `:style="{ paddingBottom: altoBanner + 'px' }"`

### Cambios — Indicador visual MODO_PRUEBA

[ ] Importar `MODO_PRUEBA` desde `ConfigPublicidad.js`
[ ] En `q-header`: aplicar clase condicional `'bg-orange-8'` si `MODO_PRUEBA`, mantener `'bg-white'` si no
[ ] En `q-toolbar`: agregar texto central `"● MODO PRUEBA"` visible solo si `MODO_PRUEBA`:
    - Color blanco (contrasta con naranja)
    - `text-weight-bold`, tamaño pequeño
    - Posicionado en el centro del toolbar (reemplaza el espacio del título)
[ ] El color del texto del toolbar también cambia a `text-white` en modo prueba

### ⚠️ Puntos delicados

- `MODO_PRUEBA` es una constante de compilación — no agrega lógica reactiva
- El indicador es solo visual en desarrollo y APK de prueba — en producción
  `MODO_PRUEBA = false` y el header vuelve a ser blanco automáticamente
- El padding en `q-page-container` aplica a TODAS las páginas automáticamente
- Cuando el banner falla (sin conexión), `altoBanner = 0` → sin padding innecesario
- El banner nativo se renderiza sobre los botones de navegación del sistema Android
  (back/home), no hay conflicto con ellos — AdMob lo maneja nativamente
- La Mesa de Trabajo y sus botones flotantes quedan correctamente por encima del banner
  gracias al padding dinámico

═══════════════════════════════════════════════════════════════

## 📋 FASE 5: PÁGINA GRACIAS + REWARDED + CONTADOR 🙏 [PENDIENTE]

### Objetivo

Crear una página dedicada accesible desde el Drawer donde el usuario
puede ver un video recompensado para apoyar la app. Es una experiencia
completa: mensaje de agradecimiento, contador personal y botón de video.
No es un diálogo ni un popup — es una página de navegación real.

### 5.1 — Ruta nueva

**Archivo:** `src/router/routes.js`

[ ] Agregar ruta `/gracias` apuntando a `GraciasPage.vue`

### 5.2 — Ítem en el Drawer

**Archivo:** `src/layouts/MainLayout.vue`

[ ] Agregar ítem al final de la lista del Drawer, antes del cierre de `q-list`:
  - Ícono: `IconHeart` de `@tabler/icons-vue`
  - Label: "Gracias"
  - `to="/gracias"` — navegación estándar, igual que el resto del drawer
[ ] Importar `IconHeart`

### 5.3 — Página GraciasPage.vue

**Archivo:** `src/pages/GraciasPage.vue`

[ ] Es una página completa con su propio `q-page` y header implícito del layout
[ ] Importar `usePublicidad`
[ ] Leer y escribir el contador desde localStorage con clave `'contadorGracias'`
[ ] `contadorGracias`: ref inicializado desde `localStorage.getItem('contadorGracias') || 0`

**UI de la página:**
[ ] Ícono grande de corazón centrado (decorativo)
[ ] Título: "Gracias por tu apoyo"
[ ] Párrafo explicativo breve, sin tecnicismos:
    "Ver un anuncio corto nos ayuda a mantener la app gratuita para todos"
[ ] Si `contadorGracias > 0`: mostrar mensaje amigable "Has dado N gracias ❤️"
[ ] Botón principal: "Ver anuncio" con ícono `IconPlayerPlay`
[ ] Al tocar el botón:
  [ ] Llamar `mostrarRecompensado()` del composable
  [ ] Si retorna `true` (video completado): incrementar contador, guardar en localStorage,
      actualizar `contadorGracias` reactivo, mostrar notificación (`q-notify`)
  [ ] Si retorna `false` (cerró antes): no incrementar, sin notificación

### ⚠️ Nota de diseño

El contador no tiene valor funcional — es solo un dato amigable para el usuario.
No agregar lógica de recompensas ni desbloqueo de funciones.

═══════════════════════════════════════════════════════════════

## 📋 FASE 6: INTERSTITIAL — PREPARACIÓN 🎬 [PENDIENTE]

### Objetivo

Dejar el interstitial listo para usar cuando exista la página de estadísticas.
No se integra en ninguna página actual para no interrumpir el flujo del usuario.

### Patrón de uso (documentación para implementación futura)

Cuando se cree `EstadisticasPage.vue`, aplicar este patrón:

```javascript
// En onMounted de la página de destino:
const { precargarInterstitial, mostrarInterstitial } = usePublicidad()
onMounted(() => precargarInterstitial())

// Al salir de la página (onBeforeUnmount o en alguna acción):
onBeforeUnmount(() => mostrarInterstitial())
```

### ⚠️ Criterio de uso

El interstitial es una pantalla completa que interrumpe al usuario.
Solo usarlo en transiciones naturales (salir de una página, no al entrar).
Nunca mostrarlo dos veces seguidas sin que el usuario haya interactuado.

═══════════════════════════════════════════════════════════════

## 🧪 FASE TESTING: PRUEBAS EN APK [PENDIENTE]

### T.A — Configuración y modo prueba

[ ] `MODO_PRUEBA = true` → los anuncios de prueba de Google aparecen (no los reales)
[ ] `MODO_PRUEBA = false` con IDs `PENDIENTE` → la app no crashea, los anuncios no cargan (esperado)
[ ] En web/browser → no se inicializa AdMob, no hay errores en consola
[ ] En APK → AdMob se inicializa correctamente

### T.B — Banner

[ ] El banner aparece en la parte inferior en todas las pantallas
[ ] El banner no tapa botones de la Mesa de Trabajo
[ ] El banner no tapa el FAB ni contenido con scroll en ninguna página
[ ] El padding del contenido se ajusta correctamente al alto del banner
[ ] El banner no aparece sobre los botones nativos del teléfono (back/home)
[ ] Si no hay conexión: banner no aparece, padding = 0, sin errores
[ ] El banner se mantiene al navegar entre páginas (no desaparece ni parpadea)

### T.C — Botón Gracias y video recompensado

[ ] Ítem "Gracias" visible en el Drawer con ícono corazón
[ ] Al tocar: navega a GraciasPage correctamente
[ ] Botón "Ver anuncio" visible y funcional
[ ] Al tocar botón: el video recompensado se carga y reproduce
[ ] Si el usuario completa el video: contador sube, notificación de agradecimiento
[ ] Si el usuario cierra el video antes: contador no sube, sin notificación
[ ] El contador persiste al cerrar y reabrir la app
[ ] Mensaje "Has dado N gracias" se actualiza inmediatamente tras ver el video
[ ] Primera vez (contador = 0): el mensaje de contador no aparece

### T.D — Interstitial (cuando se implemente estadísticas)

[ ] Se precarga correctamente al entrar a la página
[ ] Se muestra al salir (no al entrar)
[ ] No aparece si el usuario vuelve atrás inmediatamente (no estaba listo)

### T.E — Paso a producción (checklist final antes del AAB)

[ ] Completar los 4 IDs reales en `ConfigPublicidad.js`
[ ] Actualizar el App ID en `AndroidManifest.xml`
[ ] Cambiar `MODO_PRUEBA = false`
[ ] Generar APK de staging y verificar que los anuncios reales cargan
[ ] Verificar que el banner real tiene el alto correcto (puede diferir del de prueba)
[ ] Generar AAB de producción

═══════════════════════════════════════════════════════════════

## NOTAS IMPORTANTES 📌

- La publicidad solo funciona en plataforma nativa — en browser no hace nada (correcto)
- `MODO_PRUEBA` en `ConfigPublicidad.js` es el único lugar a cambiar al publicar
- El App ID en `AndroidManifest.xml` también debe actualizarse con el ID real
- El banner es nativo → no interfiere con los botones del sistema Android
- `altoBanner` es reactivo → el padding se ajusta automáticamente si el banner falla/carga
- El contador de gracias es solo informativo, sin lógica de recompensas
- El interstitial NO se usa en el flujo actual para no interrumpir la experiencia

═══════════════════════════════════════════════════════════════

## 📊 PROGRESO GENERAL: 0% — PENDIENTE

⏳ Fase 1: Instalación del plugin
⏳ Fase 2: Archivo de configuración
⏳ Fase 3: Composable usePublicidad
⏳ Fase 4: Banner en MainLayout
⏳ Fase 5: Botón Gracias + rewarded + contador
⏳ Fase 6: Interstitial — preparación
⏳ Fase Testing

═══════════════════════════════════════════════════════════════

**CREADO:** Marzo 2026
**ÚLTIMA ACTUALIZACIÓN:** Marzo 2026
**ESTADO:** 🚧 PENDIENTE — esperando IDs de producción de AdMob
