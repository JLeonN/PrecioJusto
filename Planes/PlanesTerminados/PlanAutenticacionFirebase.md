# PLAN AUTENTICACIÓN FIREBASE

## Descripción del plan

Implementar autenticación real con Firebase Auth en Precio Justo usando la base Firebase ya inicializada. El objetivo es que la app tenga cuenta de usuario, sesión persistente, registro, inicio de sesión, cierre de sesión y recuperación de contraseña, sin migrar todavía productos, comercios, listas ni fotos a Firestore.

La app debe seguir usando el almacenamiento local actual durante este plan. Firestore privado, migración local y Storage quedan para planes posteriores.

## Objetivo principal

- Crear una capa clara de autenticación con Firebase Auth.
- Agregar `UsuarioStore` para manejar usuario, sesión, carga y errores.
- Conectar Firebase Auth con `UsuarioActualService`.
- Crear pantallas y flujos de login, registro, recuperación de contraseña y logout.
- Mantener los datos locales actuales accesibles y sin migración automática.

## Reglas del plan

- No migrar datos locales a Firestore en este plan.
- No escribir productos, comercios, listas, preferencias ni fotos en Firestore.
- No subir fotos a Firebase Storage en este plan.
- No eliminar `LocalStorageAdapter`, `CapacitorAdapter` ni `AlmacenamientoService`.
- Mantener compatibilidad con datos locales existentes.
- Usar español en nombres propios del proyecto, salvo APIs externas de Firebase.
- Mostrar errores de autenticación con mensajes claros para usuario final.
- No guardar contraseñas ni tokens manualmente.

## FASE 1: Revisar base Firebase disponible

### Objetivo

Confirmar que la base técnica necesaria para Auth ya está lista antes de implementar pantallas o stores.

- [x] Revisar `FirebaseBaseService.js` y confirmar que exporta Auth.
- [x] Revisar `FirebaseBoot.js` y confirmar que la inicialización no bloquea la app.
- [x] Confirmar que `firebase` está instalado en `package.json`.
- [x] Confirmar que las variables de entorno Firebase están documentadas.
- [x] Confirmar en Firebase Console que el proveedor `Correo electrónico/contraseña` está habilitado.
- [x] Confirmar que no hay escrituras Firestore actuales desde la app.

## FASE 2: Crear servicio de autenticación

### Objetivo

Centralizar las llamadas a Firebase Auth en un servicio propio de la app.

- [x] Crear un servicio de autenticación con nombre PascalCase.
- [x] Implementar registro con correo y contraseña.
- [x] Implementar inicio de sesión con correo y contraseña.
- [x] Implementar cierre de sesión.
- [x] Implementar envío de correo para recuperar contraseña.
- [x] Implementar observador de sesión usando Firebase Auth.
- [x] Normalizar errores de Firebase Auth a mensajes claros en español.
- [x] Evitar que componentes importen Firebase Auth directamente.

## FASE 3: Crear UsuarioStore

### Objetivo

Crear el store global que represente el estado real del usuario autenticado.

- [x] Crear `UsuarioStore` con estado de usuario, carga, error y sesión iniciada.
- [x] Exponer `usuarioId`, `email`, `nombre`, `foto`, `estaAutenticado` y `cargandoSesion`.
- [x] Crear acción para inicializar escucha de sesión.
- [x] Crear acción para registrar usuario.
- [x] Crear acción para iniciar sesión.
- [x] Crear acción para cerrar sesión.
- [x] Crear acción para recuperar contraseña.
- [x] Conectar cambios de sesión con `UsuarioActualService`.
- [x] Restaurar usuario local legacy al cerrar sesión si hace falta mantener compatibilidad temporal.

## FASE 4: Crear pantalla de acceso

### Objetivo

Agregar una vista clara para que el usuario pueda entrar, registrarse o recuperar su contraseña.

- [x] Crear página de autenticación con nombre PascalCase.
- [x] Agregar formulario de inicio de sesión con correo y contraseña.
- [x] Agregar formulario de registro con correo y contraseña.
- [x] Agregar acción para recuperación de contraseña.
- [x] Validar campos obligatorios antes de llamar al servicio.
- [x] Mostrar estados de carga en botones.
- [x] Mostrar errores de forma visible y no técnica.
- [x] Mantener diseño consistente con Quasar y variables CSS existentes.

## FASE 5: Integrar rutas y acceso obligatorio

### Objetivo

Hacer que la app use cuenta de usuario sin romper la carga inicial ni los datos locales.

- [x] Agregar ruta de autenticación.
- [x] Inicializar `UsuarioStore` al arrancar la app.
- [x] Definir qué rutas requieren usuario autenticado.
- [x] Redirigir a login cuando no haya sesión y la ruta sea privada.
- [x] Redirigir fuera del login cuando el usuario ya tenga sesión.
- [x] Evitar bucles de navegación mientras `cargandoSesion` está activo.
- [x] Verificar que después de iniciar sesión se puede entrar a las vistas principales.
- [x] Mantener datos locales visibles después del login hasta que exista plan de migración.

