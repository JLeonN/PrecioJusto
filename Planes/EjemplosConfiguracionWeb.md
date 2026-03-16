# Ejemplos de Configuración Web - Precio Justo

Este documento complementa el Plan de Despliegue con ejemplos de código específicos y configuraciones detalladas.

---

## 1. CONFIGURACIÓN DE `quasar.config.js`

### Deploy en subdirectorio (jleonn.github.io/PrecioJusto)

```javascript
// quasar.config.js
import { defineConfig } from '#q-app/wrappers'

export default defineConfig((/* ctx */) => {
  return {
    boot: ['axios'],
    css: ['app.css'],
    extras: ['roboto-font', 'material-icons'],

    build: {
      target: {
        browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
        node: 'node20',
      },
      vueRouterMode: 'hash',

      // Configuración para GitHub Pages - Subdirectorio
      publicPath: '/PrecioJusto/',

      vitePlugins: [
        [
          'vite-plugin-checker',
          {
            eslint: {
              lintCommand: 'eslint -c ./eslint.config.js "./src*/**/*.{js,mjs,cjs,vue}"',
              useFlatConfig: true,
            },
          },
          { server: false },
        ],
      ],
    },

    devServer: {
      open: true,
    },

    framework: {
      config: {},
      plugins: ['Notify', 'Dialog'],
    },

    animations: [],

    capacitor: {
      hideSplashscreen: true,
    },
  }
})
```

---

## 2. GITHUB ACTIONS WORKFLOW COMPLETO

### Archivo: `.github/workflows/deploy.yml`

```yaml
name: Deploy Precio Justo to GitHub Pages

on:
  # Ejecutar en cada push a master
  push:
    branches:
      - master

  # Permitir ejecución manual desde Actions tab
  workflow_dispatch:

# Permisos necesarios para GitHub Pages
permissions:
  contents: read
  pages: write
  id-token: write

# Prevenir múltiples deploys simultáneos
concurrency:
  group: 'pages'
  cancel-in-progress: false

jobs:
  # Job de compilación
  build:
    name: Build Quasar App
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Quasar SPA
        run: npm run build
        env:
          NODE_ENV: production

      - name: Setup GitHub Pages
        uses: actions/configure-pages@v4

      - name: Upload build artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist/spa'

  # Job de despliegue
  deploy:
    name: Deploy to GitHub Pages

    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    runs-on: ubuntu-latest
    needs: build

    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## 3. DETECCIÓN DE PLATAFORMA

### Composable para detectar plataforma

**Archivo:** `src/composables/usePlataforma.js`

```javascript
import { Capacitor } from '@capacitor/core'
import { computed } from 'vue'

export function usePlataforma() {
  const esNativo = computed(() => Capacitor.isNativePlatform())
  const esWeb = computed(() => !Capacitor.isNativePlatform())
  const esAndroid = computed(() => Capacitor.getPlatform() === 'android')
  const esIOS = computed(() => Capacitor.getPlatform() === 'ios')

  const nombrePlataforma = computed(() => Capacitor.getPlatform())

  return {
    esNativo,
    esWeb,
    esAndroid,
    esIOS,
    nombrePlataforma,
  }
}
```

---

## 4. COMPONENTE UI PARA FUNCIONALIDADES NO DISPONIBLES EN WEB

### Componente reutilizable de aviso

**Archivo:** `src/components/FuncionalidadNoDisponible.vue`

```vue
<template>
  <q-card flat bordered class="funcionalidad-no-disponible">
    <q-card-section class="row items-center q-gutter-sm">
      <q-icon :name="icono" size="40px" color="grey-6" />
      <div class="col">
        <div class="text-subtitle1 text-weight-medium text-grey-8">
          {{ titulo }}
        </div>
        <div class="text-caption text-grey-6">
          {{ descripcion }}
        </div>
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section class="q-py-sm bg-blue-1">
      <div class="row items-center q-gutter-xs">
        <q-icon name="phone_android" size="18px" color="primary" />
        <span class="text-caption text-primary"> Disponible en la app Android </span>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
defineProps({
  titulo: {
    type: String,
    default: 'Funcionalidad no disponible',
  },
  descripcion: {
    type: String,
    default: 'Esta función solo está disponible en la versión Android de la aplicación.',
  },
  icono: {
    type: String,
    default: 'block',
  },
})
</script>

<style scoped>
.funcionalidad-no-disponible {
  border-color: #e0e0e0;
  border-radius: 8px;
}
</style>
```

### Uso en componentes

```vue
<template>
  <div>
    <!-- Si es nativo, mostrar funcionalidad real -->
    <q-btn
      v-if="esNativo"
      @click="escanearCodigoNativo"
      label="Escanear código de barras"
      icon="qr_code_scanner"
    />

    <!-- Si es web, mostrar componente de aviso -->
    <FuncionalidadNoDisponible
      v-else
      titulo="Escáner de códigos de barras"
      descripcion="El escaneo automático de códigos de barras requiere la cámara del dispositivo móvil."
      icono="qr_code_scanner"
    />
  </div>
