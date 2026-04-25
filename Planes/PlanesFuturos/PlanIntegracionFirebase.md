# PLAN FUTURO — INTEGRACIÓN FIREBASE / FIRESTORE
Proyecto: Precio Justo
Estado: BORRADOR — En investigación
Responsable: Leo + CH

> ⚠️ Este es un plan de gran escala. Al momento de comenzar la implementación,
> cada sección puede convertirse en un plan independiente. Por ahora todo va aquí.

> 💰 RESTRICCIÓN ECONÓMICA: La app DEBE funcionar 100% dentro del plan gratuito
> de Firebase (Spark Plan) hasta que la app genere ingresos propios.
> Todo el diseño — especialmente el modelo de datos — debe estar optimizado
> para minimizar lecturas, escrituras y almacenamiento. Esta restricción no es
> negociable y debe tenerse en cuenta en cada decisión de arquitectura.

## ESTADO ACTUAL DE AVANCE

### Ya realizado en esta pausa

- [x] Se creó el proyecto de Firebase de pruebas: `PrecioJustoPruebas`
- [x] Se definió el ID del proyecto: `preciojustopruebas`
- [x] Se registró la app web en Firebase Console
- [x] Se registró la app Android en Firebase Console
- [x] Se descargó `google-services.json`
- [x] Se movió `google-services.json` a `android/app/google-services.json`
- [x] Se verificó que el proyecto Android usa Gradle Groovy, no Kotlin
- [x] Se verificó que la integración base de Google Services ya estaba presente en Gradle
- [x] Se ejecutó validación local de Android: `:app:processDebugGoogleServices`

### Decisiones tomadas

- [x] Se avanza primero con configuración de Firebase y aprendizaje básico, no con implementación completa
- [x] Se registran ambas apps: web y Android
- [x] La configuración concreta del proyecto Firebase se guarda en `DatosLocalesProyectos.md` y no en este plan
- [x] Por ahora no se toca Auth, Storage ni pantallas de login
- [x] El siguiente servicio a abrir en consola será Firestore

### Próximo punto exacto para retomar

1. Ir en Firebase Console a `Bases de datos y almacenamiento`
2. Entrar a `Firestore Database`
3. Crear la base de datos
4. Elegir `modo de prueba` solo para aprendizaje inicial
5. Elegir región
6. Pausar antes de tocar `Authentication` o `Storage`

### Recordatorios importantes para retomar

- La configuración web de Firebase no es un secreto por sí sola
- La seguridad real va por `Security Rules`
- No seguir con implementación real hasta cerrar la Fase 1 del modelo de datos
- Antes de Google Sign-In real en Android faltará registrar SHA-1 de debug y de producción
- Conviene aprender primero Firestore básico antes de abrir Auth

═══════════════════════════════════════════════════════════════

## 📖 DESCRIPCIÓN DEL PLAN

Migrar Precio Justo de almacenamiento local (Capacitor Storage) a una arquitectura
en la nube usando Firebase (Auth + Firestore + Storage). Este cambio es el paso más
grande del proyecto: introduce usuarios, sincronización multi-dispositivo, datos
compartidos y la base para una comunidad colaborativa de precios.

### OBJETIVOS PRINCIPALES:

- Implementar autenticación segura (Google + email/contraseña)
- Migrar datos locales (productos y comercios) a Firestore
- Mantener funcionamiento 100% offline con sincronización automática al volver la conexión
- Implementar privacidad por defecto: los datos de cada usuario son suyos y privados
- Crear una página comunitaria donde el usuario pueda compartir voluntariamente
  productos y comercios para que otros los vean y usen
- Preparar la base para el plan de "Compartir datos entre usuarios"

### PLANES QUE SE DESPRENDEN DE ESTE (futuros):

- **PlanConfiguracionUsuario** — Pantalla de configuración: cambiar nombre, usuario,
  contraseña, foto de perfil, correo
- **PlanRedConexion** — Configuración de red: elegir si sincroniza por WiFi o también
  por datos móviles
