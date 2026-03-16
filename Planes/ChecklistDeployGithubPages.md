# Checklist Deploy GitHub Pages - Precio Justo

---

## 🎯 OBJETIVO

Desplegar la aplicación Precio Justo en GitHub Pages usando GitHub Actions para deploy automático.

**URL objetivo:** `https://jleonn.github.io/` o `https://jleonn.github.io/PrecioJusto/`

---

## ✅ PRE-REQUISITOS

- [ ] Cuenta de GitHub activa
- [ ] Repositorio PrecioJusto con acceso de escritura
- [ ] Node.js 22+ instalado localmente
- [ ] Git configurado localmente

---

## 📋 FASE 1: DECISIÓN DE ESTRATEGIA

### Elegir tipo de deployment:

**Opción A: Dominio Raíz** ⭐ RECOMENDADO

- [ ] Crear nuevo repositorio `jleonn.github.io`
- [ ] Mover código a nuevo repositorio
- [ ] Configurar `publicPath: '/'`
- [ ] URL final: `https://jleonn.github.io/`

**Opción B: Subdirectorio del Repo Actual**

- [ ] Mantener repositorio actual `PrecioJusto`
- [ ] Configurar `publicPath: '/PrecioJusto/'`
- [ ] URL final: `https://jleonn.github.io/PrecioJusto/`

**Decisión tomada:** ******\_******

---

## 📋 FASE 2: CONFIGURACIÓN DEL PROYECTO

### 2.1 Archivo `.nojekyll`

- [ ] Crear archivo `public/.nojekyll` (vacío)
  ```bash
  touch public/.nojekyll
  ```
- [ ] Verificar que existe: `ls public/.nojekyll`

### 2.2 Modificar `quasar.config.js`

- [ ] Abrir `quasar.config.js`
- [ ] Localizar sección `build`
- [ ] Agregar configuración de `publicPath`:

**Si elegiste Opción A:**

```javascript
build: {
  publicPath: '/',
  // ...resto
}
```

**Si elegiste Opción B:**

```javascript
build: {
  publicPath: '/PrecioJusto/',
  // ...resto
}
```

- [ ] Verificar que `vueRouterMode: 'hash'` está configurado
- [ ] Guardar archivo

### 2.3 Actualizar `package.json`

- [ ] Abrir `package.json`
- [ ] Verificar que existe script `"build": "quasar build"`
- [ ] (Opcional) Agregar script útil: `"serve:dist": "quasar serve dist/spa"`

---

## 📋 FASE 3: GITHUB ACTIONS

### 3.1 Crear estructura de directorios

- [ ] Crear carpeta `.github/workflows/`
  ```bash
  mkdir -p .github/workflows
  ```

### 3.2 Crear workflow file

- [ ] Crear archivo `.github/workflows/deploy.yml`
- [ ] Copiar contenido del workflow (ver `EjemplosConfiguracionWeb.md`)
- [ ] Verificar que la rama en `branches:` coincide con tu rama principal
  - [ ] `main` (recomendado)
  - [ ] `master` (si usas master)

### 3.3 Validar sintaxis YAML

- [ ] Verificar indentación correcta (usar espacios, NO tabs)
- [ ] Verificar que no hay errores de sintaxis
- [ ] (Opcional) Usar validador online: https://www.yamllint.com/

---

## 📋 FASE 4: TESTING LOCAL

### 4.1 Compilación local

- [ ] Ejecutar: `npm install` (si es necesario)
- [ ] Ejecutar: `npm run build`
- [ ] Verificar que se creó carpeta `dist/spa`
- [ ] Verificar que `dist/spa/index.html` existe
- [ ] Verificar que `dist/spa/.nojekyll` existe

### 4.2 Servir localmente

- [ ] Ejecutar: `quasar serve dist/spa`
- [ ] O alternativamente: `npx http-server dist/spa -p 8080`
- [ ] Abrir navegador en `http://localhost:4000` (o el puerto mostrado)

### 4.3 Validaciones funcionales

