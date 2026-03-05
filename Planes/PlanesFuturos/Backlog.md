# Backlog — Tareas Sueltas y Pendientes

Lista de cosas que hay que hacer pero que no tienen plan propio todavía.
Marcar con `[x]` cuando esté listo.

---

## Pendientes

- [ ] **Mis Productos — Historial/Edición:** En la vista de detalle del producto (DetalleProductoPage) falta mostrar la cantidad y unidad (ej: "2 L", "500 g"). El usuario no sabe de cuánto es el producto al ver el historial de precios.

- [ ] **Producción Google Play — Publicidad AdMob:** La prueba cerrada necesita 14 días con al menos 12 verificadores activos (actualmente van 5 días). Un día antes de cumplirse los 14 días, recordar iniciar la configuración de AdMob y preparar la estrategia de publicidad antes de solicitar acceso a producción.
      Hoy es 04/03/2026.

- [ ] **Estrategia de búsqueda: local primero, APIs después:** En toda circunstancia donde se busque un producto (por nombre, código de barras, etc.), la app debe consultar primero la base de datos local del usuario y solo si no hay resultados suficientes, recurrir a las APIs externas. Revisar todos los puntos de búsqueda de la app y unificar este comportamiento.
- [ ] **Drawer — Limpiar ítems sin uso:** Eliminar del drawer los ítems que aún no tienen funcionalidad real: Estadísticas, Configuración y Acerca de.

- [ ] **Modales + Teclado Virtual (Android):** Cuando un input dentro de un modal recibe foco, el teclado virtual puede taparlo. El modal debe desplazarse automáticamente para que el input quede visible por encima del teclado. Hay que detectar bien esto porque los modales y los inputs varían mucho en tamaño y posición.
