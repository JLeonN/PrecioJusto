// Orquestador central de búsqueda de productos por código de barras.
// Prueba las APIs en orden y retorna el primer resultado exitoso.

import openFoodFactsService from './OpenFoodFactsService'
import openBeautyFactsService from './OpenBeautyFactsService'
import openPetFoodFactsService from './OpenPetFoodFactsService'
import openProductsFactsService from './OpenProductsFactsService'
import openLibraryService from './OpenLibraryService'
import googleBooksService from './GoogleBooksService'
import upcItemDbService from './UpcItemDbService'

// Etiquetas de fuente para mostrar en la UI
const FUENTES = {
  OPEN_FOOD_FACTS: 'Open Food Facts',
  OPEN_BEAUTY_FACTS: 'Open Beauty Facts',
  OPEN_PET_FOOD_FACTS: 'Open Pet Food Facts',
  OPEN_PRODUCTS_FACTS: 'Open Products Facts',
  OPEN_LIBRARY: 'Open Library',
  GOOGLE_BOOKS: 'Google Books',
  UPC_ITEM_DB: 'UPCitemdb',
}

class BuscadorProductosService {
  /**
   * Busca un producto por código de barras usando la cadena de APIs.
   * @param {string} codigo - Código EAN/UPC/ISBN
   * @returns {Promise<{producto: Object, fuenteDato: string}|null>}
   */
  async buscarPorCodigo(codigo) {
    if (!codigo) return null

    // ISBNs siempre empiezan con 978 o 979 → flujo libros
    if (codigo.startsWith('978') || codigo.startsWith('979')) {
      return await this._buscarLibro(codigo)
    }

    return await this._buscarProductoGeneral(codigo)
  }

  async _buscarLibro(isbn) {
    // 1. Open Library (primario)
    const productoOpenLibrary = await openLibraryService.buscarPorIsbn(isbn)
    if (productoOpenLibrary) return { producto: productoOpenLibrary, fuenteDato: FUENTES.OPEN_LIBRARY }

    // 2. Google Books (respaldo)
    const productoGoogleBooks = await googleBooksService.buscarPorIsbn(isbn)
    if (productoGoogleBooks) return { producto: productoGoogleBooks, fuenteDato: FUENTES.GOOGLE_BOOKS }

    return null
  }

  async _buscarProductoGeneral(codigo) {
    // 1. Open Food Facts (alimentos — ya integrado)
    const productoFood = await openFoodFactsService.buscarPorCodigoBarras(codigo)
    if (productoFood) return { producto: productoFood, fuenteDato: FUENTES.OPEN_FOOD_FACTS }

    // 2. Open Beauty Facts (cosméticos)
    const productoBeauty = await openBeautyFactsService.buscarPorCodigoBarras(codigo)
    if (productoBeauty) return { producto: productoBeauty, fuenteDato: FUENTES.OPEN_BEAUTY_FACTS }

    // 3. Open Pet Food Facts (mascotas)
    const productoPet = await openPetFoodFactsService.buscarPorCodigoBarras(codigo)
    if (productoPet) return { producto: productoPet, fuenteDato: FUENTES.OPEN_PET_FOOD_FACTS }

    // 4. Open Products Facts (productos generales)
    const productoProducts = await openProductsFactsService.buscarPorCodigoBarras(codigo)
    if (productoProducts) return { producto: productoProducts, fuenteDato: FUENTES.OPEN_PRODUCTS_FACTS }

    // 5. UPCitemdb (comodín de última instancia)
    const productoUpc = await upcItemDbService.buscarPorCodigo(codigo)
    if (productoUpc) return { producto: productoUpc, fuenteDato: FUENTES.UPC_ITEM_DB }

    return null
  }
}

export default new BuscadorProductosService()
