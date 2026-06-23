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

- [ ] Revisar `src/pages/ConfiguracionPage.vue`.
- [ ] Identificar los bloques actuales de cuenta, tema, moneda, fuente de datos y migración.
- [ ] Revisar cómo se guardan hoy las preferencias en `PreferenciasService` y `FirestorePreferenciasService`.
- [ ] Revisar `UsuarioStore` y `UsuarioActualService` para integrar el perfil sin duplicar responsabilidades.
- [ ] Confirmar que no haya escrituras directas a Firebase desde la UI.

## FASE 2: Crear estructura de acordeones

### Objetivo

Reorganizar la pantalla en paneles desplegables cerrados por defecto.

- [ ] Mantener el título principal `Configuración`.
- [ ] Quitar el texto `Preferencias globales de la app` o cualquier subtítulo equivalente.
- [ ] Crear panel `Cuenta` como primer acordeón.
- [ ] Crear panel `Apariencia`.
- [ ] Crear panel `Moneda`.
- [ ] Crear panel `Datos y sincronización`.
- [ ] Crear panel `Herramientas de prueba`.
- [ ] Asegurar que todos los paneles estén cerrados al entrar a la pantalla.
- [ ] Mostrar en cada encabezado un resumen corto del estado actual cuando aporte claridad.

## FASE 3: Agregar perfil Firebase

### Objetivo

Permitir editar datos básicos del perfil y guardarlos en Firebase.

- [ ] Crear el modelo de perfil con `usuarioId`, `nombreUsuario`, `fechaNacimiento` y `fechaActualizacion`.
- [ ] Crear un service Firestore para perfil si no existe una capa adecuada.
- [ ] Usar la ruta `usuarios/{usuarioId}/configuracion/perfil`.
- [ ] Agregar carga de perfil al abrir el panel `Cuenta` o al hidratar la sesión.
- [ ] Agregar edición de `nombreUsuario`.
- [ ] Agregar edición opcional de `fechaNacimiento`.
- [ ] Guardar cambios en Firebase con validación básica.
- [ ] Mostrar estado de guardado o error de forma simple.
- [ ] Mantener el correo de la cuenta visible, pero no editable desde este panel.
- [ ] Mantener cierre de sesión dentro del panel `Cuenta`.
- [ ] Si no hay sesión, mostrar una acción clara para iniciar sesión.

## FASE 4: Rediseñar Apariencia

### Objetivo

Convertir el bloque de tema en un panel simple y entendible.

- [ ] Renombrar el bloque actual de modo oscuro a `Apariencia`.
- [ ] Mostrar resumen en el encabezado, por ejemplo `Actual: Según el sistema`.
- [ ] Mantener opciones `Claro`, `Oscuro` y `Según el sistema`.
- [ ] Reescribir el texto explicativo para que sea más humano.
- [ ] Guardar la elección usando el flujo actual de preferencias.
- [ ] Confirmar que el tema se aplica al instante.
- [ ] Confirmar que el tema queda guardado en Firestore.

## FASE 5: Rediseñar Moneda

### Objetivo

Dejar la configuración de moneda agrupada y con explicación clara.

- [ ] Crear encabezado con resumen de moneda actual.
- [ ] Mantener opción automática y manual.
- [ ] Mantener selector de moneda manual.
- [ ] Mover el aviso `Importante` dentro del panel de Moneda.
- [ ] Reescribir el aviso para explicar que cambiar moneda no modifica precios ya guardados.
- [ ] Guardar cambios con el flujo actual de preferencias.
- [ ] Confirmar que modo de moneda y moneda manual quedan guardados en Firestore.

## FASE 6: Simplificar Datos y sincronización

### Objetivo

Mostrar al usuario solo información útil sobre sus datos sin exponer detalles técnicos innecesarios.

