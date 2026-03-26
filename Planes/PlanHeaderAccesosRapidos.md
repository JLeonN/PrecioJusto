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

- [ ] Quitar el botón de lupa actual.
- [ ] Mantener el botón hamburguesa con su lógica actual de drawer.
- [ ] Mantener el badge flotante del botón menú si hay items pendientes en `sesionEscaneoStore`.
- [ ] Convertir `Precio Justo` en área clickeable para navegar a Inicio.
- [ ] Crear un bloque derecho con accesos rápidos a:
  - [ ] Inicio
  - [ ] Comercios
  - [ ] Mesa de trabajo
- [ ] Hacer que `Mesa de trabajo` solo se renderice cuando `sesionEscaneoStore.tieneItemsPendientes`.

### Notas de implementación

- No cambiar la lógica del drawer ni su contenido en este plan.
- No convertir el header en dos filas.
- No agregar texto al lado de los iconos del bloque derecho.

### Testing (Fase 1)

- [ ] La lupa desaparece completamente.
- [ ] El menú hamburguesa sigue abriendo y cerrando el drawer.
- [ ] El título `Precio Justo` lleva a Inicio.
- [ ] Los accesos rápidos renderizan correctamente con 2 o 3 iconos según el estado de `Mesa`.

═══════════════════════════════════════════════════════════════════════

## FASE 2: NAVEGACIÓN Y ESTADO ACTIVO

**Objetivo:** Marcar visualmente la sección actual y evitar navegación innecesaria o comportamientos raros.

- [ ] Agregar lógica de estado activo por ruta actual:
  - [ ] `/` activa `Inicio`
  - [ ] `/comercios` activa `Comercios`
  - [ ] `/comercios/:nombre` también activa `Comercios`
  - [ ] `/mesa-trabajo` activa `Mesa`
- [ ] Aplicar estado activo solo por color.
- [ ] Asegurar contraste suficiente entre icono activo e iconos inactivos.
- [ ] Evitar navegación redundante si el usuario toca el acceso de la ruta actual.

### Notas de implementación

- El color activo debe verse claro sobre el fondo blanco actual del header.
- El estado activo no debe agregar fondos, chips ni resaltados extra.

### Testing (Fase 2)

- [ ] `Inicio` se marca activo en `/`.
- [ ] `Comercios` se marca activo en `/comercios`.
- [ ] `Comercios` sigue activo en `/comercios/:nombre`.
- [ ] `Mesa` se marca activo en `/mesa-trabajo`.
- [ ] Tocar la ruta actual no produce comportamiento raro ni navegación visual molesta.

═══════════════════════════════════════════════════════════════════════

## FASE 3: RESPONSIVE Y MANEJO DEL TÍTULO

**Objetivo:** Hacer que el header responda bien al espacio disponible sin deformar iconos ni romper targets táctiles.

- [ ] Reorganizar el toolbar en dos bloques:
  - [ ] Bloque izquierdo: menú + título
  - [ ] Bloque derecho: accesos rápidos
- [ ] Darle al título truncado flexible real:
  - [ ] `min-width: 0`
  - [ ] `overflow: hidden`
  - [ ] `text-overflow: ellipsis`
  - [ ] `white-space: nowrap`
- [ ] Permitir que el título se achique antes de ocultarse.
- [ ] Mantener tamaño táctil estable para los iconos del bloque derecho.
- [ ] Evitar que el título empuje o deforme los botones en pantallas angostas.

### Notas de implementación

- Ocultar el título siempre debe ser la última opción.
- Es preferible sacrificar ancho del texto antes que reducir demasiado el área táctil de los botones.

### Testing (Fase 3)

- [ ] En pantallas angostas, el título se achica antes de desaparecer.
- [ ] Los iconos no se deforman ni quedan demasiado pequeños.
- [ ] El header sigue viéndose equilibrado con 2 iconos.
- [ ] El header sigue viéndose equilibrado con 3 iconos.
- [ ] El título no empuja el bloque derecho fuera de lugar.

═══════════════════════════════════════════════════════════════════════

