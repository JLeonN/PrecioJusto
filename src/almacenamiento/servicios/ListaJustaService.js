import { adaptadorActual } from './AlmacenamientoService.js'

const CLAVE_LISTAS = 'lista_justa'

class ListaJustaService {
  constructor() {
    this.adaptador = adaptadorActual
  }

  async obtenerListas() {
    try {
      const datos = await this.adaptador.obtener(CLAVE_LISTAS)
      const listas = Array.isArray(datos?.listas) ? datos.listas : []
      return listas.map((lista) => this._normalizarLista(lista))
    } catch (error) {
      console.error('Error al obtener listas de Lista Justa:', error)
      return []
    }
  }

  async guardarListas(listas) {
    try {
      return await this.adaptador.guardar(CLAVE_LISTAS, { listas })
    } catch (error) {
      console.error('Error al guardar listas de Lista Justa:', error)
      return false
    }
  }

  crearListaVacia(nombre, orden = 0) {
    const ahora = new Date().toISOString()

    return {
      id: this._generarId('listaJusta'),
      nombre: (nombre || '').trim(),
      orden,
      estadoGeneral: 'activa',
      preferenciaPrecioFaltante: 'preguntar',
      fechaCreacion: ahora,
      fechaActualizacion: ahora,
      fechaUltimoUso: ahora,
      items: [],
      metadatos: {
        version: 1,
      },
    }
  }

  normalizarItem(nuevoItem = {}) {
    return {
      id: nuevoItem.id || this._generarId('itemLista'),
      productoId: nuevoItem.productoId || null,
      origen: nuevoItem.origen || 'manual',
      nombre: (nuevoItem.nombre || '').trim(),
      cantidad: Number.isFinite(Number(nuevoItem.cantidad)) ? Math.max(1, Number(nuevoItem.cantidad)) : 1,
      precioManual: Number.isFinite(Number(nuevoItem.precioManual)) && Number(nuevoItem.precioManual) > 0
        ? Number(nuevoItem.precioManual)
        : null,
      comprado: Boolean(nuevoItem.comprado),
      codigoBarras: (nuevoItem.codigoBarras || '').trim() || null,
      marca: (nuevoItem.marca || '').trim() || null,
      categoria: (nuevoItem.categoria || '').trim() || null,
      gramosOLitros: (nuevoItem.gramosOLitros || '').trim() || null,
      comercio: (nuevoItem.comercio || '').trim() || null,
      unidad: (nuevoItem.unidad || '').trim() || 'unidad',
      imagen: nuevoItem.imagen || null,
      estadoDerivacion: nuevoItem.estadoDerivacion || 'ninguno',
      creadoEn: nuevoItem.creadoEn || new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
      origenEscaneo: nuevoItem.origenEscaneo || null,
      advertencias: {
        sinNombre: !(nuevoItem.nombre || '').trim(),
        sinPrecio: !Number.isFinite(Number(nuevoItem.precioManual)) || Number(nuevoItem.precioManual) <= 0,
      },
    }
  }

  _normalizarLista(lista = {}) {
    const items = Array.isArray(lista.items) ? lista.items : []

    return {
      id: lista.id || this._generarId('listaJusta'),
      nombre: (lista.nombre || 'Lista sin nombre').trim(),
      orden: Number.isFinite(Number(lista.orden)) ? Number(lista.orden) : 0,
      estadoGeneral: lista.estadoGeneral || 'activa',
      preferenciaPrecioFaltante: lista.preferenciaPrecioFaltante || 'preguntar',
      fechaCreacion: lista.fechaCreacion || new Date().toISOString(),
      fechaActualizacion: lista.fechaActualizacion || new Date().toISOString(),
      fechaUltimoUso: lista.fechaUltimoUso || lista.fechaActualizacion || lista.fechaCreacion || new Date().toISOString(),
      items: items.map((item) => this.normalizarItem(item)),
      metadatos: {
        version: lista.metadatos?.version || 1,
      },
    }
  }

  _generarId(prefijo) {
    return `${prefijo}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }
}

export default new ListaJustaService()
