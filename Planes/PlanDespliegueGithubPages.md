# Plan de Despliegue Web - GitHub Pages

## Resumen Ejecutivo

Este documento detalla la investigación y el plan para compilar la aplicación Quasar/Vue.js "Precio Justo" para web y publicarla en GitHub Pages.

---

## 1. INVESTIGACIÓN Y HALLAZGOS

### 1.1 Estado Actual del Proyecto

**Configuración actual:**

- Framework: Quasar v2.16.0 con Vite (`@quasar/app-vite`)
- Repositorio: `git@github.com:JLeonN/PrecioJusto.git`
- Compilación actual: Android (Capacitor)
- Directorio de salida web: `dist/spa` (configurado en `capacitor.config.json`)
- Modo de router: `hash` (configurado en `quasar.config.js:40`)

**Scripts actuales en `package.json`:**

```json
{
  "dev": "quasar dev",
  "build": "quasar build",
  "cel": "quasar build && npx cap sync android && npx cap open android"
}
```

### 1.2 Compilación para Web (SPA)

Quasar ya está configurado para compilar en modo SPA por defecto. El comando:

```bash
quasar build
```

Genera automáticamente:

- **Directorio de salida:** `/dist/spa`
- **Contenido:** HTML, CSS, JS minificados y optimizados
- **Modo router:** Hash mode (compatible con GitHub Pages sin configuración adicional)

**Ventajas del modo hash:**

- No requiere configuración especial del servidor
- Compatible directo con GitHub Pages
- URLs con `#` (ej: `https://usuario.github.io/#/productos`)

### 1.3 Opciones de Despliegue en GitHub Pages

#### Opción A: Usuario/Organización

- **Repositorio:** `<username>.github.io`
- **URL resultante:** `https://jleonn.github.io/`
- **Requiere:** `publicPath` configurado como `/`
- **Ventaja:** URL limpia en dominio raíz

#### Opción B: Proyecto específico ⭐ ELEGIDA

- **Repositorio:** `PrecioJusto` (repo actual)
- **URL resultante:** `https://jleonn.github.io/PrecioJusto/`
- **Requiere:** `publicPath` configurado como `/PrecioJusto/'`
- **Ventaja:** Permite múltiples proyectos, no requiere nuevo repo

### 1.4 Métodos de Publicación

#### Método 1: GitHub Actions (RECOMENDADO)

**Ventajas:**

- Automatización completa
- Deploy automático en cada push
- No requiere comandos manuales
- Integración nativa con GitHub

**Proceso:**

1. Configurar workflow en `.github/workflows/deploy.yml`
2. Push a la rama principal
3. GitHub Actions compila y despliega automáticamente

#### Método 2: Push Manual con `push-dir`

**Ventajas:**

- Control manual del deploy
- Útil para validar antes de publicar

**Proceso:**

1. Instalar: `npm install --save-dev push-dir`
2. Configurar script en `package.json`
3. Ejecutar: `npm run build && npm run deploy`

#### Método 3: Branch `gh-pages` manual

**Ventajas:**

- Simple para proyectos pequeños
- Sin dependencias adicionales

**Proceso:**

1. Compilar: `quasar build`
2. Copiar contenido de `dist/spa` a rama `gh-pages`
3. Push a GitHub

---

## 2. CONFIGURACIONES NECESARIAS

### 2.1 Configuración en `quasar.config.js`

**Para Opción B - Subdirectorio (elegida):**

```javascript
build: {
  publicPath: '/PrecioJusto/',
  // ... resto de configuración
}
```

### 2.2 Archivo `.nojekyll`

Crear archivo vacío `.nojekyll` en carpeta `public/` para que GitHub Pages no procese con Jekyll:

```bash
touch public/.nojekyll
```

### 2.3 Configuración de Cache (Importante)

GitHub Pages debe configurarse para NO cachear `index.html`:

**En el workflow de GitHub Actions:**

```yaml
# Se configura automáticamente con actions/deploy-pages
```

---

## 3. PLAN DE IMPLEMENTACIÓN

### FASE 1: Preparación del Proyecto

**Tarea 1.1: Decidir estrategia de deploy**

- [ ] Elegir entre Opción A (dominio raíz) u Opción B (subdirectorio)
- [ ] Confirmar nombre del repositorio a usar

**Tarea 1.2: Configurar `quasar.config.js`**

- [ ] Agregar `publicPath` según opción elegida
- [ ] Validar configuración de `vueRouterMode: 'hash'`

**Tarea 1.3: Agregar archivo `.nojekyll`**

- [ ] Crear archivo en carpeta `public/`
- [ ] Commit del archivo

### FASE 2: Configuración de GitHub Actions (RECOMENDADO)

**Tarea 2.1: Crear workflow file**

- [ ] Crear directorio `.github/workflows/`
- [ ] Crear archivo `deploy.yml` con configuración

**Tarea 2.2: Configurar permisos en GitHub**

- [ ] Ir a Settings > Pages
- [ ] Seleccionar Source: "GitHub Actions"

**Tarea 2.3: Agregar script de build**

- [ ] Validar que `package.json` tenga script `build`

### FASE 3: Testing y Validación

**Tarea 3.1: Compilación local**

- [ ] Ejecutar: `quasar build`
- [ ] Verificar directorio `dist/spa`
- [ ] Validar rutas de assets

**Tarea 3.2: Test local**

- [ ] Servir archivos localmente: `quasar serve dist/spa`
- [ ] Validar navegación y funcionalidad

**Tarea 3.3: Deploy inicial**

- [ ] Push a rama principal
- [ ] Monitorear GitHub Actions
- [ ] Validar deployment exitoso

