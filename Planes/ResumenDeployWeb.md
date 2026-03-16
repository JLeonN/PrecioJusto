# Resumen Rápido - Deploy Web GitHub Pages

## TL;DR - Pasos para Deploy

### 1. Preparación (5 minutos)

```bash
# Crear archivo .nojekyll
touch public/.nojekyll
```

Modificar `quasar.config.js` (descomentar y cambiar `publicPath`):

```javascript
build: {
  publicPath: '/PrecioJusto/',
  vueRouterMode: 'hash',
}
```

### 2. GitHub Actions (10 minutos)

Crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [master]
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
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: './dist/spa'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

### 3. Configurar GitHub (2 minutos)

1. Ir a Settings → Pages
2. Source: "GitHub Actions"
3. Listo

### 4. Deploy (automático)

```bash
git add .
git commit -m "feat: configurar deploy a GitHub Pages"
git push origin master
```

GitHub Actions se encargará del resto. La app estará en:

- `https://jleonn.github.io/PrecioJusto/`

---

## Decisiones Tomadas

### Opción B: Subdirectorio ⭐ ELEGIDA

- **Repo:** `PrecioJusto` (actual)
- **URL:** `https://jleonn.github.io/PrecioJusto/`
- **publicPath:** `'/PrecioJusto/'`
- **Rama:** `master`

---

## Features Web vs Nativo

### ✅ Funciona en Web

- LocalStorage (via Preferences)
- Navegación completa
- CRUD de productos/comercios
- Búsqueda
- APIs externas (OpenFoodFacts)

### ❌ NO Funciona en Web

- Escaneo de códigos de barras
- Cámara nativa completa
- Notificaciones push

**Solución:** Detectar plataforma y mostrar componente `FuncionalidadNoDisponible.vue`:

```vue
<FuncionalidadNoDisponible
  v-if="esWeb"
  titulo="Escáner de códigos de barras"
  descripcion="El escaneo automático requiere la cámara del dispositivo móvil."
  icono="qr_code_scanner"
/>
```

Ver detalles completos en `EjemplosConfiguracionWeb.md` secciones 3, 4 y 6.

---

## Testing Rápido

```bash
# Compilar
npm run build

# Servir localmente
quasar serve dist/spa

# Abrir http://localhost:4000
```

Validar:

- ✅ Carga la app
- ✅ Navegación funciona
- ✅ LocalStorage persiste
- ✅ APIs responden

---

## Problemas Comunes

**Assets no cargan:** Verificar `publicPath` correcto

**Rutas dan 404:** Usar `vueRouterMode: 'hash'` (ya configurado)

**GitHub Actions falla:** Verificar permisos en Settings → Actions → General → Workflow permissions

---

## Documentos Completos

- **Plan de despliegue:** `PlanDespliegueGithubPages.md`
- **Plan de implementación paso a paso:** `PlanImplementacionDeployWeb.md`
- **Ejemplos de código:** `EjemplosConfiguracionWeb.md`
- **Checklist completo:** `ChecklistDeployGithubPages.md`
