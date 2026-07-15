# PLAN CATÁLOGO COMPARTIDO FIREBASE

## Descripción del plan

Incorporar un catálogo técnico compartido en Firebase Firestore para reutilizar datos generales de productos entre usuarios. El catálogo será un respaldo de búsqueda entre los productos privados del usuario y las APIs externas. Los precios, comercios, listas, fotos privadas y datos del usuario seguirán siendo privados.

## Objetivo principal

- Consultar datos reutilizables de productos por código de barras sin descargar un catálogo completo.
- Evitar duplicados comunitarios usando el código de barras normalizado como identificador único.
- Mantener separados los datos compartidos de los datos privados de cada usuario.
- Permitir que un producto comunitario incompleto reciba únicamente datos faltantes, sin sobrescribir automáticamente datos ya publicados.

## Reglas del plan

- El orden de búsqueda será: Mis productos, catálogo compartido Firestore, APIs externas y creación manual.
- El catálogo comunitario solo contendrá datos generales de identificación del producto; nunca precios, monedas, comercios, listas, fotos privadas, UID, correo ni datos del autor.
- La clave comunitaria será el código de barras normalizado. Productos sin código de barras válido permanecen privados y no se publican.
- La edición privada de un producto no debe alterar datos comunitarios ya existentes. Solo se podrán completar campos comunitarios que estén vacíos.
- Respetar la arquitectura local-first existente: la interfaz conserva la respuesta local inmediata y las consultas remotas se ejecutan como respaldo.

## FASE 1: Definir contrato y límites del catálogo

### Objetivo

Establecer el modelo comunitario mínimo, las condiciones de publicación y los límites de seguridad antes de modificar servicios o reglas.

- [ ] Revisar el modelo actual de producto, la normalización de código de barras y los puntos reales de guardado manual y Mesa de trabajo.
- [ ] Definir la ruta `catalogoCompartido/productos/{codigoBarrasNormalizado}` y documentar los campos compartidos permitidos: código de barras, nombre, marca, cantidad o presentación, categoría, imagen pública si corresponde, fechas técnicas y versión de datos.
- [ ] Definir qué campos se consideran vacíos y pueden completarse sin reemplazar valores existentes.
- [ ] Definir los requisitos mínimos para crear un documento comunitario incompleto: usuario autenticado, código de barras válido y campos con formato y longitud permitidos.

## FASE 2: Crear acceso aislado al catálogo compartido

### Objetivo

Incorporar un servicio de Firestore independiente de los productos privados para consultar, crear y completar fichas comunitarias por código de barras.

- [ ] Crear un servicio con responsabilidades exclusivas de catálogo compartido, siguiendo los patrones de los servicios Firestore existentes.
- [ ] Implementar consulta directa de un único documento por código de barras normalizado, sin consultas masivas ni carga inicial del catálogo.
- [ ] Implementar creación idempotente para que varios usuarios que aporten el mismo código mantengan un único documento comunitario.
- [ ] Implementar actualización limitada a campos vacíos y preservar los valores comunitarios ya existentes.
- [ ] Mantener separado el resultado comunitario de las entidades privadas del almacenamiento local hasta que el usuario complete su propio flujo de guardado.
- [ ] Registrar únicamente metadatos técnicos necesarios para depurar y ordenar datos, sin exponer identidad de usuarios.

## FASE 3: Integrar la búsqueda de respaldo

### Objetivo

Usar el catálogo compartido como segunda fuente de datos en los flujos que hoy consultan productos locales y APIs.

- [ ] Revisar `BusquedaProductosHibridaService.js` y centralizar allí la consulta al catálogo compartido entre la búsqueda local y las APIs externas.
- [ ] Mantener las respuestas actuales de Mis productos como primera prioridad.
- [ ] Cuando se encuentre una ficha comunitaria, devolverla con el mismo contrato de datos que consume el modal de agregar producto y los flujos de Lista Justa.
- [ ] Completar automáticamente los campos del formulario con los datos comunitarios encontrados, sin mostrar un diálogo adicional.
- [ ] Mantener la posibilidad de editar los campos en el modal antes de guardar.
- [ ] Confirmar que el escaneo rápido y la ráfaga continúan enviando registros incompletos a Mesa de trabajo para su corrección.
- [ ] Conservar el fallback a todas las APIs actuales si el catálogo compartido no tiene el código buscado.

