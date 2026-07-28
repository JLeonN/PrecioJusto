# Manual Técnico Firebase Gratis Para Apps Quasar/Capacitor

## Propósito

Este manual explica cómo integrar Firebase en una app Quasar/Capacitor usando un enfoque gratuito, ordenado y replicable. Nace de la experiencia real de integrar Firebase en una app grande que ya tenía datos locales, versión web, versión Android, LocalStorage, Capacitor Preferences y varios dominios de datos.

El objetivo no es copiar una app específica. El objetivo es que una IA futura, o Leo, pueda leer este documento y entender cómo llevar Firebase a otra app sin repetir errores, sin mezclar responsabilidades y sin activar servicios pagos por accidente.

La recomendación principal es esta:

> Firebase debe integrarse por capas. No debe agregarse como un archivo mágico que escucha toda la app.

Firebase funciona bien cuando cada dominio de datos tiene su propio servicio, cuando el usuario actual está centralizado, cuando Firestore tiene reglas privadas claras y cuando la app conserva un fallback local mientras se valida la migración.

---

## Alcance Del Enfoque Gratis

Este manual asume que se quiere mantener la app dentro del plan gratis de Firebase siempre que sea posible.

Servicios recomendados para este enfoque:

- Firebase Auth con correo y contraseña y, si aporta valor, Google Sign-In.
- Cloud Firestore para datos privados del usuario.
- Firestore Offline para cache local y escrituras pendientes.
- Firebase Security Rules para aislar datos por usuario.
- LocalStorage o Capacitor Preferences como respaldo local durante la transición.

Servicios que deben tratarse con cuidado:

- Firebase Storage para fotos o archivos.
- Cloud Functions.
- Extensiones.
- Cualquier flujo que requiera Blaze o facturación activa.

Regla práctica:

> Si el objetivo es gratis, primero cerrar Auth + Firestore privado sin fotos. Las fotos se analizan aparte.

---

## Resultado Esperado

Al terminar una integración correcta, la app debería tener:

- Login, registro, recuperación de contraseña, Google Sign-In y logout.
- Sesión persistente entre recargas.
- Datos privados guardados bajo el UID de Firebase Auth.
- Firestore como fuente principal cuando hay usuario autenticado.
- Fallback local si no hay sesión, si no hay red o si Firestore falla.
- Firestore Offline activo.
- Limpieza de stores al cambiar de usuario.
- Reglas Firestore que impiden que un usuario lea datos de otro.
- Pruebas en navegador y celular.
- Build web publicado con variables Firebase disponibles en GitHub Actions si se usa GitHub Pages.
- Validación manual o automática mirando documentos reales en Firebase.

No se considera cerrada la integración si solo "parece funcionar" en la UI. También hay que comprobar Firestore.

---

## Arquitectura Recomendada

La arquitectura recomendada tiene estas capas:

```text
UI Vue/Quasar
  -> Store Pinia del dominio
    -> Service del dominio
      -> Adaptador local
      -> Service Firestore del dominio
        -> FirebaseBaseService
        -> UsuarioActualService
```

Cada capa tiene una responsabilidad concreta.

### UI Vue/Quasar

La UI no debería escribir directamente en Firestore ni en LocalStorage.

Correcto:

```text
Formulario -> store.guardarProducto() -> ProductosService -> FirestoreProductosService
```

Incorrecto:

```text
Formulario -> setDoc()
Formulario -> localStorage.setItem()
```

La UI puede mostrar estados de carga, errores y avisos, pero no debe conocer detalles de rutas Firestore.

### Stores Pinia

Los stores manejan estado visible, carga inicial, limpieza y acciones de alto nivel.

Responsabilidades recomendadas:

- Mantener listas visibles.
- Exponer `cargando`, `error`, `fuenteDatos` o estado similar.
- Llamar al service del dominio.
- Limpiar estado al cambiar de usuario.
- Hidratar datos cuando la sesión esté lista.

Responsabilidades que no deberían tener:

- Construir rutas Firestore.
- Escribir documentos directamente.
- Duplicar lógica de sincronización que ya existe en el service.
- Leer o escribir LocalStorage directamente.

### Services De Dominio

Cada dominio importante debe tener su propio service.

Ejemplos universales:

- `ProductosService`
- `ComerciosService`
- `ListasService`
- `PreferenciasService`
- `MesaTrabajoService`
- `NotasService`
- `TareasService`
- `ClientesService`

El patrón recomendado es:

1. Normalizar datos.
2. Guardar localmente.
3. Intentar sincronizar con Firestore si hay usuario Firebase.
4. Devolver estado de sincronización.
5. No romper la UI si Firestore falla.

Regla importante:

> La escritura a Firestore debe vivir en los services de dominio, no repartida por componentes ni duplicada en stores.

### Services Firestore

Cada dominio debería tener un service Firestore propio.

Ejemplos:

- `FirestoreProductosService`
- `FirestoreComerciosService`
- `FirestoreListasService`
- `FirestorePreferenciasService`
- `FirestoreMesaTrabajoService`

Responsabilidades:

- Construir referencias Firestore.
- Aplicar whitelist de campos permitidos.
- Normalizar datos antes de guardar.
- Leer documentos del usuario actual.
- Omitir escritura si no hay usuario Firebase.
- Usar `setDoc`, `getDoc`, `getDocs`, `deleteDoc` o eliminación lógica según el dominio.

Este service no debería conocer la UI.

### FirebaseBaseService

Debe centralizar:

- Inicialización de Firebase App.
- Auth.
- Firestore.
- Activación de Firestore Offline.
- Helpers para obtener instancias.

Este archivo evita inicializaciones duplicadas y reduce errores.

### UsuarioActualService

Debe centralizar el usuario actual de la app.

Responsabilidades:

- Saber si el usuario actual es local o Firebase.
- Exponer el UID actual.
- Cambiar a usuario Firebase al iniciar sesión.
- Restaurar usuario local al cerrar sesión.
- Evitar que services inventen usuarios por su cuenta.

Regla práctica:

> Ningún service debería inventar un UID. Todos deben pasar por el usuario actual centralizado.

---

## Modelo Universal De Firestore

El modelo recomendado para datos privados es:

```text
usuarios/{usuarioId}/{dominio}/{documentoId}
```

Ejemplos:

```text
usuarios/{usuarioId}/productos/{productoId}
usuarios/{usuarioId}/comercios/{comercioId}
usuarios/{usuarioId}/listas/{listaId}
usuarios/{usuarioId}/mesaTrabajoItems/{itemId}
usuarios/{usuarioId}/configuracion/preferencias
usuarios/{usuarioId}/configuracion/perfil
usuarios/{usuarioId}/confirmaciones/{confirmacionId}
```

Para datos de configuración que son un solo documento:

```text
usuarios/{usuarioId}/configuracion/preferencias
```

Para datos repetidos:

```text
usuarios/{usuarioId}/tareas/{tareaId}
usuarios/{usuarioId}/notas/{notaId}
usuarios/{usuarioId}/clientes/{clienteId}
```

Para subdatos que pueden crecer mucho:

```text
usuarios/{usuarioId}/productos/{productoId}/precios/{precioId}
usuarios/{usuarioId}/proyectos/{proyectoId}/eventos/{eventoId}
```

Recomendación:

- Usar documentos separados para datos que crecen sin límite.
- Evitar documentos gigantes.
- Embeber arrays solo cuando tienen límite claro.
- Guardar `usuarioId` dentro del documento como campo de auditoría, aunque la ruta ya lo tenga.

---

### Catálogo Compartido Por GTIN

Cuando una app necesita reutilizar datos generales de productos entre usuarios, crear una colección global separada de las rutas privadas:

```text
catalogoCompartidoProductos/{codigoBarras}
```

No reutilizar documentos ni fotos bajo `usuarios/{uid}`. El catálogo solo puede contener datos identificatorios sin UID, correo, precios, comercios, listas ni metadata privada.

Contrato recomendado:

```text
codigoBarras
nombre
cantidad
unidad
marca opcional
categoria opcional
imagenUrl opcional de API pública
origenCatalogo: api | manual
fechaCreacion
fechaActualizacion
```

Usar GTIN-8, GTIN-12, GTIN-13 o GTIN-14 como ID del documento. El cliente debe normalizar el código y validar su dígito verificador antes de consultar o publicar. Las reglas deben validar formato numérico, longitud, campos y coincidencia entre ID y `codigoBarras`; no sustituir la validación de dígito verificador del cliente.

La búsqueda debe ser puntual con `get` por código exacto. Permitir `get` autenticado y denegar `list` evita descargar o enumerar el catálogo completo.

Para crear o completar una ficha, usar `runTransaction`: leer el documento, crear si no existe y completar solo campos vacíos. No permitir que una edición privada reemplace datos comunitarios ya existentes. La transacción requiere conexión; si falla u opera offline, guardar el producto privado y omitir el aporte sin bloquear al usuario.

La publicación debe ocurrir solo al crear un producto o modificar datos identificatorios. No dispararla al agregar precios, comercios, confirmaciones o interacciones. No hacer una migración masiva inicial si la cuota gratuita es una prioridad.

Una foto tomada o elegida por el usuario sigue siendo privada aunque esté comprimida. Solo compartir `imagenUrl` cuando provenga de una API pública; no publicar base64, rutas de Storage ni documentos de imagen bajo `usuarios/{uid}`.

---

## Reglas Firestore Recomendadas

La seguridad real está en Firestore Rules, no en la UI.

Regla base recomendada:

```text
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function estaAutenticado() {
      return request.auth != null;
    }

    function esDueno(usuarioId) {
      return estaAutenticado() && request.auth.uid == usuarioId;
    }

    match /usuarios/{usuarioId}/{documento=**} {
      allow read, write: if esDueno(usuarioId);
    }

    match /{documento=**} {
      allow read, write: if false;
    }
  }
}
```

