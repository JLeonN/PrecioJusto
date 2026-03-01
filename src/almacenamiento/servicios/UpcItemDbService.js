// Servicio UPCitemdb Trial API — comodín general (686M+ productos, 100 req/día)

import axios from 'axios'

const BASE_URL = 'https://api.upcitemdb.com/prod/trial/lookup'

class UpcItemDbService {
  async buscarPorCodigo(codigo) {
    try {
      const response = await axios.get(BASE_URL, {
        params: { upc: codigo },
      })

      if (response.data.code !== 'OK' || !response.data.items?.length) return null

      return this._mapearProducto(response.data.items[0], codigo)
    } catch (error) {
      // 429 = rate limit alcanzado — no romper el flujo
      if (error.response?.status === 429) {
        console.warn('⚠️ UPCitemdb: límite diario alcanzado (100 req/día)')
        return null
      }
      if (error.code === 'ERR_NETWORK') return null // CORS en browser dev — OK en Android nativo
      console.error('❌ UPCitemdb error:', error)
      return null
    }
  }

  _mapearProducto(item, codigo) {
    if (!item) return null
    // Tomar solo el primer segmento si la categoría es un breadcrumb ("A > B > C")
    const categoriaRaw = item.category || ''
    const categoria = categoriaRaw.split('>')[0].trim()

    return {
      nombre: item.title || '',
      marca: item.brand || '',
      codigoBarras: item.ean || item.upc || codigo,
      cantidad: 1,
      unidad: 'unidad',
      categoria,
      imagen: item.images?.[0] || null,
    }
  }
}

export default new UpcItemDbService()
