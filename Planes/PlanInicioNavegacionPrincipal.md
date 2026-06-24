# PLAN INICIO Y NAVEGACION PRINCIPAL

## Descripcion del plan

Crear una nueva pagina de inicio para Precio Justo que funcione como pantalla principal y permita navegar rapido a las secciones mas importantes de la app mediante tarjetas tipo acceso de celular. La pagina debe quedar como ruta principal por defecto y la navegacion debe integrarse con el header y el drawer sin romper el flujo actual.

## Objetivo principal

- Crear una pagina de inicio clara, visual y responsive.
- Mostrar accesos a Lista justa, Mis productos y Comercios en ese orden.
- Dejar la navegacion preparada para sumar nuevas secciones desde un array de accesos.
- Agregar accesos a Inicio en header y drawer solo cuando el usuario no esta en Inicio.

## Reglas del plan

- Usar nombres en espanol, descriptivos y consistentes con el proyecto.
- Crear archivos nuevos con PascalCase y sin guiones ni guiones bajos.
- Usar colores y espaciados desde `src/css/Variables.css` cuando aplique.
- Mantener el drawer actual y agregar Inicio sin reorganizar el resto de opciones.
- El boton de Inicio del header debe aparecer con transicion suave solo fuera de la pagina Inicio.

## FASE 1: Relevar navegacion actual

### Objetivo

Identificar como estan definidas las rutas, el layout principal, el header y el drawer para integrar Inicio respetando el patron existente.

- [x] Revisar el archivo de rutas para ubicar las paginas actuales de Lista justa, Mis productos y Comercios.
- [x] Revisar el layout principal para identificar el boton de menu hamburguesa y la estructura del header.
- [x] Revisar el drawer actual para entender como se renderizan las opciones de navegacion.
- [x] Confirmar el nombre real de las rutas que se usaran en los accesos de Inicio.

## FASE 2: Crear pagina Inicio

### Objetivo

Construir una pagina nueva que muestre accesos principales con formato de tarjetas tipo icono de celular.

- [x] Crear la pagina `InicioPage.vue` en la carpeta correspondiente de paginas.
- [x] Agregar un titulo simple para la pantalla de inicio.
- [x] Agregar la descripcion `Accedé rápido a tus listas, productos y comercios.`
- [x] Definir un array de accesos con Lista justa, Mis productos y Comercios en ese orden.
- [x] Asignar a cada acceso un icono, titulo, subtitulo y ruta.
- [x] Renderizar las tarjetas desde el array para facilitar futuras secciones.
- [x] Hacer que cada tarjeta navegue a su ruta al tocarla o hacer click.

## FASE 3: Ajustar estilo responsive

### Objetivo

Lograr que la pagina se vea bien en celular, tablet y escritorio sin que las tarjetas se estiren demasiado.

- [x] Crear una grilla responsive para las tarjetas.
- [x] Usar una columna en pantallas chicas cuando sea necesario.
- [x] Permitir dos columnas en celulares grandes o pantallas medianas si el texto entra bien.
- [x] Centrar la grilla con un ancho maximo para tablet y escritorio.
- [x] Definir una altura minima estable para que las tarjetas queden parejas.
- [x] Usar variables de color del proyecto y evitar colores inventados.
- [x] Verificar que titulo, subtitulo e icono no se superpongan ni corten texto.

## FASE 4: Integrar ruta principal

### Objetivo

Hacer que Inicio sea la pantalla principal por defecto sin perder acceso a las paginas actuales.

- [x] Cambiar la ruta principal para que apunte a la nueva pagina Inicio.
- [x] Mantener accesibles las rutas existentes de Lista justa, Mis productos y Comercios.
- [x] Verificar que la redireccion despues del login lleve a Inicio por defecto.
- [x] Ajustar nombres de ruta si el proyecto usa rutas nombradas para navegacion.

## FASE 5: Integrar header y drawer

### Objetivo

Agregar acceso a Inicio en los puntos principales de navegacion sin duplicarlo cuando el usuario ya esta en Inicio.

- [x] Agregar un boton de Inicio junto al boton de tres rayitas del header.
- [x] Mostrar el boton de Inicio del header solo cuando la ruta actual no sea Inicio.
- [x] Aplicar una transicion suave al aparecer y desaparecer el boton de Inicio.
- [x] Agregar Inicio arriba del drawer manteniendo el resto de opciones igual.
- [x] Mostrar Inicio en el drawer solo cuando la ruta actual no sea Inicio.
- [x] Marcar el estado activo de Inicio cuando corresponda en los lugares donde este visible.

## FASE TESTING

### Objetivo

Validar que la nueva pagina y la navegacion funcionen correctamente en escritorio y mobile.

- [x] Ejecutar `npm run lint` y corregir cualquier error.
- [x] Ejecutar `npm run build` y verificar que la app compile correctamente.
- [x] Levantar la app en modo desarrollo y abrir la ruta principal.
- [ ] Verificar con sesion iniciada que la pagina inicial muestra titulo, descripcion y las tres tarjetas en el orden correcto.
- [ ] Entrar a Lista justa desde su tarjeta y verificar que navega correctamente.
- [ ] Entrar a Mis productos desde su tarjeta y verificar que navega correctamente.
- [ ] Entrar a Comercios desde su tarjeta y verificar que navega correctamente.
- [ ] Verificar que el boton de Inicio aparece en el header al estar fuera de Inicio.
- [ ] Verificar que el boton de Inicio no aparece en el header al estar en Inicio.
- [ ] Verificar que Inicio aparece arriba del drawer al estar fuera de Inicio.
- [ ] Verificar que Inicio no aparece en el drawer al estar en Inicio.
- [ ] Probar vista mobile y confirmar que las tarjetas no se cortan ni quedan demasiado estiradas.
- [ ] Probar vista tablet o escritorio y confirmar que la grilla queda centrada con ancho controlado.

## Progreso del plan

- [x] Fase 1: Relevar navegacion actual
- [x] Fase 2: Crear pagina Inicio
- [x] Fase 3: Ajustar estilo responsive
- [x] Fase 4: Integrar ruta principal
- [x] Fase 5: Integrar header y drawer
- [ ] Fase Testing

Fecha de creacion: 24 de Junio 2026
Fecha de ultima actualizacion: 24 de Junio 2026
Estado: EN PROCESO