Esto garantiza:

- Usuario A solo ve datos de usuario A.
- Usuario B queda bloqueado.
- Usuarios sin sesión quedan bloqueados.
- Rutas fuera del modelo privado quedan denegadas.

No confiar en filtros de la app para seguridad. La app puede ocultar datos, pero las reglas son las que protegen.

---

## Auth Y Sesión

Firebase Auth debe integrarse antes de migrar datos.

Orden recomendado:

1. Crear proyecto Firebase.
2. Activar proveedor de correo y contraseña.
3. Activar Google solo si la app necesita acceso rápido sin contraseña.
4. Crear service de Auth.
5. Crear store de usuario.
6. Crear página de acceso.
7. Proteger rutas.
8. Probar registro, login, persistencia y logout.

El store de usuario debería tener:

- `usuario`
- `cargandoSesion`
- `cargandoAccion`
- `error`
- `estaAutenticado`
- `usuarioId`
- `inicializarSesion`
- `esperarSesionLista`
- `registrarUsuario`
- `iniciarSesion`
- `iniciarSesionConGoogle`
- `vincularGoogleConCorreo`
- `cerrarSesion`
- `recuperarContrasena`

Al iniciar sesión:

- Guardar usuario Firebase como usuario actual.
- Hidratar stores privados.
- Leer datos desde Firestore.

Al cerrar sesión:

- Cerrar sesión Firebase.
- Restaurar usuario local si la app lo necesita.
- Limpiar stores privados.
- Evitar que queden datos visuales de otro usuario.

Error común:

> Cerrar sesión sin limpiar stores deja datos del usuario anterior visibles en pantalla.

### Inicio De Sesión Con Google

Google Sign-In puede seguir dentro del plan gratis y conviene tratarlo como otro proveedor de Firebase Auth, no como una sesión paralela de Google.

Objetivo de arquitectura:

```text
Pantalla de acceso
  -> UsuarioStore
    -> AutenticacionFirebaseService
      -> Firebase Auth
        -> UsuarioActualService + stores privados + caché uid-{usuarioId}
```

La UI nunca debe importar Firebase ni el plugin nativo directamente. El resultado final siempre debe ser una única sesión de Firebase Auth, para que `onAuthStateChanged`, el UID, los stores y Firestore sigan el mismo flujo que correo y contraseña.

#### Configuración En Firebase

1. Activar **Google** en Firebase Authentication, sin desactivar correo y contraseña si ambos métodos se mantienen.
2. Definir un nombre visible y correo de soporte para la pantalla de consentimiento.
3. En Authentication, agregar los dominios autorizados de cada entorno web. Para desarrollo usar `localhost`, sin puerto. Agregar también el dominio real publicado, por ejemplo GitHub Pages.
4. Registrar la app Android con el `applicationId` exacto.
5. Agregar SHA-1 y SHA-256 de cada certificado que firma la app: debug para pruebas USB, release y firma de Google Play si la tienda vuelve a firmar el AAB.
6. Descargar nuevamente `google-services.json` después de agregar las huellas y reemplazar el archivo Android local.

No copiar claves privadas ni credenciales de OAuth al repositorio, al manual ni a archivos de la UI.

#### Flujo Web Y Android

En navegador, iniciar el flujo desde el toque del usuario con `signInWithPopup` y un `GoogleAuthProvider`. Pedir selección de cuenta evita que el navegador reutilice silenciosamente una cuenta no deseada.

En Android con Capacitor, usar un plugin nativo compatible con la versión de Capacitor. El selector nativo obtiene el ID token de Google y la capa de servicio lo transforma en una credencial de Firebase JavaScript mediante `GoogleAuthProvider.credential(...)` y `signInWithCredential(...)`.

Usar `skipNativeAuth: true` cuando el resto de la app usa Firebase JavaScript. Así no se crean dos sesiones diferentes: el plugin solo obtiene la identidad de Google y Firebase JavaScript conserva la sesión que observan stores y services.

Configuración orientativa de Capacitor:

```json
{
  "plugins": {
    "FirebaseAuthentication": {
      "skipNativeAuth": true,
      "providers": ["google.com"]
    }
  }
}
```

Después de modificar plugins, `google-services.json` o dependencias nativas, ejecutar sincronización de Capacitor y probar en un celular real. El navegador no valida la configuración OAuth de Android.

#### Cuentas Existentes Y UID

No crear una cuenta nueva ni cambiar el UID cuando el correo de Google ya pertenece a una cuenta creada con correo y contraseña.

Flujo recomendado ante `auth/account-exists-with-different-credential`:

1. Conservar temporalmente la credencial Google pendiente solo en memoria.
2. Pedir la contraseña de la cuenta existente para confirmar que el usuario es su dueño.
3. Iniciar sesión con correo y contraseña.
4. Ejecutar `linkWithCredential(usuario, credencialGooglePendiente)`.
5. Limpiar la credencial pendiente y continuar con el mismo UID, stores y caché `uid-{usuarioId}`.

Si el usuario vuelve atrás o cancela, limpiar la credencial pendiente. Nunca guardar esa credencial en IndexedDB, Preferences, localStorage ni Firestore.

#### Errores Y Diagnóstico

Traducir errores a mensajes claros. No mostrar códigos internos de Firebase al usuario.

- Cancelación del selector o popup cerrado: informar que el ingreso fue cancelado, sin marcarlo como fallo grave.
- Popup bloqueado: pedir permitir ventanas emergentes y reintentar desde el botón.
- Sin red: informar que se necesita conexión.
- Proveedor deshabilitado u origen no autorizado: informar que el método no está disponible y revisar Firebase.
- Cuenta existente con otro método: pedir contraseña para vincular Google, no registrar otra cuenta.
- Android sin selector o con error de configuración: revisar `applicationId`, SHA-1, SHA-256 y que el `google-services.json` renovado incluya clientes OAuth Android y web.

Regla práctica:

> Si Android informa que la aplicación no está registrada para OAuth, el problema está en paquete, certificado o `google-services.json`; no en el botón Vue.

#### Pruebas Mínimas De Google Sign-In

- Navegador: cuenta Google nueva, cuenta existente, cancelación, popup bloqueado, persistencia, logout y redirección a la ruta original.
- Cuenta existente: correo y contraseña más Google con el mismo correo conserva UID y caché local.
- Android real: selector de cuentas, cancelación, retorno a la app, reinicio, logout y reingreso.
- Configuración: Google activo en Auth, dominios web autorizados y `google-services.json` actualizado con OAuth Android.
- Release Android: comprobar la huella de la firma release y, si aplica, la huella de firma de Google Play antes de publicar.

---

## Firestore Offline

Firestore Offline permite:

- Leer datos cacheados.
- Crear escrituras locales mientras no hay conexión.
- Sincronizar cuando vuelve internet.

Pero no significa que Firebase reemplace toda la arquitectura local automáticamente.

Lo que sí hace:

- Cachea documentos leídos desde Firestore.
- Acepta escrituras pendientes.
- Reintenta sincronizar.

Lo que no hace por sí solo:

- Migrar datos viejos desde LocalStorage.
- Entender el modelo de tu app.
- Resolver conflictos complejos de negocio.
- Sincronizar archivos pesados como fotos.
- Limpiar stores al cambiar usuario.

Recomendación:

> Usar Firestore Offline como soporte de Firebase, no como excusa para borrar de golpe LocalStorage o Capacitor Preferences.

---

## LocalStorage, Capacitor Preferences E IndexedDB

En apps existentes, no conviene eliminar el almacenamiento local al principio.

Uso recomendado durante integración:

- Web: `LocalStorageAdapter`.
- Android legacy: `CapacitorAdapter`, solo si los datos son chicos.
- Android recomendado para datos grandes: `IndexedDbAdapter`.
- Services: siempre pasan por `AlmacenamientoService`.
- Firestore: fuente principal cuando hay usuario autenticado.
- Local: fallback y respaldo temporal.

Ventajas de conservar local al principio:

- Permite migración gradual.
- Reduce riesgo de pérdida de datos.
- Permite seguir usando la app sin sesión.
- Facilita pruebas offline.
- Da margen para reintentar sincronizaciones.

Cuándo se podría reducir el uso local:

- Cuando todos los dominios estén migrados.
- Cuando las pruebas navegador/celular pasen.
- Cuando se confirme que usuario A no ve datos de usuario B.
- Cuando Firestore sea fuente principal estable.
- Cuando haya estrategia clara para datos offline sin sesión.

No hacer:

> No reemplazar LocalStorage/Capacitor por Firebase de golpe en una app con datos reales.

Lección de producción:

> `@capacitor/preferences` no debe usarse como caché principal para JSON grande, listas largas ni objetos con fotos base64.

En Android, `Preferences.get()` puede devolver un valor gigante desde la capa nativa hacia el WebView. Si ese valor contiene muchas fotos base64 o un JSON enorme, la app puede cerrarse antes de que JavaScript tenga oportunidad de manejar el error. En ese caso el problema no es Firestore: es memoria del dispositivo.

Uso recomendado después de esta experiencia:

- `IndexedDB`: caché principal para productos, comercios, listas, mesa y datos privados grandes.
- `Capacitor Preferences`: flags, decisiones, metadatos, sesión mínima, marcas de migración y datos chicos.
- `LocalStorage`: útil en navegador, pero no asumir que escala bien para datos pesados.
- `Firestore Offline`: soporte de nube/offline, no reemplazo mágico del caché local propio.

Regla práctica:

> Si un dato puede crecer sin límite o puede incluir fotos, no debe vivir como JSON gigante en Preferences.

