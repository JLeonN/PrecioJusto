# Plan Mensajes Errores Auth Firebase

## Descripción del plan

Mejorar los mensajes de autenticación Firebase para que el usuario entienda qué pasó y qué puede hacer en los flujos de ingresar, crear cuenta y recuperar contraseña. Este plan no agrega inicio con Google; Google Login queda fuera de alcance y se evaluará en un plan futuro separado.

## Objetivo principal

- Mostrar errores claros, accionables y seguros en español.
- Validar campos básicos antes de llamar a Firebase.
- Agregar estados visibles de carga: `Ingresando…`, `Creando cuenta…` y `Enviando…`.
- Mejorar la explicación del flujo de recuperación de contraseña.

## Reglas del plan

- No agregar Google Login en este plan.
- No mostrar detalles técnicos de Firebase al usuario final.
- No revelar si una contraseña es corta; usar un mensaje general de requisitos.
- No cambiar la configuración Firebase de producción.
- No tocar reglas Firestore, datos guardados ni migraciones.
- Mantener textos naturales en español y consistentes con la app móvil.

## FASE 1: Auditar autenticación actual

### Objetivo

Identificar dónde se capturan y muestran los errores actuales de Firebase Auth.

- [x] Revisar `AutenticacionPage.vue` o la pantalla real de acceso.
- [x] Revisar `AutenticacionFirebaseService.js` y servicios relacionados.
- [x] Identificar cómo se muestran hoy errores de ingresar, crear cuenta y recuperar contraseña.
- [x] Confirmar si ya existe lógica para validar correo, contraseña y confirmación.
- [x] Confirmar si los botones ya tienen estado de carga o si hay que agregarlos.

## FASE 2: Centralizar mensajes Firebase Auth

### Objetivo

Crear una capa única para traducir errores de Firebase Auth a mensajes seguros en español.

- [x] Crear un helper o servicio con nombre en español, por ejemplo `MensajesErroresFirebaseAuth.js`.
- [x] Agregar una función que reciba el error original y devuelva un mensaje para usuario final.
- [x] Cubrir correo inválido o incompleto con `Revisá el correo. Parece incompleto.`
- [x] Cubrir correo o contraseña incorrectos con `El correo o la contraseña no coinciden.`
- [x] Cubrir cuenta no encontrada con `No encontramos una cuenta con ese correo. Podés crear una cuenta nueva.`
- [x] Cubrir cuenta ya existente con `Ya existe una cuenta con ese correo. Iniciá sesión o recuperá tu contraseña.`
- [x] Cubrir demasiados intentos con `Hubo demasiados intentos. Esperá un momento y probá de nuevo.`
- [x] Cubrir falta de conexión con `No hay conexión. Necesitás internet para ingresar o crear una cuenta.`
- [x] Cubrir contraseña no válida con `La contraseña no cumple los requisitos.`
- [x] Agregar mensaje genérico final para errores no contemplados.

## FASE 3: Validar campos antes de Firebase

### Objetivo

Evitar llamadas innecesarias a Firebase cuando el formulario está incompleto o claramente mal escrito.

- [x] Validar correo vacío en ingresar, crear cuenta y recuperar contraseña.
- [x] Mostrar `Ingresá tu correo.` cuando falte el correo.
- [x] Validar formato básico de correo antes de llamar a Firebase.
- [x] Mostrar `Revisá el correo. Parece incompleto.` si el correo no tiene formato válido.
- [x] Validar contraseña vacía en ingresar.
- [x] Mostrar `Ingresá tu contraseña.` cuando falte la contraseña.
- [x] Validar contraseña vacía en crear cuenta.
- [x] Validar confirmación de contraseña vacía si el formulario la usa.
- [x] Mostrar `Las contraseñas no coinciden.` cuando contraseña y confirmación sean distintas.

## FASE 4: Mejorar estados de carga

### Objetivo

Mostrar al usuario que la app está trabajando mientras Firebase responde.

- [x] Mostrar `Ingresando…` mientras se ejecuta el login.
- [x] Mostrar `Creando cuenta…` mientras se registra un usuario nuevo.
- [x] Mostrar `Enviando…` mientras se solicita recuperación de contraseña.
- [x] Deshabilitar el botón activo mientras la operación está en curso.
- [x] Evitar doble envío por taps repetidos.
- [x] Mantener accesibles las pestañas o acciones que no rompan el flujo.

## FASE 5: Mejorar recuperar contraseña

### Objetivo

Explicar con claridad qué debe hacer el usuario para recuperar el acceso.

- [x] Agregar texto explicativo en la pestaña de recuperar contraseña.
- [x] Usar un texto similar a `Ingresá tu correo y te enviaremos un enlace para recuperar el acceso.`
- [x] Mostrar éxito con `Te enviamos un correo para recuperar el acceso. Revisá tu bandeja de entrada.`
- [x] Mantener el flujo simple: correo, enviar, confirmación.
- [x] Validar que no se muestre información técnica del error.

## FASE 6: Integrar mensajes en la pantalla

### Objetivo

Conectar validaciones y mensajes centralizados con los tres flujos de autenticación.

- [x] Usar el traductor de errores en el flujo de ingresar.
- [x] Usar el traductor de errores en el flujo de crear cuenta.
- [x] Usar el traductor de errores en el flujo de recuperar contraseña.
- [x] Evitar duplicar textos entre componente y servicio.
- [ ] Confirmar que los mensajes quedan visibles y no se cortan en celular.
- [ ] Confirmar que los mensajes respetan modo claro y modo oscuro.

## FASE TESTING

### Objetivo

Validar de forma ejecutable por IA y revisable por Leo que los mensajes de Auth quedaron claros y seguros.

- [x] Ejecutar `npm run lint`.
- [x] Ejecutar `npm run build`.
- [ ] Probar ingreso con correo vacío.
- [ ] Probar ingreso con correo incompleto.
- [ ] Probar ingreso con contraseña vacía.
- [ ] Probar ingreso con credenciales incorrectas.
- [ ] Probar crear cuenta con correo vacío.
- [ ] Probar crear cuenta con correo incompleto.
- [ ] Probar crear cuenta con contraseñas distintas.
- [ ] Probar crear cuenta con una cuenta ya existente.
- [ ] Probar recuperar contraseña con correo vacío.
- [ ] Probar recuperar contraseña con correo incompleto.
- [ ] Probar recuperar contraseña con correo válido.
- [ ] Verificar que aparecen `Ingresando…`, `Creando cuenta…` y `Enviando…` durante cada operación.
- [x] Verificar que no se muestra Google Login.
- [x] Verificar que no se muestran códigos técnicos de Firebase al usuario.
- [ ] Verificar visualmente en modo claro y modo oscuro.

## Progreso del plan

- [x] Fase 1: Auditar autenticación actual
- [x] Fase 2: Centralizar mensajes Firebase Auth
- [x] Fase 3: Validar campos antes de Firebase
- [x] Fase 4: Mejorar estados de carga
- [x] Fase 5: Mejorar recuperar contraseña
- [ ] Fase 6: Integrar mensajes en la pantalla
- [ ] Fase Testing

Fecha de creación: 26 de junio 2026
Fecha de última actualización: 26 de junio 2026
Estado: EN PROCESO
