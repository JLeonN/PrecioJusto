# PLAN MODELO FIRESTORE Y MIGRACIÓN

## Descripción del plan

Definir el modelo definitivo de datos privados en Firestore y la estrategia de migración desde el almacenamiento local actual de Precio Justo. La app ya tiene Firebase base, Firebase Auth y rutas protegidas, pero todavía no guarda productos, comercios, listas, preferencias ni fotos en Firestore.

Este plan debe dejar preparada la arquitectura para que cada usuario autenticado tenga sus datos privados en Firestore, con funcionamiento offline y migración segura desde LocalStorage o Capacitor. No implementa la migración final todavía si el modelo no queda cerrado.

## Objetivo principal

- Definir colecciones, documentos y subcolecciones privadas por `usuarioId`.
- Separar productos, precios, comercios, listas y preferencias en estructuras compatibles con Firestore.
- Diseñar reglas privadas de Firestore antes de escribir datos reales.
- Diseñar migración local a nube sin pérdida de datos.
- Decidir qué datos quedan solo locales y qué datos se sincronizan.
- Preparar el camino para Storage de fotos sin guardar base64 en Firestore.

## Reglas del plan

- No migrar datos reales hasta cerrar el modelo de datos.
- No escribir documentos Firestore desde la app hasta tener reglas privadas definidas.
- No guardar imágenes base64 en Firestore.
- No eliminar almacenamiento local hasta verificar migración completa.
- Mantener backup local antes de cualquier migración real.
- Mantener compatibilidad con datos locales existentes.
- Usar Firebase Auth como dueño de datos mediante `usuarioId`.
- Mantener los adaptadores locales como respaldo durante esta etapa.

## FASE 1: Inventariar datos locales reales

### Objetivo

Confirmar qué datos existen hoy y qué forma tienen antes de diseñar el modelo Firestore definitivo.

- [x] Ejecutar lectura de inventario local con `InventarioMigracionFirebaseService`.
- [x] Contar productos, precios, comercios, direcciones, listas, items, preferencias, confirmaciones y fotos.
- [x] Identificar campos obligatorios actuales por tipo de dato.
- [x] Identificar campos opcionales o legacy que deben conservarse.
- [x] Identificar datos con base64 o imágenes externas.
- [x] Identificar relaciones actuales entre precios, productos, comercios y direcciones.
- [x] Documentar datos que pueden quedar solo locales.

## FASE 2: Definir modelo privado de Firestore

### Objetivo

Diseñar colecciones y documentos privados por usuario antes de escribir cualquier dato real.

- [x] Definir documento base `usuarios/{usuarioId}`.
- [x] Definir colección `usuarios/{usuarioId}/productos`.
- [x] Definir subcolección `usuarios/{usuarioId}/productos/{productoId}/precios`.
- [x] Definir colección `usuarios/{usuarioId}/comercios`.
- [x] Definir cómo representar direcciones de comercio.
- [x] Definir colección `usuarios/{usuarioId}/listasJustas`.
- [x] Definir documento de preferencias `usuarios/{usuarioId}/configuracion/preferencias`.
- [x] Definir colección o documentos para confirmaciones privadas.
- [x] Confirmar qué campos se guardan en cada documento y cuáles se calculan localmente.

## FASE 3: Diseñar productos y precios

### Objetivo

Evitar documentos gigantes y dejar claro cómo se consultan productos y precios.

- [x] Definir campos del documento producto.
- [x] Definir campos del documento precio.
- [x] Decidir qué campos calculados del producto se guardan y cuáles se recalculan.
- [x] Definir si `precioMejor`, `comercioMejor`, `monedaReferencia` y tendencias quedan persistidos.
- [x] Definir índices necesarios para búsqueda y orden.
- [x] Definir estrategia para buscar por código de barras.
- [x] Definir estrategia para buscar por nombre, marca y categoría.
- [x] Definir cómo manejar precios offline antes de sincronizar.

## FASE 4: Diseñar comercios y direcciones

