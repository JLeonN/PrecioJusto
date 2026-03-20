# Tareas Pendientes

Lista de cosas que hay que hacer pero que no tienen plan propio todavía.
Cuando una tarea se completa, simplemente se borra.

**Orden:** de mayor a menor dificultad (10 = muy difícil, 1 = muy fácil).
Las tareas más difíciles siempre van arriba.

---

## Pendientes

### Dificultad 7/10

- **Estrategia de búsqueda: local primero, APIs después:** En toda circunstancia donde se busque un producto (por nombre, código de barras, etc.), la app debe consultar primero la base de datos local del usuario y solo si no hay resultados suficientes, recurrir a las APIs externas. Revisar todos los puntos de búsqueda de la app y unificar este comportamiento.

### Dificultad 4/10

- **Estadísticas en Edición de Comercio — Revisión completa:** Las estadísticas que se muestran en `EditarComercioPage` necesitan una revisión general: sacar las que no aportan valor, editar las existentes para que sean más precisas o útiles, y agregar estadísticas nuevas. Actualmente se muestran: "Registrado" (fecha), "Último uso" (tiempo relativo), "Último precio" (tiempo relativo), "Productos" (cantidad) y "Sucursales" (cantidad). El usuario quiere definir cuáles quedan, cuáles se modifican y cuáles se agregan en una sesión de trabajo dedicada.

### Dificultad 1/10

- **Remover identificador de versión (v1.0.6):** Una vez que se confirme que la app funciona correctamente en todos los dispositivos tras los cambios en `publicPath`, se debe remover el componente de texto `v1.0.6` agregado en `App.vue` (y su estilo correspondiente).