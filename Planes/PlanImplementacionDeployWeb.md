# Plan de Implementación - Deploy Web GitHub Pages

## PLAN PASO A PASO PARA DESPLEGAR PRECIO JUSTO EN GITHUB PAGES

**Objetivo:** Tener la aplicación web funcionando en `https://jleonn.github.io/PrecioJusto/`

**Tiempo estimado total:** 30-45 minutos

**Nivel de dificultad:** Fácil

---

## 📋 PRERREQUISITOS

Antes de comenzar, verifica que tienes:

- [ ] Git instalado y configurado
- [ ] Node.js 22+ instalado
- [ ] Acceso al repositorio GitHub JLeonN/PrecioJusto
- [ ] Editor de código (VS Code recomendado)
- [ ] Terminal/consola abierta

---

## PASO 1: CREAR ARCHIVO `.nojekyll`

**¿Por qué?** GitHub Pages usa Jekyll por defecto. Este archivo le dice que NO lo use.

**¿Dónde?** En la carpeta `public/` del proyecto.

### Instrucciones:

**Opción A - Desde terminal:**

```bash
# Ir a la raíz del proyecto
cd /Users/f.sangiacomo/FranCode/PrecioJusto

# Crear el archivo
touch public/.nojekyll

# Verificar que se creó
ls -la public/.nojekyll
```

**Resultado esperado:**

```
-rw-r--r--  1 usuario  staff  0 Mar 16 10:00 public/.nojekyll
```

**Opción B - Desde VS Code:**

1. Abrir carpeta `public/`
2. Click derecho → New File
3. Nombrar exactamente: `.nojekyll`
4. Dejar el archivo VACÍO (0 bytes)
5. Guardar

### ✅ Validación:

- [ ] El archivo `public/.nojekyll` existe
- [ ] El archivo está vacío (0 bytes)

---

## PASO 2: CONFIGURAR `quasar.config.js`

**¿Por qué?** Necesitamos decirle a Quasar dónde estará hosteada la app.

**¿Qué modificar?** Agregar la propiedad `publicPath` en la sección `build`.

### Instrucciones:

1. **Abrir archivo:** `quasar.config.js`

2. **Localizar la sección `build`** (alrededor de la línea 34):

```javascript
build: {
  target: {
    browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
    node: 'node20',
  },

  vueRouterMode: 'hash', // available values: 'hash', 'history'
  // vueRouterBase,
  // vueDevtools,
  // vueOptionsAPI: false,
```

3. **Agregar/descomentar la línea `publicPath`** (ya existe comentada, descomentar y cambiar):

Cambiar esto:

```javascript
// publicPath: '/',
```

Por esto:

```javascript
  publicPath: '/PrecioJusto/',
```

Resultado final de la sección `build`:

```javascript
build: {
  target: {
    browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
    node: 'node20',
  },

  vueRouterMode: 'hash',
  publicPath: '/PrecioJusto/',

  // vueRouterBase,
  // vueDevtools,
  // vueOptionsAPI: false,
```

4. **Guardar el archivo** (Ctrl+S o Cmd+S)

### ⚠️ IMPORTANTE:

- El valor DEBE incluir `/` al inicio Y al final: `'/PrecioJusto/'`
- DEBE coincidir EXACTAMENTE con el nombre de tu repositorio en GitHub
- Respeta mayúsculas/minúsculas

### ✅ Validación:

- [ ] Línea agregada después de `vueRouterMode`
- [ ] Valor es `'/PrecioJusto/'` (con barras al inicio y fin)
- [ ] Archivo guardado

---

## PASO 3: CREAR ESTRUCTURA PARA GITHUB ACTIONS

**¿Por qué?** GitHub Actions necesita un lugar específico para sus configuraciones.

**¿Qué crear?** Carpeta `.github/workflows/`

### Instrucciones:

**Desde terminal:**

```bash
# Asegúrate de estar en la raíz del proyecto
cd /Users/f.sangiacomo/FranCode/PrecioJusto

# Crear la estructura de carpetas
mkdir -p .github/workflows

# Verificar que se creó
ls -la .github/
```

**Resultado esperado:**

```
drwxr-xr-x   3 usuario  staff   96 Mar 16 10:05 .
drwxr-xr-x  25 usuario  staff  800 Mar 16 10:05 ..
drwxr-xr-x   2 usuario  staff   64 Mar 16 10:05 workflows
```

