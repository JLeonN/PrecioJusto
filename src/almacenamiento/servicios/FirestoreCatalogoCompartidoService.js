import { doc, getDoc, runTransaction } from 'firebase/firestore'
import { TIPOS_USUARIO } from '../constantes/PreparacionFirebase.js'
import { crearFichaCatalogoCompartido, esGtinValido, normalizarCodigoCatalogo } from '../../utils/CatalogoCompartidoUtils.js'
import firebaseBaseService from './FirebaseBaseService.js'
import usuarioActualService from './UsuarioActualService.js'

const CAMPOS_COMPLETABLES = ['marca', 'categoria', 'imagenUrl']

function obtenerDb() {
  return firebaseBaseService.obtenerFirestoreDb()
}

function estaDisponibleEnLinea() {
  return typeof navigator === 'undefined' || navigator.onLine !== false
}

function obtenerUsuarioFirebaseActual() {
  const usuario = usuarioActualService.obtenerUsuarioActual()
  if (!usuario?.id || usuario.esLocal || usuario.tipo !== TIPOS_USUARIO.FIREBASE) return null
  return usuario.id
}

function obtenerReferenciaProducto(codigoBarras) {
  return doc(obtenerDb(), 'catalogoCompartidoProductos', normalizarCodigoCatalogo(codigoBarras))
}

function crearResultadoOmitido(mensaje) {
  return {
    exito: false,
    omitido: true,
    mensaje,
  }
}

function completarCamposVacios(fichaActual, fichaNueva) {
  const cambios = {}

  for (const campo of CAMPOS_COMPLETABLES) {
    if (!fichaActual[campo] && fichaNueva[campo]) cambios[campo] = fichaNueva[campo]
  }

  return cambios
}

async function obtenerProductoPorCodigo(codigoBarras) {
  const codigoNormalizado = normalizarCodigoCatalogo(codigoBarras)

  if (!obtenerUsuarioFirebaseActual() || !esGtinValido(codigoNormalizado) || !estaDisponibleEnLinea()) {
    return null
  }

  try {
    const snapshot = await getDoc(obtenerReferenciaProducto(codigoNormalizado))
    if (!snapshot.exists()) return null

    return {
      ...snapshot.data(),
      codigoBarras: snapshot.id,
    }
  } catch (error) {
    console.warn('No se pudo consultar el catálogo compartido:', error)
    return null
  }
}

async function publicarProducto(producto) {
  const fichaNueva = crearFichaCatalogoCompartido(producto)

  if (!obtenerUsuarioFirebaseActual()) return crearResultadoOmitido('No hay usuario Firebase autenticado.')
  if (!fichaNueva) return crearResultadoOmitido('El producto no cumple los datos mínimos del catálogo.')
  if (!estaDisponibleEnLinea()) return crearResultadoOmitido('El catálogo compartido requiere conexión.')

  try {
    const referencia = obtenerReferenciaProducto(fichaNueva.codigoBarras)
    const resultado = await runTransaction(obtenerDb(), async (transaccion) => {
      const snapshot = await transaccion.get(referencia)
      const ahora = new Date().toISOString()

      if (!snapshot.exists()) {
        transaccion.set(referencia, {
          ...fichaNueva,
          fechaCreacion: ahora,
          fechaActualizacion: ahora,
        })
        return { creada: true, completada: false }
      }

      const cambios = completarCamposVacios(snapshot.data(), fichaNueva)
      if (Object.keys(cambios).length === 0) return { creada: false, completada: false }

      transaccion.update(referencia, {
        ...cambios,
        fechaActualizacion: ahora,
      })
      return { creada: false, completada: true }
    })

    return {
      exito: true,
      ...resultado,
    }
  } catch (error) {
    console.warn('No se pudo publicar el producto en el catálogo compartido:', error)
    return {
      exito: false,
      mensaje: error.message || 'No se pudo publicar el producto en el catálogo compartido.',
    }
  }
}

export default {
  obtenerProductoPorCodigo,
  publicarProducto,
}