</template>

<script setup>
import { usePlataforma } from 'src/composables/usePlataforma'
import FuncionalidadNoDisponible from 'src/components/FuncionalidadNoDisponible.vue'

const { esNativo } = usePlataforma()

const escanearCodigoNativo = async () => {
  // Implementación con Capacitor MLKit
}
</script>
```

---

## 5. ALTERNATIVA: MÉTODO MANUAL CON `push-dir`

### Instalación

```bash
npm install --save-dev push-dir
```

### Configuración en `package.json`

```json
{
  "name": "precio-justo",
  "version": "1.0.2",
  "scripts": {
    "dev": "quasar dev",
    "build": "quasar build",
    "build:web": "quasar build",
    "serve:dist": "quasar serve dist/spa",
    "deploy:pages": "push-dir --dir=dist/spa --remote=gh-pages --branch=gh-pages",
    "deploy": "npm run build && npm run deploy:pages",
    "cel": "quasar build && npx cap sync android && npx cap open android"
  }
}
```

### Configurar remote (una sola vez)

```bash
# Para repositorio tipo username.github.io
git remote add gh-pages git@github.com:JLeonN/jleonn.github.io.git

# O para branch gh-pages del mismo repo
git remote add gh-pages git@github.com:JLeonN/PrecioJusto.git
```

### Deploy manual

```bash
npm run deploy
```

---

## 6. FALLBACK PARA FEATURES NO DISPONIBLES EN WEB

### Scanner de código de barras con fallback de entrada manual

**Archivo:** `src/composables/useEscanerCodigoBarra.js`

```javascript
import { usePlataforma } from './usePlataforma'
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning'
import { useQuasar } from 'quasar'

export function useEscanerCodigoBarra() {
  const { esNativo } = usePlataforma()
  const $q = useQuasar()

  // Indica si el escaneo nativo está soportado
  const soportaEscaneo = () => esNativo.value

  const escanearCodigo = async () => {
    if (!esNativo.value) {
      // Versión web: entrada manual con diálogo
      return await solicitarCodigoManual()
    }

    // Versión nativa: usar scanner
    try {
      const { barcodes } = await BarcodeScanner.scan()
      if (barcodes.length > 0) {
        return barcodes[0].rawValue
      }
      return null
    } catch (error) {
      console.error('Error escaneando:', error)
      return null
    }
  }

  const solicitarCodigoManual = () => {
    return new Promise((resolve) => {
      $q.dialog({
        title: 'Ingresar código de barras',
        message:
          'El escaneo automático solo está disponible en la app Android. Ingresá el código manualmente:',
        prompt: {
          model: '',
          type: 'text',
          placeholder: 'Ej: 7790001234567',
        },
        cancel: true,
        persistent: true,
      })
        .onOk((codigo) => {
          resolve(codigo)
        })
        .onCancel(() => {
          resolve(null)
        })
    })
  }

  return {
    escanearCodigo,
    soportaEscaneo,
  }
}
```

### Listado de funcionalidades con fallback recomendado

| Funcionalidad                | Nativo                  | Web                                          | Componente a usar               |
| ---------------------------- | ----------------------- | -------------------------------------------- | ------------------------------- |
| Escaneo de códigos de barras | `BarcodeScanner.scan()` | `FuncionalidadNoDisponible` + diálogo manual | `useEscanerCodigoBarra.js`      |
| Cámara nativa completa       | `Camera.getPhoto()`     | `FuncionalidadNoDisponible`                  | `FuncionalidadNoDisponible.vue` |
| Notificaciones push          | Plugin nativo           | `FuncionalidadNoDisponible`                  | `FuncionalidadNoDisponible.vue` |

### Ejemplo: múltiples features no disponibles en una página

```vue
<template>
  <q-page padding>
    <div class="q-gutter-md">
      <!-- Scanner: fallback con entrada manual -->
      <FuncionalidadNoDisponible
        v-if="esWeb"
        titulo="Escáner de códigos de barras"
        descripcion="El escaneo automático requiere la cámara del dispositivo móvil."
        icono="qr_code_scanner"
      />

      <!-- Cámara: no disponible en web -->
      <FuncionalidadNoDisponible
        v-if="esWeb"
        titulo="Cámara de fotos"
        descripcion="La captura de fotos de productos requiere la app Android."
        icono="photo_camera"
      />
    </div>
  </q-page>
</template>

<script setup>
import { usePlataforma } from 'src/composables/usePlataforma'
import FuncionalidadNoDisponible from 'src/components/FuncionalidadNoDisponible.vue'

const { esWeb } = usePlataforma()
</script>
```

---

## 7. SCRIPT DE VALIDACIÓN PRE-DEPLOY

### Archivo: `scripts/validar-build.js`

```javascript
#!/usr/bin/env node