- [ ] Crear un panel `Datos y sincronización` con lenguaje de usuario.
- [ ] Explicar que los datos se guardan en la cuenta cuando hay sesión iniciada.
- [ ] Mostrar un estado simple de sincronización si existe información suficiente.
- [ ] Evaluar si conviene mostrar `Actualizar estado` en este panel o moverlo a herramientas de prueba.
- [ ] Evaluar si `Crear copia de seguridad` debe quedar visible para usuario o solo para pruebas.
- [ ] Evaluar si `Pasar datos de este dispositivo a mi cuenta` reemplaza al texto técnico `Migrar`.
- [ ] Evitar palabras técnicas como `Firestore`, `fuente de datos`, `sinIniciar` o `migración` en este panel.
- [ ] Mantener cualquier acción delicada con confirmación clara.

## FASE 7: Separar Herramientas de prueba

### Objetivo

Mover toda la información técnica de Firebase a un panel cerrado y claramente marcado como herramienta de prueba.

- [ ] Crear panel `Herramientas de prueba`.
- [ ] Mover aquí el bloque actual de `Fuente de datos`.
- [ ] Mover aquí los conteos técnicos de migración local.
- [ ] Mover aquí estados técnicos como `sinIniciar`, `local`, `Firestore`, `pendiente` o `error`.
- [ ] Mover aquí botones técnicos que no sean necesarios para usuario normal.
- [ ] Agregar texto breve: `Información técnica para revisar sincronización mientras probás la app.`
- [ ] Mantener el panel cerrado por defecto.
- [ ] No ocultarlo por modo desarrollo todavía, salvo que durante la implementación se vea necesario.

## FASE 8: Actualizar documentación

### Objetivo

Dejar registrado el cambio para que una IA futura entienda el nuevo flujo.

- [ ] Revisar si `Resumen11Firebase.md` necesita una nota breve sobre perfil Firebase.
- [ ] Revisar si `ManualFirebaseGratis.md` necesita mencionar el patrón de perfil de usuario.
- [ ] Documentar la ruta `usuarios/{usuarioId}/configuracion/perfil` si se agrega.
- [ ] No editar documentación si el cambio queda autoexplicado en el plan y el código.

## FASE TESTING

### Objetivo

Validar que la nueva configuración sea clara, funcional y segura para Firebase.

- [ ] Ejecutar `npm run lint`.
- [ ] Ejecutar `npm run build`.
- [ ] Abrir Configuración y confirmar que todos los paneles empiezan cerrados.
- [ ] Abrir `Cuenta` y confirmar que muestra correo, nombre, fecha opcional y acciones de sesión.
- [ ] Guardar nombre de usuario y confirmar que se escribe en Firebase.
- [ ] Guardar fecha de nacimiento opcional y confirmar que se escribe en Firebase.
- [ ] Cerrar sesión y confirmar que la app no muestra datos privados del usuario anterior.
- [ ] Iniciar sesión de nuevo y confirmar que el perfil se carga desde Firebase.
- [ ] Cambiar Apariencia y confirmar que se aplica y se guarda en Firestore.
- [ ] Cambiar Moneda y confirmar que se guarda en Firestore.
- [ ] Revisar que `Datos y sincronización` no muestre lenguaje técnico innecesario.
- [ ] Revisar que `Herramientas de prueba` conserve la información técnica útil.
- [ ] Probar en navegador con una cuenta real.
- [ ] Probar en Android si el cambio visual queda aprobado.
- [ ] Verificar que usuario A no pueda leer el perfil de usuario B.

## Progreso del plan

- [ ] Fase 1: Revisar configuración actual
- [ ] Fase 2: Crear estructura de acordeones
- [ ] Fase 3: Agregar perfil Firebase
- [ ] Fase 4: Rediseñar Apariencia
- [ ] Fase 5: Rediseñar Moneda
- [ ] Fase 6: Simplificar Datos y sincronización
- [ ] Fase 7: Separar Herramientas de prueba
- [ ] Fase 8: Actualizar documentación
- [ ] Fase Testing

Fecha de creación: 23 de junio 2026
Fecha de última actualización: 23 de junio 2026
Estado: BORRADOR
