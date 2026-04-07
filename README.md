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
  "versionDisponible": "1.1.9",
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
