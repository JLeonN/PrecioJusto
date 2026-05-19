# PLAN FIRESTORE PRIVADO PRODUCTOS

## Descripción del plan

Implementar la primera escritura real de datos privados en Firestore para Precio Justo, limitada a productos y precios del usuario autenticado. La app ya tiene Firebase Auth, Firestore Offline y un modelo aprobado en `PlanModeloFirestoreYMigracion.md`.

Este plan debe conectar productos y precios a Firestore bajo `usuarios/{usuarioId}`, manteniendo LocalStorage/Capacitor como respaldo temporal y sin migrar todavía comercios, listas, preferencias, fotos ni comunidad.

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
- No activar comunidad en este plan.
- No borrar datos locales actuales.
- No eliminar `LocalStorageAdapter`, `CapacitorAdapter` ni `ProductosService` local hasta tener validación completa.
- Usar Firebase Auth como fuente de `usuarioId`.
- No escribir productos si no hay usuario autenticado.
- No guardar imágenes base64 nuevas en Firestore; si un producto tiene imagen base64 local, tratarla según decisión del modelo y dejar Storage para otro plan.

## FASE 1: Revisar modelo y reglas antes de escribir

### Objetivo

Confirmar que el modelo aprobado y las reglas privadas están listas antes de activar escrituras reales.

- [ ] Revisar `Planes/Resumenes/ModeloFirestoreMigracion.md`.
- [ ] Confirmar ruta de productos: `usuarios/{usuarioId}/productos/{productoId}`.
- [ ] Confirmar ruta de precios: `usuarios/{usuarioId}/productos/{productoId}/precios/{precioId}`.
- [ ] Confirmar campos mínimos de producto.
- [ ] Confirmar campos mínimos de precio.
- [ ] Confirmar campos calculados que se guardarán en producto.
- [ ] Aplicar reglas privadas en Firebase Console para `usuarios/{usuarioId}`.
- [ ] Probar manualmente que usuario no autenticado no puede leer ni escribir.

## FASE 2: Crear servicio Firestore de productos

### Objetivo

Crear una capa específica para productos privados en Firestore sin contaminar componentes ni stores con SDK directo.

- [ ] Crear servicio con nombre PascalCase para productos Firestore.
- [ ] Obtener `usuarioId` desde `UsuarioStore` o `UsuarioActualService`.
- [ ] Crear helper para ruta privada de producto.
- [ ] Implementar guardar producto.
- [ ] Implementar obtener producto por ID.
- [ ] Implementar obtener productos del usuario.
- [ ] Implementar actualizar producto.
- [ ] Implementar eliminar producto con criterio definido por el modelo.
- [ ] Normalizar timestamps y `usuarioId`.
- [ ] Evitar guardar campos no permitidos o datos pesados innecesarios.

## FASE 3: Crear servicio Firestore de precios

### Objetivo

Separar precios como subcolección para evitar documentos gigantes.

- [ ] Crear helper para ruta privada de precios de un producto.
- [ ] Implementar guardar precio dentro de la subcolección del producto.
- [ ] Implementar obtener precios de un producto.
- [ ] Implementar actualizar precio si corresponde.
- [ ] Implementar eliminar precio si corresponde.
- [ ] Normalizar `comercioId`, `direccionId`, `valor`, `moneda`, `fecha` y `usuarioId`.
- [ ] Asegurar que el producto exista antes de guardar precio.
- [ ] Definir comportamiento si se agrega precio offline.

## FASE 4: Integrar con flujo actual de productos

### Objetivo

Conectar Firestore sin romper la experiencia actual ni perder datos locales.

- [ ] Decidir punto exacto donde se invoca Firestore al guardar producto.
- [ ] Mantener guardado local actual como respaldo temporal.
- [ ] Guardar primero local y luego Firestore, o Firestore y luego local, según decisión documentada.
- [ ] Marcar errores de sincronización sin bloquear la UI si el dato local se guardó.
- [ ] Actualizar estado `sincronizando` en `productosStore`.
- [ ] Evitar duplicar productos en memoria después de guardar.
- [ ] Confirmar que búsquedas locales siguen funcionando durante esta fase.

## FASE 5: Integrar agregado de precios

### Objetivo

Guardar precios nuevos en Firestore como subdocumentos sin romper el historial local existente.

