# PLAN CATÁLOGO COMPARTIDO FIREBASE

## Descripción del plan

Incorporar un catálogo técnico compartido en Firebase Firestore para reutilizar datos generales de productos entre usuarios. El catálogo será un respaldo de búsqueda por código de barras entre los productos privados del usuario y las APIs externas. Los precios, comercios, listas, fotos privadas y datos del usuario seguirán siendo privados.

## Objetivo principal

- Consultar una ficha compartida por código de barras sin descargar ni recorrer el catálogo completo.
- Mantener un único documento por GTIN válido y evitar duplicados o sobrescrituras entre usuarios.
- Conservar aislados los productos privados y toda la sincronización Firebase actual.
- Publicar solamente fichas que tengan código de barras, nombre, cantidad y unidad.

## Reglas del plan

- El orden de búsqueda por código será: Mis productos, catálogo compartido Firestore, APIs externas y creación manual.
- La búsqueda por nombre conserva su comportamiento actual y no consulta el catálogo compartido.
- La clave comunitaria será un GTIN normalizado y validado. Solo se aceptarán GTIN-8, GTIN-12, GTIN-13 o GTIN-14 con dígito verificador correcto.
- Cada ficha comunitaria deberá tener `codigoBarras`, `nombre`, `cantidad` y `unidad`. Marca y categoría son opcionales.
- `imagenUrl` será opcional y solo podrá ser una URL HTTP(S) recibida de una API. Nunca se publicarán base64, fotos locales, rutas de Storage ni metadatos de fotos privadas.
- El catálogo no contendrá precios, monedas, comercios, listas, UID, correo, fotos privadas ni datos del autor.
- Una ficha compartida solo se puede crear o completar; los valores comunitarios ya existentes no se reemplazan desde una edición privada.
- Solo usuarios Firebase autenticados podrán consultar o aportar al catálogo. Usuarios locales conservan el flujo actual y omiten esta fuente.
- La publicación comunitaria es oportunista: no habrá migración masiva de productos existentes ni cola offline en esta versión. Un fallo remoto nunca impedirá guardar el producto privado.
- Respetar la arquitectura local-first: el catálogo es una fuente de respaldo y no participa de la reconciliación de colecciones privadas.

## FASE 1: Definir contrato y validación comunitaria

### Objetivo

Dejar definido el documento compartido, la validación exclusiva de catálogo y los puntos de publicación sin alterar reglas privadas existentes.

- [x] Consultar `Planes/Manuales/ManualFirebaseGratis.md` antes de implementar y actualizarlo al finalizar con el patrón confirmado.
- [x] Consultar `DatosLocalesProyectos.md` solo de forma local si está disponible, sin copiar, versionar ni exponer sus contenidos.
- [x] Definir la ruta `catalogoCompartidoProductos/{codigoBarrasNormalizado}`.
- [x] Definir los campos permitidos: `codigoBarras`, `nombre`, `cantidad`, `unidad`, `marca`, `categoria`, `imagenUrl`, `origenCatalogo`, `fechaCreacion` y `fechaActualizacion`.
- [x] Definir `origenCatalogo` como metadato técnico limitado a `api` o `manual`, sin mostrar ni almacenar identidad del usuario.
- [x] Crear un validador de GTIN exclusivo para el catálogo, con normalización, longitudes admitidas y dígito verificador.
- [x] Mantener códigos no GTIN y formatos privados existentes funcionando en Mis productos sin publicarlos al catálogo.
- [x] Requerir código GTIN válido, nombre no vacío, cantidad mayor a cero y unidad no vacía antes de cualquier escritura comunitaria.
- [x] Definir que una imagen solo es apta si es una URL HTTP(S) externa proveniente de API; cualquier otra imagen queda privada.

## FASE 2: Crear acceso aislado al catálogo compartido

### Objetivo

Incorporar un servicio Firestore independiente de los productos privados para consultar, crear y completar fichas comunitarias por código exacto.

