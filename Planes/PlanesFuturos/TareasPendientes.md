# Tareas Pendientes

Lista de cosas que hay que hacer pero que no tienen plan propio todavía.
Cuando una tarea se completa, simplemente se borra.

---

## Pendientes

- **Producción Google Play — Publicidad AdMob:** La prueba cerrada necesita 14 días con al menos 12 verificadores activos (actualmente van 5 días). Un día antes de cumplirse los 14 días, recordar iniciar la configuración de AdMob y preparar la estrategia de publicidad antes de solicitar acceso a producción.
      Hoy es 04/03/2026.

- **Estrategia de búsqueda: local primero, APIs después:** En toda circunstancia donde se busque un producto (por nombre, código de barras, etc.), la app debe consultar primero la base de datos local del usuario y solo si no hay resultados suficientes, recurrir a las APIs externas. Revisar todos los puntos de búsqueda de la app y unificar este comportamiento.

- **Estadísticas en Edición de Comercio — Revisión completa:** Las estadísticas que se muestran en `EditarComercioPage` necesitan una revisión general: sacar las que no aportan valor, editar las existentes para que sean más precisas o útiles, y agregar estadísticas nuevas. Actualmente se muestran: "Registrado" (fecha), "Último uso" (tiempo relativo), "Último precio" (tiempo relativo), "Productos" (cantidad) y "Sucursales" (cantidad). El usuario quiere definir cuáles quedan, cuáles se modifican y cuáles se agregan en una sesión de trabajo dedicada.

- **DialogoVerImagen — Integración y auditoría de uso:** El componente `DialogoVerImagen.vue` (`src/components/Compartidos/`) existe pero no se usa en la sección de comercios. Integrarlo donde el usuario pueda ver la foto del comercio en tamaño completo (ej: al tocar la foto en `EditarComercioPage`). Además, auditar toda la app para identificar otros lugares donde se muestran imágenes sin visor (productos, historial, etc.) y aplicar el mismo componente.

- **Modales + Teclado Virtual (Android):** Cuando un input dentro de un modal recibe foco, el teclado virtual puede taparlo. El modal debe desplazarse automáticamente para que el input quede visible por encima del teclado. Hay que detectar bien esto porque los modales y los inputs varían mucho en tamaño y posición.
