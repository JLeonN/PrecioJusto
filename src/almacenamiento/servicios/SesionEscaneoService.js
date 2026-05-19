import { adaptadorActual } from './AlmacenamientoService.js'
import { CLAVE_SESION_ESCANEO } from '../constantes/ClavesAlmacenamiento.js'

class SesionEscaneoService {
  constructor() {
    this.adaptador = adaptadorActual
  }

  async obtenerSesion() {
    try {
      return await this.adaptador.obtener(CLAVE_SESION_ESCANEO)
    } catch (error) {
      console.error('Error al obtener sesión de escaneo:', error)
      return null
    }
  }

  async guardarSesion(items) {
    try {
      return await this.adaptador.guardar(CLAVE_SESION_ESCANEO, { items })
    } catch (error) {
      console.error('Error al guardar sesión de escaneo:', error)
      return false
    }
  }

  async eliminarSesion() {
    try {
      return await this.adaptador.eliminar(CLAVE_SESION_ESCANEO)
    } catch (error) {
      console.error('Error al eliminar sesión de escaneo:', error)
      return false
    }
  }
}

export default new SesionEscaneoService()
