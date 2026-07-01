import { adaptadorActual } from './AlmacenamientoService.js'
import {
  CLAVE_CACHE_FIRESTORE_MESA_META,
  CLAVE_SESION_ESCANEO,
} from '../constantes/ClavesAlmacenamiento.js'

const CLAVE_RESPALDO_URGENTE_SESION_ESCANEO = 'precioJustoRespaldoUrgenteSesionEscaneo'

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

  async obtenerItemsSesion(opciones = {}) {
    const sesion = await this.obtenerSesion()
    const items = Array.isArray(sesion?.items) ? sesion.items : []
    if (items.length > 0) return items
    if (opciones.usarRespaldoUrgente === false) return []
    return this.obtenerItemsRespaldoUrgente()
  }

  async guardarSesion(items) {
    try {
      this.guardarRespaldoUrgente(items)
      return await this.adaptador.guardar(CLAVE_SESION_ESCANEO, { items })
    } catch (error) {
      console.error('Error al guardar sesión de escaneo:', error)
      return false
    }
  }

  async eliminarSesion() {
    try {
      this.eliminarRespaldoUrgente()
      return await this.adaptador.eliminar(CLAVE_SESION_ESCANEO)
    } catch (error) {
      console.error('Error al eliminar sesión de escaneo:', error)
      return false
    }
  }

  async guardarItemsEnCacheLocal(items = []) {
    try {
      this.guardarRespaldoUrgente(items)
      return await this.adaptador.guardar(CLAVE_SESION_ESCANEO, { items })
    } catch (error) {
      console.error('Error al guardar cache local de Mesa:', error)
      return false
    }
  }

  async obtenerMetaCacheFirestore() {
    try {
      return (await this.adaptador.obtener(CLAVE_CACHE_FIRESTORE_MESA_META)) || null
    } catch (error) {
      console.warn('No se pudo leer meta cache Firestore de Mesa:', error)
      return null
    }
  }

  async guardarMetaCacheFirestore(meta = {}) {
    try {
      return await this.adaptador.guardar(CLAVE_CACHE_FIRESTORE_MESA_META, {
        ...meta,
        fechaGuardado: new Date().toISOString(),
      })
    } catch (error) {
      console.warn('No se pudo guardar meta cache Firestore de Mesa:', error)
      return false
    }
  }

  guardarRespaldoUrgente(items) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false
      window.localStorage.setItem(
        CLAVE_RESPALDO_URGENTE_SESION_ESCANEO,
        JSON.stringify({ items, fecha: new Date().toISOString() }),
      )
      return true
    } catch (error) {
      console.warn('No se pudo guardar respaldo urgente de Mesa:', error)
      return false
    }
  }

  obtenerItemsRespaldoUrgente() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return []
      const respaldo = window.localStorage.getItem(CLAVE_RESPALDO_URGENTE_SESION_ESCANEO)
      if (!respaldo) return []
      const datos = JSON.parse(respaldo)
      return Array.isArray(datos?.items) ? datos.items : []
    } catch (error) {
      console.warn('No se pudo leer respaldo urgente de Mesa:', error)
      return []
    }
  }

  eliminarRespaldoUrgente() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false
      window.localStorage.removeItem(CLAVE_RESPALDO_URGENTE_SESION_ESCANEO)
      return true
    } catch (error) {
      console.warn('No se pudo borrar respaldo urgente de Mesa:', error)
      return false
    }
  }
}

export default new SesionEscaneoService()
