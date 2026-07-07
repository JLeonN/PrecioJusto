import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore'
import { ESTADOS_SINCRONIZACION, TIPOS_USUARIO } from '../constantes/PreparacionFirebase.js'
import firebaseBaseService from './FirebaseBaseService.js'
import usuarioActualService from './UsuarioActualService.js'

const VERSION_FORMATO_IMAGEN_PRODUCTO = 1
const TAMANO_TANDA_LECTURA = 10

function obtenerUsuarioFirebaseActual() {
  const usuario = usuarioActualService.obtenerUsuarioActual()

  if (!usuario.id || usuario.esLocal || usuario.tipo !== TIPOS_USUARIO.FIREBASE) {
    return null
  }

  return usuario.id
}

function obtenerDb() {
  return firebaseBaseService.obtenerFirestoreDb()
}

function normalizarIdDocumento(valor) {
  return String(valor || '')
    .trim()
    .replace(/\//g, '-')
}

function obtenerReferenciaImagenProducto(usuarioId, productoId) {
  return doc(
    obtenerDb(),
    'usuarios',
    usuarioId,
    'imagenesProductos',
    normalizarIdDocumento(productoId),
  )
}

function crearResultadoOmitido() {
  return {
    exito: false,
    omitido: true,
    estado: ESTADOS_SINCRONIZACION.LOCAL,
    mensaje: 'No hay usuario Firebase autenticado.',
  }
}

function obtenerEstadoEscrituraAceptada() {
  return typeof navigator !== 'undefined' && navigator.onLine === false
    ? ESTADOS_SINCRONIZACION.PENDIENTE
    : ESTADOS_SINCRONIZACION.SINCRONIZADO
}

async function guardarImagenProducto(productoId, imagenOptimizada) {
  const usuarioId = obtenerUsuarioFirebaseActual()
  if (!usuarioId) return crearResultadoOmitido()

  const id = normalizarIdDocumento(productoId)
  if (!id || !imagenOptimizada?.dataUri) {
    return {
      exito: false,
      estado: ESTADOS_SINCRONIZACION.ERROR,
      mensaje: 'Faltan datos para guardar la imagen del producto.',
    }
  }

  const ahora = new Date().toISOString()
  const referencia = obtenerReferenciaImagenProducto(usuarioId, id)
  const snapshotActual = await getDoc(referencia)
  const imagenFirestore = {
    id,
    usuarioId,
    productoId: id,
    mime: imagenOptimizada.mime || 'image/jpeg',
    ancho: Number(imagenOptimizada.ancho || 0),
    alto: Number(imagenOptimizada.alto || 0),
    pesoBytes: Number(imagenOptimizada.pesoBytes || 0),
    imagenBase64: imagenOptimizada.dataUri,
    fechaCreacion: snapshotActual.exists()
      ? snapshotActual.data()?.fechaCreacion || ahora
      : ahora,
    fechaActualizacion: ahora,
    versionFormato: VERSION_FORMATO_IMAGEN_PRODUCTO,
  }

  await setDoc(referencia, imagenFirestore, { merge: true })

  return {
    exito: true,
    estado: obtenerEstadoEscrituraAceptada(),
    imagen: imagenFirestore,
  }
}

async function obtenerImagenProducto(productoId, opciones = {}) {
  const usuarioId = opciones.usuarioId || obtenerUsuarioFirebaseActual()
  if (!usuarioId || !productoId) return null

  const snapshot = await getDoc(obtenerReferenciaImagenProducto(usuarioId, productoId))
  if (!snapshot.exists()) return null

  return {
    id: snapshot.id,
    ...snapshot.data(),
  }
}

async function obtenerImagenesProductos(productoIds = [], opciones = {}) {
  const idsUnicos = [...new Set((productoIds || []).map(normalizarIdDocumento).filter(Boolean))]
  const imagenes = new Map()

  for (let indice = 0; indice < idsUnicos.length; indice += TAMANO_TANDA_LECTURA) {
    const tanda = idsUnicos.slice(indice, indice + TAMANO_TANDA_LECTURA)
    const resultados = await Promise.all(
      tanda.map((productoId) => obtenerImagenProducto(productoId, opciones)),
    )

    resultados.filter(Boolean).forEach((imagen) => {
      imagenes.set(String(imagen.productoId || imagen.id), imagen)
    })
  }

  return imagenes
}

async function eliminarImagenProducto(productoId, opciones = {}) {
  const usuarioId = opciones.usuarioId || obtenerUsuarioFirebaseActual()
  if (!usuarioId) return crearResultadoOmitido()
  if (!productoId) {
    return {
      exito: false,
      estado: ESTADOS_SINCRONIZACION.ERROR,
      mensaje: 'Falta el producto para eliminar la imagen.',
    }
  }

  await deleteDoc(obtenerReferenciaImagenProducto(usuarioId, productoId))

  return {
    exito: true,
    estado: obtenerEstadoEscrituraAceptada(),
  }
}

export default {
  obtenerReferenciaImagenProducto,
  guardarImagenProducto,
  obtenerImagenProducto,
  obtenerImagenesProductos,
  eliminarImagenProducto,
}
