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

[ ] Revisar la estructura actual de `preferencias_usuario`
[ ] Agregar soporte para `modoMoneda`
[ ] Agregar soporte para `monedaManual`
[ ] Agregar soporte para `paisDetectado`
[ ] Agregar soporte para `monedaDetectada`
[ ] Mantener compatibilidad con datos viejos que solo tengan `moneda`
[ ] Definir fallback seguro si faltan campos
[ ] Persistir la nueva estructura sin romper la app existente

### preferenciasStore.js

[ ] Reemplazar el modelo actual basado solo en `moneda`
[ ] Exponer estado reactivo de `modoMoneda`
[ ] Exponer estado reactivo de `monedaManual`
[ ] Exponer estado reactivo de `paisDetectado`
[ ] Exponer estado reactivo de `monedaDetectada`
[ ] Implementar `monedaDefaultEfectiva`
[ ] Crear acciones separadas para guardar modo manual/automático
[ ] Crear acción específica para guardar la moneda manual
[ ] Evitar que los formularios sigan cambiando la preferencia global

### Compatibilidad

[ ] Si existe preferencia vieja `moneda`, migrarla razonablemente a `monedaManual`
[ ] Si no existe nada guardado, arrancar con un estado por defecto coherente
[ ] Mantener la inicialización única desde `MainLayout.vue`

═══════════════════════════════════════════════════════════════════════

## 📋 FASE 2: DETECCIÓN AUTOMÁTICA DE PAÍS Y MONEDA 🌍 [PENDIENTE]

### Objetivo

Resolver una moneda predeterminada automática sin depender de GPS ni permisos
de ubicación en esta primera versión.

### Estrategia técnica

[ ] Crear utilidad o servicio para detectar región del dispositivo
[ ] Priorizar APIs disponibles sin permisos invasivos
[ ] Evaluar `Intl.Locale`, `navigator.language`, `navigator.languages` o equivalente
[ ] Extraer código de país si la región viene informada
[ ] Mapear país → moneda predeterminada
[ ] Definir fallback si no hay región válida

### Reglas de resolución

[ ] Si `modoMoneda = manual` → usar `monedaManual`
[ ] Si `modoMoneda = automatica` y hay país válido → usar `monedaDetectada`
[ ] Si `modoMoneda = automatica` y falla la detección → usar `monedaManual`
[ ] Si también falta `monedaManual`, usar fallback técnico final seguro

### Casos delicados

[ ] Idioma sin región (`es`, `en`) no debe tomarse como país válido
[ ] Región desconocida no debe romper la app
[ ] El resultado detectado debe guardarse solo como dato de contexto, no como decisión manual
[ ] La app no debe pedir permisos de ubicación para esta fase

═══════════════════════════════════════════════════════════════════════

## 📋 FASE 3: PÁGINA CONFIGURACIÓN 🧩 [PENDIENTE]

### Objetivo

Crear una página nueva orientada a preferencias globales del usuario, con una
estructura visual preparada para sumar nuevas secciones a futuro.

### Archivo nuevo

[ ] Crear `src/pages/ConfiguracionPage.vue`

### Estructura base

[ ] Header/título claro de la sección
[ ] Contenedor principal con diseño consistente con el resto de la app
[ ] Organización por bloques o tarjetas de configuración
[ ] Espacio preparado para futuras opciones

### Sección Moneda

[ ] Mostrar bloque `Moneda predeterminada`
[ ] Agregar switch o selector para `Usar moneda automática según país`
[ ] Si automático está activo, mostrar país detectado
[ ] Si automático está activo, mostrar moneda resultante
[ ] Si automático falla, mostrar mensaje de fallback a moneda manual
[ ] Si manual está activo, mostrar selector de monedas
[ ] Guardar cambios directamente en preferencias globales

### Textos explicativos

[ ] Aclarar que esta configuración define la moneda inicial de formularios nuevos
[ ] Aclarar que cambiar la moneda de un precio puntual no cambia la preferencia general
[ ] Aclarar que la detección automática depende de la región detectada del dispositivo

═══════════════════════════════════════════════════════════════════════

## 📋 FASE 4: INTEGRACIÓN EN DRAWER Y NAVEGACIÓN 🧭 [PENDIENTE]

### Objetivo

Agregar acceso claro a Configuración desde el drawer y asegurar que quede
siempre abajo del todo, independientemente del resto de opciones.

### MainLayout.vue

[ ] Agregar ítem `Configuración` en el drawer
[ ] Usar ícono consistente con el resto del sistema
[ ] Ubicarlo siempre abajo del todo
[ ] Mantener separado visualmente del bloque principal de navegación
[ ] Verificar comportamiento con scroll del drawer
[ ] Verificar que Mesa de trabajo siga funcionando sin desplazar Configuración