### Caché Local Por Usuario

Cuando una app tiene cuentas Firebase, el caché local también debe separarse por usuario.

Patrón recomendado:

```text
uid-{usuarioId}/productos
uid-{usuarioId}/comercios
uid-{usuarioId}/listas
uid-{usuarioId}/mesa
uid-{usuarioId}/preferencias
```

Esto evita que:

- Una cuenta nueva vea datos locales de otra cuenta.
- Una migración mezcle datos viejos sin permiso.
- El usuario A vea datos del usuario B después de cerrar sesión.
- El caché compartido legacy contamine la cuenta Firebase.

El espacio `compartido` o legacy puede existir solo para recuperar datos antiguos o fotos locales, pero no debe usarse como fuente normal de datos de una cuenta Firebase.

### Local Primero, Nube Después

Para mejorar velocidad y evitar descargas repetidas, el patrón recomendado es:

```text
1. Mostrar caché local del usuario inmediatamente.
2. Consultar Firestore en segundo plano.
3. Fusionar cambios remotos con datos locales.
4. Guardar el resultado liviano en caché local.
5. No pisar fotos locales si la nube no trae foto válida.
```

Ventajas:

- La app abre rápido.
- El usuario ve datos aunque no haya conexión.
- Se reducen lecturas repetidas a Firestore.
- Se evita descargar todo cada vez que se cambia de pantalla.
- Las fotos locales no desaparecen solo porque Firestore no las tiene.

No hacer:

```text
entrar a pantalla -> borrar estado -> esperar Firestore -> pintar todo de nuevo
```

Ese patrón se siente lento y además puede borrar visualmente fotos o datos locales durante la sincronización.

### Firestore Como Verdad Después De Responder

El patrón `local primero, nube después` no significa que el caché local pueda conservar datos viejos para siempre.

Regla aprendida en producción:

> Cuando Firestore responde correctamente, Firestore pasa a ser la verdad para esa cuenta y ese dominio.

Esto es especialmente importante con borrados hechos desde otro dispositivo.

Flujo correcto:

```text
1. Mostrar caché local inmediatamente.
2. Consultar Firestore en segundo plano.
3. Si Firestore falla u offline, no borrar nada local.
4. Si Firestore responde bien, comparar IDs locales contra IDs remotos.
5. Todo ID local que ya no existe en Firestore debe eliminarse del caché local.
6. Guardar en caché local el resultado reconciliado.
```

Esto evita el problema clásico:

```text
celular borra producto -> Firestore ya no lo tiene -> navegador sigue mostrando el producto local viejo
```

Para resolverlo de forma global, crear un helper reusable de reconciliación, por ejemplo:

```text
obtenerEntidadesLocalesSobrantes(locales, remotos)
filtrarLocalesExistentesEnRemotos(locales, remotos)
limpiarLocalesSobrantes({ locales, remotos, limpiarEntidad })
ejecutarEnTandas(items, accion, 20)
```

La limpieza debe aplicarse en todos los dominios privados:

- Productos.
- Precios o subcolecciones asociadas.
- Comercios y direcciones.
- Listas e items.
- Mesa de trabajo.
- Confirmaciones o marcas asociadas.
- Fotos locales y metadatos de caché.

No hacer:

```text
fusionar local + remoto conservando IDs locales que ya no existen en Firestore
```

Eso reanima datos borrados y hace que el usuario piense que Firebase no eliminó nada.

Regla de seguridad:

> Nunca limpiar caché local si Firestore devolvió error, timeout, falta de sesión o estado offline dudoso.

La reconciliación solo debe ejecutarse cuando la lectura remota terminó bien y representa una lista completa del dominio dentro del límite definido.

### Lecturas Completas, Parciales Y Limpieza Local

En una app local-first no alcanza con saber si Firestore respondió. También hay que saber si la lectura representa el dominio completo.

Regla práctica:

> Una lectura parcial puede actualizar o agregar datos, pero no debe borrar sobrantes locales.

Ejemplo:

```text
leer productos con limit(200)
si llegaron menos de 200 -> lectura completa probable
si llegaron 200 -> lectura parcial o al límite
```

Con lectura completa:

- Se pueden fusionar datos remotos.
- Se pueden eliminar del caché local los IDs que ya no existen en Firestore.
- Se puede guardar metadata de sincronización como `lecturaCompleta: true`.

Con lectura parcial, error, timeout u offline:

- Se pueden mostrar datos locales.
- Se pueden incorporar entidades nuevas o modificadas que llegaron desde Firestore.
- No se deben borrar entidades locales sobrantes.
- No se debe marcar la limpieza como terminada.

Patrón recomendado:

```text
resultadoFirestore = {
  datos,
  conectado,
  error,
  completa
}

puedeReconciliarBorrados =
  conectado && !error && Array.isArray(datos) && completa
```

Esto evita que una consulta limitada borre datos válidos solo porque no entraron en la página leída.

Detalle de experiencia de usuario:

- La pantalla puede mostrar datos locales viejos por unos segundos.
- Cuando Firestore responde, esos datos deben desaparecer o actualizarse solos.
- Esto es normal en una arquitectura local-first.
- Si la demora es visible, conviene mostrar un estado suave como `Actualizando...`.

### Cuidado Con Subcolecciones En La Carga Inicial

Otra causa real de demora es cargar subcolecciones una por una.

Ejemplo:

```text
leer 95 productos
por cada producto leer subcolección precios
actualizar UI recién cuando terminó todo
```

Aunque Firestore ya tenga el dato nuevo, la pantalla puede tardar en reflejarlo porque la sincronización está esperando muchas lecturas secundarias.

Opciones recomendadas:

- Mostrar la lista principal con datos livianos apenas llega Firestore.
- Traer precios en segundo plano.
- Traer precios bajo demanda en detalle.
- Traer precios en paralelo con límite controlado.
- Guardar un resumen calculado en el documento principal si la pantalla lo necesita rápido.

No hacer:

```text
esperar todas las subcolecciones de todos los documentos antes de actualizar la lista visible
```

Esto funciona con pocos datos, pero empieza a sentirse lento cuando el usuario tiene muchos registros.

### Datos Principales Livianos Y Datos Secundarios Bajo Demanda

Cuando un dominio tiene datos secundarios pesados, la lista principal debe cargar solo lo necesario para pintar rápido.

Ejemplo de producto:

```text
documento producto:
  id
  nombre
  codigoBarras
  imagenUrl
  precioMejor
  comercioMejor
  monedaReferencia
  fechaActualizacion

subcolección precios:
  historial completo de precios
```

La lista principal puede usar `precioMejor` y `comercioMejor`. El historial completo se pide al abrir la tarjeta, el detalle o una pantalla que realmente lo necesite.

Regla importante:

> Un array local de datos secundarios no siempre significa que el historial esté completo.

Caso real:

```text
1. El navegador tiene un producto con 1 precio viejo en caché local.
2. El celular agrega un precio nuevo y Firestore actualiza el documento principal.
3. La lista remota liviana trae el producto actualizado, pero no trae la subcolección precios.
4. Si la app conserva el array local viejo y lo marca como completo, nunca carga el precio nuevo.
```

Solución:

- Guardar un flag explícito como `preciosCargados`, `historialCargado` o `detalleSecundarioCargado`.
- Si Firestore trae el documento principal con `fechaActualizacion` más nueva que el caché local y no trae la subcolección, marcar los datos secundarios como pendientes.
- Al abrir la tarjeta o el detalle, cargar la subcolección del ID específico.
- Después de cargarla, actualizar el store visible y guardar el caché local.
- Si el resumen principal dice que hay datos, pero el array local está vacío o viejo, intentar una carga bajo demanda antes de mostrar "sin datos".

No hacer:

```text
si producto.precios.length > 0 -> asumir que todos los precios están cargados
```

Eso deja historiales viejos pegados al dispositivo y oculta precios guardados desde otro navegador o celular.

---

## Fuente Principal Firestore

Una etapa clave es decidir cuándo Firestore pasa a ser fuente principal.

Antes de esa etapa:

```text
UI lee local -> service sincroniza Firestore como espejo
```

Después de esa etapa:

```text
UI lee Firestore -> local queda como fallback/respaldo
```

Para hacerlo bien conviene tener un service común, por ejemplo:

```text
FuentePrincipalFirestoreService
```

Ese service puede resolver:

- Esperar sesión.
- Intentar leer Firestore.
- Si Firestore no está disponible, cargar local.
- Devolver estado de fuente.
- Evitar que cada store tenga lógica distinta.

Estados útiles:

- `sinSesion`
- `local`
- `firestore`
- `pendiente`
- `error`

La UI puede mostrar el origen activo en configuración o diagnóstico.

### Borrado Real Global

Antes de implementar Firebase, decidir qué significa "borrar" en la app.

Para apps de usuario normal, la recomendación práctica es:

> Borrar es borrar.

Eso significa que el dato debe desaparecer de:

- UI.
- Store en memoria.
- Caché local.
- Fotos locales asociadas.
- Metadatos de sincronización.
- Firestore.
- Subcolecciones relacionadas.

Ejemplo con productos:

```text
eliminar producto
  -> borrar subcolección precios
  -> borrar confirmaciones asociadas
  -> borrar foto local si existe
  -> borrar documento producto
  -> borrar caché local del producto
```

Ejemplo con comercios:

```text
eliminar comercio
  -> borrar documento comercio
  -> borrar fotos de comercio/direcciones
  -> limpiar precios que apuntan a ese comercio o dirección
  -> borrar caché local y metadatos relacionados
```

Ejemplo con listas:

```text
eliminar lista
  -> borrar documento lista
  -> borrar fotos locales de items
  -> guardar caché local sin esa lista
```

Ejemplo con Mesa de Trabajo:

```text
eliminar o resolver item
  -> borrar documento remoto si existe
  -> borrar cache local
  -> borrar respaldo urgente local
  -> borrar foto local
  -> mantener solo marcas operativas mínimas si hacen falta para evitar fantasmas
```

No hacer:

```text
marcar eliminado: true y luego fusionar local + remoto sin limpiar local
```

Ese patrón puede dejar "fantasmas": datos que desaparecen, pero vuelven después de recargar, abrir otro dispositivo o sincronizar.

Cuándo usar soft delete:

- Auditoría obligatoria.
- Papelera o recuperación.
- Reglas legales.
- Historial visible para el usuario.

Si no existe una necesidad real de auditoría o papelera, el borrado real es más simple, ocupa menos espacio y evita reactivar datos viejos.

Regla de implementación:

> El borrado debe ser global por dominio, no un parche aislado en una pantalla.

Si se corrige solo productos pero no comercios, listas o mesa, el mismo problema aparecerá en otro lugar.

---

## Patrón De Guardado Recomendado

Patrón general para un service de dominio:

```text
guardarDato(dato):
  datoNormalizado = normalizar(dato)
  guardarLocal(datoNormalizado)
  resultadoFirestore = intentarGuardarFirestore(datoNormalizado)
  devolver dato + estado de sincronización
```

Si no hay sesión Firebase:

```text
guardar local
devolver estado local
```

Si hay sesión Firebase y conexión:

```text
guardar local
guardar Firestore
devolver sincronizado
```

Si hay sesión Firebase pero Firestore tarda:

```text
guardar local
aceptar estado pendiente
no bloquear UI indefinidamente
```

Si Firestore falla:

```text
guardar local
devolver error de sincronización
permitir reintento
```

Esto protege la experiencia del usuario.

### Historiales Sin Precios Repetidos

Cuando un historial registra cambios de precio, cada entrada debe representar un cambio real y no una repetición de la misma verificación.

Regla recomendada para precios por comercio y sucursal:

1. Normalizar valor, moneda y escalas por cantidad antes de comparar.
2. Comparar el nuevo precio solamente con el último registro del mismo comercio y sucursal.
3. Si valor, moneda, modalidad mayorista y escalas son iguales, actualizar la fecha del registro existente; no crear un documento nuevo.
4. Si hubo un valor distinto entre medio, conservar ambos eventos aunque el valor original vuelva a aparecer.
5. Al cargar o guardar un historial, consolidar tramos consecutivos idénticos y conservar el registro más reciente de cada tramo.

Ejemplo correcto:

```text
$225 -> $230 -> $225
```

Los dos registros de `$225` se conservan porque hubo un cambio real entre ellos.

Para limpiar duplicados históricos, usar los IDs existentes: guardar el precio conservado, borrar los documentos repetidos de la subcolección y actualizar el caché local. Si Firestore falla, está offline o no hay sesión, no borrar el caché local por una lectura remota dudosa; conservar el cambio local y permitir que la sincronización se reintente.

---

## Timeouts De Sincronización

No conviene dejar la UI esperando Firestore indefinidamente.

Patrón recomendado:

```text
Promise.race([
  guardarEnFirestore(),
  timeoutControlado()
])
```

Si el timeout gana, devolver estado `pendiente`.

Esto es útil porque Firestore Offline puede aceptar escrituras localmente y sincronizar después, pero la UI no debería quedar congelada.

Estados recomendados:

- `sincronizado`
- `pendiente`
- `local`
- `error`

---

## Preferencias Del Usuario

Las preferencias suelen ser un documento único por usuario.

Ruta recomendada:

```text
usuarios/{usuarioId}/configuracion/preferencias
```

Campos típicos:

```text
usuarioId
modoTema
modoMoneda
monedaManual
idioma
unidad
fechaActualizacion
```

Reglas prácticas:

- Guardar preferencias localmente para arranque rápido.
- Hidratar desde Firestore cuando la sesión esté lista.
- Aplicar tema local primero para evitar parpadeo.
- Sincronizar cambios a Firestore desde `PreferenciasService`.
- No duplicar llamadas de sincronización en el store si el service ya guarda en Firestore.

Error real que hay que evitar:

> Dejar una llamada vieja en el store a un método de sincronización que ya no existe. El dato puede guardarse, pero la UI lanza error después.

Checklist específico:

- Cambiar modo oscuro/claro.
- Cambiar moneda.
- Recargar navegador.
- Abrir sesión en celular.
- Confirmar que Firestore tiene el documento de preferencias.
- Confirmar que el UID del documento coincide con el usuario autenticado.

---

## Perfil Del Usuario

El perfil del usuario debe ser un documento privado separado de las preferencias.

Ruta recomendada:

```text
usuarios/{usuarioId}/configuracion/perfil
```

Campos típicos:

```text
usuarioId
nombreUsuario
fechaNacimiento
fechaActualizacion
```

Reglas prácticas:

- Guardar solo datos necesarios para la app.
- Hacer opcionales los datos personales que no sean imprescindibles.
- No guardar información sensible si la app no la necesita.
- Mantener el correo como dato de Firebase Auth, no como campo editable común.
- Usar un service propio, por ejemplo `FirestorePerfilService`.
- Cargar el perfil al iniciar sesión o al abrir el panel de cuenta.
- Limpiar datos visibles al cerrar sesión para no mezclar usuarios.

Recomendación:

> No mezclar perfil con preferencias. El perfil describe a la persona; las preferencias describen cómo quiere usar la app.

---

## Dominios De Datos

Este manual usa dominios de ejemplo para explicar el patrón. En otra app pueden llamarse distinto.

### Dominio Tipo Producto

Sirve para datos principales del usuario.

Ruta:

```text
usuarios/{usuarioId}/productos/{productoId}
```

Si el producto tiene historial que crece:

```text
usuarios/{usuarioId}/productos/{productoId}/precios/{precioId}
```

Recomendaciones:

- Documento principal para datos actuales.
- Subcolección para historial.
- No guardar imágenes base64.
- Mantener IDs locales para migrar sin duplicar.

### Dominio Tipo Comercio O Cliente

Sirve para entidades editables del usuario.

Ruta:

```text
usuarios/{usuarioId}/comercios/{comercioId}
```

En otra app podría ser:

```text
usuarios/{usuarioId}/clientes/{clienteId}
usuarios/{usuarioId}/proveedores/{proveedorId}
usuarios/{usuarioId}/ubicaciones/{ubicacionId}
```

Recomendaciones:

- Usar documento por entidad.
- Embeder subdatos solo si tienen límite claro.
- Si hay muchas direcciones, teléfonos, eventos o movimientos, usar subcolección.

### Dominio Tipo Lista

Sirve para colecciones creadas por el usuario.

Ruta:

```text
usuarios/{usuarioId}/listas/{listaId}
```

Items embebidos si el límite es claro:

```text
items: [...]
```

Subcolección si puede crecer mucho:

```text
usuarios/{usuarioId}/listas/{listaId}/items/{itemId}
```

Recomendación:

- Para listas chicas, items embebidos simplifican.
- Para listas largas o colaborativas, usar subcolección.

### Dominio Tipo Mesa De Trabajo

La Mesa de Trabajo representa datos temporales o intermedios que el usuario espera conservar.

Ruta:

```text
usuarios/{usuarioId}/mesaTrabajoItems/{itemId}
```

Regla práctica:

> Si el usuario espera encontrarlo después de cerrar la app, no es solo estado temporal. Debe persistirse.

Recomendaciones:

- Guardar cada item con ID estable.
- Sincronizar altas, cambios y eliminaciones.
- Limpiar al cambiar de usuario.
- Si existe local previo, migrar automáticamente al entrar con Firebase.
- Evitar mezclar mesa local de un usuario con otro usuario.

### Dominio Tipo Confirmación

Sirve para marcas, favoritos, confirmaciones o estados del usuario sobre otro dato.

Ruta:

```text
usuarios/{usuarioId}/confirmaciones/{confirmacionId}
```

Recomendación:

- Crear IDs determinísticos si se quiere evitar duplicados.
- Ejemplo: `productoId + precioId`.
- Borrar o marcar como eliminado según el caso.

---

## Fotos Y Archivos En Modo Gratis

Las fotos deben tratarse aparte.

Regla principal:

> Firestore es para datos, no para archivos pesados.

No guardar en Firestore:

- Fotos base64 grandes.
- Archivos.
- Videos.
- Audios.
- PDFs pesados.

Por qué:

- Firestore cobra/limita por lecturas, escrituras y tamaño de documentos.
- Los documentos tienen límite de tamaño.
- Base64 agranda los archivos.
- La app se vuelve lenta.
- Sincronizar muchas fotos puede disparar costos o errores.
- En Android, clonar o serializar fotos base64 grandes puede cerrar la app por memoria.

### Memoria Del Dispositivo

Una foto base64 no solo pesa en disco. Durante una migración puede duplicarse varias veces en memoria:

- Valor leído desde LocalStorage o Capacitor Preferences.
- Objeto armado para inventario.
- Copia para backup.
- Copia por `JSON.stringify`.
- Copia para enviar a Firestore.
- Copia interna del WebView.

En celulares reales esto puede terminar en `OutOfMemoryError`, incluso si el usuario tiene pocos productos. El caso real que originó esta regla fue una app Android que intentó reservar más de 140 MB de una vez dentro del WebView durante la migración local a Firestore.

Regla práctica:

> Antes de clonar, serializar, guardar backup o migrar, quitar fotos base64 del objeto de trabajo.

Patrón recomendado:

```text
leer dato local
quitar foto base64 del objeto de migración
conservar dato local original en el dispositivo
guardar en Firestore solo datos livianos
```

Evitar:

