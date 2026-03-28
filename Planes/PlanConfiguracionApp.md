# PLAN DE TRABAJO - CONFIGURACION DE LA APP

Proyecto: Precio Justo
Fecha inicio: 28 de Marzo 2026
Responsable: Leo + CH

═══════════════════════════════════════════════════════════════════════

## 📖 DESCRIPCIÓN DEL PLAN

Este plan detalla la creación del apartado de Configuración de la app,
accesible desde el drawer mediante una página propia. El objetivo es
centralizar preferencias globales del usuario en un lugar claro y estable,
empezando por la configuración de moneda predeterminada.

La primera versión de Configuración se enfoca en resolver un problema
importante del estado actual: hoy la moneda usada dentro de varios
formularios también se guarda como preferencia global, mezclando dos
conceptos que deben quedar separados.

Este plan define una nueva lógica:

- La moneda predeterminada de la app se configura solo desde Configuración.
- La moneda elegida dentro de un precio puntual pertenece solo a ese precio.
- La app puede usar modo automático según el país detectado.
- Si la detección automática falla, se usa la última moneda manual guardada.

La pantalla de Configuración debe quedar preparada para crecer en el futuro
con más secciones de la app, sin quedar diseñada solo para moneda.

### OBJETIVOS PRINCIPALES:

- Agregar un botón de `Configuración` en el drawer, siempre abajo del todo.
- Crear una página nueva `Configuración` con estructura escalable.
- Separar correctamente moneda global vs moneda local de cada precio.
- Permitir modo manual y modo automático para la moneda predeterminada.
- Detectar país/región del dispositivo sin usar GPS en esta primera versión.
- Resolver una moneda predeterminada efectiva única para toda la app.
- Mantener persistencia estable al reiniciar la app.

### REGLAS DE NEGOCIO DE MONEDA:

- `moneda del precio`: moneda del registro puntual que el usuario está cargando.
- `moneda predeterminada`: moneda usada para precargar formularios nuevos.
- `modo automático`: la moneda predeterminada se calcula según país detectado.
- `modo manual`: la moneda predeterminada sale de la moneda elegida por el usuario.
- Si falla la detección automática, usar la última moneda manual guardada.
- Cambiar la moneda dentro de un formulario NO modifica la preferencia global.
- El próximo formulario SIEMPRE vuelve a usar la moneda predeterminada efectiva.

### MODELO DE PREFERENCIAS PROPUESTO:

- `modoMoneda`: `'automatica' | 'manual'`
- `monedaManual`: última moneda elegida manualmente por el usuario
- `paisDetectado`: región detectada del dispositivo, si existe
- `monedaDetectada`: moneda inferida a partir del país detectado
- `monedaDefaultEfectiva`: computed o getter central con la regla final

### CRITERIOS DE UX:

- Configuración debe sentirse como una sección del sistema, no como un modal.
- La pantalla debe poder crecer con nuevas secciones futuras.
- El usuario debe entender claramente qué moneda es global y cuál es local.
- Si el modo automático está activo, mostrar el país detectado y la moneda resultante.
- Si falla la detección, informar que se usa la última moneda manual guardada.

═══════════════════════════════════════════════════════════════════════

## 📋 FASE 1: MODELO DE PREFERENCIAS Y PERSISTENCIA ⚙️ [PENDIENTE]

### Objetivo

Rediseñar la preferencia de moneda para que la app deje de tratar cualquier
cambio local como si fuera una preferencia global.

### PreferenciasService.js

[x] Revisar la estructura actual de `preferencias_usuario`
[x] Agregar soporte para `modoMoneda`
[x] Agregar soporte para `monedaManual`
[x] Agregar soporte para `paisDetectado`
[x] Agregar soporte para `monedaDetectada`
[x] Mantener compatibilidad con datos viejos que solo tengan `moneda`
[x] Definir fallback seguro si faltan campos
[x] Persistir la nueva estructura sin romper la app existente

### preferenciasStore.js

[x] Reemplazar el modelo actual basado solo en `moneda`
[x] Exponer estado reactivo de `modoMoneda`
[x] Exponer estado reactivo de `monedaManual`
[x] Exponer estado reactivo de `paisDetectado`
[x] Exponer estado reactivo de `monedaDetectada`
[x] Implementar `monedaDefaultEfectiva`
[x] Crear acciones separadas para guardar modo manual/automático
[x] Crear acción específica para guardar la moneda manual
[x] Evitar que los formularios sigan cambiando la preferencia global

### Compatibilidad

[x] Si existe preferencia vieja `moneda`, migrarla razonablemente a `monedaManual`
[x] Si no existe nada guardado, arrancar con un estado por defecto coherente
[x] Mantener la inicialización única desde `MainLayout.vue`

