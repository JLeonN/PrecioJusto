// Servicio Google Books API — búsqueda de libros por ISBN (respaldo)

import axios from 'axios'

const BASE_URL = 'https://www.googleapis.com/books/v1/volumes'

class GoogleBooksService {
  async buscarPorIsbn(isbn) {
    try {
      const response = await axios.get(BASE_URL, {
        params: { q: `isbn:${isbn}` },
      })

      if (!response.data.totalItems || response.data.totalItems === 0) return null

      const item = response.data.items?.[0]
      if (!item) return null

      return this._mapearLibro(item, isbn)
    } catch (error) {
      console.error('❌ GoogleBooks error:', error)
      return null
    }
  }

  _mapearLibro(item, isbn) {
    const info = item.volumeInfo || {}
    // Reemplazar http por https en la miniatura de portada
    const imagenRaw = info.imageLinks?.thumbnail || null
    const imagen = imagenRaw ? imagenRaw.replace('http://', 'https://') : null

    return {
      nombre: info.title || '',
      marca: info.authors?.[0] || info.publisher || '',
      codigoBarras: isbn,
      cantidad: 1,
      unidad: 'unidad',
      categoria: 'Libro',
      imagen,
    }
  }
}

export default new GoogleBooksService()
