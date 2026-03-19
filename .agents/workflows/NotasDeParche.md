---
description: Flujo completo de release: lectura de commits, incremento de versión, actualización de archivos, build, commit, tag y generación de notas de parche.
---

// turbo-all

1. **Leer Commits**: 
   - `(git tag --sort=-version:refname | Select-Object -First 1)` (obtener último tag)
   - `git log {último_tag}..HEAD --oneline` (resumen)
   - `git log {último_tag}..HEAD --pretty=format:"%s %b"` (detalles)
2. **Versión**: 
   - Leer `package.json` -> increment patch (`+1`).
3. **Actualizar Archivos**: 
   - `package.json` -> `version`
   - Si existe `android/app/build.gradle`: `versionCode++`, `versionName = nueva_version`.
4. **Documentación**: 
   - Si existe `Planes/Resumenes/`: actualizar `Resumen1General.md` con cambios y versión.
5. **Build**: 
   - Detectar tipo (`capacitor`, `quasar`, `vite`) y ejecutar build correspondiente. **Detenerse si falla**.
6. **Release**: 
   - `git add -A`
   - `git commit -m "v{versión}" -m "{descripción técnica}"`
   - `git tag v{versión}`
   - `git status`
7. **Notas de Parche**: 
   - Generar notas con emojis (< 450 chars) en español e inglés en un solo bloque de código.

No realizar push. No pedir confirmación. Detenerse solo en error de build.
