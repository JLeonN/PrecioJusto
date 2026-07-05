import { adaptadorActual } from './AlmacenamientoService.js'
import {
  CLAVE_CACHE_FIRESTORE_MESA_META,
  CLAVE_SESION_ESCANEO,
  CLAVE_SESION_ESCANEO_RESUELTOS,
} from '../constantes/ClavesAlmacenamiento.js'
import fotosLocalesService from './FotosLocalesService.js'

const CLAVE_RESPALDO_URGENTE_SESION_ESCANEO = 'precioJustoRespaldoUrgenteSesionEscaneo'
const MAXIMO_ITEMS_RESUELTOS = 500

function normalizarCodigo(valor) {
  return String(valor || '').trim()
}

function crearRegistroResuelto(item, datosExtra = {}) {
  const origen = typeof item === 'object' && item !== null ? item : { id: item }
  const fechaResolucion = datosExtra.fechaResolucion || origen.fechaResolucion || new Date().toISOString()

  return {
    id: String(datosExtra.id || origen.id || '').trim(),
    codigoBarras: normalizarCodigo(datosExtra.codigoBarras || origen.codigoBarras),
    productoDestinoId: String(
      datosExtra.productoDestinoId ||
        origen.productoDestinoId ||
        origen.productoExistenteId ||
        '',
    ).trim(),
    fechaResolucion,
  }
}

function normalizarRegistroResuelto(registro) {
  if (typeof registro === 'string') return crearRegistroResuelto(registro)
  return crearRegistroResuelto(registro)
}

function deduplicarRegistrosResueltos(registros = []) {
  const resultado = []
  const claves = new Set()

  for (const registro of registros.map(normalizarRegistroResuelto)) {
    const clave = registro.id || registro.codigoBarras || registro.productoDestinoId
    if (!clave || claves.has(clave)) continue

    claves.add(clave)
    resultado.push(registro)
  }

  return resultado.slice(0, MAXIMO_ITEMS_RESUELTOS)
}

class SesionEscaneoService {
  constructor() {
    this.adaptador = adaptadorActual
  }

  async obtenerSesion() {
    try {
      const sesion = await this.adaptador.obtener(CLAVE_SESION_ESCANEO)
      if (!Array.isArray(sesion?.items)) return sesion
      return {
        ...sesion,
        items: await fotosLocalesService.protegerItemsMesa(sesion.items),
      }
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
      const itemsParaCache = await fotosLocalesService.protegerItemsMesa(items)
      this.guardarRespaldoUrgente(itemsParaCache)
      return await this.adaptador.guardar(CLAVE_SESION_ESCANEO, { items: itemsParaCache })
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
      const itemsParaCache = await fotosLocalesService.protegerItemsMesa(items)
      this.guardarRespaldoUrgente(itemsParaCache)
      return await this.adaptador.guardar(CLAVE_SESION_ESCANEO, { items: itemsParaCache })
    } catch (error) {
      console.error('Error al guardar cache local de Mesa:', error)
      return false
    }
  }

  async obtenerIdsItemsResueltos() {
    const registros = await this.obtenerItemsResueltos()
    return registros.map((registro) => registro.id).filter(Boolean)
  }

  async obtenerItemsResueltos() {
    try {
      const datos = await this.adaptador.obtener(CLAVE_SESION_ESCANEO_RESUELTOS)
      const registros = Array.isArray(datos?.registros) ? datos.registros : []
      const idsLegacy = Array.isArray(datos?.ids) ? datos.ids : []
      return deduplicarRegistrosResueltos([...registros, ...idsLegacy])
    } catch (error) {
      console.warn('No se pudieron leer ítems resueltos de Mesa:', error)
      return []
    }
  }

  async marcarItemResuelto(item, datosExtra = {}) {
    const registroNuevo = crearRegistroResuelto(item, datosExtra)
    if (!registroNuevo.id && !registroNuevo.codigoBarras && !registroNuevo.productoDestinoId) return false

    try {
      const registrosActuales = await this.obtenerItemsResueltos()
      const registros = deduplicarRegistrosResueltos([registroNuevo, ...registrosActuales])

      return await this.adaptador.guardar(CLAVE_SESION_ESCANEO_RESUELTOS, {
        ids: registros.map((registro) => registro.id).filter(Boolean),
        registros,
        fechaActualizacion: new Date().toISOString(),
      })
    } catch (error) {
      console.warn('No se pudo marcar ítem de Mesa como resuelto:', error)
      return false
    }
  }

  async marcarItemsResueltos(items = []) {
    const registrosNuevos = items
      .map((item) => crearRegistroResuelto(item))
      .filter((registro) => registro.id || registro.codigoBarras || registro.productoDestinoId)
    if (registrosNuevos.length === 0) return false

    try {
      const registrosActuales = await this.obtenerItemsResueltos()
      const registros = deduplicarRegistrosResueltos([...registrosNuevos, ...registrosActuales])

      return await this.adaptador.guardar(CLAVE_SESION_ESCANEO_RESUELTOS, {
        ids: registros.map((registro) => registro.id).filter(Boolean),
        registros,
        fechaActualizacion: new Date().toISOString(),
      })
    } catch (error) {
      console.warn('No se pudieron marcar ítems de Mesa como resueltos:', error)
      return false
    }
  }

  async filtrarItemsNoResueltos(items = [], opciones = {}) {
    const registrosResueltos = await this.obtenerItemsResueltos()
    const idsResueltos = new Set(registrosResueltos.map((registro) => registro.id).filter(Boolean))
    const codigosResueltos = new Set(
      registrosResueltos.map((registro) => registro.codigoBarras).filter(Boolean),
    )
    const productosDestinoResueltos = new Set(
      registrosResueltos.map((registro) => registro.productoDestinoId).filter(Boolean),
    )
    const productosExistentes = Array.isArray(opciones.productosExistentes)
      ? opciones.productosExistentes
      : []
    const codigosProductosExistentes = new Set(
      productosExistentes.map((producto) => normalizarCodigo(producto?.codigoBarras)).filter(Boolean),
    )
    const idsProductosExistentes = new Set(
      productosExistentes.map((producto) => String(producto?.id || '').trim()).filter(Boolean),
    )

    return items.filter((item) => {
      const id = String(item?.id || '').trim()
      const codigoBarras = normalizarCodigo(item?.codigoBarras)
      const productoDestinoId = String(item?.productoDestinoId || item?.productoExistenteId || '').trim()

      if (item?.eliminado || item?.estadoMesa === 'resuelto') return false
      if (id && idsResueltos.has(id)) return false
      if (codigoBarras && codigosResueltos.has(codigoBarras)) return false
      if (productoDestinoId && productosDestinoResueltos.has(productoDestinoId)) return false
      if (codigoBarras && codigosProductosExistentes.has(codigoBarras)) return false
      if (productoDestinoId && idsProductosExistentes.has(productoDestinoId)) return false

      return true
    })
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
      const itemsLivianos = fotosLocalesService.quitarFotosPesadasMesa(items)
      window.localStorage.setItem(
        CLAVE_RESPALDO_URGENTE_SESION_ESCANEO,
        JSON.stringify({ items: itemsLivianos, fecha: new Date().toISOString() }),
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
      return Array.isArray(datos?.items) ? fotosLocalesService.quitarFotosPesadasMesa(datos.items) : []
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
