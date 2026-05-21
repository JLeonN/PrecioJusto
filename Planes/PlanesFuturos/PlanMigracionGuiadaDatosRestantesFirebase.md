# PLAN MIGRACION GUIADA DATOS RESTANTES FIREBASE

## Descripción del plan

Actualizar la migración guiada local a Firebase para incluir los dominios privados que se agregaron después de productos, precios, comercios y direcciones: Lista Justa, preferencias, confirmaciones y fotos cuando Storage esté disponible.

La app ya tiene `MigracionLocalFirebaseService`, inventario local, backup previo, estado de migración, cola de pendientes y validación de conteos para productos/precios/comercios. Este plan debe extender ese flujo sin convertir todavía Firestore en fuente principal.

## Objetivo principal

- Incluir Lista Justa en la migración guiada.
- Incluir preferencias privadas en la migración guiada.
- Incluir confirmaciones privadas en la migración guiada.
- Preparar migración de fotos a Storage si el servicio Storage ya existe.
- Mantener backup local obligatorio antes de migrar.
- Mantener reintentos idempotentes sin duplicar documentos.
- Validar conteos antes y después de migrar.
- Dejar preparada la app para un plan posterior de fuente principal Firestore.

## Reglas del plan

- No convertir Firestore en fuente principal en este plan.
- No eliminar datos de LocalStorage/Capacitor después de migrar.
- No ejecutar migración automática sin confirmación explícita del usuario.
- No guardar base64 en Firestore.
- No migrar fotos a Firestore; fotos solo pueden ir a Storage si el servicio está disponible.
- No migrar `sesionEscaneo`, estado temporal de UI ni backups locales.
- No relajar `firestore.rules` ni reglas de Storage.
- Si un dominio falla, marcar migración parcial y conservar cola de reintento.
- La migración debe poder repetirse usando los mismos IDs sin duplicar documentos.

## FASE 1: Revisar estado actual de migración

### Objetivo

Entender qué migra hoy la app y qué dominios faltan.

- [ ] Revisar `Planes/PlanesFuturos/PlanMaestroFirebase.md`.
- [ ] Revisar `Planes/Resumenes/ModeloFirestoreMigracion.md`.
- [ ] Revisar `Planes/Resumenes/Resumen11Firebase.md`.
- [ ] Revisar `src/almacenamiento/servicios/MigracionLocalFirebaseService.js`.
- [ ] Revisar `src/almacenamiento/servicios/InventarioMigracionFirebaseService.js`.
- [ ] Revisar `src/pages/ConfiguracionPage.vue`.
- [ ] Confirmar que hoy la migración cubre productos, precios, comercios y direcciones.
- [ ] Confirmar que listas, preferencias, confirmaciones y fotos no quedan cubiertas por la migración actual.
- [ ] Confirmar que LocalStorage/Capacitor sigue siendo fuente visible principal.

## FASE 2: Ampliar inventario local

### Objetivo

Asegurar que el inventario detecta todos los datos privados restantes y sus cantidades.

- [ ] Confirmar lectura local de listas desde `CLAVE_LISTA_JUSTA`.
- [ ] Confirmar lectura local de preferencias desde `CLAVE_PREFERENCIAS_USUARIO`.
- [ ] Confirmar lectura local de confirmaciones desde `PREFIJO_CONFIRMACIONES`.
- [ ] Agregar conteo de items de Lista Justa.
- [ ] Agregar conteo de fotos de productos.
- [ ] Agregar conteo de fotos de comercios y direcciones.
- [ ] Agregar conteo de fotos de items de Lista Justa si falta.
- [ ] Mantener `sesionEscaneo` solo como dato informativo no migrable.
- [ ] Confirmar que el backup local previo incluye todos los datos detectados.

## FASE 3: Ampliar conteos esperados y estado de migración

### Objetivo

Hacer que el estado de migración pueda representar todos los dominios privados.