### Router

[ ] Crear ruta nueva para Configuración
[ ] Integrarla bajo `MainLayout.vue`
[ ] Verificar navegación desde drawer
[ ] Verificar botón back nativo en Android

═══════════════════════════════════════════════════════════════════════

## 📋 FASE 5: DESACOPLAR MONEDA LOCAL VS PREFERENCIA GLOBAL 🔄 [PENDIENTE]

### Objetivo

Corregir todos los flujos actuales donde la moneda usada en una carga puntual
termina guardándose como si fuera preferencia global.

### Revisión de componentes y flujos

[ ] Revisar `FormularioPrecio.vue`
[ ] Revisar `DialogoAgregarPrecio.vue`
[ ] Revisar `DialogoAgregarProducto.vue`
[ ] Revisar `TarjetaEscaneo.vue`
[ ] Revisar `TarjetaProductoBorrador.vue`
[ ] Revisar cualquier otro flujo donde hoy se invoque `guardarMoneda()`

### Cambios esperados

[ ] Inicializar formularios nuevos con `monedaDefaultEfectiva`
[ ] Permitir cambiar la moneda local del precio sin tocar Configuración
[ ] Guardar en el precio la moneda realmente elegida para ese registro
[ ] Evitar side effects globales al editar moneda en formularios
[ ] Mantener consistencia entre alta manual, escaneo rápido, mesa y edición

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

## 🧪 FASE TESTING [PENDIENTE]

### T.A — Configuración manual

[ ] Entrar a Configuración desde el drawer
[ ] Verificar que el botón está siempre abajo del todo
[ ] Desactivar modo automático
[ ] Elegir una moneda manual
[ ] Cerrar y reabrir la app
[ ] Verificar persistencia correcta de la moneda manual

### T.B — Configuración automática

[ ] Activar modo automático
[ ] Verificar que se muestra país detectado si existe
[ ] Verificar que se muestra moneda detectada si existe
[ ] Si no se detecta país, verificar mensaje de fallback
[ ] Verificar que en fallback se usa la última moneda manual guardada

### T.C — Formularios nuevos

[ ] Abrir `DialogoAgregarProducto`
[ ] Verificar que la moneda inicial coincide con `monedaDefaultEfectiva`
[ ] Abrir `DialogoAgregarPrecio`
[ ] Verificar que la moneda inicial coincide con `monedaDefaultEfectiva`
[ ] Abrir flujo de escaneo rápido
[ ] Verificar que la moneda inicial coincide con `monedaDefaultEfectiva`

### T.D — Moneda local de precio

[ ] En un formulario nuevo, cambiar moneda solo para ese precio
[ ] Guardar el precio y verificar que se persiste con esa moneda puntual
[ ] Abrir un nuevo formulario
[ ] Verificar que NO quedó como preferencia global accidental

### T.E — Regresiones

[ ] Verificar que Mesa de trabajo sigue funcionando
[ ] Verificar que `TarjetaProductoBorrador` no pisa Configuración
[ ] Verificar que `TarjetaEscaneo` no pisa Configuración
[ ] Verificar que formularios viejos con datos existentes no rompen
[ ] Verificar compatibilidad con preferencias viejas migradas

### T.F — Navegación

[ ] Verificar ida y vuelta desde drawer
[ ] Verificar botón back nativo en Android
[ ] Verificar comportamiento visual en móvil
[ ] Verificar que el drawer sigue ordenado correctamente con y sin items en Mesa

═══════════════════════════════════════════════════════════════════════

## ⚠️ RIESGOS Y BUGS POSIBLES

- Componentes viejos pueden seguir llamando `guardarMoneda()` y pisar la preferencia global.
- La detección de región puede devolver idioma sin país y generar falsos positivos.
- Si no se migra bien la preferencia vieja, algunos usuarios podrían perder su moneda manual previa.
- Configuración puede mostrar un estado distinto al efectivamente usado si la resolución de moneda no se centraliza.
- El drawer puede perder la posición fija de Configuración si no se separa bien el layout superior/inferior.
- Algunos formularios podrían inicializar con la última moneda editada en memoria en vez de usar la preferencia efectiva.

═══════════════════════════════════════════════════════════════════════

## 📊 PROGRESO GENERAL: 0% — PLAN DEFINIDO

- [ ] Fase 1: Modelo de preferencias y persistencia
- [ ] Fase 2: Detección automática de país y moneda
- [ ] Fase 3: Página Configuración
- [ ] Fase 4: Integración en drawer y navegación
- [ ] Fase 5: Desacoplar moneda local vs preferencia global
- [ ] Fase 6: Ajustes de UX y documentación interna
- [ ] Fase Testing

**ESTADO:** ⏳ Pendiente de implementación