**Tarea 3.4: Pruebas en producción**

- [ ] Validar carga de la aplicación
- [ ] Probar todas las rutas principales
- [ ] Verificar funcionamiento de APIs
- [ ] Validar LocalStorage (funcionalidad offline)

### FASE 4: Documentación y Mantenimiento

**Tarea 4.1: Actualizar README.md**

- [ ] Documentar URL de producción
- [ ] Agregar badge de deploy status
- [ ] Documentar proceso de deploy

**Tarea 4.2: Agregar scripts útiles**

- [ ] Script `deploy:preview` para testing
- [ ] Script `build:web` específico

---

## 4. WORKFLOW DE GITHUB ACTIONS (Plantilla)

Crear archivo: `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - master # Rama principal del repositorio
  workflow_dispatch: # Permite ejecución manual

# Permisos necesarios para GitHub Pages
permissions:
  contents: read
  pages: write
  id-token: write

# Prevenir deploys concurrentes
concurrency:
  group: 'pages'
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout código
        uses: actions/checkout@v4

      - name: Configurar Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Instalar dependencias
        run: npm ci

      - name: Compilar aplicación Quasar
        run: npm run build

      - name: Configurar Pages
        uses: actions/configure-pages@v4

      - name: Subir artefacto
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist/spa'

  deploy:
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

## 5. SCRIPTS ADICIONALES PARA `package.json`

```json
{
  "scripts": {
    "dev": "quasar dev",
    "build": "quasar build",
    "build:web": "quasar build",
    "serve:dist": "quasar serve dist/spa",
    "cel": "quasar build && npx cap sync android && npx cap open android"
  }
}
```

---

## 6. CONSIDERACIONES TÉCNICAS

### 6.1 Compatibilidad con Capacitor

La aplicación puede mantener AMBAS compilaciones:

- **Android:** mediante `npm run cel`
- **Web:** mediante `npm run build`

Ambas usan el mismo código fuente.

### 6.2 Plugins de Capacitor

Los siguientes plugins NO funcionarán en web:

- `@capacitor-mlkit/barcode-scanning`
- `@capacitor/camera` (funciona parcialmente con API web)

**Solución:** Implementar detección de plataforma, componente de error UI y fallbacks:

```javascript
import { Capacitor } from '@capacitor/core'

if (Capacitor.isNativePlatform()) {
  // Usar plugin nativo
} else {
  // Mostrar componente FuncionalidadNoDisponible
  // Ver EjemplosConfiguracionWeb.md sección 4
}
```

### 6.3 LocalStorage y Preferences

- `@capacitor/preferences` funciona en web con localStorage
- La funcionalidad offline debería mantenerse

### 6.4 Modo Router

**Hash mode (actual):** `https://site.com/#/productos`

- ✅ Compatible con GitHub Pages sin config
- ✅ No requiere configuración de servidor
- ❌ URLs con `#`

**History mode (alternativa):**

- ✅ URLs limpias: `https://site.com/productos`
- ❌ Requiere configuración especial en GitHub Pages
- ❌ Necesita archivo `404.html` con workaround

**Recomendación:** Mantener hash mode para GitHub Pages.

---

## 7. LIMITACIONES Y ADVERTENCIAS

### 7.1 GitHub Pages

- Sitios públicos (incluso en repos privados con plan Free)
- Límite de tamaño: 1GB
- Límite de ancho de banda: 100GB/mes
- Máximo 10 builds por hora

### 7.2 Features no disponibles en web

- Escaneo de códigos de barras (requiere implementación web alternativa)
- Acceso completo a cámara (solo funcionalidad básica)
- Notificaciones push nativas

### 7.3 APIs de terceros

Validar que las APIs usadas (OpenFoodFacts, etc.) permitan CORS desde el dominio de GitHub Pages.

---

## 8. TESTING CHECKLIST

Antes de considerar el deploy exitoso, validar:

- [ ] **Carga inicial:** La app carga correctamente
- [ ] **Navegación:** Todas las rutas funcionan
- [ ] **LocalStorage:** Datos se persisten correctamente
- [ ] **Búsqueda:** Sistema de búsqueda funciona
- [ ] **APIs externas:** OpenFoodFacts responde correctamente
- [ ] **Imágenes:** Assets cargan correctamente
- [ ] **Responsive:** Funciona en diferentes tamaños de pantalla
- [ ] **Comercios:** CRUD de comercios funciona
- [ ] **Productos:** CRUD de productos funciona
- [ ] **Performance:** Tiempos de carga aceptables

---

## 9. RECURSOS Y REFERENCIAS

### Documentación oficial

- [Quasar SPA Deployment](https://quasar.dev/quasar-cli-vite/developing-spa/deploying)
- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [GitHub Actions for Pages](https://github.com/actions/deploy-pages)

### Herramientas útiles

- [Quasar CLI](https://quasar.dev/start/quasar-cli)
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)

---

## 10. PRÓXIMOS PASOS

1. ~~**Decidir estrategia:**~~ Opción B (subdirectorio `/PrecioJusto/`) - DECIDIDO
2. **Configurar proyecto:** Descomentar y modificar `publicPath` en `quasar.config.js`
3. **Crear componente UI de error:** `FuncionalidadNoDisponible.vue` para features solo Android
4. **Implementar GitHub Actions:** Crear workflow file apuntando a rama `master`
5. **Testing:** Validar compilación local
6. **Deploy:** Push y monitorear despliegue
7. **Validación:** Ejecutar testing checklist completo

---

**Fecha de creación:** 16 de marzo de 2026  
**Versión:** 1.0  
**Estado:** Investigación completada - Listo para implementación
