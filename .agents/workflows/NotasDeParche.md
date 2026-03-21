---
description: Flujo completo de release: lectura de commits, incremento de versión, actualización de archivos, build, commit, tag y generación de notas de parche.
---

// turbo-all

# /NotasDeParche

Ejecuta el flujo completo de release. Sigue estos pasos en orden sin preguntar nada.

---

## PASO 1 — Leer commits desde el último tag

Corre en paralelo:

- `git tag --sort=-version:refname | head -1` — obtener el último tag
- `git log {último_tag}..HEAD --oneline` — commits desde ese tag
- `git log {último_tag}..HEAD --pretty=format:"%s %b"` — mensajes completos para las notas

Con esa información, prepará internamente:

- Lista de cambios para generar las notas de parche
- Resumen técnico de lo que cambió para actualizar la documentación

---

## PASO 2 — Calcular nueva versión

1. Leé la versión actual de `package.json` (campo `"version"`)
2. Incrementá el último número en 1 (patch): `1.0.2 → 1.0.3`
3. Guardá la nueva versión para usarla en los pasos siguientes

---

## PASO 3 — Actualizar archivos de versión

**Siempre:** Actualizá el campo `"version"` en `package.json`

**Si existe `android/app/build.gradle`:**

- Incrementá `versionCode` en 1
- Actualizá `versionName` con la nueva versión

Verificá que ambos archivos queden con la misma versión antes de continuar.

---

## PASO 4 — Actualizar documentación (si aplica)

**Si existe la carpeta `Planes/Resumenes/`:**

Revisá los commits del PASO 1 e identificá qué cambió en el proyecto. Luego actualizá los resúmenes existentes que correspondan:

- Priorizá siempre `Resumen1General.md` — contiene la versión actual, estado del proyecto y estructura de archivos
- Solo actualizá los resúmenes donde haya información desactualizada o nueva
- No creés resúmenes nuevos salvo que sea realmente necesario
- Sé breve y claro; si algún tema está poco explicado, desarrollalo un poco más
- Estos resúmenes deben ser útiles tanto para IAs como para personas

**Si la carpeta no existe:** Saltá este paso.

---

## PASO 5 — Detectar tipo de proyecto y compilar

Detectá el tipo de proyecto verificando qué archivos existen:

| Condición                                              | Comando                                                        |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| Existe `capacitor.config.json` o `capacitor.config.ts` | `quasar build && npx cap sync android && npx cap open android` |
| Existe `quasar.config.js` (sin Capacitor)              | `quasar build`                                                 |
| Existe `vite.config.js` o `vite.config.ts`             | `npm run build`                                                |
| Ninguno de los anteriores                              | `npm run build`                                                |

Si el build falla, detenete y reportá el error. No sigas con el commit ni el tag.

---

## PASO 6 — Commit + tag

Solo si el build fue exitoso.

Seguí exactamente las mismas reglas que `/commit`:

- Stagear todo: `git add -A`
- **Título del commit:** `v{nueva versión}` (ej: `v1.0.3`) — máximo 4 palabras
- **Descripción:** breve, clara y técnica en Markdown — describe todo el trabajo incluido en esta versión
- Formato exacto del commit:

```
git commit -m "$(cat <<'EOF'
v1.0.3

Descripción aquí
)"
```

- Después del commit, creá el tag: `git tag v{nueva versión}`
- Corré `git status` para verificar que quedó limpio

---

## PASO 7 — Mostrar notas de parche

Generá las notas basándote en los commits del PASO 1.

**Reglas:**

- Máximo 450 caracteres por versión
- Incluir emojis
- Lenguaje simple, orientado al usuario final (sin tecnicismos)
- Dos versiones: español latinoamericano (`es-419`) e inglés (`en-US`)
- Estructura idéntica en ambas versiones

Entregá ambas versiones dentro de un único bloque de código:

```
<es-419>
versión en español aquí
</es-419>

<en-US>
english version here
</en-US>
```

---

## REGLAS ESTRICTAS

- No preguntes nada antes ni después
- No hagas push
- Si el build falla, detenete y reportá el error claramente
- El tag solo se crea si el commit fue exitoso