- [ ] Agregar conteos esperados para `listas`.
- [ ] Agregar conteos esperados para `itemsListaJusta`.
- [ ] Agregar conteo esperado para `preferencias`.
- [ ] Agregar conteo esperado para `confirmaciones`.
- [ ] Agregar conteos esperados para `fotosProductos`, `fotosComercios` y `fotosListas`.
- [ ] Agregar conteos migrados equivalentes.
- [ ] Agregar conteos Firestore/Storage equivalentes.
- [ ] Mantener compatibilidad con estados de migración anteriores.
- [ ] Actualizar `VERSION_MIGRACION_LOCAL_FIREBASE` si cambia el formato del estado.

## FASE 4: Migrar Lista Justa

### Objetivo

Agregar Lista Justa al flujo guiado usando el servicio Firestore ya existente.

- [ ] Importar `FirestoreListasJustasService`.
- [ ] Migrar cada lista local con su ID local.
- [ ] Migrar items embebidos respetando el límite del modelo.
- [ ] Registrar pendientes en cola si una lista falla.
- [ ] Evitar duplicados si se reintenta la migración.
- [ ] Actualizar conteos migrados de listas e items.
- [ ] Validar conteos Firestore con `obtenerListasJustasUsuario`.
- [ ] Confirmar que imágenes base64 de items no se escriben en Firestore.

## FASE 5: Migrar preferencias

### Objetivo

Agregar preferencias privadas al flujo guiado sin tocar preferencias efímeras.

- [ ] Importar `FirestorePreferenciasService`.
- [ ] Migrar preferencias locales si existen.
- [ ] Normalizar campos mediante el servicio Firestore de preferencias.
- [ ] No migrar estado temporal de sesión ni UI.
- [ ] Registrar pendiente si falla la escritura.
- [ ] Validar que existe `usuarios/{usuarioId}/configuracion/preferencias`.
- [ ] Confirmar que la app sigue leyendo preferencias locales en esta etapa.

## FASE 6: Migrar confirmaciones

### Objetivo

Agregar confirmaciones privadas al flujo guiado manteniendo documento único por usuario y precio.

- [ ] Importar `FirestoreConfirmacionesService`.
- [ ] Leer confirmaciones locales por usuario.
- [ ] Convertir cada `precioId` confirmado en documento privado Firestore.
- [ ] Usar un `confirmacionId` estable para evitar duplicados.
- [ ] Incluir `productoId` cuando pueda resolverse desde productos locales.
- [ ] Registrar pendiente si una confirmación falla.
- [ ] Validar conteo de confirmaciones Firestore.
- [ ] Confirmar que no se crea colección comunitaria pública.

## FASE 7: Preparar migración de fotos a Storage

### Objetivo

Agregar fotos al flujo de migración solo si Storage ya está implementado.

- [ ] Detectar si existe servicio Storage de fotos.
- [ ] Si Storage no existe, dejar fotos como pendientes informativas sin fallar la migración principal.
- [ ] Si Storage existe, subir fotos base64 de productos.
- [ ] Si Storage existe, subir fotos base64 de comercios y direcciones.
- [ ] Si Storage existe, subir fotos base64 de items de Lista Justa.
- [ ] Guardar rutas/URLs resultantes mediante los servicios Firestore correspondientes.
- [ ] Registrar pendientes de Storage si falla la subida.
- [ ] Confirmar que ninguna foto base64 llega a Firestore.
- [ ] No borrar base64 local hasta validar subida y relectura.

## FASE 8: Ampliar cola de pendientes y reintentos

### Objetivo

Permitir que los nuevos dominios se reintenten de forma idempotente.

- [ ] Agregar items de cola para listas.
- [ ] Agregar items de cola para preferencias.
- [ ] Agregar items de cola para confirmaciones.
- [ ] Agregar items de cola para fotos Storage.
- [ ] Usar IDs estables por tipo de dato y documento.
- [ ] Guardar último error por item de cola.
- [ ] Incrementar intentos sin duplicar el item.
- [ ] Reintentar solo lo que falló.
- [ ] Mantener resumen legible para UI de configuración.