### ✅ Validación:

- [ ] Carpeta `.github/` existe en la raíz
- [ ] Carpeta `.github/workflows/` existe

---

## PASO 4: CREAR WORKFLOW DE GITHUB ACTIONS

**¿Por qué?** Este archivo le dice a GitHub cómo compilar y desplegar tu app automáticamente.

**¿Qué crear?** Archivo `.github/workflows/deploy.yml`

### Instrucciones:

1. **Crear archivo:** `.github/workflows/deploy.yml`

2. **Copiar EXACTAMENTE este contenido:**

```yaml
name: Deploy Precio Justo to GitHub Pages

on:
  push:
    branches:
      - master
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: false

jobs:
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

3. **Guardar el archivo**

### ⚠️ IMPORTANTE:

- **Rama configurada:** El workflow apunta a `master` (rama principal del repositorio)

- **Indentación:** YAML es sensible a espacios. Usa ESPACIOS, NO tabs
- **No modificar nombres de actions** (actions/checkout@v4, etc.)

### Cómo verificar tu rama principal:

```bash
git branch
# La rama con * es la actual
# La rama principal generalmente es "main" o "master"
```

### ✅ Validación:

- [ ] Archivo `.github/workflows/deploy.yml` creado
- [ ] Contenido copiado COMPLETO
- [ ] Rama correcta configurada (main o master)
- [ ] Archivo guardado

---

## PASO 5: CREAR COMPOSABLE Y COMPONENTE DE ERROR PARA WEB

**¿Por qué?** Las funcionalidades nativas de Android (escáner, cámara, notificaciones) no están disponibles en web. Necesitamos un componente visual que informe al usuario y un composable para detectar la plataforma.

### Instrucciones:

1. **Crear composable de detección de plataforma:**

**Archivo:** `src/composables/usePlataforma.js`

```javascript
import { Capacitor } from '@capacitor/core'
import { computed } from 'vue'

export function usePlataforma() {
  const esNativo = computed(() => Capacitor.isNativePlatform())
  const esWeb = computed(() => !Capacitor.isNativePlatform())
  const esAndroid = computed(() => Capacitor.getPlatform() === 'android')

  const nombrePlataforma = computed(() => Capacitor.getPlatform())

  return {
    esNativo,
    esWeb,
    esAndroid,
    nombrePlataforma,
  }
}
```

2. **Crear componente UI de error:**

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

3. **Uso en cualquier componente:**

```vue
<template>
  <div>
    <q-btn v-if="esNativo" @click="escanear" label="Escanear" icon="qr_code_scanner" />
    <FuncionalidadNoDisponible
      v-else
      titulo="Escáner de códigos de barras"
      descripcion="El escaneo automático requiere la cámara del dispositivo móvil."
      icono="qr_code_scanner"
    />
  </div>
</template>

<script setup>
import { usePlataforma } from 'src/composables/usePlataforma'
import FuncionalidadNoDisponible from 'src/components/FuncionalidadNoDisponible.vue'

const { esNativo } = usePlataforma()
</script>
```

### ✅ Validación:

- [ ] Composable `src/composables/usePlataforma.js` creado
- [ ] Componente `src/components/FuncionalidadNoDisponible.vue` creado
- [ ] El componente se muestra correctamente en web (ejecutar `npm run dev`)
- [ ] En web muestra el aviso; en nativo muestra la funcionalidad real

---

## PASO 6: VERIFICAR `package.json`

**¿Por qué?** GitHub Actions ejecutará `npm run build`, debemos asegurarnos que existe.

### Instrucciones:

1. **Abrir:** `package.json`

2. **Buscar sección `scripts`** (alrededor de línea 9):

```json
"scripts": {
  "lint": "eslint -c ./eslint.config.js \"./src*/**/*.{js,cjs,mjs,vue}\"",
  "format": "prettier --write \"**/*.{js,vue,css,html,md,json}\" --ignore-path .gitignore",
  "test": "echo \"No test specified\" && exit 0",
  "dev": "quasar dev",
  "build": "quasar build",  // ← VERIFICAR QUE EXISTE
  "postinstall": "quasar prepare",
  "cel": "quasar build && npx cap sync android && npx cap open android"
}
```

3. **Confirmar que existe la línea:**
   ```json
   "build": "quasar build",
   ```

### ✅ Validación:

- [ ] Script `"build": "quasar build"` existe
- [ ] (Si no existe, agregarlo)

---

## PASO 7: TESTING LOCAL ANTES DE COMMIT

**¿Por qué?** Validar que la compilación funciona ANTES de subir a GitHub.

### Instrucciones:

1. **Compilar el proyecto:**

```bash
npm run build
```

**Resultado esperado:**

```
✓ built in X seconds
 build  Build folder ready at dist/spa
