export const USUARIO_LOCAL_LEGACY_ID = 'user_actual_123'

export const TIPOS_USUARIO = Object.freeze({
  LOCAL: 'local',
  FIREBASE: 'firebase',
})

export const ESTADOS_SINCRONIZACION = Object.freeze({
  LOCAL: 'local',
  PENDIENTE: 'pendiente',
  SINCRONIZADO: 'sincronizado',
  ERROR: 'error',
})

export const ORIGENES_FOTO = Object.freeze({
  API: 'api',
  USUARIO: 'usuario',
  STORAGE: 'storage',
  EXTERNA: 'externa',
  DESCONOCIDA: 'desconocida',
})

export const TIPOS_DATO_USUARIO = Object.freeze({
  PRODUCTO: 'producto',
  PRECIO: 'precio',
  COMERCIO: 'comercio',
  LISTA_JUSTA: 'listaJusta',
  PREFERENCIAS: 'preferencias',
  CONFIRMACION: 'confirmacion',
  SESION_ESCANEO: 'sesionEscaneo',
})

export const ACCIONES_SINCRONIZABLES = Object.freeze({
  CREAR: 'crear',
  ACTUALIZAR: 'actualizar',
  ELIMINAR: 'eliminar',
  SUBIR_FOTO: 'subirFoto',
})

export const DATOS_PRIVADOS_USUARIO = Object.freeze([
  TIPOS_DATO_USUARIO.PRODUCTO,
  TIPOS_DATO_USUARIO.PRECIO,
  TIPOS_DATO_USUARIO.COMERCIO,
  TIPOS_DATO_USUARIO.LISTA_JUSTA,
  TIPOS_DATO_USUARIO.PREFERENCIAS,
  TIPOS_DATO_USUARIO.CONFIRMACION,
])

export const DATOS_LOCALES_NO_SINCRONIZABLES = Object.freeze([
  TIPOS_DATO_USUARIO.SESION_ESCANEO,
])

export const COLECCIONES_FIRESTORE_FUTURAS = Object.freeze({
  productosPrivados: 'usuarios/{usuarioId}/productos',
  preciosPrivados: 'usuarios/{usuarioId}/productos/{productoId}/precios',
  comerciosPrivados: 'usuarios/{usuarioId}/comercios',
  listasPrivadas: 'usuarios/{usuarioId}/listasJustas',
  preferenciasUsuario: 'usuarios/{usuarioId}/configuracion/preferencias',
  confirmacionesUsuario: 'usuarios/{usuarioId}/confirmaciones',
  fotosPrivadas: 'usuarios/{usuarioId}/fotos',
})

export const RUTAS_FIRESTORE_PRIVADAS = Object.freeze({
  usuario: 'usuarios/{usuarioId}',
  productos: 'usuarios/{usuarioId}/productos',
  producto: 'usuarios/{usuarioId}/productos/{productoId}',
  precios: 'usuarios/{usuarioId}/productos/{productoId}/precios',
  precio: 'usuarios/{usuarioId}/productos/{productoId}/precios/{precioId}',
  comercios: 'usuarios/{usuarioId}/comercios',
  comercio: 'usuarios/{usuarioId}/comercios/{comercioId}',
  listasJustas: 'usuarios/{usuarioId}/listasJustas',
  listaJusta: 'usuarios/{usuarioId}/listasJustas/{listaId}',
  preferencias: 'usuarios/{usuarioId}/configuracion/preferencias',
  confirmaciones: 'usuarios/{usuarioId}/confirmaciones',
  confirmacion: 'usuarios/{usuarioId}/confirmaciones/{confirmacionId}',
  fotos: 'usuarios/{usuarioId}/fotos',
  foto: 'usuarios/{usuarioId}/fotos/{fotoId}',
  migracion: 'usuarios/{usuarioId}/configuracion/migracionLocal',
})

export const LIMITES_MODELO_FIRESTORE = Object.freeze({
  itemsListaEmbebidosMaximo: 100,
  direccionesComercioEmbebidasMaximo: 50,
  productosPorPagina: 50,
  comerciosPorPagina: 50,
  listasPorPagina: 30,
})

