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

- [ ] Revisar el archivo de rutas para ubicar las paginas actuales de Lista justa, Mis productos y Comercios.
- [ ] Revisar el layout principal para identificar el boton de menu hamburguesa y la estructura del header.
- [ ] Revisar el drawer actual para entender como se renderizan las opciones de navegacion.
- [ ] Confirmar el nombre real de las rutas que se usaran en los accesos de Inicio.

## FASE 2: Crear pagina Inicio

### Objetivo

Construir una pagina nueva que muestre accesos principales con formato de tarjetas tipo icono de celular.

- [ ] Crear la pagina `InicioPage.vue` en la carpeta correspondiente de paginas.
- [ ] Agregar un titulo simple para la pantalla de inicio.
- [ ] Agregar la descripcion `Accedé rápido a tus listas, productos y comercios.`
- [ ] Definir un array de accesos con Lista justa, Mis productos y Comercios en ese orden.
- [ ] Asignar a cada acceso un icono, titulo, subtitulo y ruta.
- [ ] Renderizar las tarjetas desde el array para facilitar futuras secciones.
- [ ] Hacer que cada tarjeta navegue a su ruta al tocarla o hacer click.

## FASE 3: Ajustar estilo responsive

### Objetivo

Lograr que la pagina se vea bien en celular, tablet y escritorio sin que las tarjetas se estiren demasiado.

- [ ] Crear una grilla responsive para las tarjetas.
- [ ] Usar una columna en pantallas chicas cuando sea necesario.
- [ ] Permitir dos columnas en celulares grandes o pantallas medianas si el texto entra bien.
- [ ] Centrar la grilla con un ancho maximo para tablet y escritorio.
- [ ] Definir una altura minima estable para que las tarjetas queden parejas.
- [ ] Usar variables de color del proyecto y evitar colores inventados.
- [ ] Verificar que titulo, subtitulo e icono no se superpongan ni corten texto.

## FASE 4: Integrar ruta principal

### Objetivo

Hacer que Inicio sea la pantalla principal por defecto sin perder acceso a las paginas actuales.

- [ ] Cambiar la ruta principal para que apunte a la nueva pagina Inicio.
- [ ] Mantener accesibles las rutas existentes de Lista justa, Mis productos y Comercios.
- [ ] Verificar que la redireccion despues del login lleve a Inicio por defecto.
- [ ] Ajustar nombres de ruta si el proyecto usa rutas nombradas para navegacion.

## FASE 5: Integrar header y drawer

### Objetivo

Agregar acceso a Inicio en los puntos principales de navegacion sin duplicarlo cuando el usuario ya esta en Inicio.

- [ ] Agregar un boton de Inicio junto al boton de tres rayitas del header.
- [ ] Mostrar el boton de Inicio del header solo cuando la ruta actual no sea Inicio.
- [ ] Aplicar una transicion suave al aparecer y desaparecer el boton de Inicio.
- [ ] Agregar Inicio arriba del drawer manteniendo el resto de opciones igual.
- [ ] Mostrar Inicio en el drawer solo cuando la ruta actual no sea Inicio.
- [ ] Marcar el estado activo de Inicio cuando corresponda en los lugares donde este visible.

## FASE TESTING

### Objetivo

Validar que la nueva pagina y la navegacion funcionen correctamente en escritorio y mobile.

- [ ] Ejecutar `npm run lint` y corregir cualquier error.
- [ ] Levantar la app en modo desarrollo y abrir la ruta principal.
- [ ] Verificar que la pagina inicial muestra titulo, descripcion y las tres tarjetas en el orden correcto.
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

- [ ] Fase 1: Relevar navegacion actual
- [ ] Fase 2: Crear pagina Inicio
- [ ] Fase 3: Ajustar estilo responsive
- [ ] Fase 4: Integrar ruta principal
- [ ] Fase 5: Integrar header y drawer
- [ ] Fase Testing

Fecha de creacion: 24 de Junio 2026
Fecha de ultima actualizacion: 24 de Junio 2026
Estado: BORRADOR