```

2. **Verificar que se creó la carpeta:**

```bash
ls -la dist/spa/
```

**Debes ver archivos como:**

- `index.html`
- `favicon.ico`
- `.nojekyll`
- carpetas `assets/`, `icons/`, etc.

3. **Servir localmente para probar:**

```bash
npx quasar serve dist/spa
```

**O alternativamente:**

```bash
cd dist/spa
python3 -m http.server 8000
```

4. **Abrir navegador en:**

- Si usas quasar serve: `http://localhost:4000`
- Si usas Python: `http://localhost:8000`

5. **Validar que funciona:**

- [ ] La app carga
- [ ] Puedes navegar entre páginas
- [ ] No hay errores en consola (F12 → Console)

6. **Detener el servidor:** `Ctrl+C` en la terminal

### ✅ Validación:

- [ ] `npm run build` ejecuta sin errores
- [ ] Carpeta `dist/spa/` existe y tiene contenido
- [ ] Archivo `dist/spa/.nojekyll` existe
- [ ] App funciona localmente
- [ ] No hay errores en consola del navegador

---

## PASO 8: COMMIT DE CAMBIOS

**¿Por qué?** Necesitamos guardar nuestros cambios en Git antes de subirlos.

### Instrucciones:

1. **Ver qué archivos cambiaron:**

```bash
git status
```

**Deberías ver:**

```
Changes not staged for commit:
  modified:   quasar.config.js

Untracked files:
  .github/
  public/.nojekyll
  src/composables/usePlataforma.js
  src/components/FuncionalidadNoDisponible.vue
```

2. **Agregar TODOS los archivos modificados:**

```bash
git add .
```

3. **Verificar que se agregaron:**

```bash
git status
```

**Deberías ver:**

```
Changes to be committed:
  new file:   .github/workflows/deploy.yml
  modified:   quasar.config.js
  new file:   public/.nojekyll
  new file:   src/composables/usePlataforma.js
  new file:   src/components/FuncionalidadNoDisponible.vue
```

4. **Hacer commit:**

```bash
git commit -m "feat: configurar deploy automático a GitHub Pages"
```

**Resultado esperado:**

```
[master abc1234] feat: configurar deploy automático a GitHub Pages
 3 files changed, 52 insertions(+)
 create mode 100644 .github/workflows/deploy.yml
 create mode 100644 public/.nojekyll
```

### ✅ Validación:

- [ ] `git status` muestra archivos en "Changes to be committed"
- [ ] Commit creado exitosamente
- [ ] Mensaje de commit claro y descriptivo

---

## PASO 9: PUSH A GITHUB

**¿Por qué?** Subir los cambios a GitHub para que GitHub Actions pueda ejecutarse.

### Instrucciones:

1. **Subir cambios:**

```bash
git push origin master
```

**Resultado esperado:**

```
Enumerating objects: 8, done.
Counting objects: 100% (8/8), done.
Delta compression using up to 8 threads
Compressing objects: 100% (5/5), done.
Writing objects: 100% (6/6), 1.23 KiB | 1.23 MiB/s, done.
Total 6 (delta 2), reused 0 (delta 0), pack-reused 0
remote: Resolving deltas: 100% (2/2), completed with 1 local object.
To github.com:JLeonN/PrecioJusto.git
   abc1234..def5678  master -> master
```

2. **Si hay error de autenticación:**

```bash
# Configurar credenciales si es necesario
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"

# Intentar push nuevamente
git push origin master
```

### ✅ Validación:

- [ ] Push ejecutado sin errores
- [ ] Mensaje confirma que se subieron los cambios

---

## PASO 10: CONFIGURAR GITHUB PAGES EN EL REPOSITORIO

**¿Por qué?** Debemos decirle a GitHub que use GitHub Actions para el deploy.

### Instrucciones:

1. **Ir a GitHub en el navegador:**
   - URL: https://github.com/JLeonN/PrecioJusto

