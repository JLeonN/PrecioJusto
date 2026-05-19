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
