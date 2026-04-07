# Tareas Pendientes

Lista de cosas que hay que hacer pero que no tienen plan propio todavía.
Cuando una tarea se completa, simplemente se borra.

**Orden:** de mayor a menor dificultad (10 = muy difícil, 1 = muy fácil).
Las tareas más difíciles siempre van arriba.

---

## Pendientes

### Dificultad 8/10

- **Precios especiales, packs y escalas (mayoristas / por cantidad):** Permitir registrar situaciones que no son “un solo precio unitario simple”: ofertas tipo 2×$100, precio distinto si comprás 1, venta mínima en pack, etc. Incluir en UI algo explícito (checkbox, toggle o equivalente) y persistencia coherente. **Mayoristas y tramos:** muchos comercios aplican precio según cantidad (ej.: 1 unidad $75, 3 iguales $73 c/u, 6 iguales $70 c/u); el modelo y el formulario deben poder cubrir eso o, como mínimo, dejar el diseño listo para ampliarlo — definir en sesión dedicada cómo se cargan los tramos, cómo se compara con otros locales y cómo se muestra en listados. Auditar todos los puntos de ingreso de precio: `DialogoAgregarPrecio`, `FormularioPrecio` / flujos de agregar producto, mesa de trabajo / borradores de escaneo, detalle de producto y cualquier otro formulario de precio.

### Dificultad 5/10

- **App en varios idiomas:** Preparar la app para soportar múltiples idiomas. Antes de implementar cualquier cambio hay que hacer un plan dedicado para definir el alcance, la estrategia de traducciones y los puntos de la UI que se van a tocar.

### Dificultad 4/10

- **Expandir confirmación de eliminación embebida en botón de papelera (patrón reutilizable ya implementado):** El patrón base ya está implementado y funcionando mediante `src/components/Compartidos/BotonConfirmacionEliminar.vue`, pero desde ahora la regla de implementación queda explícita: **conservar primero la interfaz existente (forma, tamaño, colores, texto y layout) y agregar solo la lógica de confirmación embebida (`Confirmar | Cancelar`)**. No rediseñar botones ni reemplazar bloques visuales completos salvo pedido explícito del usuario. Aplicar este criterio en listas, tarjetas y acciones rápidas de borrado simple; mantener diálogos externos solo para borrados masivos o casos sensibles donde esté justificado.

### Dificultad 4/10

- **Estadísticas en Edición de Comercio — Revisión completa:** Las estadísticas que se muestran en `EditarComercioPage` necesitan una revisión general: sacar las que no aportan valor, editar las existentes para que sean más precisas o útiles, y agregar estadísticas nuevas. Actualmente se muestran: "Registrado" (fecha), "Último uso" (tiempo relativo), "Último precio" (tiempo relativo), "Productos" (cantidad) y "Sucursales" (cantidad). El usuario quiere definir cuáles quedan, cuáles se modifican y cuáles se agregan en una sesión de trabajo dedicada.