═══════════════════════════════════════════════════════════════════════

## 📋 FASE 2: DETECCIÓN AUTOMÁTICA DE PAÍS Y MONEDA 🌍 [PENDIENTE]

### Objetivo

Resolver una moneda predeterminada automática sin depender de GPS ni permisos
de ubicación en esta primera versión.

### Estrategia técnica

[x] Crear utilidad o servicio para detectar región del dispositivo
[x] Priorizar APIs disponibles sin permisos invasivos
[x] Evaluar `Intl.Locale`, `navigator.language`, `navigator.languages` o equivalente
[x] Extraer código de país si la región viene informada
[x] Mapear país → moneda predeterminada
[x] Definir fallback si no hay región válida

### Reglas de resolución

[x] Si `modoMoneda = manual` → usar `monedaManual`
[x] Si `modoMoneda = automatica` y hay país válido → usar `monedaDetectada`
[x] Si `modoMoneda = automatica` y falla la detección → usar `monedaManual`
[x] Si también falta `monedaManual`, usar fallback técnico final seguro

### Casos delicados

[x] Idioma sin región (`es`, `en`) no debe tomarse como país válido
[x] Región desconocida no debe romper la app
[x] El resultado detectado debe guardarse solo como dato de contexto, no como decisión manual
[x] La app no debe pedir permisos de ubicación para esta fase

═══════════════════════════════════════════════════════════════════════

## 📋 FASE 3: PÁGINA CONFIGURACIÓN 🧩 [PENDIENTE]

### Objetivo

Crear una página nueva orientada a preferencias globales del usuario, con una
estructura visual preparada para sumar nuevas secciones a futuro.

### Archivo nuevo

[x] Crear `src/pages/ConfiguracionPage.vue`

### Estructura base

[x] Header/título claro de la sección
[x] Contenedor principal con diseño consistente con el resto de la app
[x] Organización por bloques o tarjetas de configuración
[x] Espacio preparado para futuras opciones

### Sección Moneda

[x] Mostrar bloque `Moneda predeterminada`
[x] Agregar switch o selector para `Usar moneda automática según país`
[x] Si automático está activo, mostrar país detectado
[x] Si automático está activo, mostrar moneda resultante
[x] Si automático falla, mostrar mensaje de fallback a moneda manual
[x] Si manual está activo, mostrar selector de monedas
[x] Guardar cambios directamente en preferencias globales

### Textos explicativos

[x] Aclarar que esta configuración define la moneda inicial de formularios nuevos
[x] Aclarar que cambiar la moneda de un precio puntual no cambia la preferencia general
[x] Aclarar que la detección automática depende de la región detectada del dispositivo

═══════════════════════════════════════════════════════════════════════

## 📋 FASE 4: INTEGRACIÓN EN DRAWER Y NAVEGACIÓN 🧭 [PENDIENTE]

### Objetivo

Agregar acceso claro a Configuración desde el drawer y asegurar que quede
siempre abajo del todo, independientemente del resto de opciones.

### MainLayout.vue

[x] Agregar ítem `Configuración` en el drawer
[x] Usar ícono consistente con el resto del sistema
[x] Ubicarlo siempre abajo del todo
[x] Mantener separado visualmente del bloque principal de navegación
[ ] Verificar comportamiento con scroll del drawer
[ ] Verificar que Mesa de trabajo siga funcionando sin desplazar Configuración

### Router

[x] Crear ruta nueva para Configuración
[x] Integrarla bajo `MainLayout.vue`
[ ] Verificar navegación desde drawer
[ ] Verificar botón back nativo en Android

═══════════════════════════════════════════════════════════════════════

## 📋 FASE 5: DESACOPLAR MONEDA LOCAL VS PREFERENCIA GLOBAL 🔄 [PENDIENTE]

### Objetivo

Corregir todos los flujos actuales donde la moneda usada en una carga puntual
termina guardándose como si fuera preferencia global.

### Revisión de componentes y flujos

[x] Revisar `FormularioPrecio.vue`
[x] Revisar `DialogoAgregarPrecio.vue`
[x] Revisar `DialogoAgregarProducto.vue`
[x] Revisar `TarjetaEscaneo.vue`
[x] Revisar `TarjetaProductoBorrador.vue`
[x] Revisar cualquier otro flujo donde hoy se invoque `guardarMoneda()`

### Cambios esperados

[x] Inicializar formularios nuevos con `monedaDefaultEfectiva`
[x] Permitir cambiar la moneda local del precio sin tocar Configuración
[x] Guardar en el precio la moneda realmente elegida para ese registro
[x] Evitar side effects globales al editar moneda en formularios
[x] Mantener consistencia entre alta manual, escaneo rápido, mesa y edición

