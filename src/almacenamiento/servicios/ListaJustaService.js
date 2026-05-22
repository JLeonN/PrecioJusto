import { adaptadorActual } from './AlmacenamientoService.js'

import { CLAVE_LISTA_JUSTA } from '../constantes/ClavesAlmacenamiento.js'
import { ESTADOS_SINCRONIZACION, ORIGENES_FOTO } from '../constantes/PreparacionFirebase.js'
import firestoreListasJustasService from './FirestoreListasJustasService.js'
import firebaseStorageFotosService from './FirebaseStorageFotosService.js'
import usuarioActualService from './UsuarioActualService.js'

const CLAVE_LISTAS = CLAVE_LISTA_JUSTA
const TIEMPO_MAXIMO_SINCRONIZACION_FIRESTORE_MS = 7000

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
      const guardado = await this.adaptador.guardar(CLAVE_LISTAS, { listas })

      if (guardado) {
        await this.sincronizarListasFirestore(listas)
      }

      return guardado
    } catch (error) {
      console.error('Error al guardar listas de Lista Justa:', error)
      return false
    }
  }

  async sincronizarListasFirestore(listas = []) {
    for (const lista of listas) {
      lista.sincronizacionFirestore = await this.sincronizarListaFirestore(lista)
    }
  }

  async sincronizarListaFirestore(lista) {
    try {
      await this._prepararFotosStorageLista(lista)
      const resultado = await this._ejecutarConTimeoutFirestore(
        firestoreListasJustasService.guardarListaJusta(lista),
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
          mensaje: resultado.mensaje || 'No se pudo sincronizar la Lista Justa con Firestore.',
          error: resultado.mensaje || 'Error de sincronización Firestore.',
        }
      }

      return {
        estado: resultado.estado || ESTADOS_SINCRONIZACION.SINCRONIZADO,
        fecha: new Date().toISOString(),
        mensaje:
          resultado.estado === ESTADOS_SINCRONIZACION.PENDIENTE
            ? 'Lista Justa guardada localmente y pendiente de sincronizar con Firestore.'
            : 'Lista Justa sincronizada con Firestore.',
        error: null,
      }
    } catch (error) {
      console.error('Error al sincronizar Lista Justa con Firestore:', error)
      return {
        estado: ESTADOS_SINCRONIZACION.ERROR,
        fecha: new Date().toISOString(),
        mensaje: 'La Lista Justa quedó guardada localmente, pero no se sincronizó con Firestore.',
        error: error.message || 'Error de sincronización Firestore.',
      }
    }
  }

  async sincronizarEliminacionListaFirestore(listaId) {
    try {
      const resultado = await this._ejecutarConTimeoutFirestore(
        firestoreListasJustasService.eliminarListaJusta(listaId),
      )
      if (!resultado.omitido && !resultado.exito) {
        console.warn('La lista se eliminó localmente, pero no se marcó como eliminada en Firestore.')
      }
    } catch (error) {
      console.warn('La lista se eliminó localmente, pero falló la eliminación Firestore.', error)
    }
  }

  crearListaVacia(nombre, orden = 0) {
    const ahora = new Date().toISOString()

    return {
      id: this._generarId('listaJusta'),
      usuarioId: usuarioActualService.obtenerUsuarioIdActual(),
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
      imagenUrl: nuevoItem.imagenUrl || null,
      imagenRutaStorage: nuevoItem.imagenRutaStorage || null,
      fotoFuente: this._normalizarFotoFuente(nuevoItem),
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
      usuarioId: lista.usuarioId || usuarioActualService.obtenerUsuarioIdActual(),
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

  _normalizarFotoFuente(item) {
    if (!item?.imagen) return null
    if (item.fotoFuente) return item.fotoFuente
    if (item.origenApi || item.fuenteDato) return ORIGENES_FOTO.API
    return ORIGENES_FOTO.USUARIO
  }

  _normalizarConfiguracionInteligente(configuracion, comercioActual = null) {
    const heredarComercioActual =
      configuracion?.heredarComercioActual !== undefined
        ? Boolean(configuracion.heredarComercioActual)
        : true
    const comercioBaseFuente =
      configuracion && Object.prototype.hasOwnProperty.call(configuracion, 'comercioBase')
        ? configuracion.comercioBase
        : heredarComercioActual
          ? comercioActual || null
          : null
    const comercioBaseNormalizado = this._normalizarComercioInteligente(
      comercioBaseFuente,
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
      heredarComercioActual,
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

  async _prepararFotosStorageLista(lista) {
    if (!Array.isArray(lista?.items)) return

    for (const item of lista.items) {
      if (!item?.imagen) {
        item.imagenUrl = null
        item.imagenRutaStorage = null
        continue
      }

      if (!firebaseStorageFotosService.esDataUriImagen(item.imagen)) {
        continue
      }

      const resultado = await firebaseStorageFotosService.subirFotoPrivada({
        tipo: 'listas',
        ids: { idPrincipal: lista.id, idSecundario: item.id },
        dataUri: item.imagen,
      })

      if (resultado.exito) {
        item.imagenUrl = resultado.url
        item.imagenRutaStorage = resultado.rutaStorage
        item.fotoFuente = ORIGENES_FOTO.STORAGE
        item.sincronizacionFoto = {
          estado: resultado.estado,
          fecha: new Date().toISOString(),
          mensaje: 'Foto subida a Firebase Storage.',
        }
      } else if (!resultado.omitido) {
        item.sincronizacionFoto = {
          estado: ESTADOS_SINCRONIZACION.ERROR,
          fecha: new Date().toISOString(),
          mensaje: resultado.mensaje || 'No se pudo subir la foto a Firebase Storage.',
        }
      }
    }
  }

  async sincronizarFotosPendientesStorage() {
    const listas = await this.obtenerListas()
    const tieneFotosPendientes = listas.some((lista) =>
      (lista?.items || []).some((item) => firebaseStorageFotosService.esDataUriImagen(item?.imagen)),
    )

    if (!tieneFotosPendientes) return 0

    await this.guardarListas(listas)
    return listas.length
  }
}

export default new ListaJustaService()