- [ ] Identificar flujos que agregan precios a productos.
- [ ] Mantener historial local actual por compatibilidad.
- [ ] Enviar precio nuevo a subcolección Firestore cuando haya usuario autenticado.
- [ ] Manejar error de Firestore sin perder el precio local.
- [ ] Confirmar que `precioMejor`, `comercioMejor` y datos calculados siguen visibles.
- [ ] Definir si el producto padre se actualiza con resumen calculado después de agregar precio.

## FASE 6: Leer productos desde Firestore

### Objetivo

Validar lectura privada desde Firestore sin reemplazar todavía toda la fuente local si eso aumenta el riesgo.

- [ ] Implementar carga controlada de productos Firestore del usuario.
- [ ] Comparar productos Firestore contra productos locales en desarrollo.
- [ ] Definir estrategia temporal de visualización: local primero, Firestore verificado en paralelo.
- [ ] Evitar listeners en tiempo real si no son necesarios en esta fase.
- [ ] Usar lecturas paginables o limitadas si corresponde.
- [ ] Confirmar que Firestore Offline devuelve datos cacheados al recargar sin conexión.

## FASE 7: Indicadores de sincronización

### Objetivo

Dar señales claras cuando productos o precios estén pendientes, sincronizados o con error.

- [ ] Definir campos locales temporales de sincronización para productos.
- [ ] Definir campos locales temporales de sincronización para precios.
- [ ] Mostrar estado simple si hay error de sincronización.
- [ ] Evitar mensajes invasivos cuando Firestore sincroniza normalmente en segundo plano.
- [ ] Registrar errores técnicos en consola para depuración.
- [ ] Mantener textos de UI claros y en español.

## FASE 8: Validar privacidad entre usuarios

### Objetivo

Confirmar que los datos privados de productos y precios quedan realmente aislados por usuario.

- [ ] Crear o usar dos usuarios de prueba.
- [ ] Guardar producto con usuario A.
- [ ] Confirmar que usuario B no ve el producto de usuario A.
- [ ] Intentar leer ruta de usuario A con usuario B desde consola o prueba controlada.
- [ ] Confirmar que reglas bloquean escritura cruzada.
- [ ] Confirmar que usuario no autenticado queda bloqueado.

## FASE 9: Documentar resultado y límites

### Objetivo

Dejar claro qué quedó implementado y qué no para continuar con comercios o migración completa.

- [ ] Actualizar este plan con resultado de ejecución.
- [ ] Actualizar `Resumen11Firebase.md` con el estado de productos Firestore.
- [ ] Documentar si Firestore ya es fuente principal o solo espejo validado.
- [ ] Documentar errores conocidos y decisiones pendientes.
- [ ] Definir próximo plan recomendado: comercios privados o migración local de productos.

## FASE TESTING

### Objetivo

Validar productos y precios privados en Firestore sin romper almacenamiento local.

- [ ] Ejecutar `npm run lint`.
- [ ] Ejecutar `npm run build`.
- [ ] Iniciar sesión con usuario de prueba.
- [ ] Crear producto online y verificar documento Firestore.
- [ ] Agregar precio online y verificar subcolección Firestore.
- [ ] Crear producto sin conexión y verificar que la app no pierde el dato local.
- [ ] Recuperar conexión y verificar sincronización con Firestore.
- [ ] Recargar la app y verificar lectura/cache de Firestore.
- [ ] Cerrar sesión y confirmar que no se muestran datos privados Firestore.
- [ ] Iniciar sesión con otro usuario y confirmar aislamiento.
- [ ] Verificar que productos locales existentes no se borran.
- [ ] Verificar que no se escriben comercios, listas, preferencias ni fotos en Firestore.
- [ ] Probar en Android cuando corresponda.

## Progreso del plan

- [ ] Fase 1: Revisar modelo y reglas antes de escribir
- [ ] Fase 2: Crear servicio Firestore de productos
- [ ] Fase 3: Crear servicio Firestore de precios
- [ ] Fase 4: Integrar con flujo actual de productos
- [ ] Fase 5: Integrar agregado de precios
- [ ] Fase 6: Leer productos desde Firestore
- [ ] Fase 7: Indicadores de sincronización
- [ ] Fase 8: Validar privacidad entre usuarios
- [ ] Fase 9: Documentar resultado y límites
- [ ] Fase Testing

Fecha de creación: 19 de Mayo 2026
Fecha de última actualización: 19 de Mayo 2026
Estado: BORRADOR
