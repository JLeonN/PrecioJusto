import { adaptadorActual } from './AlmacenamientoService.js'
import productosService from './ProductosService.js'
import { PREFIJO_CONFIRMACIONES } from '../constantes/ClavesAlmacenamiento.js'
import { ESTADOS_SINCRONIZACION } from '../constantes/PreparacionFirebase.js'
import firestoreConfirmacionesService from './FirestoreConfirmacionesService.js'

const TIEMPO_MAXIMO_SINCRONIZACION_FIRESTORE_MS = 7000

class ConfirmacionesService {
  constructor() {
    this.adaptador = adaptadorActual
    this.prefijoConfirmaciones = PREFIJO_CONFIRMACIONES
  }

  async confirmarPrecio(usuarioId, productoId, precioId) {
    try {
      if (!usuarioId || !productoId || !precioId) {
        return {
          exito: false,
          mensaje: 'Parámetros inválidos',
        }
      }

      const yaConfirmo = await this.usuarioConfirmoPrecio(usuarioId, precioId)
      if (yaConfirmo) {
        return {
          exito: false,
          mensaje: 'Ya confirmaste este precio anteriormente',
        }
      }

      const producto = await productosService.obtenerProducto(productoId)
      if (!producto) {
        return {
          exito: false,
          mensaje: 'Producto no encontrado',
        }
      }

      const precio = producto.precios?.find((registroPrecio) => registroPrecio.id === precioId)
      if (!precio) {
        return {
          exito: false,
          mensaje: 'Precio no encontrado',
        }
      }

      precio.confirmaciones = (precio.confirmaciones || 0) + 1
      const productoActualizado = await productosService.guardarProducto(producto)
      if (!productoActualizado) {
        return {
          exito: false,
          mensaje: 'Error al actualizar producto',
        }
      }

      const confirmacionLocalRegistrada = await this.registrarConfirmacionUsuario(usuarioId, precioId)
      if (!confirmacionLocalRegistrada) {
        return {
          exito: false,
          mensaje: 'No se pudo guardar la confirmación local del usuario',
        }
      }

      const sincronizacionFirestore = await this._sincronizarConfirmacionFirestore({
        productoId,
        precioId,
        origen: 'confirmacionLocal',
      })

      return {
        exito: true,
        mensaje: 'Precio confirmado exitosamente',
        producto: productoActualizado,
        nuevasConfirmaciones: precio.confirmaciones,
        sincronizacionFirestore,
      }
    } catch (error) {
      console.error('Error al confirmar precio:', error)
      return {
        exito: false,
        mensaje: 'Error inesperado al confirmar',
      }
    }
  }

  async obtenerConfirmacionesUsuario(usuarioId) {
    try {
      const clave = `${this.prefijoConfirmaciones}${usuarioId}`
      const confirmaciones = await this.adaptador.obtener(clave)

      if (!confirmaciones) return new Set()
      if (Array.isArray(confirmaciones)) return new Set(confirmaciones)
      if (Array.isArray(confirmaciones.preciosConfirmados)) return new Set(confirmaciones.preciosConfirmados)
      return new Set()
    } catch (error) {
      console.error(`Error al obtener confirmaciones de ${usuarioId}:`, error)
      return new Set()
    }
  }

  async registrarConfirmacionUsuario(usuarioId, precioId) {
    try {
      const confirmacionesActuales = await this.obtenerConfirmacionesUsuario(usuarioId)
      confirmacionesActuales.add(precioId)

      const clave = `${this.prefijoConfirmaciones}${usuarioId}`
      const datos = {
        usuarioId,
        preciosConfirmados: Array.from(confirmacionesActuales),
        fechaActualizacion: new Date().toISOString(),
      }

      return await this.adaptador.guardar(clave, datos)
    } catch (error) {
      console.error('Error al registrar confirmación:', error)
      return false
    }
  }

  async usuarioConfirmoPrecio(usuarioId, precioId) {
    try {
      const confirmaciones = await this.obtenerConfirmacionesUsuario(usuarioId)
      return confirmaciones.has(precioId)
    } catch (error) {
      console.error('Error al verificar confirmación:', error)
      return false
    }
  }

  async eliminarConfirmacion(usuarioId, productoId, precioId) {
    try {
      const yaConfirmo = await this.usuarioConfirmoPrecio(usuarioId, precioId)
      if (!yaConfirmo) {
        return {
          exito: false,
          mensaje: 'No has confirmado este precio',
        }
      }

      const producto = await productosService.obtenerProducto(productoId)
      if (!producto) {
        return {
          exito: false,
          mensaje: 'Producto no encontrado',
        }
      }

      const precio = producto.precios?.find((registroPrecio) => registroPrecio.id === precioId)
      if (!precio) {
        return {
          exito: false,
          mensaje: 'Precio no encontrado',
        }
      }

      precio.confirmaciones = Math.max(0, (precio.confirmaciones || 0) - 1)
      const productoActualizado = await productosService.guardarProducto(producto)
      if (!productoActualizado) {
        return {
          exito: false,
          mensaje: 'No se pudo actualizar el producto',
        }
      }

      const confirmaciones = await this.obtenerConfirmacionesUsuario(usuarioId)
      confirmaciones.delete(precioId)

      const clave = `${this.prefijoConfirmaciones}${usuarioId}`
      const datos = {
        usuarioId,
        preciosConfirmados: Array.from(confirmaciones),
        fechaActualizacion: new Date().toISOString(),
      }
      await this.adaptador.guardar(clave, datos)

      const sincronizacionFirestore = await this._sincronizarEliminacionConfirmacionFirestore({
        productoId,
        precioId,
      })

      return {
        exito: true,
        mensaje: 'Confirmación eliminada',
        producto: productoActualizado,
        sincronizacionFirestore,
      }
    } catch (error) {
      console.error('Error al eliminar confirmación:', error)
      return {
        exito: false,
        mensaje: 'Error inesperado',
      }
    }
  }

