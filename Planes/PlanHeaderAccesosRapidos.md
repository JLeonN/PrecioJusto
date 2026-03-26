# PLAN DE TRABAJO - HEADER SUPERIOR CON ACCESOS RÁPIDOS

Proyecto: Precio Justo
Fecha inicio: Marzo 2026
Responsable: Leo + CH

═══════════════════════════════════════════════════════════════════════

## DESCRIPCIÓN DEL PLAN

Actualizar el header global de la app en `MainLayout.vue` para reemplazar la lupa por accesos rápidos a navegación principal, manteniendo el menú hamburguesa y el título `Precio Justo`.

El resultado esperado es:

- Menú hamburguesa a la izquierda.
- Título `Precio Justo` a la izquierda, clickeable para ir a Inicio.
- Accesos rápidos a la derecha para `Inicio`, `Comercios` y `Mesa de trabajo`.
- `Mesa de trabajo` visible solo cuando `sesionEscaneoStore.tieneItemsPendientes`.
- Estado activo marcado solo por color.
- Layout responsivo: el título se achica primero y solo se oculta como último recurso.
- Transiciones suaves cuando aparece o desaparece el botón de `Mesa`, sin saltos bruscos.

### OBJETIVOS PRINCIPALES

- Reemplazar una acción visual sin uso real (`lupa`) por accesos rápidos útiles.
- Mejorar la navegación principal sin quitar el drawer.
- Mantener la identidad visual del header con el título `Precio Justo`.
- Hacer que el header responda bien en teléfonos angostos sin sacrificar usabilidad táctil.
- Evitar “saltos” bruscos cuando `Mesa de trabajo` aparece o desaparece dinámicamente.

### DECISIONES CERRADAS

- La lupa actual se elimina por completo.
- Se mantiene el menú hamburguesa.
- El título permanece a la izquierda y sigue siendo importante visualmente.
- El título será clickeable y navegará a `/`.
- Los accesos rápidos serán iconos, no texto.
- El botón de `Mesa de trabajo` seguirá siendo condicional.
- El estado activo se marcará solo por color.
- Si no hay espacio, primero se achica el título; ocultarlo será la última opción.
- Máximo 3 accesos rápidos en el header. Si más adelante hiciera falta un cuarto, se rediseña el header en vez de seguir comprimiéndolo.

### ARCHIVO A MODIFICAR

- `src/layouts/MainLayout.vue`

═══════════════════════════════════════════════════════════════════════

## FASE 1: ESTRUCTURA BASE DEL HEADER

**Objetivo:** Reemplazar la lupa por una zona de acciones de navegación rápida sin romper la estructura actual del layout.

- [x] Quitar el botón de lupa actual.
- [x] Mantener el botón hamburguesa con su lógica actual de drawer.
- [x] Mantener el badge flotante del botón menú si hay items pendientes en `sesionEscaneoStore`.
- [x] Convertir `Precio Justo` en área clickeable para navegar a Inicio.
- [x] Crear un bloque derecho con accesos rápidos a:
  - [x] Inicio
  - [x] Comercios
  - [x] Mesa de trabajo
- [x] Hacer que `Mesa de trabajo` solo se renderice cuando `sesionEscaneoStore.tieneItemsPendientes`.

### Notas de implementación

- No cambiar la lógica del drawer ni su contenido en este plan.
- No convertir el header en dos filas.
- No agregar texto al lado de los iconos del bloque derecho.

### Testing (Fase 1)

- [x] La lupa desaparece completamente.
- [x] El menú hamburguesa sigue abriendo y cerrando el drawer.
- [x] El título `Precio Justo` lleva a Inicio.
- [x] Los accesos rápidos renderizan correctamente con 2 o 3 iconos según el estado de `Mesa`.

═══════════════════════════════════════════════════════════════════════

## FASE 2: NAVEGACIÓN Y ESTADO ACTIVO

**Objetivo:** Marcar visualmente la sección actual y evitar navegación innecesaria o comportamientos raros.

- [x] Agregar lógica de estado activo por ruta actual:
  - [x] `/` activa `Inicio`
  - [x] `/comercios` activa `Comercios`
  - [x] `/comercios/:nombre` también activa `Comercios`
  - [x] `/mesa-trabajo` activa `Mesa`
- [x] Aplicar estado activo solo por color.
- [x] Asegurar contraste suficiente entre icono activo e iconos inactivos.
- [x] Evitar navegación redundante si el usuario toca el acceso de la ruta actual.

### Notas de implementación

- El color activo debe verse claro sobre el fondo blanco actual del header.
- El estado activo no debe agregar fondos, chips ni resaltados extra.

### Testing (Fase 2)

- [x] `Inicio` se marca activo en `/`.
- [x] `Comercios` se marca activo en `/comercios`.
- [x] `Comercios` sigue activo en `/comercios/:nombre`.
- [x] `Mesa` se marca activo en `/mesa-trabajo`.
- [x] Tocar la ruta actual no produce comportamiento raro ni navegación visual molesta.

═══════════════════════════════════════════════════════════════════════

## FASE 3: RESPONSIVE Y MANEJO DEL TÍTULO

**Objetivo:** Hacer que el header responda bien al espacio disponible sin deformar iconos ni romper targets táctiles.

