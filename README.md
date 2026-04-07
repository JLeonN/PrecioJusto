# Precio Justo (precio-justo)

Aplicación para comparar y trackear precios de productos en diferentes comercios

## Install the dependencies

```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
quasar dev
```

### Lint the files

```bash
yarn lint
# or
npm run lint
```

### Format the files

```bash
yarn format
# or
npm run format
```

### Build the app for production

```bash
quasar build
```

## Simbolos de depuracion Android (Play Console)

Este proyecto ya genera simbolos nativos en `release` con:

- `android/app/build.gradle` -> `ndk.debugSymbolLevel 'SYMBOL_TABLE'`

Flujo recomendado por release Android:

1. Generar release Android completo (bundle + zip de simbolos + validacion):

```bash
npm run androidReleaseConSimbolos
```

2. Si queres ejecutar por pasos:

```bash
npm run androidReleaseBundle
npm run androidEmpaquetarSimbolos
npm run androidVerificarSimbolos
```

3. Archivos esperados despues del build:

- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- Simbolos: `android/app/build/outputs/native-debug-symbols/release/native-debug-symbols.zip`

4. Subir a Play Console (cuando aparezca advertencia o si queres asegurarlo manualmente):

- `Test and release` -> `App bundle explorer`
- Elegir el artifact/version
- Pestaña `Downloads` -> seccion `Assets`
- Subir `native-debug-symbols.zip` en `debug symbols`

Nota tecnica: con App Bundle + AGP 4.1+ Play puede tomar los simbolos automaticamente desde el bundle, pero en este proyecto los `.so` nativos vienen de dependencias de terceros y no siempre se genera el zip automatico en `outputs`. Por eso se agrega `androidEmpaquetarSimbolos`, que crea `native-debug-symbols.zip` desde `android/app/build/intermediates/merged_native_libs/release/mergeReleaseNativeLibs/out/lib`.

## Sistema de actualizacion en GitHub Pages

- La app publica `public/version.json` en GitHub Pages junto al build.
- `version.json` se genera automaticamente desde la version real de `package.json`.
- La URL de `version.json` es absoluta y se calcula desde el remote de GitHub.

### Generar version.json manualmente

```bash
npm run generarVersionJson
```

### Estructura de version.json

```json
{
  "versionDisponible": "1.1.10",
  "urlPlayStore": "https://play.google.com/store/apps/details?id=com.preciojusto.app",
  "mostrarActualizacion": true
}
```

### Fuente oficial de version

- Archivo oficial: `package.json` campo `version`.
- Android debe mantener `android/app/build.gradle` alineado con esa version.

### Flujo para publicar una nueva version sin romper avisos

1. Actualizar la version del proyecto.
2. Ejecutar `npm run build` (genera `version.json` automaticamente).
3. Publicar a `master` para que GitHub Actions despliegue Pages.
4. Verificar que `https://JLeonN.github.io/PrecioJusto/version.json` responda.

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).