```text
JSON.parse(JSON.stringify(productoConFotoBase64))
backup completo con fotos base64
cola pendiente con fotos base64
validación que vuelva a leer backups pesados
```

Si se necesita backup, que sea un backup liviano sin fotos. El respaldo real de la foto sigue siendo el dato local original del dispositivo.

### Caso Real: Crash Por Preferences En Android

Problema visto en producción:

```text
@capacitor/preferences guardaba JSON grande con fotos base64.
La app intentaba leer ese JSON al entrar a una pantalla.
Android entregaba el valor gigante al WebView.
El proceso moría con OutOfMemoryError antes de que la app pudiera recuperarse.
```

Síntoma:

- La app se cierra sola.
- Pasa especialmente al abrir listados grandes.
- Puede pasar aunque Firestore esté bien.
- Puede pasar aunque el usuario tenga pocos datos, si esos datos tienen fotos base64 grandes.
- Puede repetirse al apretar botones de migración, backup o "guardar en la nube".

Diagnóstico recomendado:

```text
adb logcat
buscar:
OutOfMemoryError
PreferencesPlugin.get
Failed to allocate
Application Error
```

Reparación recomendada:

- Mover caché grande a `IndexedDB`.
- Dejar Preferences solo para datos chicos.
- Separar fotos base64 del objeto principal.
- No hidratar todas las fotos en listados.
- Cargar fotos locales solo bajo demanda en detalle, visor o edición.
- Migrar datos legacy por tandas pequeñas.
- Si una clave legacy revienta al leerla, marcarla como no migrable por memoria y no volver a leerla automáticamente.

Regla fuerte:

> Nunca diseñar una migración que dependa de leer un JSON gigante de Preferences con fotos adentro.

### Separar Fotos Del Objeto Principal

Para datos con foto local, guardar dos cosas:

```text
producto liviano:
  id
  nombre
  precio
  imagenUrl externa si existe
  fotoLocalId si hay foto local
  fotoFuente

foto local separada:
  fotoLocalId
  data:image/...base64
```

El listado debe usar:

- `imagenUrl` si es URL externa.
- placeholder si la foto local existe pero no se cargó.
- foto local solo cuando el usuario abre detalle, visor o edición.

No hacer:

```text
productos = productos.map(producto => hidratarFotoBase64(producto))
```

Eso vuelve a cargar todas las fotos juntas y puede repetir el problema de memoria.

### Migrar En Tandas

Cuando se migra local a Firestore o se mueve de Preferences a IndexedDB, procesar por tandas chicas.

Tamaño recomendado:

```text
10 registros por tanda para rescate/migración sensible.
20 registros por tanda para datos livianos ya controlados.
```

En Android real, elegir 10 cuando hay riesgo de fotos, JSON grande o usuarios con datos viejos.

Patrón:

```text
tomar 10 registros
quitar fotos base64
guardar datos livianos
guardar foto separada si se puede leer sin romper memoria
ceder el hilo
continuar con la siguiente tanda
```

Entre tandas conviene ceder el hilo:

```text
await new Promise((resolve) => setTimeout(resolve, 0))
```

Ventajas:

- Baja el pico de memoria.
- La UI respira.
- Es más fácil mostrar progreso.
- Si falla un lote, se puede registrar y seguir con otros.

El objetivo no es que la migración sea la más rápida. El objetivo es que no cierre la app del usuario.

### Feedback Durante Migraciones

Si el usuario toca "guardar datos en la nube", la app debe mostrar feedback inmediato.

Estados mínimos:

- Preparando datos.
- Guardando lote actual.
- Progreso visible: `10 de 80`, `20 de 80`, etc.
- Finalizado.
- Error recuperable con opción de reintentar.

No hacer:

```text
boton -> no pasa nada visible -> varios segundos despues la app cambia o se cierra
```

Eso genera desconfianza y hace imposible saber si los datos se guardaron.

Texto recomendado para usuarios normales:

```text
Estamos guardando tus datos en la nube.
No cierres la app hasta que termine.
```

Evitar palabras técnicas para usuario final:

- Firebase.
- Firestore.
- IndexedDB.
- Preferences.
- JSON.
- base64.

Esas palabras quedan para herramientas internas, logs o documentación técnica.

### Firebase Storage

Firebase Storage es el servicio correcto para archivos, pero en proyectos reales puede requerir Blaze o facturación según configuración y uso.

Si Leo quiere mantener todo gratis:

- No depender de Firebase Storage como requisito para cerrar Firebase.
- No bloquear Auth + Firestore por fotos.
- No activar Blaze solo para resolver fotos si la prioridad es gratis.

### Opciones Gratuitas Para Fotos

Opción 1: Fotos locales

- Guardar la foto en el dispositivo.
- Firestore guarda solo metadatos.
- Al cambiar de celular, la foto no viaja.
- Es lo más compatible con "gratis".

Opción 2: Sincronizar solo URL externa

- Si la foto ya viene de una API o URL pública, Firestore guarda la URL.
- No se sube archivo propio.
- Depende de que la URL siga existiendo.

Opción 3: Base64 muy pequeño y excepcional

- Solo para miniaturas muy chicas.
- No recomendado para uso general.
- No usar para fotos normales de cámara.

Opción 4: Preparar campos para futuro

Firestore puede guardar campos como:

```text
fotoUrl
fotoRutaStorage
fotoFuente
```

Pero si no se usa Storage, esos campos pueden quedar vacíos o apuntar a foto local.

### Sistema Recomendado De Fotos Sincronizadas

El sistema de fotos debe ser progresivo. Primero se resuelve el dato liviano en Firestore. Después se resuelve la foto completa con la estrategia disponible para esa app.

Regla principal:

> Firestore guarda metadata de la foto. El archivo de imagen vive fuera del documento.

Arquitectura recomendada:

```text
UI Vue/Quasar
  -> useCamaraFoto o composable equivalente
    -> Store del dominio
      -> Service del dominio
        -> FotosService
          -> Foto local optimizada
          -> Firebase Storage si está disponible
          -> Firestore guarda URL/ruta/metadata
```

Campos recomendados en documentos Firestore:

```text
fotoUrl
fotoRutaStorage
fotoFuente
fotoEstado
fotoActualizadaEn
fotoEliminadaEn
fotoVersion
```

Para productos puede usarse `imagenUrl` si el proyecto ya distingue imagen de producto y foto de comercio. Lo importante es mantener la misma convención dentro de cada dominio.

Valores recomendados:

```text
fotoFuente: 'usuario' | 'api' | 'externa' | 'local' | null
fotoEstado: 'sinFoto' | 'localPendiente' | 'sincronizada' | 'eliminada' | 'error'
```

Rutas recomendadas si se usa Firebase Storage:

```text
usuarios/{usuarioId}/fotos/productos/{productoId}.jpg
usuarios/{usuarioId}/fotos/comercios/{comercioId}.jpg
usuarios/{usuarioId}/fotos/direcciones/{comercioId}-{direccionId}.jpg
usuarios/{usuarioId}/fotos/listas/{listaId}-{itemId}.jpg
```

Si un dominio puede tener varias fotos por entidad, agregar un ID estable:

```text
usuarios/{usuarioId}/fotos/productos/{productoId}/{fotoId}.jpg
```

Flujo para agregar o cambiar foto:

```text
1. Usuario toma foto o elige desde galería.
2. La app reduce tamaño y comprime antes de guardar.
3. Se guarda una copia local optimizada para mostrar rápido.
4. Si hay usuario Firebase y Storage disponible, se sube el archivo.
5. Firestore guarda solo `fotoUrl`, `fotoRutaStorage`, `fotoFuente`, `fotoEstado` y fechas.
6. La UI muestra la foto local primero y luego la URL remota cuando esté lista.
```

Recomendación inicial de optimización:

- Convertir a JPEG o WebP si el proyecto lo soporta.
- Limitar lado mayor entre 900 px y 1280 px para fotos normales.
- Usar calidad aproximada entre 0.65 y 0.8.
- Crear miniatura separada solo si los listados cargan muchas imágenes.
- No conservar la foto original de cámara si la app no la necesita.

La mejor configuración depende del tipo de app. Para productos, comercios, tickets, perfiles y evidencias simples, una foto optimizada suele ser suficiente.

Flujo para borrar foto:

```text
1. Marcar la entidad en memoria como sin foto.
2. Limpiar `fotoUrl`, `fotoRutaStorage`, `fotoFuente` si corresponde.
3. Guardar el cambio en Firestore.
4. Borrar el archivo de Storage si existe ruta.
5. Borrar foto local y miniatura local.
6. Invalidar caché visual para que no reaparezca la imagen anterior.
```

El borrado debe ser idempotente:

- Si Firestore ya no tiene foto, no debe fallar.
- Si Storage ya no tiene archivo, no debe fallar.
- Si el caché local no tiene foto, no debe fallar.
- Si falla borrar Storage pero Firestore ya quedó sin foto, registrar pendiente de limpieza y no reanimar la foto.

No hacer:

```text
borrar solo fotoUrl en Firestore
dejar fotoRutaStorage vieja
dejar miniatura local vieja
mantener foto base64 en el objeto principal
mostrar una imagen desde caché si `fotoEstado` es 'eliminada'
```

Regla práctica:

> Cambiar foto y borrar foto son dos flujos distintos. El cambio puede pisar una URL vieja; el borrado debe limpiar Firestore, Storage, caché local y estado visual.

### Reglas Storage Recomendadas

Si la app usa Firebase Storage, versionar reglas locales igual que Firestore Rules.

Regla base privada:

```text
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    function estaAutenticado() {
      return request.auth != null;
    }

    function esDueno(usuarioId) {
      return estaAutenticado() && request.auth.uid == usuarioId;
    }

    match /usuarios/{usuarioId}/fotos/{archivo=**} {
      allow read, write: if esDueno(usuarioId)
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

Notas:

- Ajustar el límite según la app.
- Validar tipo MIME también en el cliente antes de subir.
- No usar rutas públicas compartidas para fotos privadas.
- No guardar fotos de usuario fuera de `usuarios/{usuarioId}`.

### CORS En Desarrollo Web

Si la app web local muestra fotos desde Firebase Storage, puede requerir CORS para `localhost`.

Patrón:

```text
localhost:9000 -> permite GET de fotos durante desarrollo
dominio publicado -> permite GET de fotos en producción web
```

No asumir que Android y navegador fallan igual. Android puede mostrar una foto mientras la web falla por CORS.

### Cola De Fotos Pendientes

Si la app permite sacar fotos sin conexión o si Storage falla, usar una cola liviana.

La cola debe guardar:

```text
fotoLocalId
dominio
entidadId
accion: 'subir' | 'borrar'
intentos
fechaCreacion
ultimoError
```

La cola no debe guardar:

```text
base64 completo
blob completo
objeto de producto/comercio/lista completo
```

Al recuperar conexión:

```text
1. Leer item pendiente.
2. Buscar foto local por `fotoLocalId`.
3. Subir o borrar según acción.
4. Actualizar Firestore con metadata liviana.
5. Eliminar item de cola si terminó bien.
```

### Lectura Y Reconstrucción Visual

Cuando Firestore es fuente principal, la UI no debería depender de base64.

Orden recomendado para resolver una foto visible:

```text
1. Si `fotoEstado` es 'eliminada' o no hay metadata, mostrar placeholder.
2. Si existe foto local vigente, mostrarla inmediatamente.
3. Si existe `fotoUrl`, mostrar la URL remota.
4. Si la URL remota carga bien, actualizar caché local opcionalmente.
5. Si falla la URL remota, mostrar placeholder o foto local vieja solo si no está marcada como eliminada.
```

Esto evita dos problemas:

- Que una foto tarde en aparecer al cambiar de dispositivo.
- Que una foto borrada vuelva por caché local.

### Prueba Mínima Del Sistema De Fotos

No cerrar fotos solo porque una imagen aparece una vez.

Prueba mínima:

```text
navegador -> agregar foto -> celular la ve
celular -> cambiar foto -> navegador la ve
navegador -> borrar foto -> celular la borra
celular -> borrar foto -> navegador la borra
recargar navegador -> la foto correcta sigue o sigue borrada
cerrar y abrir Android -> la foto correcta sigue o sigue borrada
Firebase Console -> Firestore no tiene base64
Firebase Console -> Storage no tiene archivos huérfanos evidentes
```

Si el cambio funciona pero el borrado falla, revisar primero:

- Caché local.
- Miniaturas.
- Campos `fotoUrl` y `fotoRutaStorage`.
- Estado visual del componente.
- Cola pendiente.
- Reconciliación después de una lectura remota completa.

Recomendación práctica:

> Cerrar Auth + Firestore primero. Después agregar fotos como sistema separado. Si Storage no está disponible en modo gratis, mantener foto local optimizada + metadata en Firestore. Si Storage está disponible y aceptado, subir archivo a Storage y guardar solo URL/ruta en Firestore.

---

## Migración De Datos Locales

En una app existente, la migración debe ser guiada y reversible.

Orden recomendado:

1. Inventariar datos locales.
2. Mostrar conteos al usuario o al desarrollador.
3. Crear backup local liviano sin fotos pesadas.
4. Migrar por dominio y por tandas.
5. Usar los mismos IDs locales.
6. Guardar estado de migración en Firestore.
7. Permitir reintento.
8. Validar conteos.
9. No borrar local al terminar.

Ruta sugerida para estado:

```text
usuarios/{usuarioId}/configuracion/migracionLocal
```

Estados recomendados:

```text
sinIniciar
inventariado
backupCreado
enProceso
parcial
completada
error
```

Regla importante:

> La migración debe ser idempotente. Si se ejecuta dos veces, no debe duplicar documentos.

Para lograrlo:

- Mantener IDs existentes.
- Usar `setDoc` con ID conocido.
- Evitar `addDoc` en migraciones.
- Registrar errores por item.
- Reintentar solo lo pendiente.
- Migrar datos pesados por tandas pequeñas, preferentemente 10 registros por tanda en Android.
- No incluir fotos base64 en backups, colas pendientes ni estados de migración.
- No leer backups viejos con fotos durante un reintento.
- Mostrar progreso visible al usuario mientras se guarda en la nube.
- Permitir cancelar o reintentar si una tanda falla.
- Registrar claves legacy peligrosas para no volver a leerlas automáticamente.

Recomendación para Android:

> Probar migraciones con datos reales y logcat conectado. Si aparece `OutOfMemoryError`, revisar primero fotos base64, backups completos, `JSON.stringify` sobre objetos grandes y colas pendientes con datos pesados.

Checklist anti-crash antes de publicar una migración:

- La migración no lee todas las fotos juntas.
- La migración no arma un inventario gigante con base64.
- La migración no guarda backup completo con fotos.
- La migración procesa por tandas de 10 si hay riesgo de datos pesados.
- La migración cede el hilo entre tandas.
- La migración muestra progreso.
- La migración conserva datos locales originales como respaldo.
- La migración puede reintentarse sin duplicar datos.
- La migración fue probada en un celular real, no solo en navegador.

---

## Orden Recomendado De Implementación

No implementar todo junto.

Orden recomendado:

1. Crear proyecto Firebase nuevo.
2. Registrar app web.
3. Registrar app Android si aplica.
4. Agregar SDK Firebase.
5. Crear `FirebaseBaseService`.
6. Activar Auth por correo.
7. Crear `AutenticacionFirebaseService`.
8. Crear `UsuarioActualService`.
9. Crear `UsuarioStore`.
10. Crear boot de sesión.
11. Crear página de acceso.
12. Proteger rutas.
13. Crear reglas Firestore privadas.
14. Crear service Firestore para un dominio pequeño.
15. Sincronizar ese dominio local-first.
16. Probar con usuario real.
17. Probar aislamiento entre dos usuarios.
18. Repetir dominio por dominio.
19. Crear migración guiada.
20. Pasar Firestore a fuente principal.
21. Probar navegador y Android.
22. Cerrar Firebase sin fotos.
23. Documentar pendientes.

Mi recomendación práctica:

> El primer dominio debe ser pequeño. No empezar por el dominio más difícil.

---

## Publicación Web En GitHub Pages Con Firebase

Si la app también se publica como web en GitHub Pages, hay una diferencia importante entre el entorno local y el entorno publicado.

Regla práctica:

> GitHub Pages no usa el `.env.local` del desarrollador. El workflow de GitHub Actions debe recibir las variables Firebase antes de ejecutar `npm run build`.

En apps Quasar/Vite, las variables públicas de Firebase suelen tener prefijo `VITE_`. Como Vite inserta esas variables durante la compilación, no alcanza con tenerlas configuradas localmente.

Variables mínimas a validar en el workflow:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Patrón recomendado para GitHub Actions:

1. Configurar las variables en `Settings -> Secrets and variables -> Actions`.
2. Usar `secrets` para valores que se quieran tratar como sensibles.
3. Usar `vars` para valores públicos si se decide gestionarlos como configuración visible del repo.
4. Validar que todas las variables existen antes de compilar.
5. Pasar las mismas variables al paso `npm run build`.
6. Cortar el workflow con un mensaje claro si falta alguna.

Ejemplo de validación:

```yaml
- name: Validar variables Firebase
  run: |
    for variable in \
      VITE_FIREBASE_API_KEY \
      VITE_FIREBASE_AUTH_DOMAIN \
      VITE_FIREBASE_PROJECT_ID \
      VITE_FIREBASE_STORAGE_BUCKET \
      VITE_FIREBASE_MESSAGING_SENDER_ID \
      VITE_FIREBASE_APP_ID
    do
      if [ -z "${!variable}" ]; then
        echo "Falta configurar $variable en Secrets o Variables de GitHub Actions."
        exit 1
      fi
    done
  env:
    VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY || vars.VITE_FIREBASE_API_KEY }}
    VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN || vars.VITE_FIREBASE_AUTH_DOMAIN }}
    VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID || vars.VITE_FIREBASE_PROJECT_ID }}
    VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET || vars.VITE_FIREBASE_STORAGE_BUCKET }}
    VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID || vars.VITE_FIREBASE_MESSAGING_SENDER_ID }}
    VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID || vars.VITE_FIREBASE_APP_ID }}
```

El paso de build debe recibir el mismo `env`:

```yaml
- name: Build
  run: npm run build
  env:
    VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY || vars.VITE_FIREBASE_API_KEY }}
    VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN || vars.VITE_FIREBASE_AUTH_DOMAIN }}
    VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID || vars.VITE_FIREBASE_PROJECT_ID }}
    VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET || vars.VITE_FIREBASE_STORAGE_BUCKET }}
    VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID || vars.VITE_FIREBASE_MESSAGING_SENDER_ID }}
    VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID || vars.VITE_FIREBASE_APP_ID }}
