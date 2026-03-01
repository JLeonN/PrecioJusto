/**
 * 🌍 SERVICIO OPEN FOOD FACTS API
 *
 * API gratuita para buscar productos por código de barras o texto.
 * Documentación: https://world.openfoodfacts.org/data
 */

import axios from 'axios'

class OpenFoodFactsService {
  constructor() {
    this.baseURL = 'https://world.openfoodfacts.org/api/v2'
    this.apiURLLegacy = 'https://world.openfoodfacts.org/cgi'
  }

  /**
   * 🔍 BUSCAR POR CÓDIGO DE BARRAS
   * @param {string} codigoBarras - Código EAN/UPC
   * @returns {Promise<Object|null>} - Producto o null
   */
  async buscarPorCodigoBarras(codigoBarras) {
    try {
      const url = `${this.baseURL}/product/${codigoBarras}`
      console.log(`🔍 Buscando código: ${codigoBarras}`)

      const response = await axios.get(url)

      if (response.data.status === 1 && response.data.product) {
        return this._mapearProducto(response.data.product)
      }

      console.log('⚠️ Producto no encontrado')
      return null
    } catch (error) {
      if (error.response?.status === 404) return null
      console.error('❌ Error al buscar código:', error)
      return null
    }
  }

  /**
   * 🔍 BUSCAR POR TEXTO (nombre, marca, etc)
   * @param {string} texto - Término de búsqueda
   * @param {number} limite - Máximo de resultados (default: 10)
   * @returns {Promise<Array>} - Array de productos
   */
  async buscarPorTexto(texto, limite = 10) {
    try {
      const url = `${this.apiURLLegacy}/search.pl`
      console.log(`🔍 Buscando texto: "${texto}"`)

      const response = await axios.get(url, {
        params: {
          search_terms: texto,
          search_simple: 1,
          action: 'process',
          json: 1,
          page_size: limite,
        },
      })

      if (response.data.products && response.data.products.length > 0) {
        return response.data.products.map((p) => this._mapearProducto(p))
      }

      console.log('⚠️ Sin resultados')
      return []
    } catch (error) {
      console.error('❌ Error al buscar texto:', error)
      return []
    }
  }

  /**
   * 🗺️ MAPEAR DATOS API → FORMATO APP
   * @private
   */
  _mapearProducto(productoAPI) {
    // Extraer cantidad y unidad
    const { cantidad, unidad } = this._extraerCantidadUnidad(productoAPI.quantity || '')

    return {
      nombre: productoAPI.product_name || '',
      marca: productoAPI.brands || '',
      codigoBarras: productoAPI.code || '',
      cantidad: cantidad,
      unidad: unidad,
      categoria: this._extraerPrimeraCategoria(productoAPI.categories || ''),
      imagen: productoAPI.image_url || null,
    }
  }

  /**
   * 📏 EXTRAER CANTIDAD Y UNIDAD
   * Ejemplos: "1 L" → {cantidad: 1, unidad: 'litro'}
   *           "500 ml" → {cantidad: 500, unidad: 'mililitro'}
   * @private
   */
  _extraerCantidadUnidad(textoQuantity) {
    if (!textoQuantity) return { cantidad: 1, unidad: 'unidad' }

    const textoLower = textoQuantity.toLowerCase().trim()

    // Patrones comunes
    const patrones = [
      { regex: /(\d+(?:\.\d+)?)\s*l(?:itros?)?/i, unidad: 'litro' },
      { regex: /(\d+(?:\.\d+)?)\s*ml/i, unidad: 'mililitro' },
      { regex: /(\d+(?:\.\d+)?)\s*kg/i, unidad: 'kilo' },
      { regex: /(\d+(?:\.\d+)?)\s*g(?:ramos?)?/i, unidad: 'gramo' },
      { regex: /(\d+(?:\.\d+)?)\s*u(?:nidades?)?/i, unidad: 'unidad' },
    ]

    for (const patron of patrones) {
      const match = textoLower.match(patron.regex)
      if (match) {
        return {
          cantidad: parseFloat(match[1]),
          unidad: patron.unidad,
        }
      }
    }

    // Si no matchea nada, devolver default
    return { cantidad: 1, unidad: 'unidad' }
  }

  /**
   * 🏷️ EXTRAER PRIMERA CATEGORÍA
   * La API devuelve categorías separadas por coma
   * @private
   */
  _extraerPrimeraCategoria(categorias) {
    if (!categorias) return ''

    const lista = categorias.split(',')
    return lista[0].trim()
  }
}

// 🧪 TESTING: Exponer en window para probar desde consola
if (typeof window !== 'undefined') {
  window.testAPI = new OpenFoodFactsService()
}

export default new OpenFoodFactsService()