## FASE 4: APARICIÓN/DESAPARICIÓN DINÁMICA DE MESA

**Objetivo:** Evitar saltos visuales bruscos cuando `Mesa de trabajo` aparece o desaparece dinámicamente.

- [ ] Tratar el botón de `Mesa` como acción condicional con transición visual suave.
- [ ] Cuando aparece `Mesa`, contraer el espacio disponible del título de forma progresiva.
- [ ] Cuando desaparece `Mesa`, devolver espacio al título de forma progresiva.
- [ ] Mantener estabilidad visual general del header durante el cambio.
- [ ] Revisar el comportamiento del badge para que no desalinee el último icono.

### Notas de implementación

- La transición debe ser corta, sobria y estable.
- Priorizar una sensación de ajuste natural antes que una animación llamativa.
- Si el badge de `Mesa` compromete la alineación en móvil, simplificarlo antes que romper el layout.

### Testing (Fase 4)

- [ ] `Mesa` aparece solo cuando hay items pendientes.
- [ ] `Mesa` desaparece cuando deja de haber items pendientes.
- [ ] La aparición de `Mesa` no provoca un salto feo del título.
- [ ] La desaparición de `Mesa` no provoca un salto feo del título.
- [ ] El header se recompone con suavidad cuando cambia entre 2 y 3 accesos.
- [ ] El badge no rompe la alineación del último icono en móviles angostos.

═══════════════════════════════════════════════════════════════════════

## FASE TESTING

Checklist final de regresión y comportamiento responsive del header.

### T.A — Navegación principal

- [ ] `Precio Justo` navega a Inicio.
- [ ] `Inicio` navega correctamente a `/`.
- [ ] `Comercios` navega correctamente a `/comercios`.
- [ ] `Mesa` navega correctamente a `/mesa-trabajo` cuando existe.

### T.B — Estado activo

- [ ] El estado activo se ve claramente en móvil.
- [ ] El estado activo se ve claramente en desktop.
- [ ] El color activo contrasta suficiente frente al fondo blanco.
- [ ] Los iconos inactivos no compiten visualmente con el icono activo.

### T.C — Responsive

- [ ] El título se achica antes de ocultarse.
- [ ] En teléfonos angostos el layout sigue siendo usable.
- [ ] Los botones mantienen tamaño táctil cómodo.
- [ ] El título no rompe el layout con 3 accesos rápidos visibles.

### T.D — Mesa dinámica

- [ ] `Mesa` aparece con transición suave cuando hay items pendientes.
- [ ] `Mesa` desaparece con transición suave cuando ya no hay items pendientes.
- [ ] El título recupera espacio correctamente al desaparecer `Mesa`.
- [ ] No hay saltos visuales bruscos en el header.

### T.E — Drawer y regresión general

- [ ] El botón hamburguesa sigue funcionando como antes.
- [ ] El drawer no cambia de comportamiento.
- [ ] El badge del menú sigue funcionando.
- [ ] El botón back nativo de Android no sufre regresiones por este cambio.
- [ ] El header sigue respetando `safe-area-top`.

### T.F — Casos límite

- [ ] Tocar varias veces el mismo acceso no genera comportamientos raros.
- [ ] Cambiar rápidamente entre rutas no rompe el estado activo.
- [ ] El badge de `Mesa` no desalinea el icono.
- [ ] El header no queda “temblando” visualmente cuando `Mesa` aparece y desaparece.

═══════════════════════════════════════════════════════════════════════

## ORDEN DE IMPLEMENTACIÓN SUGERIDO

1. Fase 1 (estructura base)
2. Fase 2 (navegación y estado activo)
3. Fase 3 (responsive y título)
4. Fase 4 (aparición/desaparición dinámica de Mesa)
5. **FASE TESTING**

═══════════════════════════════════════════════════════════════════════

## ESTADO DEL PLAN

**ESTADO:** Pendiente

**ÚLTIMA ACTUALIZACIÓN:** Marzo 2026 — plan creado para rediseñar el header global con accesos rápidos, título flexible y transición suave del botón `Mesa de trabajo`.