## FASE 6: Agregar logout y estado de usuario

### Objetivo

Permitir al usuario cerrar sesión y ver el estado básico de su cuenta.

- [x] Agregar opción de cerrar sesión en la zona de configuración o menú correspondiente.
- [x] Mostrar correo del usuario autenticado donde sea útil.
- [x] Confirmar logout si puede afectar el acceso a la app.
- [x] Limpiar estado reactivo de usuario al cerrar sesión.
- [x] No borrar datos locales al cerrar sesión en este plan.
- [x] Documentar que la limpieza/migración de datos queda para un plan posterior.

## FASE 7: Preparar Google Sign-In sin implementarlo

### Objetivo

Dejar anotado lo necesario para sumar Google más adelante sin mezclarlo con el primer flujo de Auth.

- [x] Revisar requisitos de Google Sign-In en web.
- [x] Revisar requisitos de Google Sign-In en Android con SHA-1.
- [x] Documentar que Google Sign-In queda fuera de este plan.
- [x] Confirmar que email y contraseña funcionan antes de sumar proveedores externos.

## FASE 8: Actualizar documentación del avance

### Objetivo

Dejar el estado del trabajo claro para continuar con Firestore privado después.

- [x] Actualizar el plan con resultado de ejecución.
- [x] Actualizar `DatosLocalesProyectos.md` si se crean usuarios de prueba o cambia configuración Auth.
- [x] Actualizar resumen correspondiente si el proyecto mantiene resumen por etapa.
- [x] Registrar cualquier decisión pendiente para el plan de Firestore privado.

## FASE TESTING

### Objetivo

Validar que la autenticación real funciona sin romper el almacenamiento local actual.

- [x] Ejecutar `npm run lint`.
- [x] Ejecutar `npm run build`.
- [x] Abrir la app en navegador con sesión cerrada y verificar que redirige a login cuando corresponde.
- [x] Registrar un usuario nuevo con correo y contraseña válidos.
- [x] Intentar registrar con correo inválido y verificar mensaje claro.
- [x] Iniciar sesión con credenciales correctas.
- [x] Intentar iniciar sesión con contraseña incorrecta y verificar mensaje claro.
- [x] Recargar la página y verificar que la sesión persiste.
- [x] Cerrar sesión y verificar que se limpia el estado de usuario.
- [x] Verificar que los datos locales existentes no se borran.
- [x] Verificar que productos, comercios, listas y preferencias no se escriben en Firestore todavía.
- [x] Probar el flujo en Android cuando corresponda.

## Progreso del plan

- [x] Fase 1: Revisar base Firebase disponible
- [x] Fase 2: Crear servicio de autenticación
- [x] Fase 3: Crear UsuarioStore
- [x] Fase 4: Crear pantalla de acceso
- [x] Fase 5: Integrar rutas y acceso obligatorio
- [x] Fase 6: Agregar logout y estado de usuario
- [x] Fase 7: Preparar Google Sign-In sin implementarlo
- [x] Fase 8: Actualizar documentación del avance
- [x] Fase Testing

Fecha de creación: 19 de Mayo 2026
Fecha de última actualización: 19 de Mayo 2026
Estado: TERMINADO

## Resultado de ejecución

- Servicio AutenticacionFirebaseService.js creado para registro, login, logout, recuperación y observador de sesión.
- Store UsuarioStore.js creado y conectado con UsuarioActualService para mantener compatibilidad local.
- Boot UsuarioBoot.js agregado al arranque de Quasar.
- Ruta /acceso creada y rutas principales protegidas por sesión.
- Página AutenticacionPage.vue creada con ingreso, registro y recuperación.
- ConfiguracionPage.vue muestra cuenta activa y permite cerrar sesión con confirmación.
- Google Sign-In queda documentado como pendiente para un plan posterior: requerirá proveedor Google, configuración web y SHA-1/SHA-256 Android.

## Resultado de testing

- `npm run lint`: OK.
- `npm run build`: OK.
- `npm run androidReleaseConSimbolos`: OK.
- MCP Browser: redirección sin sesión a `/acceso` OK.
- MCP Browser: registro de usuario válido OK.
- MCP Browser: correo inválido y contraseña inválida muestran errores claros OK.
- MCP Browser: login correcto OK.
- MCP Browser: contraseña incorrecta muestra error claro OK.
- MCP Browser: recarga mantiene sesión OK.
- MCP Browser: logout limpia estado y vuelve a login OK.
- Almacenamiento local: productos, listas, preferencias y sesión de escaneo siguen usando adaptadores locales.
- Firestore: no se escribieron documentos; solo se observaron llamadas Auth a Identity Toolkit.
- Error conocido no relacionado: CORS de `version.json` contra GitHub Pages en dev.