- **PlanSistemaAmigos** — Sistema de amigos dentro de la app para compartir productos
  y comercios sin salir de la app. El usuario siempre queda dentro del ecosistema.
  Reemplaza la idea original de compartir por link/QR/código externo.
  > Cosas a resolver cuando se planifique:
  > - ¿Cómo se encuentran los usuarios entre sí? (por @usuario, por QR, por email, etc.)
  > - ¿Cómo llegan los items compartidos al otro? (bandeja de entrada, notificación, etc.)
  > - ¿Qué nivel de privacidad tiene el perfil del usuario frente a desconocidos?
  > - ¿Se necesitan solicitudes de amistad o es directo?
  > - ¿Notificaciones push al recibir algo?
- **PlanModeracionComunidad** — Sistema de reporte de contenido inapropiado en la
  página comunitaria

### TECNOLOGÍAS A INCORPORAR:

- Firebase Authentication (Google + Email/Password)
- Cloud Firestore (base de datos NoSQL en la nube)
- Firebase Storage (imágenes de productos y comercios)
- Firebase Security Rules (control de acceso)
- Firebase Crashlytics (reporte de crashes — gratuito, recomendado)
- Firebase Analytics (ya integrado con AdMob — unificar)
- CapacitorFirebase o firebase-js-sdk (integración con Capacitor/Android)

═══════════════════════════════════════════════════════════════

## 🔍 INVESTIGACIÓN PREVIA (OBLIGATORIA antes de implementar)

### Costos y límites (Spark Plan — gratuito, SIN tarjeta de crédito)

La app debe funcionar SIEMPRE dentro de estos límites. No se activa Blaze Plan.

| Servicio | Límite gratuito diario |
|---|---|
| Firestore lecturas | 50.000 / día |
| Firestore escrituras | 20.000 / día |
| Firestore eliminaciones | 20.000 / día |
| Firestore almacenado | 1 GB total |
| Storage almacenado | 5 GB total |
| Storage descargado | 1 GB / día |
| Auth | Ilimitado |
| Crashlytics | Ilimitado (gratuito siempre) |

**Estrategias obligatorias para no superar los límites:**

- Aprovechar al máximo el caché offline de Firestore: si el dato no cambió,
  no se hace una lectura nueva al servidor
- Imágenes de productos: preferir la URL de Open Food Facts (externa, no ocupa Storage)
  Solo subir a Firebase Storage las fotos tomadas desde la cámara del usuario
- Página comunitaria: implementar paginación estricta (cargar de a 20 items máximo)
  y no recargar si el usuario ya los tiene en caché
- No usar listeners en tiempo real (onSnapshot) donde no sea necesario.
  Preferir lecturas únicas (getDoc / getDocs) para datos que no cambian frecuentemente
- Configurar alertas de presupuesto en Firebase Console (aunque sea plan Spark,
  Google avisa si el uso es inusualmente alto)
- Nunca escribir en Firestore en un loop o sin control (riesgo de agotar cuota en segundos)

> ⚠️ Con ~100 usuarios activos usando la app normalmente, el Spark Plan es suficiente.
> Si la app crece mucho antes de generar ingresos, revisar estrategia.

### Recursos para estudiar

**Documentación oficial (siempre la fuente más actualizada):**
- https://firebase.google.com/docs/firestore (Firestore completo)
- https://firebase.google.com/docs/auth (Authentication)
- https://firebase.google.com/docs/storage (Storage)
- https://firebase.google.com/docs/rules (Security Rules)
- https://firebase.google.com/docs/firestore/manage-data/enable-offline (Offline)
- https://firebase.google.com/pricing (Tabla de precios y límites)

**YouTube — Canales recomendados:**
- **Fireship** (canal en inglés) — el mejor contenido de Firebase en YouTube,
  muy directo y actualizado. Buscar: "Firestore data modeling", "Firebase Auth"
- **The Net Ninja** (canal en inglés) — tiene series completas de Firebase + Vue
  Buscar: "Vue 3 Firebase tutorial"
