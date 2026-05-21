import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { ESTADOS_SINCRONIZACION, ORIGENES_FOTO, TIPOS_USUARIO } from '../constantes/PreparacionFirebase.js'
import firebaseBaseService from './FirebaseBaseService.js'
import usuarioActualService from './UsuarioActualService.js'

const TIPOS_MIME_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024

function obtenerUsuarioFirebaseId() {
  const usuario = usuarioActualService.obtenerUsuarioActual()
  if (!usuario?.id || usuario.esLocal || usuario.tipo !== TIPOS_USUARIO.FIREBASE) return null
  return usuario.id
}

function esDataUriImagen(valor) {
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(String(valor || '').trim())
}

function dataUriABlob(dataUri) {
  const coincidencia = String(dataUri || '').match(/^data:([^;]+);base64,(.+)$/)
  if (!coincidencia) return null
  const [, tipoMime, base64] = coincidencia
  const binario = atob(base64)
  const bytes = new Uint8Array(binario.length)
  for (let indice = 0; indice < binario.length; indice += 1) {
    bytes[indice] = binario.charCodeAt(indice)
  }
  return new Blob([bytes], { type: tipoMime })
}

function normalizarSegmento(segmento, fallback) {
  return String(segmento || fallback || '')
    .trim()
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || fallback
}

function extensionPorMime(tipoMime) {
  if (tipoMime === 'image/png') return 'png'
  if (tipoMime === 'image/webp') return 'webp'
  if (tipoMime === 'image/heic') return 'heic'
  if (tipoMime === 'image/heif') return 'heif'
  return 'jpg'
}

function crearRutaStorage(tipo, usuarioId, ids = {}, tipoMime = 'image/jpeg') {
  const entidad = normalizarSegmento(tipo, 'foto')
  const idPrincipal = normalizarSegmento(ids.idPrincipal, 'sin-id')
  const idSecundario = ids.idSecundario ? `-${normalizarSegmento(ids.idSecundario, 'ref')}` : ''
  const extension = extensionPorMime(tipoMime)
  const nombreArchivo = `${entidad}-${idPrincipal}${idSecundario}.${extension}`
  return `usuarios/${usuarioId}/fotos/${entidad}/${nombreArchivo}`
}

async function subirFotoPrivada({ tipo, ids, dataUri }) {
  const usuarioId = obtenerUsuarioFirebaseId()
  if (!usuarioId) {
    return { exito: false, omitido: true, estado: ESTADOS_SINCRONIZACION.LOCAL, mensaje: 'Sin usuario Firebase.' }
  }

  if (!esDataUriImagen(dataUri)) {
    return { exito: false, omitido: true, estado: ESTADOS_SINCRONIZACION.LOCAL, mensaje: 'La foto no es base64 de imagen.' }
  }

  const blob = dataUriABlob(dataUri)
  if (!blob) {
    return { exito: false, estado: ESTADOS_SINCRONIZACION.ERROR, mensaje: 'No se pudo convertir la imagen para subida.' }
  }

  if (!TIPOS_MIME_PERMITIDOS.has(blob.type)) {
    return { exito: false, estado: ESTADOS_SINCRONIZACION.ERROR, mensaje: `Tipo no permitido: ${blob.type}` }
  }

  if (blob.size > TAMANO_MAXIMO_BYTES) {
    return { exito: false, estado: ESTADOS_SINCRONIZACION.ERROR, mensaje: 'La imagen supera el maximo permitido de 5MB.' }
  }

  try {
    const storage = firebaseBaseService.obtenerFirebaseStorage()
    const rutaStorage = crearRutaStorage(tipo, usuarioId, ids, blob.type)
    const referencia = ref(storage, rutaStorage)
    const metadata = {
      contentType: blob.type,
      customMetadata: {
        usuarioId,
        origen: ORIGENES_FOTO.USUARIO,
      },
    }
    await uploadBytes(referencia, blob, metadata)
    const url = await getDownloadURL(referencia)
    return {
      exito: true,
      estado: typeof navigator !== 'undefined' && navigator.onLine === false
        ? ESTADOS_SINCRONIZACION.PENDIENTE
        : ESTADOS_SINCRONIZACION.SINCRONIZADO,
      rutaStorage,
      url,
      fotoFuente: ORIGENES_FOTO.STORAGE,
    }
  } catch (error) {
    return {
      exito: false,
      estado: ESTADOS_SINCRONIZACION.ERROR,
      mensaje: error?.message || 'Error al subir foto a Firebase Storage.',
      error,
    }
  }
}

export default {
  esDataUriImagen,
  subirFotoPrivada,
}