2. **Ir a Settings:**
   - Click en tab **"Settings"** (arriba a la derecha)
   - Si no lo ves, click en el menú "..." → "Settings"

3. **Ir a Pages:**
   - En el sidebar izquierdo, bajo "Code and automation"
   - Click en **"Pages"**

4. **Configurar Source:**
   - En la sección "Build and deployment"
   - Bajo "Source", seleccionar: **"GitHub Actions"**
   - (NO seleccionar "Deploy from a branch")

5. **Verificar configuración:**
   - Debe decir: "Source: GitHub Actions"
   - NO debe haber ninguna rama seleccionada

6. **Dejar todo lo demás por defecto**

### ✅ Validación:

- [ ] En Settings → Pages
- [ ] Source está en "GitHub Actions"
- [ ] No hay errores mostrados

---

## PASO 11: VERIFICAR PERMISOS DE GITHUB ACTIONS

**¿Por qué?** GitHub Actions necesita permisos para desplegar.

### Instrucciones:

1. **Desde Settings (donde ya estás):**
   - Sidebar izquierdo → "Actions" → "General"

2. **Scroll hasta "Workflow permissions"**

3. **Verificar que esté seleccionado:**
   - **"Read and write permissions"**
   - O al menos: "Read repository contents and packages permissions"

4. **Si está en "Read repository contents permissions only":**
   - Seleccionar "Read and write permissions"
   - Click en **"Save"**

### ✅ Validación:

- [ ] Permisos de workflow verificados
- [ ] "Read and write permissions" seleccionado

---

## PASO 12: MONITOREAR GITHUB ACTIONS

**¿Por qué?** Ver el progreso del deployment en tiempo real.

### Instrucciones:

1. **Ir al tab "Actions":**
   - En el repositorio GitHub
   - Click en tab **"Actions"** (arriba)

2. **Ver el workflow en ejecución:**
   - Deberías ver: "Deploy Precio Justo to GitHub Pages"
   - Estado: 🟡 amarillo (running) o 🟢 verde (success)
   - Si ves 🔴 rojo, hay un error (ver troubleshooting)

3. **Click en el workflow** para ver detalles

4. **Expandir los jobs:**
   - Click en "build" para ver pasos del build
   - Click en "deploy" para ver pasos del deployment

5. **Esperar a que termine:**
   - Tiempo estimado: 2-4 minutos primera vez
   - Verás checkmarks ✓ verdes cuando completen

6. **Verificar que TODO está verde:**
   - [ ] Job "build" → ✓ verde
   - [ ] Job "deploy" → ✓ verde

### Qué ver en cada step:

**Job: build**

- ✓ Checkout repository
- ✓ Setup Node.js
- ✓ Install dependencies (puede tomar 1-2 min)
- ✓ Build Quasar SPA (puede tomar 30-60 seg)
- ✓ Setup GitHub Pages
- ✓ Upload build artifact

**Job: deploy**

- ✓ Deploy to GitHub Pages

### ✅ Validación:

- [ ] Workflow ejecutado completamente
- [ ] Todos los steps en verde
- [ ] No hay errores

---

## PASO 13: OBTENER URL DE PRODUCCIÓN

**¿Por qué?** Necesitamos la URL para acceder a la app.

### Instrucciones:

**Opción A - Desde GitHub Actions:**

1. En el workflow que acabó de ejecutar
2. Click en el job "deploy"
3. Expandir step "Deploy to GitHub Pages"
4. Buscar línea que dice: `Deployed to: https://...`
5. Copiar esa URL

**Opción B - Desde Settings:**

1. Settings → Pages
2. En la parte superior verás un mensaje:
   ```
   Your site is live at https://jleonn.github.io/PrecioJusto/
   ```
3. Copiar esa URL

**Opción C - Construir manualmente:**

La URL será: `https://jleonn.github.io/PrecioJusto/`

### ✅ Validación:

- [ ] URL obtenida
- [ ] URL copiada al portapapeles

---

## PASO 14: VALIDAR SITIO EN PRODUCCIÓN

**¿Por qué?** Asegurarnos que todo funciona en producción.

### Instrucciones:

1. **Abrir la URL en navegador:**
   - Pegar: `https://jleonn.github.io/PrecioJusto/`
   - Esperar a que cargue (primera vez puede tomar 1-2 minutos)

