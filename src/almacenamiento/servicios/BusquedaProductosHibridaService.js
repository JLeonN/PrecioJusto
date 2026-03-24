/**
 * Búsqueda híbrida: primero base local del usuario, luego APIs externas.
 * Política MVP: Planes/PlanBusquedaLocalPrimeroYEstadosCarga.md
 */

import productosService from './ProductosService.js'
import buscadorProductosService from './BuscadorProductosService.js'
import openFoodFactsService from './OpenFoodFactsService.js'

/** Etiqueta mostrada en resultados y formulario (coincide con origen local) */
export const FUENTE_DATO_LOCAL = 'Mis productos'

const LIMITE_RESULTADOS_LOCAL_NOMBRE = 15
const LIMITE_OPEN_FOOD_FACTS_TEXTO = 10
const FUENTE_OPEN_FOOD_FACTS = 'Open Food Facts'

function mapearProductoLocalParaDialogo(producto) {
  if (!producto) return null
  return {
    nombre: producto.nombre || '',
    marca: producto.marca || '',
    codigoBarras: producto.codigoBarras || '',
    cantidad: producto.cantidad ?? 1,
    unidad: producto.unidad || 'unidad',
    categoria: producto.categoria || '',
    imagen: producto.imagen || null,
    fuenteDato: FUENTE_DATO_LOCAL,
    fotoFuente: producto.fotoFuente ?? null,
  }
}

class BusquedaProductosHibridaService {
  /**
   * @param {string} codigo
   * @param {{ forzarApi?: boolean, onAntesLlamadaApi?: () => void }} [options]
   * @returns {Promise<{
   *   origen: 'local' | 'api' | 'ninguno',
   *   productoLocal: Object | null,
   *   resultadoApi: { producto: Object, fuenteDato: string } | null,
   *   itemsParaDialogo: Array,
   *   puedeEnriquecerConApi: boolean
   * }>}
   */
  async buscarPorCodigoConPolitica(codigo, options = {}) {
    const { forzarApi = false, onAntesLlamadaApi = null } = options
    const c = (codigo || '').trim()
    if (!c) {
      return {
        origen: 'ninguno',
        productoLocal: null,
        resultadoApi: null,
        itemsParaDialogo: [],
        puedeEnriquecerConApi: false,
      }
    }

    const productoLocal = await productosService.buscarPorCodigoBarras(c)

    if (productoLocal && !forzarApi) {
      const item = mapearProductoLocalParaDialogo(productoLocal)
      return {
        origen: 'local',
        productoLocal,
        resultadoApi: null,
        itemsParaDialogo: item ? [item] : [],
        puedeEnriquecerConApi: true,
      }
    }

    if (onAntesLlamadaApi) onAntesLlamadaApi()
    const resultadoApi = await buscadorProductosService.buscarPorCodigo(c)

    if (resultadoApi) {
      return {
        origen: 'api',
        productoLocal: productoLocal || null,
        resultadoApi,
        itemsParaDialogo: [{ ...resultadoApi.producto, fuenteDato: resultadoApi.fuenteDato }],
        puedeEnriquecerConApi: false,
      }
    }

    return {
      origen: 'ninguno',
      productoLocal: productoLocal || null,
      resultadoApi: null,
      itemsParaDialogo: [],
      puedeEnriquecerConApi: Boolean(productoLocal),
    }
  }

  /**
   * @param {string} texto
   * @param {{ ampliarOpenFoodFacts?: boolean, onAntesLlamadaApi?: () => void }} [options]
   * @returns {Promise<{
   *   origen: 'local' | 'api' | 'ninguno',
   *   itemsParaDialogo: Array,
   *   puedeAmpliarOpenFoodFacts: boolean
   * }>}
   */
  async buscarPorNombreConPolitica(texto, options = {}) {
    const { ampliarOpenFoodFacts = false, onAntesLlamadaApi = null } = options
    const t = (texto || '').trim()
    if (!t) {
      return {
        origen: 'ninguno',
        itemsParaDialogo: [],
        puedeAmpliarOpenFoodFacts: false,
      }
    }

    if (!ampliarOpenFoodFacts) {
      const locales = await productosService.buscarPorTextoFlexible(t)
      const slice = locales.slice(0, LIMITE_RESULTADOS_LOCAL_NOMBRE).map(mapearProductoLocalParaDialogo).filter(Boolean)
      if (slice.length > 0) {
        return {
          origen: 'local',
          itemsParaDialogo: slice,
          puedeAmpliarOpenFoodFacts: true,
        }
      }
    }

    if (onAntesLlamadaApi) onAntesLlamadaApi()
    const off = await openFoodFactsService.buscarPorTexto(t, LIMITE_OPEN_FOOD_FACTS_TEXTO)
    const items = off.map((p) => ({ ...p, fuenteDato: FUENTE_OPEN_FOOD_FACTS }))

    if (items.length > 0) {
      return {
        origen: 'api',
        itemsParaDialogo: items,
        puedeAmpliarOpenFoodFacts: false,
      }
    }

    return {
      origen: 'ninguno',
      itemsParaDialogo: [],
      puedeAmpliarOpenFoodFacts: false,
    }
  }
}

export default new BusquedaProductosHibridaService()
