# Plan Configuración Acordeón Perfil Firebase

## Descripción del plan

Rediseñar la pantalla de Configuración para que deje de mostrar información técnica de Firebase de forma directa y pase a estar organizada en paneles desplegables cerrados por defecto. La pantalla debe ser más clara para el usuario normal, conservar herramientas útiles de prueba y agregar un perfil de usuario editable guardado en Firebase.

## Objetivo principal

- Convertir Configuración en una pantalla por acordeones cerrados por defecto.
- Agregar un panel de Cuenta con perfil editable guardado en Firebase.
- Reordenar Apariencia, Moneda, Datos y sincronización, y Herramientas de prueba.
- Reducir lenguaje técnico visible para el usuario normal.
- Mantener las herramientas Firebase disponibles para pruebas sin ocupar la pantalla principal.

## Reglas del plan

- No borrar herramientas Firebase de diagnóstico mientras la app siga en etapa de pruebas.
- No mostrar datos técnicos de Firestore como contenido principal de Configuración.
- Guardar el perfil de usuario en Firebase bajo `usuarios/{usuarioId}/configuracion/perfil`.
- La fecha de nacimiento debe ser opcional.
- Todos los paneles deben iniciar cerrados por defecto.
- Mantener el diseño coherente con Quasar y con el estilo actual de la app.
- No reactivar fotos ni agregar dependencias pagas.

## FASE 1: Revisar configuración actual

### Objetivo

Entender la estructura real de `ConfiguracionPage.vue` y los servicios actuales antes de rediseñar.

- [x] Revisar `src/pages/ConfiguracionPage.vue`.
- [x] Identificar los bloques actuales de cuenta, tema, moneda, fuente de datos y migración.
- [x] Revisar cómo se guardan hoy las preferencias en `PreferenciasService` y `FirestorePreferenciasService`.
- [x] Revisar `UsuarioStore` y `UsuarioActualService` para integrar el perfil sin duplicar responsabilidades.
- [x] Confirmar que no haya escrituras directas a Firebase desde la UI.

## FASE 2: Crear estructura de acordeones

### Objetivo

Reorganizar la pantalla en paneles desplegables cerrados por defecto.

- [x] Mantener el título principal `Configuración`.
- [x] Quitar el texto `Preferencias globales de la app` o cualquier subtítulo equivalente.
- [x] Crear panel `Cuenta` como primer acordeón.
- [x] Crear panel `Apariencia`.
- [x] Crear panel `Moneda`.
- [x] Crear panel `Datos y sincronización`.
- [x] Crear panel `Herramientas de prueba`.
- [x] Asegurar que todos los paneles estén cerrados al entrar a la pantalla.
- [x] Mostrar en cada encabezado un resumen corto del estado actual cuando aporte claridad.

## FASE 3: Agregar perfil Firebase

### Objetivo

Permitir editar datos básicos del perfil y guardarlos en Firebase.

- [x] Crear el modelo de perfil con `usuarioId`, `nombreUsuario`, `fechaNacimiento` y `fechaActualizacion`.
- [x] Crear un service Firestore para perfil si no existe una capa adecuada.
- [x] Usar la ruta `usuarios/{usuarioId}/configuracion/perfil`.
- [x] Agregar carga de perfil al abrir el panel `Cuenta` o al hidratar la sesión.
- [x] Agregar edición de `nombreUsuario`.
- [x] Agregar edición opcional de `fechaNacimiento`.
- [x] Guardar cambios en Firebase con validación básica.
- [x] Mostrar estado de guardado o error de forma simple.
- [x] Mantener el correo de la cuenta visible, pero no editable desde este panel.
- [x] Mantener cierre de sesión dentro del panel `Cuenta`.
- [x] Si no hay sesión, mostrar una acción clara para iniciar sesión.

## FASE 4: Rediseñar Apariencia

### Objetivo

Convertir el bloque de tema en un panel simple y entendible.

- [x] Renombrar el bloque actual de modo oscuro a `Apariencia`.
- [x] Mostrar resumen en el encabezado, por ejemplo `Actual: Según el sistema`.
- [x] Mantener opciones `Claro`, `Oscuro` y `Según el sistema`.
- [x] Reescribir el texto explicativo para que sea más humano.
- [x] Guardar la elección usando el flujo actual de preferencias.
- [x] Confirmar que el tema se aplica al instante.
- [ ] Confirmar que el tema queda guardado en Firestore.

## FASE 5: Rediseñar Moneda

### Objetivo

Dejar la configuración de moneda agrupada y con explicación clara.