### Criterios funcionales

[ ] Si la preferencia global es `EUR`, un formulario nuevo abre en `EUR`
[ ] Si el usuario cambia ese precio puntual a `USD`, solo ese precio queda en `USD`
[ ] El siguiente formulario vuelve a abrir en `EUR`
[ ] Si automático está activo y detecta `UYU`, el siguiente formulario abre en `UYU`

═══════════════════════════════════════════════════════════════════════

## 📋 FASE 6: AJUSTES DE UX Y DOCUMENTACIÓN INTERNA 📝 [PENDIENTE]

### Objetivo

Dejar la experiencia consistente y evitar que el usuario interprete mal el
significado de moneda predeterminada vs moneda de un precio puntual.

### UX

[ ] Revisar textos de ayuda en Configuración
[ ] Revisar labels relacionados a moneda en formularios
[ ] Evitar wording ambiguo como si toda moneda cambiara globalmente
[ ] Confirmar que el flujo manual/automático se entienda sin explicación externa

### Documentación interna

[ ] Actualizar resúmenes si corresponde
[ ] Documentar la nueva regla de `monedaDefaultEfectiva`
[ ] Documentar fallback cuando falla la detección automática
[ ] Dejar claro qué componentes ya no deben persistir preferencia global

═══════════════════════════════════════════════════════════════════════

## 🧪 FASE TESTING [VALIDADA PARCIALMENTE]

### T.A — Configuración manual

[x] Entrar a Configuración desde el drawer
[x] Verificar que el botón está siempre abajo del todo
[x] Desactivar modo automático
[x] Elegir una moneda manual
[x] Cerrar y reabrir la app
[x] Verificar persistencia correcta de la moneda manual

### T.B — Configuración automática

[x] Activar modo automático
[x] Verificar que se muestra país detectado si existe
[x] Verificar que se muestra moneda detectada si existe
[x] Si no se detecta país, verificar mensaje de fallback
[x] Verificar que en fallback se usa la última moneda manual guardada

### T.C — Formularios nuevos

[x] Abrir `DialogoAgregarProducto`
[x] Verificar que la moneda inicial coincide con `monedaDefaultEfectiva`
[x] Abrir `DialogoAgregarPrecio`
[x] Verificar que la moneda inicial coincide con `monedaDefaultEfectiva`
[x] Abrir flujo de escaneo rápido
[x] Verificar que la moneda inicial coincide con `monedaDefaultEfectiva` en el estado interno del flujo

### T.D — Moneda local de precio

[x] En un formulario nuevo, cambiar moneda solo para ese precio
[x] Guardar el precio y verificar que se persiste con esa moneda puntual
[x] Abrir un nuevo formulario
[x] Verificar que NO quedó como preferencia global accidental

### T.E — Regresiones

[x] Verificar que Mesa de trabajo sigue funcionando
[x] Verificar que `TarjetaProductoBorrador` no pisa Configuración
[x] Verificar que `TarjetaEscaneo` no pisa Configuración
[x] Verificar que formularios viejos con datos existentes no rompen
[x] Verificar compatibilidad con preferencias viejas migradas

### T.F — Navegación

[x] Verificar ida y vuelta desde drawer
[ ] Verificar botón back nativo en Android
[x] Verificar comportamiento visual en móvil
[x] Verificar que el drawer sigue ordenado correctamente con y sin items en Mesa

═══════════════════════════════════════════════════════════════════════

## ⚠️ RIESGOS Y BUGS POSIBLES

- Componentes viejos pueden seguir llamando `guardarMoneda()` y pisar la preferencia global.
- La detección de región puede devolver idioma sin país y generar falsos positivos.
- Si no se migra bien la preferencia vieja, algunos usuarios podrían perder su moneda manual previa.
- Configuración puede mostrar un estado distinto al efectivamente usado si la resolución de moneda no se centraliza.
- El drawer puede perder la posición fija de Configuración si no se separa bien el layout superior/inferior.
- Algunos formularios podrían inicializar con la última moneda editada en memoria en vez de usar la preferencia efectiva.

═══════════════════════════════════════════════════════════════════════

## 📊 PROGRESO GENERAL: 75% — IMPLEMENTACIÓN BASE COMPLETADA

- [ ] Fase 1: Modelo de preferencias y persistencia
- [ ] Fase 2: Detección automática de país y moneda
- [ ] Fase 3: Página Configuración
- [ ] Fase 4: Integración en drawer y navegación
- [ ] Fase 5: Desacoplar moneda local vs preferencia global
- [ ] Fase 6: Ajustes de UX y documentación interna
- [ ] Fase Testing

**ESTADO:** 🚧 Implementación base validada; queda pendiente solo la verificación del botón back nativo en Android
