const MIME_WEBP = 'image/webp'
const MIME_JPEG = 'image/jpeg'
const PESO_REINTENTO_BYTES = 120000
const PESO_MAXIMO_BYTES = 180000

export function esDataUriImagen(valor) {
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(String(valor || '').trim())
}

export function calcularPesoBase64Bytes(dataUri) {
  const base64 = String(dataUri || '').split(',')[1] || ''
  if (!base64) return 0

  const relleno = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.max(0, Math.floor((base64.length * 3) / 4) - relleno)
}

function cargarImagen(dataUri) {
  return new Promise((resolve, reject) => {
    const imagen = new Image()
    imagen.onload = () => resolve(imagen)
    imagen.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'))
    imagen.src = dataUri
  })
}

function crearCanvasReducido(imagen, tamanoMaximo) {
  const anchoOriginal = imagen.naturalWidth || imagen.width
  const altoOriginal = imagen.naturalHeight || imagen.height

  if (!anchoOriginal || !altoOriginal) {
    throw new Error('La imagen no tiene dimensiones válidas.')
  }

  const escala = Math.min(1, tamanoMaximo / Math.max(anchoOriginal, altoOriginal))
  const ancho = Math.max(1, Math.round(anchoOriginal * escala))
  const alto = Math.max(1, Math.round(altoOriginal * escala))
  const canvas = document.createElement('canvas')
  canvas.width = ancho
  canvas.height = alto

  const contexto = canvas.getContext('2d')
  if (!contexto) {
    throw new Error('No se pudo preparar la imagen para Firestore.')
  }

  contexto.drawImage(imagen, 0, 0, ancho, alto)
  return { canvas, ancho, alto, fueReducida: escala < 1 }
}

function exportarCanvas(canvas, mimePreferido, calidad) {
  const dataUri = canvas.toDataURL(mimePreferido, calidad)
  const mime = dataUri.startsWith(`data:${mimePreferido};`) ? mimePreferido : MIME_JPEG
  return { dataUri, mime }
}

async function comprimirConOpciones(dataUri, opciones) {
  const imagen = await cargarImagen(dataUri)
  const { canvas, ancho, alto, fueReducida } = crearCanvasReducido(imagen, opciones.tamanoMaximo)
  const resultado = exportarCanvas(canvas, opciones.mimePreferido, opciones.calidad)

  return {
    ...resultado,
    ancho,
    alto,
    pesoBytes: calcularPesoBase64Bytes(resultado.dataUri),
    fueReducida,
  }
}

export async function comprimirImagenParaFirestore(dataUri, opciones = {}) {
  if (!esDataUriImagen(dataUri)) {
    throw new Error('La imagen no tiene formato base64 válido.')
  }

  const configuracion = {
    tamanoMaximo: Number(opciones.tamanoMaximo || 480),
    calidad: Number(opciones.calidad || 0.55),
    mimePreferido: opciones.mimePreferido || MIME_WEBP,
  }
  let resultado = await comprimirConOpciones(dataUri, configuracion)

  if (resultado.pesoBytes > PESO_REINTENTO_BYTES) {
    resultado = await comprimirConOpciones(dataUri, {
      ...configuracion,
      tamanoMaximo: 360,
      calidad: 0.45,
    })
  }

  if (resultado.pesoBytes > PESO_MAXIMO_BYTES) {
    throw new Error('La imagen sigue siendo demasiado grande para sincronizar gratis.')
  }

  return resultado
}

export const LIMITES_IMAGEN_FIRESTORE = Object.freeze({
  PESO_REINTENTO_BYTES,
  PESO_MAXIMO_BYTES,
})