- [x] Crear encabezado con resumen de moneda actual.
- [x] Mantener opción automática y manual.
- [x] Mantener selector de moneda manual.
- [x] Mover el aviso `Importante` dentro del panel de Moneda.
- [x] Reescribir el aviso para explicar que cambiar moneda no modifica precios ya guardados.
- [x] Guardar cambios con el flujo actual de preferencias.
- [ ] Confirmar que modo de moneda y moneda manual quedan guardados en Firestore.

## FASE 6: Simplificar Datos y sincronización

### Objetivo

Mostrar al usuario solo información útil sobre sus datos sin exponer detalles técnicos innecesarios.

- [x] Crear un panel `Datos y sincronización` con lenguaje de usuario.
- [x] Explicar que los datos se guardan en la cuenta cuando hay sesión iniciada.
- [x] Mostrar un estado simple de sincronización si existe información suficiente.
- [x] Evaluar si conviene mostrar `Actualizar estado` en este panel o moverlo a herramientas de prueba.
- [x] Evaluar si `Crear copia de seguridad` debe quedar visible para usuario o solo para pruebas.
- [x] Evaluar si `Pasar datos de este dispositivo a mi cuenta` reemplaza al texto técnico `Migrar`.
- [x] Evitar palabras técnicas como `Firestore`, `fuente de datos`, `sinIniciar` o `migración` en este panel.
- [x] Mantener cualquier acción delicada con confirmación clara.

## FASE 7: Separar Herramientas de prueba

### Objetivo

Mover toda la información técnica de Firebase a un panel cerrado y claramente marcado como herramienta de prueba.

- [x] Crear panel `Herramientas de prueba`.
- [x] Mover aquí el bloque actual de `Fuente de datos`.
- [x] Mover aquí los conteos técnicos de migración local.
- [x] Mover aquí estados técnicos como `sinIniciar`, `local`, `Firestore`, `pendiente` o `error`.
- [x] Mover aquí botones técnicos que no sean necesarios para usuario normal.
- [x] Agregar texto breve: `Información técnica para revisar sincronización mientras probás la app.`
- [x] Mantener el panel cerrado por defecto.
- [x] No ocultarlo por modo desarrollo todavía, salvo que durante la implementación se vea necesario.

## FASE 8: Actualizar documentación

### Objetivo

Dejar registrado el cambio para que una IA futura entienda el nuevo flujo.

- [x] Revisar si `Resumen11Firebase.md` necesita una nota breve sobre perfil Firebase.
- [x] Revisar si `ManualFirebaseGratis.md` necesita mencionar el patrón de perfil de usuario.
- [x] Documentar la ruta `usuarios/{usuarioId}/configuracion/perfil` si se agrega.
- [x] No editar documentación si el cambio queda autoexplicado en el plan y el código.

## FASE TESTING

### Objetivo

Validar que la nueva configuración sea clara, funcional y segura para Firebase.

- [x] Ejecutar `npm run lint`.
- [x] Ejecutar `npm run build`.
- [x] Abrir Configuración y confirmar que todos los paneles empiezan cerrados.
- [x] Abrir `Cuenta` y confirmar que muestra correo, nombre, fecha opcional y acciones de sesión.
- [x] Guardar nombre de usuario y confirmar que se escribe en Firebase.
- [x] Guardar fecha de nacimiento opcional y confirmar que se escribe en Firebase.
- [ ] Cerrar sesión y confirmar que la app no muestra datos privados del usuario anterior.
- [x] Recargar Configuración con sesión activa y confirmar que el perfil se carga desde Firebase.
- [ ] Cambiar Apariencia y confirmar que se aplica y se guarda en Firestore.
- [ ] Cambiar Moneda y confirmar que se guarda en Firestore.
- [x] Revisar que `Datos y sincronización` no muestre lenguaje técnico innecesario.
- [x] Revisar que `Herramientas de prueba` conserve la información técnica útil.
- [x] Probar en navegador con una cuenta real.
- [ ] Probar en Android si el cambio visual queda aprobado.
- [ ] Verificar que usuario A no pueda leer el perfil de usuario B.

## Progreso del plan

- [x] Fase 1: Revisar configuración actual
- [x] Fase 2: Crear estructura de acordeones
- [x] Fase 3: Agregar perfil Firebase
- [ ] Fase 4: Rediseñar Apariencia
- [ ] Fase 5: Rediseñar Moneda
- [x] Fase 6: Simplificar Datos y sincronización
- [x] Fase 7: Separar Herramientas de prueba
- [x] Fase 8: Actualizar documentación
- [ ] Fase Testing

Fecha de creación: 23 de junio 2026
Fecha de última actualización: 23 de junio 2026
Estado: EN PROCESO
