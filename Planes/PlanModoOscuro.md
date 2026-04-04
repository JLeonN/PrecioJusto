# PLAN MODO OSCURO REUTILIZABLE

## Descripcion del plan

Implementar un sistema de modo oscuro global para la app con tres estados de preferencia: `claro`, `oscuro` y `seguir sistema`. La solucion debe integrarse con la pantalla de Configuración, persistir la elección del usuario en la capa de almacenamiento existente, reaccionar si el sistema cambia mientras la app está abierta cuando el modo sea automático, mostrar publicidad con el mismo patrón funcional que `Moneda predeterminada` y dejar una base reutilizable para futuras páginas, componentes y funciones.

## Objetivo principal

- Agregar una preferencia global de tema con tres estados y persistencia real
- Integrar la configuración del tema en la pantalla de Configuración con una UI clara, linda y consistente con la app
- Aplicar el modo oscuro de forma transversal en colores globales, tarjetas, diálogos, inputs, banners y publicidad
- Dejar reglas reutilizables para que futuras pantallas adopten el tema sin rehacer lógica visual

## Reglas del plan

- Mantener el patrón arquitectónico actual de `ConfiguracionPage.vue`, `preferenciasStore.js` y la capa de almacenamiento ya existente
- Usar `src/css/Variables.css` como base central del sistema de temas y evitar repartir colores del tema en archivos paralelos sin necesidad real
- No resolver el modo oscuro con colores hardcodeados por pantalla si ya existe una variable o token reutilizable
- La lógica de preferencia debe soportar exactamente tres estados: `claro`, `oscuro` y `sistema`
- Si el usuario elige `claro` u `oscuro`, esa elección sobrescribe al sistema hasta que vuelva a seleccionar `seguir sistema`
- Si el usuario elige `seguir sistema`, la app debe reflejar el tema del dispositivo y reaccionar a cambios del sistema mientras la app siga abierta
- La publicidad del apartado debe seguir el mismo patrón funcional de `Moneda predeterminada`, adaptada a la UI de tres opciones
- Mantener los tres colores principales de la app como identidad visual, permitiendo variantes suavizadas en modo oscuro si hace falta para armonía y contraste
- Revisar explícitamente textos blancos, negros o de color fijo para evitar combinaciones ilegibles entre fondo y contenido
- Todo texto, nombres y comentarios nuevos deben mantenerse en español y consistentes con el proyecto

## FASE 1: Definir la preferencia de tema y su persistencia

### Objetivo

Dejar resuelto el modelo de datos del modo oscuro y su persistencia sobre la infraestructura actual de preferencias.

- [ ] Identificar en la capa de preferencias la forma correcta de agregar una nueva preferencia global de tema sin romper compatibilidad
- [ ] Definir la clave persistente y el valor permitido para el tema: `claro`, `oscuro` y `sistema`
- [ ] Extender el servicio y store de preferencias para leer, guardar y exponer el modo de tema actual
- [ ] Garantizar un valor inicial predecible cuando todavía no exista preferencia guardada
- [ ] Dejar claro en la implementación qué valor representa preferencia manual y qué valor representa seguimiento del sistema

## FASE 2: Conectar el tema con Quasar y la deteccion del sistema

### Objetivo

Hacer que la preferencia elegida gobierne el tema efectivo de la app y que el modo `seguir sistema` responda a cambios del dispositivo.

- [ ] Integrar el modo de tema con la API oficial de dark mode de Quasar
- [ ] Resolver el tema efectivo según esta prioridad: preferencia manual del usuario o sistema si el modo es `sistema`
- [ ] Implementar la detección del tema del sistema de forma reactiva mientras la app está abierta
- [ ] Asegurar que el tema correcto se aplique al iniciar la app antes de que la interfaz quede inconsistente
- [ ] Verificar que el comportamiento sea coherente tanto en web como en entorno móvil con Capacitor

## FASE 3: Crear el apartado de Configuración para modo oscuro

### Objetivo

Agregar un bloque nuevo en Configuración que permita elegir entre las tres opciones con una presentación prolija y clara.

