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
- No activar comunidad en este plan.
- No subir fotos a Firebase Storage en este plan.
- No eliminar `LocalStorageAdapter`, `CapacitorAdapter` ni `AlmacenamientoService`.
- Mantener compatibilidad con datos locales existentes.
- Usar español en nombres propios del proyecto, salvo APIs externas de Firebase.
- Mostrar errores de autenticación con mensajes claros para usuario final.
- No guardar contraseñas ni tokens manualmente.

## FASE 1: Revisar base Firebase disponible

### Objetivo

Confirmar que la base técnica necesaria para Auth ya está lista antes de implementar pantallas o stores.

- [ ] Revisar `FirebaseBaseService.js` y confirmar que exporta Auth.
- [ ] Revisar `FirebaseBoot.js` y confirmar que la inicialización no bloquea la app.
- [ ] Confirmar que `firebase` está instalado en `package.json`.
- [ ] Confirmar que las variables de entorno Firebase están documentadas.
- [ ] Confirmar en Firebase Console que el proveedor `Correo electrónico/contraseña` está habilitado.
- [ ] Confirmar que no hay escrituras Firestore actuales desde la app.

## FASE 2: Crear servicio de autenticación

### Objetivo

Centralizar las llamadas a Firebase Auth en un servicio propio de la app.

- [ ] Crear un servicio de autenticación con nombre PascalCase.
- [ ] Implementar registro con correo y contraseña.
- [ ] Implementar inicio de sesión con correo y contraseña.
- [ ] Implementar cierre de sesión.
- [ ] Implementar envío de correo para recuperar contraseña.
- [ ] Implementar observador de sesión usando Firebase Auth.
- [ ] Normalizar errores de Firebase Auth a mensajes claros en español.
- [ ] Evitar que componentes importen Firebase Auth directamente.

## FASE 3: Crear UsuarioStore

### Objetivo

Crear el store global que represente el estado real del usuario autenticado.

- [ ] Crear `UsuarioStore` con estado de usuario, carga, error y sesión iniciada.
- [ ] Exponer `usuarioId`, `email`, `nombre`, `foto`, `estaAutenticado` y `cargandoSesion`.
- [ ] Crear acción para inicializar escucha de sesión.
- [ ] Crear acción para registrar usuario.
- [ ] Crear acción para iniciar sesión.
- [ ] Crear acción para cerrar sesión.
- [ ] Crear acción para recuperar contraseña.
- [ ] Conectar cambios de sesión con `UsuarioActualService`.
- [ ] Restaurar usuario local legacy al cerrar sesión si hace falta mantener compatibilidad temporal.

## FASE 4: Crear pantalla de acceso

### Objetivo

Agregar una vista clara para que el usuario pueda entrar, registrarse o recuperar su contraseña.

- [ ] Crear página de autenticación con nombre PascalCase.
- [ ] Agregar formulario de inicio de sesión con correo y contraseña.
- [ ] Agregar formulario de registro con correo y contraseña.
- [ ] Agregar acción para recuperación de contraseña.
- [ ] Validar campos obligatorios antes de llamar al servicio.
- [ ] Mostrar estados de carga en botones.
- [ ] Mostrar errores de forma visible y no técnica.
- [ ] Mantener diseño consistente con Quasar y variables CSS existentes.

## FASE 5: Integrar rutas y acceso obligatorio

### Objetivo

Hacer que la app use cuenta de usuario sin romper la carga inicial ni los datos locales.

- [ ] Agregar ruta de autenticación.
- [ ] Inicializar `UsuarioStore` al arrancar la app.
- [ ] Definir qué rutas requieren usuario autenticado.
- [ ] Redirigir a login cuando no haya sesión y la ruta sea privada.
- [ ] Redirigir fuera del login cuando el usuario ya tenga sesión.
- [ ] Evitar bucles de navegación mientras `cargandoSesion` está activo.
- [ ] Verificar que después de iniciar sesión se puede entrar a las vistas principales.
- [ ] Mantener datos locales visibles después del login hasta que exista plan de migración.

## FASE 6: Agregar logout y estado de usuario

### Objetivo

Permitir al usuario cerrar sesión y ver el estado básico de su cuenta.

- [ ] Agregar opción de cerrar sesión en la zona de configuración o menú correspondiente.
- [ ] Mostrar correo del usuario autenticado donde sea útil.
- [ ] Confirmar logout si puede afectar el acceso a la app.
- [ ] Limpiar estado reactivo de usuario al cerrar sesión.
- [ ] No borrar datos locales al cerrar sesión en este plan.
- [ ] Documentar que la limpieza/migración de datos queda para un plan posterior.

## FASE 7: Preparar Google Sign-In sin implementarlo

### Objetivo

Dejar anotado lo necesario para sumar Google más adelante sin mezclarlo con el primer flujo de Auth.

- [ ] Revisar requisitos de Google Sign-In en web.
- [ ] Revisar requisitos de Google Sign-In en Android con SHA-1.
- [ ] Documentar que Google Sign-In queda fuera de este plan.
- [ ] Confirmar que email y contraseña funcionan antes de sumar proveedores externos.

## FASE 8: Actualizar documentación del avance

### Objetivo

Dejar el estado del trabajo claro para continuar con Firestore privado después.

- [ ] Actualizar el plan con resultado de ejecución.
- [ ] Actualizar `DatosLocalesProyectos.md` si se crean usuarios de prueba o cambia configuración Auth.
- [ ] Actualizar resumen correspondiente si el proyecto mantiene resumen por etapa.
- [ ] Registrar cualquier decisión pendiente para el plan de Firestore privado.

## FASE TESTING

### Objetivo

Validar que la autenticación real funciona sin romper el almacenamiento local actual.

- [ ] Ejecutar `npm run lint`.
- [ ] Ejecutar `npm run build`.
- [ ] Abrir la app en navegador con sesión cerrada y verificar que redirige a login cuando corresponde.
- [ ] Registrar un usuario nuevo con correo y contraseña válidos.
- [ ] Intentar registrar con correo inválido y verificar mensaje claro.
- [ ] Iniciar sesión con credenciales correctas.
- [ ] Intentar iniciar sesión con contraseña incorrecta y verificar mensaje claro.
- [ ] Recargar la página y verificar que la sesión persiste.
- [ ] Cerrar sesión y verificar que se limpia el estado de usuario.
- [ ] Verificar que los datos locales existentes no se borran.
- [ ] Verificar que productos, comercios, listas y preferencias no se escriben en Firestore todavía.
- [ ] Probar el flujo en Android cuando corresponda.

## Progreso del plan

- [ ] Fase 1: Revisar base Firebase disponible
- [ ] Fase 2: Crear servicio de autenticación
- [ ] Fase 3: Crear UsuarioStore
- [ ] Fase 4: Crear pantalla de acceso
- [ ] Fase 5: Integrar rutas y acceso obligatorio
- [ ] Fase 6: Agregar logout y estado de usuario
- [ ] Fase 7: Preparar Google Sign-In sin implementarlo
- [ ] Fase 8: Actualizar documentación del avance
- [ ] Fase Testing

Fecha de creación: 19 de Mayo 2026
Fecha de última actualización: 19 de Mayo 2026
Estado: BORRADOR
