# Tareas Pendientes

Lista de cosas que hay que hacer pero que no tienen plan propio todavía.
Cuando una tarea se completa, simplemente se borra.

**Orden:** de mayor a menor dificultad (10 = muy difícil, 1 = muy fácil).
Las tareas más difíciles siempre van arriba.

---

## Pendientes

### Dificultad 7/10
- **Estrategia de búsqueda: local primero, APIs después:** En toda circunstancia donde se busque un producto (por nombre, código de barras, etc.), la app debe consultar primero la base de datos local del usuario y solo si no hay resultados suficientes, recurrir a las APIs externas. Revisar todos los puntos de búsqueda de la app y unificar este comportamiento.

### Dificultad 5/10
- **Mesa de Trabajo — Agregar comercio rápido desde tarjeta de producto:** En cada tarjeta de producto de la Mesa de Trabajo, agregar una opción para registrar un precio/comercio de forma rápida sin tener que salir de la vista. Debe ser el mismo flujo de "agregar comercio" que ya existe, pero accesible directo desde la tarjeta.

### Dificultad 4/10
- **Estadísticas en Edición de Comercio — Revisión completa:** Las estadísticas que se muestran en `EditarComercioPage` necesitan una revisión general: sacar las que no aportan valor, editar las existentes para que sean más precisas o útiles, y agregar estadísticas nuevas. Actualmente se muestran: "Registrado" (fecha), "Último uso" (tiempo relativo), "Último precio" (tiempo relativo), "Productos" (cantidad) y "Sucursales" (cantidad). El usuario quiere definir cuáles quedan, cuáles se modifican y cuáles se agregan en una sesión de trabajo dedicada.

### Dificultad 3/10
- **Mesa de Trabajo — Buscador de productos:** Agregar el mismo buscador que tienen las vistas de Productos y Comercios (mismo componente, mismo comportamiento) para filtrar los productos visibles en la Mesa de Trabajo.

### Dificultad 2/10
- **Investigar GitHub Pages para este proyecto:** Evaluar si es viable usar GitHub Pages para publicar una versión web de la app (Quasar puede compilar como SPA). Considerar las limitaciones: GitHub Pages solo sirve archivos estáticos, no hay backend ni base de datos, y la app usa Capacitor para Android. Determinar si tendría utilidad real (demo, landing, versión web limitada) o si no aplica al modelo de la app.
