# RESUMEN 9 - CONFIGURACIÓN

## Propósito
La sección de Configuración concentra las preferencias globales de la app y deja listo un espacio estable para crecer sin mezclar ajustes puntuales de cada pantalla.

## Estado actual
- Página disponible en `/configuracion`
- Acceso visible desde el drawer
- Moneda predeterminada con modo manual y modo automático
- Detección de país para intentar definir la moneda correcta
- Fallback seguro a la última moneda manual guardada
- La moneda elegida en un precio puntual no modifica la preferencia global

## Lo que ya resuelve
- Define una única moneda global para formularios nuevos
- Muestra la moneda predeterminada efectiva en pantalla
- Permite separar claramente moneda global y moneda local

## Preparado para el futuro
- Idioma de la app
- Modo oscuro
- Modo claro
- Nombre de usuario
- Contraseña
- Más opciones de cuenta y preferencias

## Reglas importantes
- Si la detección automática falla, se usa la moneda manual guardada
- La pantalla debe seguir siendo simple aunque agregue más ajustes
- Cada nuevo ajuste debe respetar la separación entre preferencia global y dato puntual
