# PLAN FIRESTORE PRIVADO PRODUCTOS

## Descripción del plan

Implementar la primera escritura real de datos privados en Firestore para Precio Justo, limitada a productos y precios del usuario autenticado. La app ya tiene Firebase Auth, Firestore Offline y un modelo aprobado en `PlanModeloFirestoreYMigracion.md`.


## Objetivo principal

- Crear servicios Firestore privados para productos y precios.
- Guardar productos en `usuarios/{usuarioId}/productos/{productoId}`.
- Guardar precios en `usuarios/{usuarioId}/productos/{productoId}/precios/{precioId}`.
- Mantener compatibilidad con almacenamiento local actual mientras se valida Firestore.
- Probar funcionamiento online, offline y sincronización al volver conexión.
- Confirmar que los datos de un usuario no son accesibles para otro.

## Reglas del plan

- No migrar todos los datos locales en este plan.
- No tocar comercios, listas, preferencias ni fotos salvo lectura mínima necesaria.
- No usar Storage en este plan.
- No borrar datos locales actuales.
- No eliminar `LocalStorageAdapter`, `CapacitorAdapter` ni `ProductosService` local hasta tener validación completa.
- Usar Firebase Auth como fuente de `usuarioId`.
- No escribir productos si no hay usuario autenticado.
- No guardar imágenes base64 nuevas en Firestore; si un producto tiene imagen base64 local, tratarla según decisión del modelo y dejar Storage para otro plan.

## FASE 1: Revisar modelo y reglas antes de escribir

### Objetivo

Confirmar que el modelo aprobado y las reglas privadas están listas antes de activar escrituras reales.

- [x] Revisar `Planes/Resumenes/ModeloFirestoreMigracion.md`.
- [x] Confirmar ruta de productos: `usuarios/{usuarioId}/productos/{productoId}`.
- [x] Confirmar ruta de precios: `usuarios/{usuarioId}/productos/{productoId}/precios/{precioId}`.
- [x] Confirmar campos mínimos de producto.
- [x] Confirmar campos mínimos de precio.
- [x] Confirmar campos calculados que se guardarán en producto.
- [x] Aplicar reglas privadas en Firebase Console para `usuarios/{usuarioId}`.
- [x] Probar manualmente que usuario no autenticado no puede leer ni escribir.

## FASE 2: Crear servicio Firestore de productos

### Objetivo

Crear una capa específica para productos privados en Firestore sin contaminar componentes ni stores con SDK directo.

- [x] Crear servicio con nombre PascalCase para productos Firestore.
- [x] Obtener `usuarioId` desde `UsuarioStore` o `UsuarioActualService`.
- [x] Crear helper para ruta privada de producto.
- [x] Implementar guardar producto.
- [x] Implementar obtener producto por ID.
- [x] Implementar obtener productos del usuario.
- [x] Implementar actualizar producto.
- [x] Implementar eliminar producto con criterio definido por el modelo.
- [x] Normalizar timestamps y `usuarioId`.
- [x] Evitar guardar campos no permitidos o datos pesados innecesarios.

## FASE 3: Crear servicio Firestore de precios

### Objetivo

Separar precios como subcolección para evitar documentos gigantes.

- [x] Crear helper para ruta privada de precios de un producto.
- [x] Implementar guardar precio dentro de la subcolección del producto.
- [x] Implementar obtener precios de un producto.
- [x] Implementar actualizar precio si corresponde.
- [x] Implementar eliminar precio si corresponde.
- [x] Normalizar `comercioId`, `direccionId`, `valor`, `moneda`, `fecha` y `usuarioId`.
- [x] Asegurar que el producto exista antes de guardar precio.
- [x] Definir comportamiento si se agrega precio offline.

## FASE 4: Integrar con flujo actual de productos

### Objetivo

Conectar Firestore sin romper la experiencia actual ni perder datos locales.

- [x] Decidir punto exacto donde se invoca Firestore al guardar producto.
- [x] Mantener guardado local actual como respaldo temporal.
- [x] Guardar primero local y luego Firestore, o Firestore y luego local, según decisión documentada.
- [x] Marcar errores de sincronización sin bloquear la UI si el dato local se guardó.
- [x] Actualizar estado `sincronizando` en `productosStore`.
- [x] Evitar duplicar productos en memoria después de guardar.
- [x] Confirmar que búsquedas locales siguen funcionando durante esta fase.

## FASE 5: Integrar agregado de precios

### Objetivo

Guardar precios nuevos en Firestore como subdocumentos sin romper el historial local existente.

- [x] Identificar flujos que agregan precios a productos.
- [x] Mantener historial local actual por compatibilidad.
- [x] Enviar precio nuevo a subcolección Firestore cuando haya usuario autenticado.
- [x] Manejar error de Firestore sin perder el precio local.
- [x] Confirmar que `precioMejor`, `comercioMejor` y datos calculados siguen visibles.
- [x] Definir si el producto padre se actualiza con resumen calculado después de agregar precio.

## FASE 6: Leer productos desde Firestore

### Objetivo

Validar lectura privada desde Firestore sin reemplazar todavía toda la fuente local si eso aumenta el riesgo.

- [x] Implementar carga controlada de productos Firestore del usuario.
- [x] Comparar productos Firestore contra productos locales en desarrollo.
- [x] Definir estrategia temporal de visualización: local primero, Firestore verificado en paralelo.
- [x] Evitar listeners en tiempo real si no son necesarios en esta fase.
- [x] Usar lecturas paginables o limitadas si corresponde.
- [x] Confirmar que Firestore Offline devuelve datos cacheados al recargar sin conexión.

## FASE 7: Indicadores de sincronización

### Objetivo

Dar señales claras cuando productos o precios estén pendientes, sincronizados o con error.