2. **Testing básico - Navegación:**
   - [ ] La página principal carga
   - [ ] No hay pantalla blanca
   - [ ] No hay error 404
   - [ ] Puedes ver el contenido de la app

3. **Testing básico - Funcionalidad:**
   - [ ] Click en menú funciona
   - [ ] Navegar a "Productos" funciona
   - [ ] Navegar a "Comercios" funciona
   - [ ] Volver atrás funciona

4. **Abrir consola del navegador (F12):**
   - [ ] No hay errores en rojo
   - [ ] No hay warnings críticos

5. **Testing de datos:**
   - [ ] Agregar un producto de prueba
   - [ ] Recargar página (F5)
   - [ ] Verificar que el producto sigue ahí (LocalStorage funciona)

6. **Testing responsive:**
   - F12 → Toggle device toolbar
   - Probar en vista móvil
   - [ ] Se ve bien en mobile
   - [ ] Se ve bien en tablet
   - [ ] Se ve bien en desktop

### ✅ Validación COMPLETA:

- [ ] Sitio carga correctamente
- [ ] Navegación funciona
- [ ] LocalStorage persiste datos
- [ ] No hay errores en consola
- [ ] Responsive funciona

---

## PASO 15: DOCUMENTAR EN README

**¿Por qué?** Para que otros (y tú en el futuro) sepan dónde está el sitio.

### Instrucciones:

1. **Abrir:** `README.md`

2. **Agregar al principio (después del título):**

```markdown
# Precio Justo

[![Deploy to GitHub Pages](https://github.com/JLeonN/PrecioJusto/actions/workflows/deploy.yml/badge.svg)](https://github.com/JLeonN/PrecioJusto/actions/workflows/deploy.yml)

Aplicación para comparar y trackear precios de productos en diferentes comercios.

## 🌐 Demo en Vivo

**Web:** https://jleonn.github.io/PrecioJusto/

## 📱 Plataformas

- **Web (GitHub Pages):** Acceso desde cualquier navegador
- **Android:** Aplicación nativa con Capacitor

> **Nota:** Algunas funcionalidades como el escaneo de códigos de barras solo están disponibles en la versión Android.

## 🚀 Deploy

La versión web se despliega automáticamente a GitHub Pages cuando se hace push a la rama `master`.

---
```

3. **Guardar el archivo**

4. **Commit y push:**

```bash
git add README.md
git commit -m "docs: agregar enlace a demo en vivo"
git push origin master
```

### ✅ Validación:

- [ ] README.md actualizado
- [ ] Badge de deploy agregado
- [ ] URL de producción documentada
- [ ] Cambios commiteados y pusheados

---

## PASO 16: PRUEBA DE DEPLOY AUTOMÁTICO

**¿Por qué?** Verificar que futuros cambios se despliegan automáticamente.

### Instrucciones:

1. **Hacer un cambio menor visible:**

Abrir `src/pages/IndexPage.vue` y hacer un pequeño cambio. Actualmente la página está vacía, cambiar:

```vue
<template>
  <q-page class="flex flex-center">
    <!-- Vacío por ahora -->
  </q-page>
</template>
```

Por:

```vue
<template>
  <q-page class="flex flex-center">
    <div class="text-h4 text-grey-7">Precio Justo - Web</div>
  </q-page>
</template>
```

2. **Guardar el archivo**

3. **Commit y push:**

```bash
git add src/pages/IndexPage.vue
git commit -m "test: validar deploy automático"
git push origin master
```

4. **Monitorear GitHub Actions:**
   - Ir a Actions tab
   - Ver que se ejecuta automáticamente
   - Esperar a que termine

5. **Validar en producción:**
   - Ir a `https://jleonn.github.io/PrecioJusto/`
   - Recargar página (Ctrl+Shift+R para forzar recarga)
   - Verificar que se ve el cambio (el texto "Precio Justo - Web")

### ✅ Validación:

- [ ] Cambio hecho localmente
- [ ] Push ejecutado
- [ ] GitHub Actions se ejecutó automáticamente
- [ ] Cambio visible en producción

---

## 🎉 IMPLEMENTACIÓN COMPLETADA

### Checklist Final de Éxito:

- [ ] ✅ Archivo `.nojekyll` creado
- [ ] ✅ `quasar.config.js` configurado con `publicPath: '/PrecioJusto/'`
- [ ] ✅ Composable `usePlataforma.js` creado
- [ ] ✅ Componente `FuncionalidadNoDisponible.vue` creado
- [ ] ✅ GitHub Actions workflow creado (apuntando a `master`)
- [ ] ✅ Build local exitoso
- [ ] ✅ Cambios pusheados a GitHub
- [ ] ✅ GitHub Pages configurado correctamente
- [ ] ✅ Workflow ejecutado sin errores
- [ ] ✅ Sitio accesible en `https://jleonn.github.io/PrecioJusto/`
- [ ] ✅ Todas las funcionalidades core funcionan
- [ ] ✅ Features no disponibles en web muestran componente de error
- [ ] ✅ LocalStorage persiste datos
- [ ] ✅ README.md actualizado
- [ ] ✅ Deploy automático validado

### URLs Importantes:

| Recurso            | URL                                                  |
| ------------------ | ---------------------------------------------------- |
| **Producción**     | https://jleonn.github.io/PrecioJusto/                |
| **Repositorio**    | https://github.com/JLeonN/PrecioJusto                |
| **GitHub Actions** | https://github.com/JLeonN/PrecioJusto/actions        |
| **Settings Pages** | https://github.com/JLeonN/PrecioJusto/settings/pages |

### Próximos Deploys:

Ahora, cada vez que hagas:

```bash
git push origin master
```

GitHub Actions automáticamente:

1. Compilará la app
2. La desplegará a GitHub Pages
3. Estará disponible en 2-3 minutos

**¡No necesitas hacer nada más! 🚀**

---

## 🆘 TROUBLESHOOTING

### Error: "Build failed" en GitHub Actions

**Ver logs:**

1. Actions tab → Click en workflow fallido
2. Click en job "build"
3. Expandir step que tiene ❌ rojo
4. Leer mensaje de error

**Causas comunes:**

**Error: `npm ci` falla**

- Solución: Verificar que `package-lock.json` está commiteado
- Ejecutar localmente: `rm -rf node_modules package-lock.json && npm install`
- Commit y push

**Error: `npm run build` falla**

- Solución: Ejecutar `npm run build` localmente
- Solucionar errores que aparezcan
- Commit y push

### Error: Sitio muestra 404

**Esperar:** Primera vez puede tomar 2-3 minutos

**Verificar:**

1. Settings → Pages → Source está en "GitHub Actions"
2. Actions → Último workflow está en verde
3. URL correcta: `https://jleonn.github.io/PrecioJusto/` (con /PrecioJusto/)

### Error: Assets no cargan (CSS/JS 404)

**Causa:** `publicPath` incorrecto

**Solución:**

1. Abrir `quasar.config.js`
2. Verificar: `publicPath: '/PrecioJusto/',`
3. Debe tener `/` al inicio Y al final
4. Debe ser EXACTAMENTE el nombre del repo
5. Commit y push

### Error: Cambios no se reflejan en producción

**Causa:** Cache del navegador

**Solución:**

1. Recargar forzando: `Ctrl+Shift+R` (Windows/Linux) o `Cmd+Shift+R` (Mac)
2. O abrir en ventana incógnita
3. O limpiar cache del navegador

### Error: LocalStorage no funciona

**Verificar:**

1. Abrir consola (F12)
2. Tab "Application" → Storage → Local Storage
3. Debería mostrar datos

**Si no funciona:**

- Verificar que estás en HTTPS (GitHub Pages lo hace automático)
- Revisar consola por errores
- Verificar código de storage en la app

---

## 📝 NOTAS IMPORTANTES

### Mantenimiento

- **Deploy automático:** Cada push a `master` despliega automáticamente
- **Tiempo de deploy:** 2-4 minutos
- **Límites GitHub Pages:** 100GB bandwidth/mes, 1GB tamaño repo

### Desarrollo Local

```bash
# Desarrollar
npm run dev

# Compilar para web
npm run build

# Compilar para Android
npm run cel
```

### Features Web vs Android

**✅ Disponible en ambas:**

- CRUD Productos
- CRUD Comercios
- Búsqueda
- LocalStorage
- APIs externas

**❌ Solo Android:**

- Escaneo códigos de barras
- Cámara nativa completa
- Notificaciones push

---

**Fecha de implementación:** **\*\***\_\_\_**\*\***

**Implementado por:** **\*\***\_\_\_**\*\***

**Versión:** 1.0

**Estado:** ✅ COMPLETADO