export const CAMPOS_MODELO_FIRESTORE = Object.freeze({
  producto: Object.freeze([
    'id',
    'usuarioId',
    'nombre',
    'nombreNormalizado',
    'marca',
    'marcaNormalizada',
    'categoria',
    'categoriaNormalizada',
    'codigoBarras',
    'cantidad',
    'unidad',
    'imagenUrl',
    'imagenRutaStorage',
    'fotoFuente',
    'fuenteDato',
    'precioMejor',
    'comercioMejor',
    'monedaReferencia',
    'diferenciaPrecio',
    'tendenciaGeneral',
    'porcentajeTendencia',
    'tieneVentajaPorCantidad',
    'tieneEscalasSospechosas',
    'fechaCreacion',
    'fechaActualizacion',
    'ultimaInteraccion',
    'eliminado',
  ]),
  precio: Object.freeze([
    'id',
    'usuarioId',
    'productoId',
    'valor',
    'moneda',
    'comercioId',
    'direccionId',
    'comercio',
    'direccion',
    'nombreCompleto',
    'fecha',
    'confirmaciones',
    'activarPreciosMayoristas',
    'escalasPorCantidad',
    'escalasResumen',
    'tieneEscalaMejora',
    'tieneEscalaSospechosa',
    'origen',
    'fechaCreacion',
    'fechaActualizacion',
    'eliminado',
  ]),
  comercio: Object.freeze([
    'id',
    'usuarioId',
    'nombre',
    'nombreNormalizado',
    'tipo',
    'direcciones',
    'fotoUrl',
    'fotoRutaStorage',
    'fotoFuente',
    'fechaCreacion',
    'fechaActualizacion',
    'fechaUltimoUso',
    'cantidadUsos',
    'eliminado',
  ]),
  direccion: Object.freeze([
    'id',
    'calle',
    'barrio',
    'ciudad',
    'nombreCompleto',
    'fotoUrl',
    'fotoRutaStorage',
    'fotoFuente',
    'fechaCreacion',
    'fechaActualizacion',
    'fechaUltimoUso',
    'eliminado',
  ]),
  listaJusta: Object.freeze([
    'id',
    'usuarioId',
    'nombre',
    'orden',
    'estadoGeneral',
    'preferenciaPrecioFaltante',
    'comercioActual',
    'configuracionInteligente',
    'items',
    'metadatos',
    'fechaCreacion',
    'fechaActualizacion',
    'fechaUltimoUso',
    'eliminado',
  ]),
  itemListaJusta: Object.freeze([
    'id',
    'productoId',
    'origen',
    'nombre',
    'cantidad',
    'precioManual',
    'moneda',
    'comprado',
    'codigoBarras',
    'marca',
    'categoria',
    'gramosOLitros',
    'comercio',
    'unidad',
    'imagenUrl',
    'imagenRutaStorage',
    'fotoFuente',
    'usaPreciosLocales',
    'activarPreciosMayoristas',
    'escalasPorCantidad',
    'estadoDerivacion',
    'mesaTrabajoItemId',
    'origenEscaneo',
    'advertencias',
    'creadoEn',
    'actualizadoEn',
  ]),
  preferencias: Object.freeze([
    'usuarioId',
    'modoMoneda',
    'modoTema',
    'monedaManual',
    'paisDetectado',
    'monedaDetectada',
    'unidad',
    'fechaActualizacion',
  ]),
  confirmacion: Object.freeze([
    'id',
    'usuarioId',
    'productoId',
    'precioId',
    'fecha',
    'origen',
  ]),
  foto: Object.freeze([
    'id',
    'usuarioId',
    'tipoDato',
    'datoId',
    'rutaStorage',
    'url',
    'fuente',
    'fechaCreacion',
    'fechaMigracion',
  ]),
})

export const DATOS_SOLO_LOCALES_FIRESTORE = Object.freeze([
  TIPOS_DATO_USUARIO.SESION_ESCANEO,
])

export function crearRutasFirestorePrivadas(usuarioId, ids = {}) {
  const reemplazos = {
    usuarioId,
    productoId: ids.productoId || '{productoId}',
    precioId: ids.precioId || '{precioId}',
    comercioId: ids.comercioId || '{comercioId}',
    listaId: ids.listaId || '{listaId}',
    confirmacionId: ids.confirmacionId || '{confirmacionId}',
    fotoId: ids.fotoId || '{fotoId}',
  }

  return Object.fromEntries(
    Object.entries(RUTAS_FIRESTORE_PRIVADAS).map(([clave, ruta]) => [
      clave,
      ruta.replace(/\{(\w+)\}/g, (_, nombre) => reemplazos[nombre] || `{${nombre}}`),
    ]),
  )
}