- [x] Crear `FirestoreCatalogoCompartidoService.js` con responsabilidades exclusivas de catálogo compartido.
- [x] Agregar en `PreparacionFirebase.js` las rutas y campos exclusivos del catálogo, separados de las constantes privadas bajo `usuarios/{uid}`.
- [x] Implementar consulta directa de un único documento por referencia, sin `getDocs`, filtros, paginación ni carga inicial del catálogo.
- [x] Implementar creación y completado con `runTransaction` para leer la ficha, crearla si no existe y escribir únicamente los campos que estén vacíos.
- [x] Mantener la función de transacción sin cambios de estado de Vue o Pinia, porque Firestore puede reintentarla ante concurrencia.
- [x] Omitir la consulta y escritura comunitaria si el usuario actual es local, no está autenticado o el código no supera la validación GTIN.
- [x] Tratar un error, timeout u operación offline del catálogo como resultado omitido y permitir que el flujo continúe con la fuente siguiente o con el guardado privado.

## FASE 3: Integrar la búsqueda de respaldo por código

### Objetivo

Usar el catálogo como segunda fuente solamente en la búsqueda exacta por código, sin alterar la búsqueda por nombre ni los flujos de APIs existentes.

- [x] Integrar el servicio en `BusquedaProductosHibridaService.js` después de Mis productos y antes de `BuscadorProductosService`.
- [x] Extender el contrato de `buscarPorCodigoConPolitica()` con el origen `catalogo` y mapear la ficha al contrato que ya consumen el modal y Lista Justa.
- [x] Mantener Mis productos como primera prioridad y devolver sus datos sin consultar el catálogo cuando exista coincidencia local.
- [x] Cuando exista una ficha comunitaria, completar el formulario como ocurre con una API y permitir que el usuario edite su copia privada antes de guardar.
- [x] Mantener `forzarApi` como una ruta que omite Mis productos y catálogo compartido para consultar únicamente las APIs externas.
- [x] Mantener `buscarPorNombreConPolitica()` sin consultas al catálogo compartido.
- [x] Si Firestore no responde, está offline o niega acceso, continuar silenciosamente con las APIs sin mostrar un error que bloquee la carga de producto.
- [x] Verificar que escaneo rápido, ráfaga y Mesa de trabajo continúen usando el mismo servicio de búsqueda y conserven su flujo de corrección.

## FASE 4: Publicar desde flujos privados elegibles

### Objetivo

Aportar datos comunitarios solo desde altas o cambios identificatorios, sin sumar lecturas o escrituras por precios, confirmaciones o interacciones.

- [x] Identificar los flujos que crean un producto nuevo desde `DialogoAgregarProducto.vue` y `MesaTrabajoPage.vue`.
- [x] Integrar la publicación a través de un servicio o acción de dominio, nunca desde componentes Vue ni dentro de `ProductosService.guardarProducto()` de forma genérica.
- [x] Publicar después de que el producto privado quede guardado localmente y sin esperar éxito de la sincronización privada de precios, fotos o comercios.
- [x] Publicar solo en altas nuevas o cuando cambien `codigoBarras`, `nombre`, `cantidad`, `unidad`, `marca`, `categoria` o una `imagenUrl` apta.
- [x] No publicar al agregar un precio, confirmar un precio, registrar interacción, cambiar comercio ni modificar una foto privada.
- [x] Para un producto manual con los cuatro datos obligatorios, crear o completar su ficha comunitaria de forma silenciosa.
- [x] Para un producto de API con los cuatro datos obligatorios, crear o completar la misma ficha comunitaria y conservar `origenCatalogo: api`.
- [x] Si la app está offline, guardar solo el producto privado. El aporte se reintentará únicamente en una futura alta o edición identificatoria realizada con conexión.
- [x] No ejecutar una migración automática de productos ya existentes para proteger cuota, privacidad y rendimiento.

## FASE 5: Proteger reglas y documentar Firebase

### Objetivo

Agregar la nueva colección sin relajar el aislamiento actual de `usuarios/{uid}` ni exponer el catálogo completo.

