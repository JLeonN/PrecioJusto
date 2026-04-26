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
      comercioActual: null,
      configuracionInteligente: this._normalizarConfiguracionInteligente(null, null),
      items: [],
      metadatos: {
        version: 2,
      },
    }
  }

  normalizarItem(nuevoItem = {}) {
    const escalasPorCantidad = this._normalizarEscalasPorCantidad(nuevoItem.escalasPorCantidad)

    return {
      id: nuevoItem.id || this._generarId('itemLista'),
      productoId: nuevoItem.productoId || null,
      origen: nuevoItem.origen || 'manual',
      nombre: (nuevoItem.nombre || '').trim(),
      cantidad: Number.isFinite(Number(nuevoItem.cantidad)) ? Math.max(1, Number(nuevoItem.cantidad)) : 1,
      precioManual: Number.isFinite(Number(nuevoItem.precioManual)) && Number(nuevoItem.precioManual) > 0
        ? Number(nuevoItem.precioManual)
        : null,
      moneda: (nuevoItem.moneda || '').trim() || 'UYU',
      comprado: Boolean(nuevoItem.comprado),
      codigoBarras: (nuevoItem.codigoBarras || '').trim() || null,
      marca: (nuevoItem.marca || '').trim() || null,
      categoria: (nuevoItem.categoria || '').trim() || null,
      gramosOLitros: (nuevoItem.gramosOLitros || '').trim() || null,
      comercio: (nuevoItem.comercio || '').trim() || null,
      unidad: (nuevoItem.unidad || '').trim() || 'unidad',
      imagen: nuevoItem.imagen || null,
      usaPreciosLocales: Boolean(nuevoItem.usaPreciosLocales),
      activarPreciosMayoristas: Boolean(nuevoItem.activarPreciosMayoristas) && escalasPorCantidad.length > 0,
      escalasPorCantidad,
      estadoDerivacion: nuevoItem.estadoDerivacion || 'ninguno',
      mesaTrabajoItemId: nuevoItem.mesaTrabajoItemId || null,
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
    const comercioActual = lista.comercioActual || null

    return {
      id: lista.id || this._generarId('listaJusta'),
      nombre: (lista.nombre || 'Lista sin nombre').trim(),
      orden: Number.isFinite(Number(lista.orden)) ? Number(lista.orden) : 0,
      estadoGeneral: lista.estadoGeneral || 'activa',
      preferenciaPrecioFaltante: lista.preferenciaPrecioFaltante || 'preguntar',
      fechaCreacion: lista.fechaCreacion || new Date().toISOString(),
      fechaActualizacion: lista.fechaActualizacion || new Date().toISOString(),
      fechaUltimoUso: lista.fechaUltimoUso || lista.fechaActualizacion || lista.fechaCreacion || new Date().toISOString(),
      comercioActual,
      configuracionInteligente: this._normalizarConfiguracionInteligente(
        lista.configuracionInteligente,
        comercioActual,
      ),
      items: items.map((item) => this.normalizarItem(item)),
      metadatos: {
        version: Math.max(Number(lista.metadatos?.version || 1), 2),
      },
    }
  }

  _generarId(prefijo) {
    return `${prefijo}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }

  _normalizarEscalasPorCantidad(escalas) {
    return Array.isArray(escalas)
      ? escalas
        .map((escala) => ({
          cantidadMinima: Number(escala?.cantidadMinima) || 0,
          precioUnitario: Number.isFinite(Number(escala?.precioUnitario))
            ? Number(escala.precioUnitario)
            : null,
          estadoEscala: escala?.estadoEscala || 'neutral',
        }))
        .filter((escala) => escala.cantidadMinima >= 2 && escala.precioUnitario !== null)
      : []
  }

  _normalizarConfiguracionInteligente(configuracion, comercioActual = null) {
    const comercioBaseNormalizado = this._normalizarComercioInteligente(
      configuracion?.comercioBase || comercioActual || null,
    )
    const comerciosComparacion = Array.isArray(configuracion?.comerciosComparacion)
      ? configuracion.comerciosComparacion
        .map((comercio) => this._normalizarComercioInteligente(comercio))
        .filter(Boolean)
      : []

    const clavesUsadas = new Set()
    const comercioBaseClave = this._obtenerClaveComercioInteligente(comercioBaseNormalizado)

    if (comercioBaseClave) {
      clavesUsadas.add(comercioBaseClave)
    }

    const comerciosComparacionNormalizados = comerciosComparacion.filter((comercio) => {
      const clave = this._obtenerClaveComercioInteligente(comercio)
      if (!clave || clavesUsadas.has(clave)) return false
      clavesUsadas.add(clave)
      return true
    })

    return {
      comercioBase: comercioBaseNormalizado,
      comerciosComparacion: comerciosComparacionNormalizados,
    }
  }

  _normalizarComercioInteligente(comercio) {
    if (!comercio) return null

    const nombre = String(comercio.nombre || '').trim()
    const id = String(comercio.id || '').trim() || null
    const direccionId = String(comercio.direccionId || '').trim() || null
    const direccionNombre = String(comercio.direccionNombre || '').trim() || ''

    if (!nombre && !id) return null

    return {
      id,
      nombre,
      direccionId,
      direccionNombre,
    }
  }

  _obtenerClaveComercioInteligente(comercio) {
    if (!comercio) return ''

    if (comercio.id && comercio.direccionId) {
      return `${comercio.id}_${comercio.direccionId}`
    }

    if (comercio.id) return comercio.id
    if (comercio.nombre && comercio.direccionNombre) {
      return `${comercio.nombre}_${comercio.direccionNombre}`
    }

    return comercio.nombre || ''
  }
}

export default new ListaJustaService()