## FASE 9: Actualizar UI de migración

### Objetivo

Mostrar al usuario un resumen claro antes, durante y después de migrar.

- [ ] Actualizar resumen en `ConfiguracionPage.vue`.
- [ ] Mostrar conteos de listas e items.
- [ ] Mostrar si existen preferencias locales para migrar.
- [ ] Mostrar conteo de confirmaciones.
- [ ] Mostrar conteo de fotos pendientes de Storage.
- [ ] Aclarar que las fotos pueden requerir conexión y más tiempo.
- [ ] Mantener confirmación explícita antes de iniciar.
- [ ] Mostrar estado parcial si algo queda pendiente.
- [ ] Evitar mensajes técnicos largos en la UI.

## FASE 10: Validar conteos finales

### Objetivo

Cerrar la migración solo si todos los dominios esperados coinciden o quedan pendientes explícitos.

- [ ] Validar productos y precios como ya se hace hoy.
- [ ] Validar comercios y direcciones como ya se hace hoy.
- [ ] Validar listas e items.
- [ ] Validar preferencias.
- [ ] Validar confirmaciones.
- [ ] Validar fotos subidas a Storage si aplica.
- [ ] Detectar base64 en Firestore y marcar diferencia.
- [ ] Marcar estado `COMPLETADA` solo si no hay diferencias ni pendientes.
- [ ] Marcar estado `PARCIAL` si quedan pendientes reintentables.

## FASE 11: Actualizar documentación

### Objetivo

Mantener el mapa Firebase alineado con el estado real.

- [ ] Actualizar `Planes/Resumenes/ModeloFirestoreMigracion.md`.
- [ ] Actualizar `Planes/Resumenes/Resumen11Firebase.md`.
- [ ] Actualizar `Planes/PlanesFuturos/PlanMaestroFirebase.md` cuando el plan quede completado.
- [ ] Documentar qué datos siguen locales después de la migración.
- [ ] Documentar que Firestore fuente principal queda para otro plan.

## FASE TESTING

### Objetivo

Validar que la migración ampliada es segura, repetible y no pierde datos.

- [ ] Ejecutar lint o el comando de validación disponible del proyecto.
- [ ] Crear datos locales de prueba con productos, precios, comercios, listas, preferencias y confirmaciones.
- [ ] Crear backup local previo y confirmar que contiene todos los datos.
- [ ] Ejecutar migración con usuario Firebase autenticado.
- [ ] Verificar en Firestore productos, precios, comercios, listas, preferencias y confirmaciones.
- [ ] Verificar en Storage las fotos migradas si el servicio existe.
- [ ] Confirmar que Firestore no contiene base64.
- [ ] Ejecutar la migración por segunda vez y confirmar que no duplica documentos.
- [ ] Simular falla de red y confirmar estado parcial.
- [ ] Reintentar migración y confirmar que solo procesa pendientes.
- [ ] Probar sin usuario Firebase y confirmar que la migración no inicia.
- [ ] Confirmar que LocalStorage/Capacitor conserva los datos originales.
- [ ] Confirmar que la UI sigue leyendo desde almacenamiento local después de migrar.

## Progreso del plan

- [ ] Fase 1: Revisar estado actual de migración
- [ ] Fase 2: Ampliar inventario local
- [ ] Fase 3: Ampliar conteos esperados y estado de migración
- [ ] Fase 4: Migrar Lista Justa
- [ ] Fase 5: Migrar preferencias
- [ ] Fase 6: Migrar confirmaciones
- [ ] Fase 7: Preparar migración de fotos a Storage
- [ ] Fase 8: Ampliar cola de pendientes y reintentos
- [ ] Fase 9: Actualizar UI de migración
- [ ] Fase 10: Validar conteos finales
- [ ] Fase 11: Actualizar documentación
- [ ] Fase Testing

Fecha de creación: 21 de Mayo 2026
Fecha de última actualización: 21 de Mayo 2026
Estado: BORRADOR
