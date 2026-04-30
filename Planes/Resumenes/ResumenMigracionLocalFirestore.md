# RESUMEN MIGRACION LOCAL A FIRESTORE

## Contexto

Este resumen documenta la estructura de datos local vigente y su destino propuesto en Firestore para ejecutar la Fase 3 del plan de integracion Firebase.

## Claves locales detectadas

- `preferencias_usuario`
- `lista_justa`
- `comercios`
- `sesion_escaneo`
- `producto_{id}` (multiples registros)
- `confirmaciones_{usuarioId}`

Nota: en `LocalStorageAdapter` todas se guardan con prefijo interno `precio_justo_`.

## Mapeo propuesto a Firestore

### Perfil y preferencias

- Local: `preferencias_usuario`
- Firestore: `users/{uid}/perfil/principal` y `users/{uid}/configuracion/preferencias`
- Estrategia:
  - `modoTema`, `modoMoneda`, `monedaManual`, `unidad` -> `configuracion/preferencias`
  - Datos de identidad (`nombre`, `email`, `foto`, `tipoCuenta`) quedan en `perfil/principal`

### Productos

- Local: `producto_{id}`
- Firestore: `users/{uid}/productos/{productoId}`
- Estrategia:
  - Mantener `productoId` local como referencia legacy en campo `legacyId`
  - Guardar `precios` inicialmente como array para no romper logica actual
  - Evaluar separar `precios` en subcoleccion en fase posterior de optimizacion

### Comercios

- Local: `comercios` (array con direcciones internas)
- Firestore: `users/{uid}/comercios/{comercioId}`
- Estrategia:
  - Mantener estructura `direcciones[]` inicial
  - Guardar `legacyId` de comercio y direccion para resolver referencias cruzadas

### Lista Justa

- Local: `lista_justa` (objeto con `listas[]` e `items[]`)
- Firestore: `users/{uid}/listasJustas/{listaId}`
- Estrategia:
  - Migrar lista por lista como documento
  - Mantener `items[]` dentro de cada lista en primera etapa

### Sesion de escaneo

- Local: `sesion_escaneo`
- Firestore: NO migrar en primera etapa
- Motivo:
  - Es estado temporal de UI y no historico
  - Conviene mantenerlo local para evitar escrituras innecesarias en Spark

### Confirmaciones

- Local: `confirmaciones_{usuarioId}`
- Firestore: `users/{uid}/confirmaciones/{precioId}` (etapa inicial)
- Estrategia:
  - Migrar solo si existe funcionalidad activa en la app
  - Revisar luego modelo global para comunidad

## Riesgos tecnicos a cubrir antes de migrar

- Reasignacion de referencias `comercioId` y `direccionId` dentro de precios
- Evitar duplicar migraciones (hacer proceso idempotente por `legacyId`)
- No borrar local hasta confirmar escritura remota exitosa
- Confirmar reglas Firestore para escritura en todos los paths de destino

## Secuencia recomendada de migracion

1. Crear respaldo local de claves actuales.
2. Migrar perfil/configuracion.
3. Migrar comercios y construir mapa `legacyId -> firestoreId`.
4. Migrar productos reescribiendo referencias de comercio/direccion.
5. Migrar listas.
6. Marcar estado de migracion exitosa y recien ahi limpiar local (opcional).
