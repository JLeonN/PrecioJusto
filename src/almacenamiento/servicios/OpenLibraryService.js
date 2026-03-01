// Servicio Open Library API — búsqueda de libros por ISBN (primario)
// Usa Books API para evitar redirects 301 que fallan en Android WebView

import axios from 'axios'

const BOOKS_API_URL = 'https://openlibrary.org/api/books'
const COVERS_URL = 'https://covers.openlibrary.org/b/isbn'

class OpenLibraryService {
  async buscarPorIsbn(isbn) {
    try {
      const clave = `ISBN:${isbn}`
      const response = await axios.get(BOOKS_API_URL, {
        params: { bibkeys: clave, format: 'json', jscmd: 'data' },
      })

      const datos = response.data?.[clave]
      if (!datos) return null

      return this._mapearLibro(datos, isbn)
    } catch (error) {
      console.error('❌ OpenLibrary error:', error.message || error.code || error)
      return null
    }
  }

  _mapearLibro(datos, isbn) {
    if (!datos?.title) return null

    // Portada: preferir la que viene en la respuesta, fallback por ISBN
    const portada = datos.cover?.medium || datos.cover?.large || `${COVERS_URL}/${isbn}-M.jpg`
    const autor = datos.authors?.[0]?.name || ''

    return {
      nombre: datos.title || '',
      marca: autor,
      codigoBarras: isbn,
      cantidad: 1,
      unidad: 'unidad',
      categoria: 'Libro',
      imagen: portada,
    }
  }
}

export default new OpenLibraryService()