```

No hacer:

```text
workflow -> npm run build -> publicar dist/spa sin validar variables
```

Ese flujo puede publicar una app incompleta: local funciona porque existe `.env.local`, Android puede funcionar por otra configuración, pero la web publicada queda sin Firebase.

Recomendación práctica:

> En toda app Firebase publicada por GitHub Pages, el deploy debe fallar temprano si falta una variable. Es mejor un workflow rojo con mensaje claro que una web publicada rota.

---

## Checklist Para Replicar En Otra App

Antes de empezar:

- Confirmar que la app compila.
- Confirmar cómo guarda datos hoy.
- Identificar adaptador web.
- Identificar adaptador Android.
- Listar dominios de datos.
- Separar datos privados de datos globales.
- Detectar fotos o archivos pesados.
- Crear plan por fases.

Firebase base:

- Proyecto Firebase nuevo creado.
- Auth activado con correo y contraseña.
- Google activado si se ofrece inicio rápido sin contraseña.
- Firestore creado.
- App web registrada.
- App Android registrada si aplica.
- Configuración Firebase agregada.
- `.env.local` ignorado si se usan variables.
- Variables `VITE_FIREBASE_*` configuradas en GitHub Actions si se publica en GitHub Pages.
- Workflow de Pages valida variables Firebase antes de compilar.
- Paso `npm run build` del workflow recibe las variables Firebase en `env`.
- `google-services.json` actualizado si hay Android.
- SHA-1 y SHA-256 registradas para debug, release y Google Play si aplica.
- Dominios de desarrollo y producción autorizados para OAuth web.

Auth:

- Registro funciona.
- Login funciona.
- Google Sign-In funciona en navegador y Android si está habilitado.
- Vincular Google a una cuenta existente conserva el UID y los datos locales.
- Logout funciona.
- Recuperación de contraseña funciona.
- Sesión persiste al recargar.
- Rutas protegidas redirigen sin sesión.
- Stores se limpian al cambiar de usuario.

Firestore:

- Reglas privadas versionadas.
- Deploy de reglas realizado.
- Usuario A puede leer/escribir sus datos.
- Usuario B no puede leer datos de A.
- Usuario sin sesión queda bloqueado.
- Rutas fuera del modelo quedan bloqueadas.

Dominio por dominio:

- Service local existe.
- Service Firestore existe.
- Store llama al service, no a Firestore directo.
- UI no usa `localStorage` directo.
- Datos tienen `usuarioId`.
- IDs son estables.
- Eliminación definida: real o lógica.
- Si la política es borrado real, se borran también subcolecciones, fotos, confirmaciones y caché local.
- La sincronización remota limpia del caché local los IDs que ya no existen en Firestore.
- La limpieza local por reconciliación solo corre si Firestore respondió sin error.
- La limpieza local por reconciliación solo corre si la lectura remota fue completa, no parcial.
- Las listas principales cargan datos livianos y no esperan subcolecciones pesadas.
- Los datos secundarios bajo demanda tienen un flag explícito de carga completa.
- Si el documento remoto principal es más nuevo que el caché local, los datos secundarios locales se consideran posiblemente viejos.
- Offline no congela la UI.
- Firestore no guarda base64.

Fotos:

- Las fotos están fuera del documento principal.
- La app reduce tamaño y comprime antes de guardar o subir.
- Firestore guarda solo URL, ruta, fuente, estado y fechas.
- Si se usa Storage, las rutas viven bajo `usuarios/{usuarioId}/fotos`.
- Si no se usa Storage, la app mantiene foto local optimizada y metadata liviana.
- El borrado limpia Firestore, Storage si aplica, foto local, miniatura y caché visual.
- Cambiar foto y borrar foto fueron probados en navegador y Android.
- Una foto borrada no reaparece al recargar ni al cambiar de dispositivo.

Cierre:

- `npm run lint` pasa.
- `npm run build` pasa.
- Prueba navegador pasa.
- Prueba web publicada en GitHub Pages pasa si existe deploy web.
- Prueba Android pasa.
- Firestore Console muestra documentos correctos.
- No quedan llamadas a métodos viejos.
- No quedan planes abiertos bloqueando el cierre.

---

## Checklist De Pruebas Funcionales

Probar con cuenta A:

- Crear dato.
- Editar dato.
- Eliminar dato.
- Recargar navegador.
- Cerrar sesión.
- Iniciar sesión de nuevo.
- Confirmar que los datos siguen.

Probar con cuenta B:

- Iniciar sesión.
- Confirmar que no ve datos de cuenta A.
- Crear dato propio.
- Confirmar que cuenta A no lo ve.

Probar Google Sign-In:

- Ingresar con una cuenta Google nueva.
- Ingresar con una cuenta Google existente.
- Vincular Google a una cuenta creada con correo y contraseña y confirmar que mantiene el mismo UID.
- Cancelar el selector y confirmar que la pantalla sigue usable.
- En navegador, probar dominio publicado y `localhost`.
- En Android, probar selector nativo con APK debug y con la firma que se publicará.

Probar en celular:

- Login.
- Crear dato.
- Ver en navegador.
- Crear dato en navegador.
- Ver en celular.
- Borrar dato en celular.
- Confirmar que desaparece en navegador después de sincronizar.
- Borrar dato en navegador.
- Confirmar que desaparece en celular después de sincronizar.
- Cambiar preferencias.
- Cerrar y abrir app.

Probar fotos:

- Agregar foto en navegador y verla en celular.
- Cambiar foto en celular y verla en navegador.
- Borrar foto en navegador y confirmar que desaparece en celular.
- Borrar foto en celular y confirmar que desaparece en navegador.
- Recargar navegador y confirmar que no vuelve una foto borrada.
- Cerrar y abrir Android y confirmar que no vuelve una foto borrada.
- Confirmar en Firestore que no hay base64.
- Confirmar en Storage que la ruta pertenece al UID correcto si Storage está activo.

Probar offline:

- Crear dato sin conexión.
- Confirmar que la UI no se rompe.
- Recuperar conexión.
- Confirmar sincronización.

Probar Firebase Console:

- Revisar Auth users.
- Revisar documentos bajo `usuarios/{uid}`.
- Confirmar que el UID coincide con la cuenta.
- Confirmar que no aparecen documentos en rutas públicas inesperadas.

---

## Errores Que No Hay Que Repetir

### Error 1: Querer Resolver Todo Junto

Firebase Auth, Firestore, migración, offline, fotos y Android no deben cerrarse en una sola fase.

Mejor:

- Primero Auth.
- Luego un dominio.
- Luego reglas.
- Luego migración.
- Luego fuente principal.
- Luego celular.
- Fotos aparte.

### Error 2: Pensar Que Firebase Offline Reemplaza Todo

Firestore Offline ayuda, pero no reemplaza:

- Migración local.
- Limpieza de stores.
- Arquitectura de services.
- Adaptadores locales.
- Reglas de negocio.

### Error 3: Escribir Firestore Desde Componentes

Esto genera código difícil de mantener.

Mejor:

```text
Componente -> Store -> Service -> FirestoreService
```

### Error 4: Duplicar Sincronización

Si el service ya escribe en Firestore, el store no debe llamar a otra sincronización vieja.

Síntoma:

- El dato se guarda.
- Después aparece error en consola.
- La UI parece fallar aunque Firestore haya recibido el cambio.

### Error 5: No Mirar Firestore Real

No alcanza con probar la pantalla.

Hay que confirmar:

- Ruta correcta.
- UID correcto.
- Campos correctos.
- Sin base64.
- Sin documentos duplicados.

### Error 6: Confundir Auth Users Con Documentos Firestore

Firebase Auth muestra cuentas.

Firestore muestra documentos.

Que exista un usuario en Auth no significa que tenga datos en Firestore. Que existan documentos en Firestore no significa que Auth tenga una cuenta activa correcta.

### Error 7: No Limpiar Estado Al Cambiar Usuario

Si no se limpian stores privados, un usuario puede ver datos visuales del usuario anterior.

Siempre limpiar:

- Productos.
- Entidades principales.
- Listas.
- Preferencias si corresponde.
- Mesa de trabajo.
- Confirmaciones o estados privados.

### Error 8: Guardar Fotos Base64 En Firestore

No hacerlo.

Firestore debe guardar datos livianos. Las fotos van locales, por URL externa o a Storage si se acepta esa estrategia.

### Error 8.1: Clonar O Respaldar Fotos Base64 Durante La Migración

Aunque no se guarden en Firestore, las fotos base64 pueden romper la app si pasan por el flujo de migración.

No hacer:

- Crear backups completos con fotos base64.
- Guardar colas pendientes con fotos base64.
- Ejecutar `JSON.stringify` sobre productos, comercios, listas o mesa con fotos base64.
- Leer un backup viejo con fotos para validar que existe.
- Contar fotos cargando todas las fotos completas en memoria.

Hacer:

- Mantener las fotos locales en el dispositivo.
- Crear copias de migración sin fotos antes de clonar.
- Usar conteos livianos cuando el objetivo sea migrar datos a Firestore.
- Guardar en Firestore solo URL externa, metadatos o `null` si la foto es local.
- Probar en Android real con datos del usuario y revisar logcat.

Síntoma típico:

```text
java.lang.OutOfMemoryError
Failed to allocate ... byte allocation
Process: com.nombre.app
```

Si aparece ese error, la primera sospecha debe ser memoria por fotos/base64, no reglas de Firestore.

### Error 8.2: Usar Preferences Como Base De Datos Grande

`@capacitor/preferences` sirve para preferencias y datos chicos. No sirve como base principal para listas grandes, historiales, mesas de trabajo ni fotos.

No hacer:

- Guardar todos los productos en una sola clave gigante.
- Guardar comercios, direcciones, listas y mesa como JSON enorme con fotos.
- Leer esa clave gigante cada vez que se abre una pantalla.
- Usar Preferences como caché principal de una cuenta Firebase.
- Pensar que el error se puede capturar siempre con `try/catch`; si Android mata el proceso por memoria, JavaScript no llega a recuperarse.

Hacer:

- Usar IndexedDB para caché local grande.
- Separar datos por usuario.
- Separar fotos del objeto principal.
- Guardar metadatos livianos en Preferences.
- Migrar legacy hacia IndexedDB cuando sea posible.
- Si una clave legacy es demasiado grande para leerse sin crash, no volver a tocarla automáticamente.

Regla práctica:

> Preferences es para llaves chicas; IndexedDB es para caché grande.

### Error 8.3: Fusionar Local Y Remoto Sin Reconciliar Borrados

Este error aparece cuando la app usa `local primero, nube después`, pero la fusión conserva cualquier dato local aunque Firestore ya no lo tenga.

Síntoma real:

- Un producto se borra desde el celular.
- Firestore ya no tiene ese producto.
- El navegador sigue mostrando el producto después de varios F5.
- Más tarde desaparece cuando una sincronización correcta pisa el caché.

Causa:

```text
fusionar(locales, remotos)
  -> agregar todos los locales
  -> agregar o pisar remotos
  -> conservar locales que no vinieron de Firestore
