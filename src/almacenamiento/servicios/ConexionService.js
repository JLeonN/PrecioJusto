import { Network } from '@capacitor/network'

class ConexionService {
  async obtenerEstadoConexion() {
    try {
      const estado = await Network.getStatus()
      return this._normalizarEstado(estado)
    } catch (error) {
      console.warn('No se pudo obtener estado de red con Capacitor:', error)
      return this._obtenerEstadoNavegador()
    }
  }

  async escucharCambiosConexion(callback) {
    const listener = await Network.addListener('networkStatusChange', (estado) => {
      callback(this._normalizarEstado(estado))
    })

    return () => listener.remove()
  }

  _normalizarEstado(estado) {
    return {
      conectado: Boolean(estado?.connected),
      tipoConexion: estado?.connectionType || 'unknown',
      fechaLectura: new Date().toISOString(),
    }
  }

  _obtenerEstadoNavegador() {
    const conectado = typeof navigator === 'undefined' ? true : navigator.onLine

    return {
      conectado,
      tipoConexion: 'unknown',
      fechaLectura: new Date().toISOString(),
    }
  }
}

export default new ConexionService()