## FASE 4: Publicar y completar datos desde flujos privados

### Objetivo

Publicar datos generales reutilizables sin modificar el comportamiento privado de productos, precios ni comercios.

- [ ] Identificar el punto posterior al guardado local exitoso donde un producto manual con código de barras puede crear o completar la ficha comunitaria.
- [ ] Publicar de forma silenciosa el producto cuando tenga código válido, sin agregar una confirmación visual adicional en el modal.
- [ ] Permitir que una corrección hecha desde Mesa de trabajo complete campos comunitarios que estén vacíos.
- [ ] Evitar que cambios de nombre, marca, presentación o imagen en un producto privado reemplacen datos comunitarios ya existentes.
- [ ] Verificar que un fallo al publicar en el catálogo compartido no impida guardar el producto privado ni sus precios.
- [ ] Mantener precios, comercios, listas y fotos privadas fuera de toda escritura al catálogo compartido.

## FASE 5: Ajustar reglas y documentación Firebase

### Objetivo

Proteger el catálogo compartido y dejar documentada su convivencia con las colecciones privadas actuales.

- [ ] Extender `firestore.rules` para permitir lectura del catálogo compartido y escritura solo a usuarios autenticados bajo el contrato de campos permitido.
- [ ] Restringir por reglas los tipos, longitudes y campos admitidos, y bloquear datos privados o campos no autorizados.
- [ ] Impedir por reglas que una actualización reemplace un campo comunitario no vacío por otro valor.
- [ ] Mantener intactas las reglas privadas actuales bajo `usuarios/{uid}`.
- [ ] Actualizar `Planes/Manuales/ManualFirebaseGratis.md` con la nueva colección, el criterio de completado, el flujo de respaldo y las restricciones de seguridad.
- [ ] Revisar el impacto de lecturas, escrituras y almacenamiento respecto del plan gratuito de Firebase antes de habilitar la publicación general.

## FASE TESTING

### Objetivo

Validar el catálogo compartido con dos usuarios, sin regresiones en el almacenamiento privado ni mezcla de datos.

- [ ] Ejecutar lint y build del proyecto al finalizar los cambios.
- [ ] Con el usuario A, crear manualmente un producto con código de barras y verificar que se guarda de forma privada y crea una única ficha comunitaria.
- [ ] Con el usuario B, buscar el mismo código y verificar que el modal se completa desde el catálogo compartido antes de consultar APIs.
- [ ] Guardar el producto del usuario B con un precio y comercio propios, y verificar que esos datos no se escriben ni aparecen en la ficha comunitaria.
- [ ] Crear desde el usuario A una ficha comunitaria con datos incompletos y comprobar que el usuario B puede completar solo sus campos vacíos.
- [ ] Intentar modificar desde un usuario un campo comunitario ya completado y verificar que la regla o el servicio bloquea el reemplazo.
- [ ] Buscar un código inexistente en Mis productos y catálogo compartido, y verificar el fallback actual hacia las APIs y creación manual.
- [ ] Probar escaneo rápido y ráfaga con datos incompletos y verificar la continuidad del flujo hacia Mesa de trabajo.
- [ ] Verificar con dos usuarios que las colecciones privadas `usuarios/{uid}` no son legibles ni editables por el otro usuario.
- [ ] Revisar en Firebase que no se generen documentos duplicados para el mismo código de barras ni lecturas masivas del catálogo.

## Progreso del plan

- [ ] Fase 1: Definir contrato y límites del catálogo
- [ ] Fase 2: Crear acceso aislado al catálogo compartido
- [ ] Fase 3: Integrar la búsqueda de respaldo
- [ ] Fase 4: Publicar y completar datos desde flujos privados
- [ ] Fase 5: Ajustar reglas y documentación Firebase
- [ ] Fase Testing

Fecha de creación: 14 de Julio 2026
Fecha de última actualización: 14 de Julio 2026
Estado: BORRADOR
