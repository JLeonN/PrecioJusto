// Servicio Open Pet Food Facts API — alimentos y productos para mascotas

import axios from 'axios'

class OpenPetFoodFactsService {
  constructor() {
    this.baseURL = 'https://world.openpetfoodfacts.org/api/v2'
  }

  async buscarPorCodigoBarras(codigoBarras) {
    try {
      const url = `${this.baseURL}/product/${codigoBarras}`
      const response = await axios.get(url)

      if (response.data.status === 1 && response.data.product) {
        return this._mapearProducto(response.data.product)
      }

      return null
    } catch (error) {
      console.error('❌ OpenPetFoodFacts error:', error)
      return null
    }
  }

  _mapearProducto(productoAPI) {
    const { cantidad, unidad } = this._extraerCantidadUnidad(productoAPI.quantity || '')
    return {
      nombre: productoAPI.product_name || '',
      marca: productoAPI.brands || '',
      codigoBarras: productoAPI.code || '',
      cantidad,
      unidad,
      categoria: this._extraerPrimeraCategoria(productoAPI.categories || ''),
      imagen: productoAPI.image_url || null,
    }
  }

  _extraerCantidadUnidad(textoQuantity) {
    if (!textoQuantity) return { cantidad: 1, unidad: 'unidad' }
    const textoLower = textoQuantity.toLowerCase().trim()
    const patrones = [
      { regex: /(\d+(?:\.\d+)?)\s*l(?:itros?)?/i, unidad: 'litro' },
      { regex: /(\d+(?:\.\d+)?)\s*ml/i, unidad: 'mililitro' },
      { regex: /(\d+(?:\.\d+)?)\s*kg/i, unidad: 'kilo' },
      { regex: /(\d+(?:\.\d+)?)\s*g(?:ramos?)?/i, unidad: 'gramo' },
      { regex: /(\d+(?:\.\d+)?)\s*u(?:nidades?)?/i, unidad: 'unidad' },
    ]
    for (const patron of patrones) {
      const match = textoLower.match(patron.regex)
      if (match) return { cantidad: parseFloat(match[1]), unidad: patron.unidad }
    }
    return { cantidad: 1, unidad: 'unidad' }
  }

  _extraerPrimeraCategoria(categorias) {
    if (!categorias) return ''
    return categorias.split(',')[0].trim()
  }
}

export default new OpenPetFoodFactsService()
