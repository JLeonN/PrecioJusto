import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore'
import { ESTADOS_SINCRONIZACION, TIPOS_USUARIO } from '../constantes/PreparacionFirebase.js'
import firebaseBaseService from './FirebaseBaseService.js'
import usuarioActualService from './UsuarioActualService.js'

const VERSION_FORMATO_IMAGEN = 1
const TAMANO_TANDA_LECTURA = 10
const COLECCIONES_PERMITIDAS = new Set([
  'imagenesProductos',
  'imagenesComercios',
  'imagenesDirecciones',
  'imagenesListas',
  'imagenesMesa',
])

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

function validarColeccion(coleccion) {
  const nombre = String(coleccion || '').trim()
  if (!COLECCIONES_PERMITIDAS.has(nombre)) {
    throw new Error(`Colección de imágenes no permitida: ${nombre}`)
  }
  return nombre
}

function obtenerReferenciaImagen(usuarioId, coleccion, imagenId) {
  return doc(obtenerDb(), 'usuarios', usuarioId, validarColeccion(coleccion), normalizarIdDocumento(imagenId))
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

async function guardarImagen({ coleccion, imagenId, entidadId, tipoDato, imagenOptimizada, metadatos = {} }) {
  const usuarioId = obtenerUsuarioFirebaseActual()
  if (!usuarioId) return crearResultadoOmitido()

  const id = normalizarIdDocumento(imagenId)
  if (!id || !imagenOptimizada?.dataUri) {
    return {
      exito: false,
      estado: ESTADOS_SINCRONIZACION.ERROR,
      mensaje: 'Faltan datos para guardar la imagen.',
    }
  }

  const ahora = new Date().toISOString()
  const referencia = obtenerReferenciaImagen(usuarioId, coleccion, id)
  const snapshotActual = await getDoc(referencia)
  const imagenFirestore = {
    id,
    usuarioId,
    entidadId: normalizarIdDocumento(entidadId || id),
    tipoDato: tipoDato || null,
    mime: imagenOptimizada.mime || 'image/jpeg',
    ancho: Number(imagenOptimizada.ancho || 0),
    alto: Number(imagenOptimizada.alto || 0),
    pesoBytes: Number(imagenOptimizada.pesoBytes || 0),
    imagenBase64: imagenOptimizada.dataUri,
    fechaCreacion: snapshotActual.exists()
      ? snapshotActual.data()?.fechaCreacion || ahora
      : ahora,
    fechaActualizacion: ahora,
    versionFormato: VERSION_FORMATO_IMAGEN,
    ...metadatos,
  }

  await setDoc(referencia, imagenFirestore, { merge: true })

  return {
    exito: true,
    estado: obtenerEstadoEscrituraAceptada(),
    imagen: imagenFirestore,
  }
}

async function obtenerImagen({ coleccion, imagenId, usuarioId: usuarioIdOpcion }) {
  const usuarioId = usuarioIdOpcion || obtenerUsuarioFirebaseActual()
  if (!usuarioId || !imagenId) return null

  const snapshot = await getDoc(obtenerReferenciaImagen(usuarioId, coleccion, imagenId))
  if (!snapshot.exists()) return null

  return {
    id: snapshot.id,
    ...snapshot.data(),
  }
}

async function obtenerImagenes({ coleccion, imagenIds = [], usuarioId }) {
  const idsUnicos = [...new Set((imagenIds || []).map(normalizarIdDocumento).filter(Boolean))]
  const imagenes = new Map()

  for (let indice = 0; indice < idsUnicos.length; indice += TAMANO_TANDA_LECTURA) {
    const tanda = idsUnicos.slice(indice, indice + TAMANO_TANDA_LECTURA)
    const resultados = await Promise.all(
      tanda.map((imagenId) => obtenerImagen({ coleccion, imagenId, usuarioId })),
    )

    resultados.filter(Boolean).forEach((imagen) => {
      imagenes.set(String(imagen.entidadId || imagen.id), imagen)
    })
  }

  return imagenes
}

async function eliminarImagen({ coleccion, imagenId, usuarioId: usuarioIdOpcion }) {
  const usuarioId = usuarioIdOpcion || obtenerUsuarioFirebaseActual()
  if (!usuarioId) return crearResultadoOmitido()
  if (!imagenId) {
    return {
      exito: false,
      estado: ESTADOS_SINCRONIZACION.ERROR,
      mensaje: 'Falta el identificador de la imagen.',
    }
  }

  await deleteDoc(obtenerReferenciaImagen(usuarioId, coleccion, imagenId))

  return {
    exito: true,
    estado: obtenerEstadoEscrituraAceptada(),
  }
}

export default {
  obtenerReferenciaImagen,
  guardarImagen,
  obtenerImagen,
  obtenerImagenes,
  eliminarImagen,
}
