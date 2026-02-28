// Servicio Open Library API — búsqueda de libros por ISBN (primario)

import axios from 'axios'

const BASE_URL = 'https://openlibrary.org/isbn'
const COVERS_URL = 'https://covers.openlibrary.org/b/isbn'

class OpenLibraryService {
  async buscarPorIsbn(isbn) {
    try {
      const response = await axios.get(`${BASE_URL}/${isbn}.json`)
      return this._mapearLibro(response.data, isbn)
    } catch (error) {
      // 404 = libro no encontrado — no es un error real
      if (error.response?.status !== 404) {
        console.error('❌ OpenLibrary error:', error)
      }
      return null
    }
  }

  _mapearLibro(datos, isbn) {
    if (!datos?.title) return null
    return {
      nombre: datos.title || '',
      // Los autores vienen como refs (/authors/OL...) — no se hace segundo request
      marca: '',
      codigoBarras: isbn,
      cantidad: 1,
      unidad: 'unidad',
      categoria: 'Libro',
      imagen: `${COVERS_URL}/${isbn}-M.jpg`,
    }
  }
}

export default new OpenLibraryService()