  async obtenerEstadisticas(usuarioId) {
    try {
      const confirmaciones = await this.obtenerConfirmacionesUsuario(usuarioId)
      return {
        totalConfirmaciones: confirmaciones.size,
        preciosConfirmados: Array.from(confirmaciones),
      }
    } catch (error) {
      console.error('Error al obtener estadísticas:', error)
      return {
        totalConfirmaciones: 0,
        preciosConfirmados: [],
      }
    }
  }

  async limpiarConfirmacionesUsuario(usuarioId) {
    try {
      const clave = `${this.prefijoConfirmaciones}${usuarioId}`
      const eliminado = await this.adaptador.eliminar(clave)
      const sincronizacionFirestore = await this._sincronizarLimpiezaConfirmacionesFirestore()

      return eliminado || sincronizacionFirestore.omitido || sincronizacionFirestore.exito
    } catch (error) {
      console.error('Error al limpiar confirmaciones:', error)
      return false
    }
  }

  async _sincronizarConfirmacionFirestore({ productoId, precioId, origen }) {
    try {
      const resultado = await this._ejecutarConTimeoutFirestore(
        firestoreConfirmacionesService.guardarConfirmacion({
          productoId,
          precioId,
          origen,
          fecha: new Date().toISOString(),
        }),
      )

      if (resultado.omitido) {
        return {
          estado: ESTADOS_SINCRONIZACION.LOCAL,
          fecha: new Date().toISOString(),
          mensaje: resultado.mensaje,
          error: null,
        }
      }

      if (!resultado.exito) {
        return {
          estado: ESTADOS_SINCRONIZACION.ERROR,
          fecha: new Date().toISOString(),
          mensaje: resultado.mensaje || 'No se pudo sincronizar la confirmación con Firestore.',
          error: resultado.mensaje || 'Error de sincronización Firestore.',
        }
      }

      return {
        estado: resultado.estado || ESTADOS_SINCRONIZACION.SINCRONIZADO,
        fecha: new Date().toISOString(),
        mensaje:
          resultado.estado === ESTADOS_SINCRONIZACION.PENDIENTE
            ? 'Confirmación guardada localmente y pendiente de sincronizar con Firestore.'
            : 'Confirmación sincronizada con Firestore.',
        error: null,
      }
    } catch (error) {
      console.error('Error al sincronizar confirmación con Firestore:', error)
      return {
        estado: ESTADOS_SINCRONIZACION.ERROR,
        fecha: new Date().toISOString(),
        mensaje: 'La confirmación quedó local, pero no se sincronizó con Firestore.',
        error: error.message || 'Error de sincronización Firestore.',
      }
    }
  }

  async _sincronizarEliminacionConfirmacionFirestore({ productoId, precioId }) {
    try {
      const resultado = await this._ejecutarConTimeoutFirestore(
        firestoreConfirmacionesService.eliminarConfirmacion({
          productoId,
          precioId,
        }),
      )

      if (!resultado.omitido && !resultado.exito) {
        console.warn('La confirmación se eliminó localmente, pero no se eliminó en Firestore.')
      }

      return resultado
    } catch (error) {
      console.warn('La confirmación se eliminó localmente, pero falló la eliminación Firestore.', error)
      return {
        exito: false,
        estado: ESTADOS_SINCRONIZACION.ERROR,
      }
    }
  }

  async _sincronizarLimpiezaConfirmacionesFirestore() {
    try {
      return await this._ejecutarConTimeoutFirestore(
        firestoreConfirmacionesService.limpiarConfirmacionesUsuario(),
      )
    } catch (error) {
      console.warn('Se limpiaron confirmaciones locales, pero falló la limpieza Firestore.', error)
      return {
        exito: false,
        estado: ESTADOS_SINCRONIZACION.ERROR,
      }
    }
  }

  async _ejecutarConTimeoutFirestore(promesa) {
    let timeoutId = null
    const timeout = new Promise((resolve) => {
      timeoutId = setTimeout(() => {
        resolve({
          exito: true,
          estado: ESTADOS_SINCRONIZACION.PENDIENTE,
          mensaje: 'Firestore aceptó la operación localmente o quedó pendiente por conectividad.',
        })
      }, TIEMPO_MAXIMO_SINCRONIZACION_FIRESTORE_MS)
    })

    const resultado = await Promise.race([promesa, timeout])
    clearTimeout(timeoutId)
    return resultado
  }
}

export default new ConfirmacionesService()
