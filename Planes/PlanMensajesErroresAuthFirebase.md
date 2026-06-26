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

- [ ] Revisar `AutenticacionPage.vue` o la pantalla real de acceso.
- [ ] Revisar `AutenticacionFirebaseService.js` y servicios relacionados.
- [ ] Identificar cómo se muestran hoy errores de ingresar, crear cuenta y recuperar contraseña.
- [ ] Confirmar si ya existe lógica para validar correo, contraseña y confirmación.
- [ ] Confirmar si los botones ya tienen estado de carga o si hay que agregarlos.

## FASE 2: Centralizar mensajes Firebase Auth

### Objetivo

Crear una capa única para traducir errores de Firebase Auth a mensajes seguros en español.

- [ ] Crear un helper o servicio con nombre en español, por ejemplo `MensajesErroresFirebaseAuth.js`.
- [ ] Agregar una función que reciba el error original y devuelva un mensaje para usuario final.
- [ ] Cubrir correo inválido o incompleto con `Revisá el correo. Parece incompleto.`
- [ ] Cubrir correo o contraseña incorrectos con `El correo o la contraseña no coinciden.`
- [ ] Cubrir cuenta no encontrada con `No encontramos una cuenta con ese correo. Podés crear una cuenta nueva.`
- [ ] Cubrir cuenta ya existente con `Ya existe una cuenta con ese correo. Iniciá sesión o recuperá tu contraseña.`
- [ ] Cubrir demasiados intentos con `Hubo demasiados intentos. Esperá un momento y probá de nuevo.`
- [ ] Cubrir falta de conexión con `No hay conexión. Necesitás internet para ingresar o crear una cuenta.`
- [ ] Cubrir contraseña no válida con `La contraseña no cumple los requisitos.`
- [ ] Agregar mensaje genérico final para errores no contemplados.

## FASE 3: Validar campos antes de Firebase

### Objetivo

Evitar llamadas innecesarias a Firebase cuando el formulario está incompleto o claramente mal escrito.

- [ ] Validar correo vacío en ingresar, crear cuenta y recuperar contraseña.
- [ ] Mostrar `Ingresá tu correo.` cuando falte el correo.
- [ ] Validar formato básico de correo antes de llamar a Firebase.
- [ ] Mostrar `Revisá el correo. Parece incompleto.` si el correo no tiene formato válido.
- [ ] Validar contraseña vacía en ingresar.
- [ ] Mostrar `Ingresá tu contraseña.` cuando falte la contraseña.
- [ ] Validar contraseña vacía en crear cuenta.
- [ ] Validar confirmación de contraseña vacía si el formulario la usa.
- [ ] Mostrar `Las contraseñas no coinciden.` cuando contraseña y confirmación sean distintas.

## FASE 4: Mejorar estados de carga

### Objetivo

Mostrar al usuario que la app está trabajando mientras Firebase responde.

- [ ] Mostrar `Ingresando…` mientras se ejecuta el login.
- [ ] Mostrar `Creando cuenta…` mientras se registra un usuario nuevo.
- [ ] Mostrar `Enviando…` mientras se solicita recuperación de contraseña.
- [ ] Deshabilitar el botón activo mientras la operación está en curso.
- [ ] Evitar doble envío por taps repetidos.
- [ ] Mantener accesibles las pestañas o acciones que no rompan el flujo.

## FASE 5: Mejorar recuperar contraseña

### Objetivo

Explicar con claridad qué debe hacer el usuario para recuperar el acceso.

- [ ] Agregar texto explicativo en la pestaña de recuperar contraseña.
- [ ] Usar un texto similar a `Ingresá tu correo y te enviaremos un enlace para recuperar el acceso.`
- [ ] Mostrar éxito con `Te enviamos un correo para recuperar el acceso. Revisá tu bandeja de entrada.`
- [ ] Mantener el flujo simple: correo, enviar, confirmación.
- [ ] Validar que no se muestre información técnica del error.

## FASE 6: Integrar mensajes en la pantalla

### Objetivo

Conectar validaciones y mensajes centralizados con los tres flujos de autenticación.

- [ ] Usar el traductor de errores en el flujo de ingresar.
- [ ] Usar el traductor de errores en el flujo de crear cuenta.
- [ ] Usar el traductor de errores en el flujo de recuperar contraseña.
- [ ] Evitar duplicar textos entre componente y servicio.
- [ ] Confirmar que los mensajes quedan visibles y no se cortan en celular.
- [ ] Confirmar que los mensajes respetan modo claro y modo oscuro.

## FASE TESTING

### Objetivo

Validar de forma ejecutable por IA y revisable por Leo que los mensajes de Auth quedaron claros y seguros.

- [ ] Ejecutar `npm run lint`.
- [ ] Ejecutar `npm run build`.
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
- [ ] Verificar que no se muestra Google Login.
- [ ] Verificar que no se muestran códigos técnicos de Firebase al usuario.
- [ ] Verificar visualmente en modo claro y modo oscuro.

## Progreso del plan

- [ ] Fase 1: Auditar autenticación actual
- [ ] Fase 2: Centralizar mensajes Firebase Auth
- [ ] Fase 3: Validar campos antes de Firebase
- [ ] Fase 4: Mejorar estados de carga
- [ ] Fase 5: Mejorar recuperar contraseña
- [ ] Fase 6: Integrar mensajes en la pantalla
- [ ] Fase Testing

Fecha de creación: 26 de junio 2026
Fecha de última actualización: 26 de junio 2026
Estado: BORRADOR
