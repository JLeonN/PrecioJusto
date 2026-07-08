import firestoreImagenesService from './FirestoreImagenesService.js'

const COLECCION_IMAGENES_PRODUCTOS = 'imagenesProductos'

function obtenerReferenciaImagenProducto(usuarioId, productoId) {
  return firestoreImagenesService.obtenerReferenciaImagen(
    usuarioId,
    COLECCION_IMAGENES_PRODUCTOS,
    productoId,
  )
}

async function guardarImagenProducto(productoId, imagenOptimizada) {
  return firestoreImagenesService.guardarImagen({
    coleccion: COLECCION_IMAGENES_PRODUCTOS,
    imagenId: productoId,
    entidadId: productoId,
    tipoDato: 'producto',
    imagenOptimizada,
    metadatos: {
      productoId: String(productoId || ''),
    },
  })
}

async function obtenerImagenProducto(productoId, opciones = {}) {
  return firestoreImagenesService.obtenerImagen({
    coleccion: COLECCION_IMAGENES_PRODUCTOS,
    imagenId: productoId,
    usuarioId: opciones.usuarioId,
  })
}

async function obtenerImagenesProductos(productoIds = [], opciones = {}) {
  return firestoreImagenesService.obtenerImagenes({
    coleccion: COLECCION_IMAGENES_PRODUCTOS,
    imagenIds: productoIds,
    usuarioId: opciones.usuarioId,
  })
}

async function eliminarImagenProducto(productoId, opciones = {}) {
  return firestoreImagenesService.eliminarImagen({
    coleccion: COLECCION_IMAGENES_PRODUCTOS,
    imagenId: productoId,
    usuarioId: opciones.usuarioId,
  })
}

export default {
  obtenerReferenciaImagenProducto,
  guardarImagenProducto,
  obtenerImagenProducto,
  obtenerImagenesProductos,
  eliminarImagenProducto,
}