- [x] Definir campos locales temporales de sincronización para productos.
- [x] Definir campos locales temporales de sincronización para precios.
- [x] Mostrar estado simple si hay error de sincronización.
- [x] Evitar mensajes invasivos cuando Firestore sincroniza normalmente en segundo plano.
- [x] Registrar errores técnicos en consola para depuración.
- [x] Mantener textos de UI claros y en español.

## FASE 8: Validar privacidad entre usuarios

### Objetivo

Confirmar que los datos privados de productos y precios quedan realmente aislados por usuario.

- [x] Crear o usar dos usuarios de prueba.
- [x] Guardar producto con usuario A.
- [x] Confirmar que usuario B no ve el producto de usuario A.
- [x] Intentar leer ruta de usuario A con usuario B desde consola o prueba controlada.
- [x] Confirmar que reglas bloquean escritura cruzada.
- [x] Confirmar que usuario no autenticado queda bloqueado.

## FASE 9: Documentar resultado y límites

### Objetivo

Dejar claro qué quedó implementado y qué no para continuar con comercios o migración completa.

- [x] Actualizar este plan con resultado de ejecución.
- [x] Actualizar `Resumen11Firebase.md` con el estado de productos Firestore.
- [x] Documentar si Firestore ya es fuente principal o solo espejo validado.
- [x] Documentar errores conocidos y decisiones pendientes.
- [x] Definir próximo plan recomendado: comercios privados o migración local de productos.

## FASE TESTING

### Objetivo

Validar productos y precios privados en Firestore sin romper almacenamiento local.

- [x] Ejecutar `npm run lint`.
- [x] Ejecutar `npm run build`.
- [x] Iniciar sesión con usuario de prueba.
- [x] Crear producto online y verificar documento Firestore.
- [x] Agregar precio online y verificar subcolección Firestore.
- [x] Crear producto sin conexión y verificar que la app no pierde el dato local.
- [x] Recuperar conexión y verificar sincronización con Firestore.
- [x] Recargar la app y verificar lectura/cache de Firestore.
- [x] Cerrar sesión y confirmar que no se muestran datos privados Firestore.
- [x] Iniciar sesión con otro usuario y confirmar aislamiento.
- [x] Verificar que productos locales existentes no se borran.
- [x] Verificar que no se escriben comercios, listas, preferencias ni fotos en Firestore.
- [x] Probar en Android cuando corresponda.

## Resultado de ejecución

- Se implementaron `FirestoreProductosService` y `FirestorePreciosService` como capa privada Firestore.
- Las escrituras quedan bajo `usuarios/{usuarioId}/productos/{productoId}` y `usuarios/{usuarioId}/productos/{productoId}/precios/{precioId}`.
- `ProductosService` mantiene guardado local primero y luego sincroniza Firestore como espejo validado.
- Si no hay usuario Firebase autenticado, la escritura Firestore se omite y el producto queda local.
- Si Firestore queda esperando por conexión, la app devuelve estado `pendiente` después del timeout controlado y no pierde el dato local.
- Firestore no guarda imágenes base64; conserva localmente la imagen y deja `imagenUrl`/`imagenRutaStorage` para pasos futuros.
- `productosStore` expone estado de sincronización y `MisProductosPage` muestra un aviso simple si aparece error de sincronización.
- Se aplicaron reglas privadas en Firebase Console para permitir lectura/escritura solo cuando `request.auth.uid == usuarioId`.
- Firestore sigue como espejo de productos/precios; LocalStorage/Capacitor no fue reemplazado como fuente visible principal.

## Resultado de pruebas

- `npm run lint`: correcto.
- `npm run build`: correcto.
- MCP Browser: app cargó en `http://localhost:9302/` y login de prueba correcto.
- Producto online probado: `productoFirestorePrivado1779234894176`.
- Precio online probado: `precioFirestorePrivado1779234894176`.
- Verificación online: documento Firestore existe, subcolección `precios` contiene 1 documento y valor `123.45`.
- Verificación de imágenes: el producto local conserva base64; Firestore no guardó base64.
- Producto offline probado: `productoFirestoreOffline1779234934671`.
- Verificación offline: guardado local correcto, estado `pendiente`, recuperación en aproximadamente 7 segundos.
- Verificación al reconectar: el producto offline apareció en Firestore con 1 precio.
- Verificación cache: tras recarga online, lectura offline desde cache devolvió producto y precio.
- Usuario B usado para aislamiento: `preciojustopruebas2.auth.b.20260519@gmail.com`.
- Privacidad: usuario B no pudo leer ni escribir producto de usuario A (`permission-denied`).
- Sin sesión: lectura privada bloqueada (`permission-denied`).
- Verificación de colecciones no incluidas: `comercios`, `listas`, `preferencias` y `fotos` quedan en `0` documentos bajo el usuario probado.
- `npm run androidReleaseConSimbolos`: correcto; bundle release y símbolos nativos validados.
- Error conocido no relacionado: CORS de `version.json` en dev contra GitHub Pages.

## Progreso del plan

- [x] Fase 1: Revisar modelo y reglas antes de escribir
- [x] Fase 2: Crear servicio Firestore de productos
- [x] Fase 3: Crear servicio Firestore de precios
- [x] Fase 4: Integrar con flujo actual de productos
- [x] Fase 5: Integrar agregado de precios
- [x] Fase 6: Leer productos desde Firestore
- [x] Fase 7: Indicadores de sincronización
- [x] Fase 8: Validar privacidad entre usuarios
- [x] Fase 9: Documentar resultado y límites
- [x] Fase Testing

Fecha de creación: 19 de Mayo 2026
Fecha de última actualización: 19 de Mayo 2026
Estado: TERMINADO