- [ ] Revisar el patrón visual y funcional actual del bloque `Moneda predeterminada` para reutilizar la misma lógica de interacción
- [ ] Diseñar un apartado nuevo de `Modo oscuro` con una UI simple pero visualmente cuidada
- [ ] Mostrar las tres opciones `Claro`, `Oscuro` y `Seguir sistema` de forma comprensible y fácil de tocar en móvil
- [ ] Reflejar siempre en pantalla cuál es la preferencia guardada y cuál es el tema efectivo aplicado
- [ ] Disparar publicidad al interactuar con cualquiera de las tres opciones, respetando el mismo patrón funcional del apartado de moneda

## FASE 4: Aplicar el sistema visual reutilizable en toda la app

### Objetivo

Convertir el modo oscuro en una base reutilizable para vistas actuales y futuras sin depender de parches puntuales.

- [ ] Revisar las variables de color existentes en `src/css/Variables.css` y definir si alcanzan o si hace falta agregar tokens semánticos reutilizables para claro y oscuro
- [ ] Mantener los tres colores principales de marca y definir variantes adaptadas para modo oscuro si el contraste o la armonía visual lo exigen
- [ ] Adaptar estilos globales para fondo, superficie, texto, bordes y estados interactivos
- [ ] Ajustar tarjetas, diálogos, inputs, banners y bloques de publicidad para que respondan correctamente al tema efectivo
- [ ] Identificar textos blancos, negros o con color fijo y migrarlos a variables semánticas para evitar errores de legibilidad
- [ ] Detectar componentes o páginas que hoy dependan de colores fijos y migrarlos a una base compatible con tema
- [ ] Dejar una regla clara para que nuevas páginas usen el sistema de tema sin inventar estilos paralelos

## FASE 5: Endurecer compatibilidad y mantenimiento futuro

### Objetivo

Reducir deuda técnica y dejar el modo oscuro preparado para crecimiento futuro del proyecto.

- [ ] Revisar si conviene centralizar helpers o composables para consultar el tema actual y evitar duplicación
- [ ] Confirmar que la inicialización del tema no genere parpadeos visuales ni estados cruzados al montar la app
- [ ] Verificar que la preferencia persista correctamente entre reinicios y cambios de plataforma
- [ ] Dejar documentado en el código el criterio de uso para futuras pantallas y nuevos componentes
- [ ] Evitar que futuras funciones queden atadas a colores directos difíciles de mantener

## FASE TESTING

### Objetivo

Validar que el comportamiento del modo oscuro sea correcto, persistente, reactivo y consistente en la interfaz.

- [ ] Iniciar la app sin preferencia previa y verificar cuál es el tema aplicado por defecto
- [ ] Seleccionar `Claro`, reiniciar la app y verificar que la preferencia manual se mantenga
- [ ] Seleccionar `Oscuro`, reiniciar la app y verificar que la preferencia manual se mantenga
- [ ] Seleccionar `Seguir sistema` y verificar que la app tome el tema actual del dispositivo
- [ ] Cambiar el tema del sistema con la app abierta y verificar que la app reaccione solo cuando la preferencia sea `Seguir sistema`
- [ ] Cambiar manualmente entre las tres opciones desde Configuración y verificar que la UI refleje siempre la preferencia guardada y el tema efectivo
- [ ] Verificar que la publicidad se dispare con el mismo criterio funcional definido para este apartado
- [ ] Recorrer tarjetas, diálogos, inputs, banners y páginas principales para detectar contrastes pobres, fondos incorrectos o textos ilegibles
- [ ] Revisar casos con texto blanco, negro o colores fijos para confirmar que no queden bloques invisibles o con contraste insuficiente
- [ ] Validar que futuras páginas puedan adoptar el sistema usando variables y reglas comunes sin rehacer lógica del tema

## Progreso del plan

- [ ] Fase 1: Definir la preferencia de tema y su persistencia
- [ ] Fase 2: Conectar el tema con Quasar y la deteccion del sistema
- [ ] Fase 3: Crear el apartado de Configuración para modo oscuro
- [ ] Fase 4: Aplicar el sistema visual reutilizable en toda la app
- [ ] Fase 5: Endurecer compatibilidad y mantenimiento futuro
- [ ] Fase Testing

Fecha de creacion: 04 de Abril 2026
Fecha de ultima actualizacion: 04 de Abril 2026
Estado: BORRADOR