- [ ] La app carga correctamente
- [ ] Navegación entre páginas funciona
- [ ] LocalStorage persiste datos
- [ ] Búsqueda de productos funciona
- [ ] CRUD de comercios funciona
- [ ] CRUD de productos funciona
- [ ] (Si aplica) API de OpenFoodFacts responde
- [ ] No hay errores en consola del navegador

---

## 📋 FASE 5: COMMIT Y PUSH

### 5.1 Git status

- [ ] Ejecutar: `git status`
- [ ] Verificar archivos modificados:
  - [ ] `public/.nojekyll`
  - [ ] `quasar.config.js`
  - [ ] `.github/workflows/deploy.yml`
  - [ ] `package.json` (si se modificó)

### 5.2 Commit

- [ ] Ejecutar: `git add .`
- [ ] Ejecutar: `git commit -m "feat: configurar deploy automático a GitHub Pages"`
- [ ] Verificar commit: `git log -1`

### 5.3 Push

- [ ] Ejecutar: `git push origin main` (o `master`)
- [ ] Verificar que el push fue exitoso

---

## 📋 FASE 6: CONFIGURAR GITHUB PAGES

### 6.1 Configuración en GitHub

- [ ] Ir a repositorio en GitHub
- [ ] Click en **Settings**
- [ ] Sidebar → **Pages** (bajo "Code and automation")
- [ ] En "Build and deployment":
  - [ ] Source: Seleccionar **"GitHub Actions"**
  - [ ] (NO seleccionar "Deploy from a branch")
- [ ] (Opcional) Custom domain: dejar vacío por ahora

### 6.2 Permisos de Workflow

- [ ] Ir a **Settings** → **Actions** → **General**
- [ ] Scroll a "Workflow permissions"
- [ ] Verificar que esté seleccionado:
  - [ ] **"Read and write permissions"** (recomendado)
  - O al menos **"Read repository contents and packages permissions"**
- [ ] (Si cambias algo) Click en **Save**

---

## 📋 FASE 7: MONITOREAR DEPLOYMENT

### 7.1 Ver GitHub Actions

- [ ] Ir a tab **Actions** en GitHub
- [ ] Ver workflow "Deploy to GitHub Pages"
- [ ] Debe estar en estado "Running" (amarillo) o "Success" (verde)
- [ ] Click en el workflow para ver detalles

### 7.2 Verificar Jobs

- [ ] Ver job "build"
  - [ ] Step "Checkout repository" - exitoso
  - [ ] Step "Setup Node.js" - exitoso
  - [ ] Step "Install dependencies" - exitoso
  - [ ] Step "Build Quasar SPA" - exitoso
  - [ ] Step "Upload build artifact" - exitoso

- [ ] Ver job "deploy"
  - [ ] Step "Deploy to GitHub Pages" - exitoso

### 7.3 Tiempo estimado

- [ ] Primer deploy: 3-5 minutos
- [ ] Deploys subsecuentes: 2-3 minutos

---

## 📋 FASE 8: VALIDACIÓN EN PRODUCCIÓN

### 8.1 Acceder al sitio

- [ ] Obtener URL de producción:
  - GitHub Actions → último workflow → job "deploy" → output URL
  - O construir manualmente: `https://jleonn.github.io/` o `https://jleonn.github.io/PrecioJusto/`
- [ ] Abrir URL en navegador
- [ ] Esperar a que cargue (puede tomar 1-2 minutos la primera vez)

### 8.2 Testing funcional completo

**Navegación:**

- [ ] Página principal carga
- [ ] Navegación a "Productos" funciona
- [ ] Navegación a "Comercios" funciona
- [ ] Navegación a "Agregar Producto" funciona
- [ ] Navegación con botón "Atrás" funciona

**Funcionalidad de Productos:**

- [ ] Buscar producto funciona
- [ ] Ver detalle de producto funciona
- [ ] Agregar nuevo producto funciona
- [ ] Editar producto funciona
- [ ] Eliminar producto funciona
- [ ] Los datos persisten al recargar página

**Funcionalidad de Comercios:**

- [ ] Listar comercios funciona
- [ ] Agregar comercio funciona
- [ ] Editar comercio funciona
- [ ] Eliminar comercio funciona
- [ ] Los datos persisten al recargar página

**Búsqueda y APIs:**

