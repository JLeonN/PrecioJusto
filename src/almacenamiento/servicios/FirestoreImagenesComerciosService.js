import firestoreImagenesService from './FirestoreImagenesService.js'

const COLECCION_IMAGENES_COMERCIOS = 'imagenesComercios'
const COLECCION_IMAGENES_DIRECCIONES = 'imagenesDirecciones'

function crearImagenDireccionId(comercioId, direccionId) {
  return `${comercioId || 'comercio'}-${direccionId || 'direccion'}`
}

async function guardarImagenComercio(comercioId, imagenOptimizada) {
  return firestoreImagenesService.guardarImagen({
    coleccion: COLECCION_IMAGENES_COMERCIOS,
    imagenId: comercioId,
    entidadId: comercioId,
    tipoDato: 'comercio',
    imagenOptimizada,
    metadatos: {
      comercioId: String(comercioId || ''),
    },
  })
}

async function guardarImagenDireccion(comercioId, direccionId, imagenOptimizada) {
  const imagenId = crearImagenDireccionId(comercioId, direccionId)
  return firestoreImagenesService.guardarImagen({
    coleccion: COLECCION_IMAGENES_DIRECCIONES,
    imagenId,
    entidadId: imagenId,
    tipoDato: 'direccion',
    imagenOptimizada,
    metadatos: {
      comercioId: String(comercioId || ''),
      direccionId: String(direccionId || ''),
    },
  })
}

async function obtenerImagenesComercios(comercioIds = [], opciones = {}) {
  return firestoreImagenesService.obtenerImagenes({
    coleccion: COLECCION_IMAGENES_COMERCIOS,
    imagenIds: comercioIds,
    usuarioId: opciones.usuarioId,
  })
}

async function obtenerImagenesDirecciones(direccionesIds = [], opciones = {}) {
  return firestoreImagenesService.obtenerImagenes({
    coleccion: COLECCION_IMAGENES_DIRECCIONES,
    imagenIds: direccionesIds,
    usuarioId: opciones.usuarioId,
  })
}

async function eliminarImagenComercio(comercioId, opciones = {}) {
  return firestoreImagenesService.eliminarImagen({
    coleccion: COLECCION_IMAGENES_COMERCIOS,
    imagenId: comercioId,
    usuarioId: opciones.usuarioId,
  })
}

async function eliminarImagenDireccion(comercioId, direccionId, opciones = {}) {
  return firestoreImagenesService.eliminarImagen({
    coleccion: COLECCION_IMAGENES_DIRECCIONES,
    imagenId: crearImagenDireccionId(comercioId, direccionId),
    usuarioId: opciones.usuarioId,
  })
}

export default {
  crearImagenDireccionId,
  guardarImagenComercio,
  guardarImagenDireccion,
  obtenerImagenesComercios,
  obtenerImagenesDirecciones,
  eliminarImagenComercio,
  eliminarImagenDireccion,
}