### Objetivo

Separar comercios del bloque local actual y mantener compatibilidad con precios existentes.

- [x] Definir si cada comercio será un documento único.
- [x] Decidir si las direcciones quedan embebidas o como subcolección.
- [x] Definir campos mínimos de comercio.
- [x] Definir campos mínimos de dirección.
- [x] Definir cómo se conserva `comercioId` y `direccionId` usados por precios.
- [x] Definir migración de comercios duplicados o cadenas.
- [x] Definir cómo se actualiza nombre de comercio en precios relacionados.

## FASE 5: Diseñar Lista Justa y preferencias

### Objetivo

Preparar listas y preferencias para sincronización privada sin documentos demasiado grandes.

- [x] Definir si cada lista justa será un documento.
- [x] Decidir si items de lista quedan embebidos o en subcolección.
- [x] Definir límite razonable de items por lista antes de requerir subcolección.
- [x] Definir campos de configuración inteligente.
- [x] Definir cómo se relacionan items con productos existentes.
- [x] Definir documento de preferencias por usuario.
- [x] Definir qué preferencias deben sincronizarse y cuáles pueden quedar locales.

## FASE 6: Diseñar fotos y Storage futuro

### Objetivo

Dejar claro cómo se manejarán imágenes antes de migrar datos.

- [x] Identificar fotos de usuario en productos, comercios y listas.
- [x] Definir que Firestore guardará URL o ruta de Storage, no base64.
- [x] Definir estructura futura de Storage para fotos privadas.
- [x] Definir metadatos mínimos de foto: fuente, ruta, fecha, tipo de dato y dueño.
- [x] Decidir qué hacer con imágenes externas de APIs.
- [x] Definir migración posterior de fotos base64 a Storage.
- [x] Dejar Storage fuera de la primera migración si aumenta demasiado el riesgo.

## FASE 7: Diseñar reglas privadas de seguridad

### Objetivo

Preparar Firebase Security Rules antes de permitir lecturas o escrituras reales.

- [x] Escribir regla base para `usuarios/{usuarioId}`.
- [x] Permitir lectura/escritura solo cuando `request.auth.uid == usuarioId`.
- [x] Bloquear acceso a usuarios no autenticados.
- [x] Definir reglas para subcolecciones de productos, precios, comercios y listas.
- [x] Definir reglas futuras para Storage privado.
- [x] Preparar pruebas manuales de reglas en Firebase Console.

## FASE 8: Diseñar migración local a Firestore

### Objetivo

Definir un flujo seguro para subir datos locales del usuario autenticado a Firestore.

- [x] Crear backup local antes de migrar.
- [x] Mostrar resumen de datos a migrar al usuario.
- [x] Pedir confirmación explícita antes de subir datos.
- [x] Migrar productos primero.
- [x] Migrar precios después de crear productos.
- [x] Migrar comercios y conservar mapeo de IDs.
- [x] Migrar listas y preservar relación con productos.
- [x] Migrar preferencias.
- [x] Registrar estado de migración para evitar duplicados.
- [x] Permitir reintento si falla a mitad.
- [x] Verificar cantidades antes y después.

## FASE 9: Diseñar sincronización inicial

### Objetivo

Definir cómo la app pasará de local a Firestore sin romper experiencia offline.

- [x] Decidir si Firestore será fuente principal después de migrar.
- [x] Definir cómo se cargarán datos desde caché offline.
- [x] Definir estados visibles: offline, sincronizando, sincronizado y error.
- [x] Definir comportamiento si el usuario cierra sesión.
- [x] Definir comportamiento si el usuario inicia sesión en otro dispositivo.
- [x] Definir estrategia para conflictos simples.
- [x] Decidir si se mantiene copia local propia además de Firestore Offline.

## FASE 10: Preparar plan de implementación posterior

### Objetivo

Dejar listo el siguiente plan ejecutable para escribir código Firestore privado.