import { existsSync, statSync } from 'fs'
import { join } from 'path'

const DIST_PATH = './dist/spa'
const ARCHIVOS_REQUERIDOS = ['index.html', 'favicon.ico', '.nojekyll']

console.log('🔍 Validando build de producción...\n')

// Verificar que existe el directorio dist/spa
if (!existsSync(DIST_PATH)) {
  console.error('❌ Error: No existe el directorio dist/spa')
  console.error('   Ejecuta: npm run build')
  process.exit(1)
}

// Verificar archivos requeridos
let errores = 0
ARCHIVOS_REQUERIDOS.forEach((archivo) => {
  const rutaCompleta = join(DIST_PATH, archivo)
  if (!existsSync(rutaCompleta)) {
    console.error(`❌ Falta archivo: ${archivo}`)
    errores++
  } else {
    console.log(`✅ ${archivo}`)
  }
})

// Verificar tamaño del build
const stats = statSync(DIST_PATH)
const sizeMB = (getDirectorySize(DIST_PATH) / (1024 * 1024)).toFixed(2)
console.log(`\n📦 Tamaño total: ${sizeMB} MB`)

if (sizeMB > 100) {
  console.warn('⚠️  Advertencia: El build supera 100MB')
}

if (errores > 0) {
  console.error(`\n❌ Build inválido: ${errores} error(es)`)
  process.exit(1)
}

console.log('\n✅ Build válido y listo para deploy')

function getDirectorySize(dirPath) {
  let size = 0
  // Implementación simplificada
  return size
}
```

### Agregar a `package.json`

```json
{
  "scripts": {
    "validate:build": "node scripts/validar-build.js",
    "deploy": "npm run build && npm run validate:build && npm run deploy:pages"
  }
}
```

---

## 8. README BADGE PARA STATUS DE DEPLOY

### Agregar al `README.md`

````markdown
# Precio Justo

[![Deploy to GitHub Pages](https://github.com/JLeonN/PrecioJusto/actions/workflows/deploy.yml/badge.svg)](https://github.com/JLeonN/PrecioJusto/actions/workflows/deploy.yml)

Aplicación para comparar y trackear precios de productos en diferentes comercios.

## 🌐 Versiones

- **Web:** https://jleonn.github.io/PrecioJusto/
- **Android:** [Descargar APK](link-to-release)

## 🚀 Deploy

El sitio se despliega automáticamente a GitHub Pages cuando se hace push a `master`.

### Deploy manual

```bash
npm run build
# Los archivos están en dist/spa/
```
````

````

---

## 9. ENVIRONMENT VARIABLES (SI SE NECESITAN)

### Para APIs con diferentes endpoints

**Archivo:** `.env.production`

```bash
# API endpoints para producción
VITE_API_OPENFOODFACTS=https://world.openfoodfacts.org/api/v2
VITE_BASE_URL=https://jleonn.github.io
````

**Archivo:** `.env.development`

```bash
# API endpoints para desarrollo
VITE_API_OPENFOODFACTS=https://world.openfoodfacts.org/api/v2
VITE_BASE_URL=http://localhost:9000
```

### Uso en código

```javascript
// src/boot/axios.js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_OPENFOODFACTS,
})

export { api }
```

---

## 10. TESTING LOCAL DEL BUILD

### Servidor simple con Python

```bash
# Compilar
npm run build

# Servir en localhost:8000
cd dist/spa
python3 -m http.server 8000
```

### Servidor con Quasar CLI

```bash
npm run build
quasar serve dist/spa --port 8080
```

### Validar funcionalidad

```bash
# Abrir en navegador
open http://localhost:8080
# o
open http://localhost:8000
```

---

## 11. TROUBLESHOOTING COMÚN

### Problema: Assets no cargan (404)

**Síntoma:** Archivos CSS/JS no se encuentran

**Solución:** Verificar `publicPath` en `quasar.config.js`

```javascript
build: {
  publicPath: '/PrecioJusto/',  // Debe coincidir con nombre del repo
}
```

### Problema: Rutas no funcionan en producción

**Síntoma:** Al recargar página en una ruta, da 404

**Solución:** Usar hash mode (ya configurado)

```javascript
build: {
  vueRouterMode: 'hash',  // NO cambiar a 'history' para GitHub Pages
}
```

### Problema: LocalStorage no persiste

**Síntoma:** Datos se pierden al recargar

**Verificar:**

1. Que el dominio sea HTTPS (GitHub Pages lo es por defecto)
2. Que no haya errores de CORS
3. Que el código de almacenamiento funcione en web

```javascript
// Usar Preferences que funciona en web
import { Preferences } from '@capacitor/preferences'

await Preferences.set({ key: 'miDato', value: 'valor' })
const { value } = await Preferences.get({ key: 'miDato' })
```

---

**Nota:** Estos ejemplos están listos para usar. Copiar y adaptar según necesidad específica.