- **Fazt Code** (canal en español) — Firebase en español, buena introducción
  Buscar: "Firebase Firestore Vue"

**Temas específicos a investigar:**
- [ ] Firestore data modeling (colecciones vs subcolecciones vs referencias)
- [ ] Firebase Security Rules avanzadas (lectura/escritura por usuario)
- [ ] Offline persistence en Firestore con Capacitor/Android
- [ ] Firebase Auth con Google Sign-In en Android (Capacitor)
- [ ] Firebase Storage rules (imágenes privadas vs públicas)
- [ ] Firestore pagination (para la página comunitaria con muchos items)
- [ ] Firestore indexes (necesarios para queries complejas)
- [ ] Firebase Emulator Suite (para desarrollar sin gastar cuota real)
- [ ] Migración de datos locales a Firestore (estrategia)

═══════════════════════════════════════════════════════════════

## 📋 FASE 1: DISEÑO DEL MODELO DE DATOS

> Esta es la fase más crítica. Un modelo mal diseñado es muy difícil de cambiar después.
> No escribir una línea de código hasta tener esto cerrado.

### Estructura tentativa en Firestore

```
users/
  {userId}/
    perfil: { nombre, usuario, email, foto, fechaRegistro }
    configuracion: { sincronizarConDatos, tema, ... }

    productos/
      {productoId}/
        { nombre, marca, categoria, codigoBarras, imagen, ... }
        precios/
          {precioId}/
            { valor, fecha, comercioId, direccionId, ... }

    comercios/
      {comercioId}/
        { nombre, tipo, direcciones[], ... }

comunidad/
  productos/
    {productoId}/
      { ...datosProducto, compartidoPor: userId, fechaCompartido }
  comercios/
    {comercioId}/
      { ...datosComercio, compartidoPor: userId, fechaCompartido }
```

> ⚠️ Esto es tentativo. Definir el modelo final ANTES de implementar.

### Preguntas de diseño a resolver

[ ] ¿Las imágenes de productos van en Storage o se guarda solo la URL de Open Food Facts?
[ ] ¿Los precios son subcolección del producto o colección separada?
[ ] ¿Qué campos indexar para la búsqueda en la página comunitaria?
[ ] ¿Cómo manejar que el mismo producto físico sea registrado por muchos usuarios?
[ ] ¿Cuándo el usuario comparte un item, se copia o se referencia?

═══════════════════════════════════════════════════════════════

## 📋 FASE 2: CONFIGURACIÓN DE FIREBASE

[x] Crear proyecto en Firebase Console
[x] Configurar app Android (google-services.json)
[x] Registrar app web en Firebase Console
[x] Registrar app Android en Firebase Console
[x] Validar integración base Android con `google-services.json`
[ ] Instalar dependencias: firebase-js-sdk o CapacitorFirebase
[ ] Configurar Firebase Emulator Suite para desarrollo local
[ ] Activar Firestore, Auth (Google + Email), Storage
[ ] Configurar Firebase Analytics + Crashlytics
[ ] Variables de entorno para las credenciales (nunca hardcodeadas)

═══════════════════════════════════════════════════════════════

## 📋 FASE 3: AUTENTICACIÓN

### Proveedores

[ ] Google Sign-In (botón único, sin formulario)
[ ] Email + contraseña (registro e inicio de sesión)
[ ] Modo invitado — DECISIÓN PENDIENTE:
    ¿Puede el usuario usar la app sin cuenta? (actualmente sí)
    Si se mantiene el modo invitado, sus datos quedan solo locales.
    Al crear cuenta, se migra la data local a Firestore.

### Seguridad (buenas prácticas)

[ ] Verificación de email al registrarse con email/contraseña
[ ] Política de contraseñas: mínimo 8 caracteres, 1 número, 1 mayúscula
[ ] Rate limiting en intentos de login (Firebase lo maneja, pero verificar config)
[ ] Tokens JWT manejados por Firebase Auth (no almacenar manualmente)
[ ] HTTPS obligatorio (Firebase lo garantiza)
[ ] Logout en todos los dispositivos disponible desde configuración
[ ] Flujo de recuperación de contraseña (email automático de Firebase)
[ ] Pantalla de login separada (no bloquear la app para invitados si aplica)