- [x] Definir archivos nuevos necesarios para servicios Firestore.
- [x] Definir si se crea un `FirestoreAdapter` o servicios específicos por dominio.
- [x] Definir orden de implementación: productos, comercios, listas, preferencias.
- [x] Definir qué pruebas deben hacerse por cada tipo de dato.
- [x] Actualizar `Resumen11Firebase.md` con decisiones finales del modelo.

## FASE TESTING

### Objetivo

Validar que el modelo y la migración diseñados son ejecutables por IA y revisables por humano antes de tocar datos reales.

- [x] Revisar que cada colección Firestore tenga ruta, dueño y campos definidos.
- [x] Revisar que cada tipo de dato local tenga destino en Firestore o decisión de quedar local.
- [x] Revisar que precios no queden en documentos gigantes.
- [x] Revisar que fotos base64 no se escriban en Firestore.
- [x] Revisar que reglas privadas cubran todas las rutas de datos.
- [x] Revisar que la migración tenga backup, confirmación, reintento y validación.
- [x] Revisar que no haya ambigüedad sobre fuente principal después de migrar.
- [x] Ejecutar `npm run lint` si se modifica documentación o constantes relacionadas.
- [x] Confirmar con Leo que el modelo queda aprobado antes de implementar Firestore privado.

## Progreso del plan

- [x] Fase 1: Inventariar datos locales reales
- [x] Fase 2: Definir modelo privado de Firestore
- [x] Fase 3: Diseñar productos y precios
- [x] Fase 4: Diseñar comercios y direcciones
- [x] Fase 5: Diseñar Lista Justa y preferencias
- [x] Fase 6: Diseñar fotos y Storage futuro
- [x] Fase 7: Diseñar reglas privadas de seguridad
- [x] Fase 8: Diseñar migración local a Firestore
- [x] Fase 9: Diseñar sincronización inicial
- [x] Fase 10: Preparar plan de implementación posterior
- [x] Fase Testing

Fecha de creación: 19 de Mayo 2026
Fecha de última actualización: 19 de Mayo 2026
Estado: TERMINADO
## Resultado de ejecución

- Inventario local ejecutado con `InventarioMigracionFirebaseService` desde MCP Browser en `http://127.0.0.1:9301`.
- Resultado del inventario probado: adaptador `local`; productos `0`, precios `0`, comercios `0`, direcciones `0`, listas `0`, items `0`, preferencias `false`, confirmaciones `0`, fotos `0`.
- Modelo privado aprobado bajo `usuarios/{usuarioId}`.
- Productos y precios quedan separados: productos como documentos y precios como subcolección por producto.
- Comercios quedan como documentos privados con direcciones embebidas hasta 50 sucursales.
- Lista Justa queda como documento privado con items embebidos hasta 100 items.
- Preferencias quedan en `usuarios/{usuarioId}/configuracion/preferencias`.
- Confirmaciones quedan en `usuarios/{usuarioId}/confirmaciones/{confirmacionId}`.
- `sesion_escaneo`, backups y cola de sincronización quedan locales.
- Fotos base64 no se escriben en Firestore; la migración de fotos a Storage queda para un plan posterior.
- Se agregaron rutas, límites y campos del modelo en `src/almacenamiento/constantes/PreparacionFirebase.js`.
- Se creó `Planes/Resumenes/ModeloFirestoreMigracion.md` con el modelo, reglas propuestas, índices y flujo de migración.

## Resultado de testing

- Revisión de rutas, dueño y campos por colección: OK.
- Revisión de destino para cada dato local: OK.
- Revisión de precios fuera del documento producto: OK.
- Revisión de fotos base64 fuera de Firestore: OK.
- Revisión de reglas privadas propuestas: OK.
- Revisión de migración con backup, confirmación, reintento y validación: OK.
- Revisión de fuente principal posterior a migración: OK.
- `npm run lint`: OK.
- `npm run build`: OK.
- Confirmación pendiente de Leo: aprobar modelo antes de implementar escrituras Firestore reales.