- [x] Reorganizar el toolbar en dos bloques:
  - [x] Bloque izquierdo: menú + título
  - [x] Bloque derecho: accesos rápidos
- [x] Darle al título truncado flexible real:
  - [x] `min-width: 0`
  - [x] `overflow: hidden`
  - [x] `text-overflow: ellipsis`
  - [x] `white-space: nowrap`
- [x] Permitir que el título se achique antes de ocultarse.
- [x] Mantener tamaño táctil estable para los iconos del bloque derecho.
- [x] Evitar que el título empuje o deforme los botones en pantallas angostas.

### Notas de implementación

- Ocultar el título siempre debe ser la última opción.
- Es preferible sacrificar ancho del texto antes que reducir demasiado el área táctil de los botones.

### Testing (Fase 3)

- [x] En pantallas angostas, el título se achica antes de desaparecer.
- [x] Los iconos no se deforman ni quedan demasiado pequeños.
- [x] El header sigue viéndose equilibrado con 2 iconos.
- [x] El header sigue viéndose equilibrado con 3 iconos.
- [x] El título no empuja el bloque derecho fuera de lugar.

═══════════════════════════════════════════════════════════════════════

## FASE 4: APARICIÓN/DESAPARICIÓN DINÁMICA DE MESA

**Objetivo:** Evitar saltos visuales bruscos cuando `Mesa de trabajo` aparece o desaparece dinámicamente.

- [x] Tratar el botón de `Mesa` como acción condicional con transición visual suave.
- [x] Cuando aparece `Mesa`, contraer el espacio disponible del título de forma progresiva.
- [x] Cuando desaparece `Mesa`, devolver espacio al título de forma progresiva.
- [x] Mantener estabilidad visual general del header durante el cambio.
- [x] Revisar el comportamiento del badge para que no desalinee el último icono.

### Notas de implementación

- La transición debe ser corta, sobria y estable.
- Priorizar una sensación de ajuste natural antes que una animación llamativa.
- Si el badge de `Mesa` compromete la alineación en móvil, simplificarlo antes que romper el layout.

### Testing (Fase 4)

- [x] `Mesa` aparece solo cuando hay items pendientes.
- [x] `Mesa` desaparece cuando deja de haber items pendientes.
- [x] La aparición de `Mesa` no provoca un salto feo del título.
- [x] La desaparición de `Mesa` no provoca un salto feo del título.
- [x] El header se recompone con suavidad cuando cambia entre 2 y 3 accesos.
- [x] El badge no rompe la alineación del último icono en móviles angostos.

═══════════════════════════════════════════════════════════════════════

## FASE TESTING

Checklist final de regresión y comportamiento responsive del header.

### T.A — Navegación principal

- [x] `Precio Justo` navega a Inicio.
- [x] `Inicio` navega correctamente a `/`.
- [x] `Comercios` navega correctamente a `/comercios`.
- [x] `Mesa` navega correctamente a `/mesa-trabajo` cuando existe.

### T.B — Estado activo

- [x] El estado activo se ve claramente en móvil.
- [x] El estado activo se ve claramente en desktop.
- [x] El color activo contrasta suficiente frente al fondo blanco.
- [x] Los iconos inactivos no compiten visualmente con el icono activo.

### T.C — Responsive

- [x] El título se achica antes de ocultarse.
- [x] En teléfonos angostos el layout sigue siendo usable.
- [x] Los botones mantienen tamaño táctil cómodo.
- [x] El título no rompe el layout con 3 accesos rápidos visibles.

### T.D — Mesa dinámica

- [x] `Mesa` aparece con transición suave cuando hay items pendientes.
- [x] `Mesa` desaparece con transición suave cuando ya no hay items pendientes.
- [x] El título recupera espacio correctamente al desaparecer `Mesa`.
- [x] No hay saltos visuales bruscos en el header.

### T.E — Drawer y regresión general

- [x] El botón hamburguesa sigue funcionando como antes.
- [x] El drawer no cambia de comportamiento.
- [x] El badge del menú sigue funcionando.
- [ ] El botón back nativo de Android no sufre regresiones por este cambio.
- [x] El header sigue respetando `safe-area-top`.

### T.F — Casos límite

- [x] Tocar varias veces el mismo acceso no genera comportamientos raros.
- [x] Cambiar rápidamente entre rutas no rompe el estado activo.
- [x] El badge de `Mesa` no desalinea el icono.
- [x] El header no queda “temblando” visualmente cuando `Mesa` aparece y desaparece.

═══════════════════════════════════════════════════════════════════════

## ORDEN DE IMPLEMENTACIÓN SUGERIDO

1. Fase 1 (estructura base)
2. Fase 2 (navegación y estado activo)
3. Fase 3 (responsive y título)
4. Fase 4 (aparición/desaparición dinámica de Mesa)
5. **FASE TESTING**

═══════════════════════════════════════════════════════════════════════

## ESTADO DEL PLAN

**ESTADO:** En progreso (implementación completada, testing manual pendiente)

**ÚLTIMA ACTUALIZACIÓN:** 26 de Marzo 2026 - implementadas Fase 1, 2, 3 y 4 en `MainLayout.vue`; se quitó el contador duplicado del botón `Mesa` en el header y queda testing manual de regresión.