- [x] Extender `firestore.rules` con una coincidencia específica para `catalogoCompartidoProductos/{codigoBarras}` antes del cierre global por defecto.
- [x] Permitir solo `get` autenticado sobre una ficha compartida y denegar `list` explícitamente.
- [x] Permitir `create` autenticado solo cuando el ID de documento coincida con el GTIN válido y el documento tenga exclusivamente los campos permitidos y obligatorios.
- [x] Permitir `update` autenticado solo para agregar campos comunitarios faltantes o actualizar `fechaActualizacion`, sin cambiar código, nombre, cantidad, unidad ni otros valores ya existentes.
- [x] Denegar `delete` desde clientes; una corrección excepcional se realizará de forma administrativa y controlada.
- [x] Mantener intactas las reglas privadas actuales bajo `usuarios/{uid}` y el cierre global del resto de rutas.
- [ ] Validar las reglas en el emulador o Rules Playground con peticiones autenticadas y sin autenticación antes de cualquier despliegue.
- [x] Actualizar `Planes/Manuales/ManualFirebaseGratis.md` con colección, contrato, validación GTIN, consultas directas, transacciones, política offline y límites de seguridad.
- [ ] Medir lecturas, escrituras y almacenamiento de la prueba antes de habilitar la publicación general.
- [x] Solicitar confirmación explícita de Leo antes de desplegar `firestore.rules` en el proyecto de producción.

## FASE 6: Desplegar de forma controlada

### Objetivo

Publicar el cambio sin interrumpir las rutas privadas ni dejar una versión de app sin fallback.

- [x] Verificar que lint, build y pruebas de compilación de reglas finalicen correctamente antes del despliegue.
- [x] Revisar el diff de `firestore.rules` y confirmar que solo agrega la ruta del catálogo compartido.
- [x] Desplegar las reglas únicamente después de la confirmación explícita de Leo.
- [ ] Publicar la versión de la app y verificar que una denegación o indisponibilidad temporal del catálogo continúe hacia las APIs externas.
- [ ] Confirmar con dos cuentas reales que las rutas privadas siguen aisladas después del despliegue.

## FASE TESTING

### Objetivo

Validar el catálogo compartido, las reglas y los flujos privados con dos usuarios sin regresiones ni consumo masivo.

- [x] Ejecutar `npm run lint` y `npm run build` al finalizar los cambios.
- [ ] Validar GTIN-8, GTIN-12, GTIN-13 y GTIN-14 correctos, y comprobar que códigos con longitud o dígito verificador inválidos permanecen solo privados.
- [ ] Intentar publicar sin nombre, sin cantidad o sin unidad y verificar que no se crea una ficha comunitaria.
- [ ] Con el usuario A, crear un producto elegible y verificar una única ficha comunitaria con los campos permitidos.
- [ ] Con el usuario B, buscar el mismo código y verificar que el modal se completa desde el catálogo antes de consultar APIs.
- [ ] Ejecutar dos aportes simultáneos del mismo código y verificar que la transacción conserva una sola ficha y no reemplaza valores existentes.
- [ ] Guardar desde el usuario B precio, comercio, lista, foto local o confirmación y verificar que nada de ello se escribe en la ficha comunitaria.
- [ ] Probar una URL de imagen recibida de API y verificar que se guarda solo como `imagenUrl`; probar base64, foto local y ruta Storage, y verificar que no se publican.
- [ ] Probar una edición privada que contradiga una ficha comunitaria existente y verificar que la ficha compartida no cambia.
- [ ] Probar una búsqueda por nombre y verificar que no consulta el catálogo; probar `forzarApi` y verificar que omite fuente local y compartida.
- [ ] Usar un usuario local y verificar que no intenta leer ni escribir el catálogo compartido.
- [ ] Crear o editar un producto sin conexión y verificar que queda guardado de forma privada aunque el aporte comunitario sea omitido.
- [ ] Validar reglas: lectura directa autenticada permitida, `list` denegado, lectura sin sesión denegada, escritura con campos extra denegada y reemplazo de campo existente denegado.
- [ ] Verificar con dos usuarios que las colecciones privadas `usuarios/{uid}` no son legibles ni editables por el otro usuario.
- [ ] Revisar en Firebase que no se generen documentos duplicados ni consultas masivas del catálogo.

## Progreso del plan

- [x] Fase 1: Definir contrato y validación comunitaria
- [x] Fase 2: Crear acceso aislado al catálogo compartido
- [x] Fase 3: Integrar la búsqueda de respaldo por código
- [x] Fase 4: Publicar desde flujos privados elegibles
- [ ] Fase 5: Proteger reglas y documentar Firebase
- [ ] Fase 6: Desplegar de forma controlada
- [ ] Fase Testing

Fecha de creación: 14 de Julio 2026
Fecha de última actualización: 15 de Julio 2026
Estado: EN PROCESO