### Componentes nuevos

[ ] PaginaLogin.vue (pantalla de bienvenida / inicio de sesión)
[ ] DialogoRegistro.vue (registro con email)
[ ] DialogoRecuperarContrasena.vue

═══════════════════════════════════════════════════════════════

## 📋 FASE 4: PERFIL DE USUARIO

[ ] Al crear cuenta, generar documento en users/{userId}/perfil
[ ] Campos iniciales: nombre (del proveedor), email, foto (de Google si aplica)
[ ] Crear PaginaConfiguracion.vue (plan separado: PlanConfiguracionUsuario)
    - Cambiar nombre
    - Cambiar nombre de usuario (único en la app)
    - Cambiar contraseña (solo para email/password)
    - Cambiar foto de perfil
    - Cambiar email (requiere re-autenticación)
    - Eliminar cuenta (borra TODOS los datos del usuario — obligatorio por GDPR)

═══════════════════════════════════════════════════════════════

## 📋 FASE 5: MIGRACIÓN DE DATOS LOCALES → FIRESTORE

> El usuario ya tiene datos en Capacitor Storage. Hay que migrarlos sin perderlos.

[ ] Detectar si el usuario tiene datos locales al hacer login por primera vez
[ ] Mostrar diálogo: "Tenés X productos y X comercios guardados. ¿Subir a la nube?"
[ ] Proceso de migración:
    - Leer todos los datos de Capacitor Storage
    - Escribir en Firestore bajo users/{userId}/
    - Reasignar IDs (los locales son strings arbitrarios, Firestore genera sus propios)
    - Mantener backup local hasta confirmar que la migración fue exitosa
[ ] Manejo de errores: si falla a mitad, no perder datos
[ ] Indicador de progreso visual durante la migración

═══════════════════════════════════════════════════════════════

## 📋 FASE 6: OFFLINE FIRST + SINCRONIZACIÓN

> La app SIEMPRE debe funcionar sin internet. Esto es innegociable.

### Firestore Offline Persistence

[ ] Habilitar persistencia offline en Firestore (enableIndexedDbPersistence o
    enableMultiTabIndexedDbPersistence)
[ ] En Android con Capacitor, verificar compatibilidad con la versión del SDK
[ ] La app lee de caché local cuando no hay conexión → Firestore lo maneja solo
[ ] Al volver la conexión, Firestore sincroniza automáticamente las escrituras pendientes

### Indicadores visuales de estado de conexión

[ ] Usar @capacitor/network para detectar conectividad
[ ] Banner/chip sutil cuando la app está offline: "Sin conexión — guardando localmente"
[ ] Indicador cuando sincroniza: "Sincronizando..."

### Configuración de red (plan separado: PlanRedConexion)

[ ] Opción en Configuración: "Sincronizar solo por WiFi" o "Sincronizar siempre"
[ ] Si elige "solo WiFi": pausar sincronización cuando detecta que está en datos móviles
[ ] Por defecto: sincronizar siempre (comportamiento más esperado)

═══════════════════════════════════════════════════════════════

## 📋 FASE 7: PRIVACIDAD Y SEGURIDAD DE DATOS

### Modelo de privacidad

- Los productos y comercios de cada usuario son PRIVADOS por defecto
- Nadie puede ver los datos de otro usuario (garantizado por Security Rules)
- El usuario decide activamente qué compartir a la comunidad

### Firebase Security Rules