```

Eso está mal cuando Firestore ya es la fuente de verdad.

Hacer:

- Comparar IDs locales contra IDs remotos después de una lectura remota exitosa.
- Borrar del caché local los IDs sobrantes.
- Borrar fotos locales y metadatos asociados de esos IDs.
- Guardar en caché solo el resultado reconciliado.
- Aplicar lo mismo en todos los dominios privados.

No hacer:

- Ejecutar esta limpieza si Firestore falló.
- Ejecutar esta limpieza si no hay sesión.
- Ejecutar esta limpieza con una respuesta parcial no controlada.
- Corregir solo un dominio y dejar los demás con la fusión vieja.

Regla práctica:

> Local primero mejora velocidad, pero Firestore decide qué existe cuando responde bien.

### Error 8.4: Marcar Datos Secundarios Viejos Como Completos

Este error aparece cuando la lista principal carga documentos livianos desde Firestore, pero conserva datos secundarios viejos desde el caché local.

Síntoma real:

- Un producto muestra el precio principal correcto o parcialmente correcto.
- Se agrega un precio nuevo desde otro dispositivo.
- Firestore tiene el precio nuevo en la subcolección.
- La tarjeta expandida o el detalle siguen mostrando solo el historial viejo.

Causa:

```text
producto local tiene precios: [precioViejo]
producto remoto liviano llega sin subcolección precios
fusionar conserva precios locales
preciosCargados queda true
la UI nunca pide la subcolección completa
```

Hacer:

- Comparar `fechaActualizacion` del documento remoto contra la fecha local.
- Si el remoto es más nuevo y no trajo la subcolección, marcar el historial como pendiente.
- Usar flags explícitos: `preciosCargados`, `historialCargado` o `detalleSecundarioCargado`.
- Cargar la subcolección bajo demanda al abrir tarjeta, detalle o vista avanzada.
- Guardar el resultado completo en caché local después de cargarlo.

No hacer:

```text
si hay un array local con 1 item -> marcar historial como completo
```

Regla práctica:

> Datos secundarios locales son útiles para mostrar rápido, pero deben invalidarse si el documento principal remoto cambió.

### Error 9: Borrar Local Demasiado Pronto

No borrar datos locales después de la primera migración.

Conservar local permite:

- Recuperar datos.
- Comparar.
- Reintentar.
- Probar sin conexión.

### Error 10: No Tener Plan Maestro

Cuando la integración dura varios días o semanas, se pierde contexto.

Conviene tener:

- Plan maestro.
- Plan por fase.
- Resumen técnico.
- Manual final.
- Checklist de cierre.

### Error 11: Publicar GitHub Pages Sin Variables Firebase

Este error aparece cuando la app funciona en local, pero falla o queda incompleta en la web publicada.

Causa:

```text
.env.local existe en la máquina del desarrollador
GitHub Actions no tiene VITE_FIREBASE_*
npm run build compila sin configuración Firebase válida
GitHub Pages publica dist/spa incompleto
```

Hacer:

- Configurar `VITE_FIREBASE_*` en Secrets o Variables de GitHub Actions.
- Validar esas variables antes de compilar.
- Pasar las variables al paso `npm run build`.
- Hacer fallar el workflow si falta alguna.
- Revisar la app ya publicada, no solo el build local.

No hacer:

```text
asumir que .env.local viaja a GitHub Pages
```

Regla práctica:

> Si Firebase depende de variables `VITE_`, GitHub Actions debe tenerlas durante el build.

### Error 12: Tratar El Borrado De Fotos Como Un Cambio Normal

Cambiar una foto y borrar una foto no tienen el mismo riesgo.

Síntoma:

- El usuario borra una foto.
- La UI parece limpiar la imagen.
- Al volver a entrar o al sincronizar, aparece la foto anterior.

Causas comunes:

- Firestore conserva `fotoUrl` o `fotoRutaStorage`.
- Storage conserva el archivo anterior.
- IndexedDB conserva la foto local.
- Una miniatura local sigue viva.
- La UI conserva un objeto anterior en memoria.
- La reconciliación fusiona local + remoto y reanima la foto local.

Hacer:

- Limpiar todos los campos remotos de foto.
- Marcar `fotoEstado` como `eliminada` o dejar metadata coherente sin foto.
- Borrar archivo de Storage si existe ruta.
- Borrar foto local y miniatura.
- Invalidar caché visual del componente.
- Registrar pendiente de limpieza si una parte falla.
- Probar borrado desde navegador hacia celular y desde celular hacia navegador.

No hacer:

```text
actualizar fotoUrl = null y dejar el resto igual
```

Regla práctica:

> Una foto borrada nunca debe poder volver desde caché local si Firestore ya respondió bien y dice que esa entidad no tiene foto.

---

## Señales De Que Firebase Está Bien Integrado

Buenas señales:

- La app arranca sin errores con y sin sesión.
- Login y logout no dejan datos mezclados.
- Firestore tiene documentos bajo `usuarios/{uid}`.
- Las reglas bloquean acceso ajeno.
- Cada dominio tiene service propio.
- Las preferencias se guardan y se restauran.
- El celular y el navegador ven los mismos datos.
- Las fotos agregadas, cambiadas y borradas se reflejan entre navegador y Android.
- Firestore no contiene base64 de fotos.
- Offline no rompe la UI.
- `npm run lint` pasa.
- `npm run build` pasa.

Señales de peligro:

- Componentes importan Firebase directamente.
- Hay llamadas directas a `localStorage` repartidas.
- Se usa `addDoc` durante migración y se duplican datos.
- Hay documentos fuera de `usuarios/{uid}` sin necesidad.
- Un usuario ve datos de otro.
- La app depende de fotos para cerrar Firebase.
- Una foto borrada reaparece después de recargar o sincronizar.
- Firestore tiene base64, blobs o documentos gigantes de fotos.
- Hay métodos viejos de sincronización que ya no existen.
- Se cambia usuario y quedan datos anteriores en pantalla.

---

## Comandos Útiles

Instalar Firebase:

```bash
npm install firebase
```

Login Firebase CLI:

```bash
npx firebase-tools login
```

Ver proyecto activo:

```bash
npx firebase-tools use
```

Deploy de reglas Firestore:

```bash
npx firebase-tools deploy --only firestore:rules
```

Exportar usuarios Auth para revisar cuentas:

```bash
npx firebase-tools auth:export usuariosFirebase.json --project nombreProyecto --format=json
```

Validar app:

```bash
npm run lint
npm run build
```

Validar Android en este tipo de proyecto:

```bash
npm run cel
```

---

## Convenciones Recomendadas Para Código

Nombres de archivos:

```text
FirebaseBaseService.js
AutenticacionFirebaseService.js
UsuarioActualService.js
FuentePrincipalFirestoreService.js
FirestoreProductosService.js
FirestorePreferenciasService.js
```

Nombres de funciones:

```text
obtenerUsuarioFirebaseActual()
guardarPreferencias()
obtenerPreferenciasUsuario()
normalizarProductoParaFirestore()
crearResultadoOmitido()
obtenerEstadoEscrituraAceptada()
```

Campos recomendados:

```text
usuarioId
fechaCreacion
fechaActualizacion
eliminado
estadoSincronizacion
origenDatos
```

No mezclar idioma sin necesidad. Si el proyecto está en español, mantener nombres en español salvo APIs externas.

---

## Plantilla Mental Para Un Nuevo Dominio

Para agregar Firebase a un dominio nuevo, responder:

1. ¿Cuál es la ruta Firestore?
2. ¿El documento es único o colección?
3. ¿Tiene subdatos que pueden crecer?
4. ¿Qué campos están permitidos?
5. ¿Cómo se normalizan los datos?
6. ¿Cómo se guarda local?
7. ¿Cómo se guarda remoto?
8. ¿Qué pasa sin sesión?
9. ¿Qué pasa sin conexión?
10. ¿Cómo se elimina?
11. ¿Cómo se migra desde local?
12. ¿Cómo se prueba con dos usuarios?

Si no se pueden responder estas preguntas, todavía no conviene programar.

---

## Recomendación Final

Para replicar Firebase en otras apps, usar este orden:

1. Auth estable.
2. Reglas privadas.
3. Un dominio pequeño.
4. Pruebas con dos usuarios.
5. Migración local.
6. Fuente principal Firestore.
7. Resto de dominios.
8. Preferencias.
9. Mesa o estados temporales importantes.
10. Android.
11. Cierre de datos sin depender de fotos.
12. Fotos como sistema separado: local optimizado + metadata Firestore, o Storage si está disponible y aceptado.

La lección más importante:

> Firebase no es difícil por el SDK. Lo difícil es ordenar la app para que los datos tengan dueño, rutas claras, services separados, pruebas reales y una estrategia offline coherente.

Si se respeta esa arquitectura, Firebase se puede replicar en otras apps con mucho menos riesgo.