- [ ] Búsqueda general funciona
- [ ] (Si aplica) Búsqueda en OpenFoodFacts funciona
- [ ] No hay errores de CORS en consola

**Responsive y UI:**

- [ ] Se ve bien en desktop
- [ ] Se ve bien en tablet (usar DevTools)
- [ ] Se ve bien en móvil (usar DevTools)
- [ ] Iconos cargan correctamente
- [ ] Imágenes cargan correctamente

**Performance:**

- [ ] Carga inicial < 3 segundos
- [ ] Navegación entre páginas es fluida
- [ ] No hay lag perceptible

### 8.3 Testing en diferentes navegadores

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (si disponible)
- [ ] Edge (si disponible)

---

## 📋 FASE 9: DOCUMENTACIÓN

### 9.1 Actualizar README.md

- [ ] Agregar badge de deploy status:
  ```markdown
  [![Deploy](https://github.com/JLeonN/PrecioJusto/actions/workflows/deploy.yml/badge.svg)](https://github.com/JLeonN/PrecioJusto/actions/workflows/deploy.yml)
  ```
- [ ] Agregar sección con URL de producción
- [ ] Documentar diferencias entre versión web y nativa

### 9.2 Crear archivo CHANGELOG (opcional)

- [ ] Documentar versión web inicial
- [ ] Listar features disponibles en web
- [ ] Listar features solo disponibles en móvil

---

## 📋 FASE 10: MANTENIMIENTO

### 10.1 Futuras actualizaciones

- [ ] Entender que cada push a `main` triggerea deploy automático
- [ ] Monitorear GitHub Actions en cada deploy
- [ ] Validar que el sitio sigue funcionando después de updates

### 10.2 Rollback (si algo sale mal)

- [ ] Opción 1: Revertir commit: `git revert HEAD && git push`
- [ ] Opción 2: Hacer hotfix y push
- [ ] Opción 3: Deshabilitar temporalmente workflow

---

## 🎉 DEPLOY COMPLETADO

### Checklist Final

- [ ] ✅ Sitio accesible en URL de producción
- [ ] ✅ Todas las funcionalidades core funcionan
- [ ] ✅ No hay errores en consola
- [ ] ✅ Datos persisten correctamente
- [ ] ✅ GitHub Actions configurado correctamente
- [ ] ✅ README.md actualizado

### URLs Importantes

**Producción:** **********************\_\_\_**********************

**GitHub Actions:** https://github.com/JLeonN/PrecioJusto/actions

**Repositorio:** https://github.com/JLeonN/PrecioJusto

---

## 📝 NOTAS Y OBSERVACIONES

_Espacio para anotar problemas encontrados, soluciones aplicadas, o mejoras futuras:_

```
Fecha: _____________
Observaciones:




```

---

## 🆘 TROUBLESHOOTING

### GitHub Actions falla en "Build"

**Síntoma:** Error en step "Build Quasar SPA"

**Solución:**

1. Verificar que `npm run build` funciona localmente
2. Revisar logs en GitHub Actions para ver error específico
3. Verificar que dependencias están en `package.json`

### Sitio da 404

**Síntoma:** Al acceder a la URL, GitHub muestra 404

**Solución:**

1. Verificar que GitHub Pages está habilitado (Settings → Pages)
2. Verificar que Source está en "GitHub Actions"
3. Esperar 2-3 minutos después del deploy
4. Verificar que el workflow completó exitosamente

### Assets no cargan (CSS/JS 404)

**Síntoma:** El HTML carga pero los archivos CSS/JS dan 404

**Solución:**

1. Verificar `publicPath` en `quasar.config.js` coincide con la URL
2. Si usas subdirectorio, debe ser `publicPath: '/NombreRepo/'`
3. Recompilar y volver a deployar

### LocalStorage no funciona

**Síntoma:** Los datos no persisten entre recargas

**Solución:**

1. Verificar que el sitio se sirve por HTTPS (GitHub Pages lo hace automáticamente)
2. Revisar consola del navegador para errores
3. Verificar que el código de storage está correcto

---

**Versión del checklist:** 1.0  
**Última actualización:** 16 de marzo de 2026