[ ] Regla base: solo el dueño puede leer/escribir sus datos
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /comunidad/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // restringir más en fase de moderación
    }
  }
}
```
[ ] Storage Rules equivalentes para imágenes
[ ] Testear las rules con Firebase Rules Playground antes de publicar

### GDPR / Derecho al olvido

[ ] Función "Eliminar mi cuenta" en Configuración:
    - Borra todos los documentos de users/{userId}/
    - Borra imágenes de Storage del usuario
    - Desautentica la cuenta en Firebase Auth
    - Limpia caché local
    - NO borra los items que el usuario compartió en comunidad (o sí, decidir)

═══════════════════════════════════════════════════════════════

## 📋 FASE 8: PÁGINA COMUNITARIA

> Idea central: base de datos colaborativa de precios donde los usuarios
> contribuyen voluntariamente. Cada uno ve lo que todos comparten.

### Flujo para compartir un item

[ ] En TarjetaProductoYugioh / TarjetaComercioYugioh: opción "Compartir a comunidad"
[ ] Al compartir: se copia el documento a comunidad/productos/{id}
    con campo adicional: { compartidoPor: userId, fechaCompartido, reportes: 0 }
[ ] El usuario puede "descompartir" en cualquier momento (borra de comunidad/)
[ ] Si edita el item original, la versión comunitaria NO se actualiza automáticamente
    (son copias independientes — decidir si esto es lo correcto)

### PaginaComunidad.vue (nueva página)

[ ] Lista de productos y comercios compartidos por todos los usuarios
[ ] Buscador por nombre, categoría, comercio
[ ] Filtros: por categoría, por fecha, por comercio
[ ] Paginación (no cargar todo de una — usar Firestore pagination con limit + startAfter)
[ ] Al tocar un item: ver detalle con sus precios (solo lectura)
[ ] Botón: "Agregar a mis productos" (copia el item a la colección privada del usuario)
[ ] Botón: "Reportar" (flag para moderación futura)
[ ] Indicar quién compartió (nombre de usuario, no email)

### Consideraciones de la página comunitaria

[ ] ¿Cómo evitar spam o contenido basura? — Plan de moderación separado
[ ] ¿Qué pasa si dos usuarios comparten el mismo producto?
    → Mostrar ambas versiones, o deduplicar por código de barras
[ ] ¿Los precios de la comunidad tienen fecha? ¿Se muestran como "posiblemente desactualizados"?
[ ] Cold start problem: al principio nadie tiene nada compartido → pantalla vacía
    → Considerar sembrar con datos de demostración o esperar crecimiento orgánico

═══════════════════════════════════════════════════════════════

## 📋 FASE 9: ACTUALIZAR STORES DE PINIA

> Este es el cambio más extenso de código. Todos los stores actuales
> leen/escriben en Capacitor Storage. Hay que migrarlos a Firestore.

[ ] productosStore.js — reemplazar ProductosService (Capacitor) por Firestore SDK
[ ] comerciosStore.js — ídem
[ ] Crear usuarioStore.js (nuevo) — maneja auth state, perfil, configuración
[ ] Mantener compatibilidad offline (Firestore lo maneja, pero verificar flujos)
[ ] Los getters computados (comerciosAgrupados, etc.) no cambian — solo la fuente de datos

═══════════════════════════════════════════════════════════════

## 📋 FASE Testing

### Autenticación
[ ] Registro con email válido → verificación de email llega
[ ] Registro con email inválido → error claro
[ ] Login con Google → funciona en Android real (no solo emulador)
[ ] Login con email/contraseña correctos → accede
[ ] Login con contraseña incorrecta → mensaje de error sin revelar si el email existe
[ ] Recuperación de contraseña → email llega y funciona
[ ] Logout → sesión cerrada, datos locales limpios

### Offline
[ ] Sin internet: agregar producto → se guarda en caché local
[ ] Recuperar internet → el producto aparece en Firestore (verificar en consola)
[ ] Editar producto offline → se sincroniza al volver conexión
[ ] Eliminar offline → se sincroniza correctamente

### Migración
[ ] Usuario con datos locales hace login por primera vez → migración exitosa
[ ] Después de migrar: datos en Firestore coinciden con los locales
[ ] Si la migración falla a mitad: datos locales intactos, reintento posible

### Privacidad / Security Rules
[ ] Usuario A no puede leer datos de Usuario B (verificar desde Firebase Console)
[ ] Usuario no autenticado no puede leer nada
[ ] Shared items en comunidad son legibles por cualquier usuario autenticado

### Página comunitaria
[ ] Compartir un producto → aparece en comunidad para otro usuario
[ ] Descompartir → desaparece de comunidad
[ ] Paginación funciona correctamente (cargar más al hacer scroll)
[ ] Buscador filtra correctamente

### Testing responsivo
[ ] Móvil (xs) - 360px
[ ] Tablet (sm) - 768px
[ ] Desktop (md) - 1024px

═══════════════════════════════════════════════════════════════

## ⚠️ RIESGOS Y PUNTOS DELICADOS

- **Costo inesperado:** Un bug que haga lecturas en loop puede agotar la cuota gratis
  en minutos → implementar alertas de presupuesto en Firebase Console desde el día 1
- **Migración de IDs:** Los comercioId en precio.comercioId son IDs locales.
  Al migrar, hay que reasignar estas referencias con los nuevos IDs de Firestore
- **Google Sign-In en Android:** Requiere SHA-1 del keystore registrado en Firebase.
  El keystore de debug es distinto al de producción → configurar ambos
- **Imágenes:** Las fotos locales (Capacitor) no pueden subirse automáticamente
  sin lógica explícita. Las imágenes de Open Food Facts son URLs externas → fácil
- **Concurrencia:** Si el mismo usuario edita desde dos dispositivos → Firestore
  usa "last write wins" por defecto. Para campos críticos usar transacciones
- **Nombres de usuario únicos:** Firestore no tiene unicidad nativa en campos.
  Requiere una colección auxiliar: usernames/{username} → userId para verificar

═══════════════════════════════════════════════════════════════

## 💡 IDEAS ADICIONALES (no planificadas, para evaluar)

- **Firebase Crashlytics** — gratuito, detecta crashes en producción automáticamente.
  Muy recomendable agregar en Fase 2, se integra en minutos
- **Firebase Analytics** — ya tenemos AdMob (que incluye Analytics). Unificar
  y aprovechar los eventos de navegación para entender cómo usan la app
- **Push Notifications (FCM)** — para notificar al usuario cuando alguien
  "importa" un item que compartió, o cuando hay actualizaciones de precios
  en productos de su interés. Plan separado
- **Nombres de usuario únicos** — como mencionado arriba, cada usuario tendría
  un @usuario visible en la comunidad (nunca el email)
- **Historial de versiones de precio comunitario** — en la página comunitaria,
  múltiples usuarios pueden reportar el precio de un producto y ver la evolución
  (esto acerca la app a su visión original de precios colaborativos)
- **Caché de imágenes** — si se sube imagen a Storage, guardar la URL en Firestore
  y no re-subir si ya existe (usar hash o codigoBarras como key)

═══════════════════════════════════════════════════════════════

## NOTAS IMPORTANTES 📌

- NO comenzar implementación sin terminar la Fase 1 (modelo de datos)
- Usar Firebase Emulator Suite durante todo el desarrollo (no gastar cuota real)
- Configurar alertas de presupuesto en Firebase Console desde el día 1
- El SHA-1 del keystore de producción es diferente al de debug → registrar ambos
- La migración de datos locales a Firestore es irreversible → hacer backup primero
- Leer los términos de Firebase sobre datos de usuarios en apps publicadas (privacidad)

═══════════════════════════════════════════════════════════════

## PRÓXIMOS PLANES QUE DEPENDEN DE ESTE 🔗

- PlanConfiguracionUsuario (cambiar credenciales, eliminar cuenta)
- PlanRedConexion (WiFi vs datos móviles)
- PlanCompartirDatos (compartir item específico con usuario específico)
- PlanModeracionComunidad (reportes, bans, contenido inapropiado)

═══════════════════════════════════════════════════════════════

**CREADO:** 14 de Marzo 2026
**ÚLTIMA ACTUALIZACIÓN:** 25 de Abril 2026
**ESTADO:** 🔍 EN INVESTIGACIÓN — No comenzar hasta completar Fase 1
