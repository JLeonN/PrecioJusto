# Tareas Pendientes

Lista de cosas que hay que hacer pero que no tienen plan propio todavía.
Cuando una tarea se completa, simplemente se borra.

**Orden:** de mayor a menor dificultad (10 = muy difícil, 1 = muy fácil).
Las tareas más difíciles siempre van arriba.

---

## Pendientes

### Dificultad 8/10

- **Precios especiales, packs y escalas (mayoristas / por cantidad):** Permitir registrar situaciones que no son “un solo precio unitario simple”: ofertas tipo 2×$100, precio distinto si comprás 1, venta mínima en pack, etc. Incluir en UI algo explícito (checkbox, toggle o equivalente) y persistencia coherente. **Mayoristas y tramos:** muchos comercios aplican precio según cantidad (ej.: 1 unidad $75, 3 iguales $73 c/u, 6 iguales $70 c/u); el modelo y el formulario deben poder cubrir eso o, como mínimo, dejar el diseño listo para ampliarlo — definir en sesión dedicada cómo se cargan los tramos, cómo se compara con otros locales y cómo se muestra en listados. Auditar todos los puntos de ingreso de precio: `DialogoAgregarPrecio`, `FormularioPrecio` / flujos de agregar producto, mesa de trabajo / borradores de escaneo, detalle de producto y cualquier otro formulario de precio.

### Dificultad 7/10

- **Estrategia de búsqueda: local primero, APIs después:** En toda circunstancia donde se busque un producto (por nombre, código de barras, etc.), la app debe consultar primero la base de datos local del usuario y solo si no hay resultados suficientes, recurrir a las APIs externas. Revisar todos los puntos de búsqueda de la app y unificar este comportamiento.

### Dificultad 5/10

- **Estado de carga en búsquedas y operaciones lentas:** Mostrar indicador de carga coherente (pantalla dedicada, overlay o inline según pantalla) cuando la app consulte APIs u otras fuentes lentas, para que no quede una UI “muerta”. Alinear con el flujo de búsqueda unificada (local + API) donde corresponda; ver también la tarea de dificultad 7/10 “local primero, APIs después”.

### Dificultad 4/10

- **Estadísticas en Edición de Comercio — Revisión completa:** Las estadísticas que se muestran en `EditarComercioPage` necesitan una revisión general: sacar las que no aportan valor, editar las existentes para que sean más precisas o útiles, y agregar estadísticas nuevas. Actualmente se muestran: "Registrado" (fecha), "Último uso" (tiempo relativo), "Último precio" (tiempo relativo), "Productos" (cantidad) y "Sucursales" (cantidad). El usuario quiere definir cuáles quedan, cuáles se modifican y cuáles se agregan en una sesión de trabajo dedicada.

