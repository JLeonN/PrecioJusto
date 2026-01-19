/**
 * 💾 ADAPTADOR DE LOCAL STORAGE
 *
 * Este adaptador usa localStorage del navegador.
 * Ideal para: Testing, desarrollo web, prototipado rápido.
 *
 * ⚠️ LIMITACIONES:
 * - Solo disponible en navegador (no en SSR)
 * - Límite de ~5-10MB según navegador
 * - Datos se pierden al limpiar caché del navegador
 * - NO sincroniza entre dispositivos
 *
 * 🔥 MIGRAR A FIRESTORE:
 * Este adaptador es perfecto para probar tu lógica antes de Firebase.
 * Todos los métodos tienen la misma firma que FirestoreAdapter.
 */

class LocalStorageAdapter {
  constructor() {
    this.prefijo = 'precio_justo_' // Prefijo para evitar colisiones con otras apps

    // Verificar que localStorage esté disponible
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('⚠️ localStorage no disponible. Datos no persistirán.')
    }
  }

  /**
   * 💾 GUARDAR DATO
   * @param {string} clave - Identificador único
   * @param {any} valor - Dato a guardar (se convierte a JSON automáticamente)
   * @returns {Promise<boolean>} - true si guardó exitosamente
   *
   * 🔥 FIRESTORE EQUIVALENTE:
   * await db.collection('productos').doc(clave).set(valor)
   */
  async guardar(clave, valor) {
    try {
      const claveCompleta = this._construirClave(clave)
      const valorSerializado = JSON.stringify(valor)

      localStorage.setItem(claveCompleta, valorSerializado)

      console.log(`✅ Guardado: ${clave}`)
      return true
    } catch (error) {
      console.error(`❌ Error al guardar ${clave}:`, error)

      // Detectar si el error es por cuota excedida
      if (error.name === 'QuotaExceededError') {
        console.error('💥 localStorage lleno. Considera limpiar datos viejos.')
      }

      return false
    }
  }

  /**
   * 📖 OBTENER DATO
   * @param {string} clave - Identificador único
   * @returns {Promise<any|null>} - El dato o null si no existe
   *
   * 🔥 FIRESTORE EQUIVALENTE:
   * const doc = await db.collection('productos').doc(clave).get()
   * return doc.exists ? doc.data() : null
   */
  async obtener(clave) {
    try {
      const claveCompleta = this._construirClave(clave)
      const valorSerializado = localStorage.getItem(claveCompleta)

      if (valorSerializado === null) {
        console.log(`ℹ️ No existe: ${clave}`)
        return null
      }

      const valor = JSON.parse(valorSerializado)
      console.log(`✅ Obtenido: ${clave}`)
      return valor
    } catch (error) {
      console.error(`❌ Error al obtener ${clave}:`, error)
      return null
    }
  }

  /**
   * 🗑️ ELIMINAR DATO
   * @param {string} clave - Identificador único
   * @returns {Promise<boolean>} - true si eliminó exitosamente
   *
   * 🔥 FIRESTORE EQUIVALENTE:
   * await db.collection('productos').doc(clave).delete()
   */
  async eliminar(clave) {
    try {
      const claveCompleta = this._construirClave(clave)
      localStorage.removeItem(claveCompleta)

      console.log(`✅ Eliminado: ${clave}`)
      return true
    } catch (error) {
      console.error(`❌ Error al eliminar ${clave}:`, error)
      return false
    }
  }

  /**
   * 📋 LISTAR TODOS LOS DATOS (con filtro opcional)
   * @param {string} prefijoBusqueda - Filtro opcional (ej: 'producto_')
   * @returns {Promise<Array>} - Array de objetos {clave, valor}
   *
   * 🔥 FIRESTORE EQUIVALENTE:
   * const snapshot = await db.collection('productos').get()
   * return snapshot.docs.map(doc => ({clave: doc.id, valor: doc.data()}))
   */
  async listarTodo(prefijoBusqueda = '') {
    try {
      const resultados = []
      const claves = Object.keys(localStorage)

      for (const claveCompleta of claves) {
        // Filtrar solo claves de nuestra app
        if (!claveCompleta.startsWith(this.prefijo)) continue

        // Extraer la clave sin prefijo
        const clave = claveCompleta.replace(this.prefijo, '')

        // Aplicar filtro adicional si existe
        if (prefijoBusqueda && !clave.startsWith(prefijoBusqueda)) continue

        // Obtener el valor
        const valorSerializado = localStorage.getItem(claveCompleta)
        if (valorSerializado) {
          try {
            const valor = JSON.parse(valorSerializado)
            resultados.push({ clave, valor })
          } catch (error) {
            console.warn(`⚠️ Dato corrupto en ${clave}, ignorando...`, error)
          }
        }
      }

      console.log(`✅ Listados ${resultados.length} registros (filtro: '${prefijoBusqueda}')`)
      return resultados
    } catch (error) {
      console.error('❌ Error al listar:', error)
      return []
    }
  }

  /**
   * 🔍 BUSCAR POR CAMPO (útil para queries)
   * @param {string} prefijoBusqueda - Tipo de dato (ej: 'producto_')
   * @param {string} campo - Campo a buscar
   * @param {any} valorBuscado - Valor a comparar
   * @returns {Promise<Array>} - Array de registros que coinciden
   *
   * 🔥 FIRESTORE EQUIVALENTE:
   * const snapshot = await db.collection('productos')
   *   .where(campo, '==', valorBuscado).get()
   *
   * ⚠️ LIMITACIÓN: Este método carga TODOS los datos en memoria y filtra.
   * En Firestore es mucho más eficiente (índices del lado del servidor).
   */
  async buscarPorCampo(prefijoBusqueda, campo, valorBuscado) {
    try {
      const todosLosDatos = await this.listarTodo(prefijoBusqueda)

      const resultados = todosLosDatos.filter((registro) => {
        return registro.valor[campo] === valorBuscado
      })

      console.log(`✅ Encontrados ${resultados.length} registros con ${campo}=${valorBuscado}`)
      return resultados
    } catch (error) {
      console.error('❌ Error al buscar:', error)
      return []
    }
  }

  /**
   * 🧹 LIMPIAR TODO (PELIGROSO - solo para desarrollo)
   * Elimina TODOS los datos de la app
   *
   * 🔥 FIRESTORE: NO implementar esto en producción
   */
  async limpiarTodo() {
    try {
      const claves = Object.keys(localStorage)
      let contador = 0

      for (const claveCompleta of claves) {
        if (claveCompleta.startsWith(this.prefijo)) {
          localStorage.removeItem(claveCompleta)
          contador++
        }
      }

      console.log(`✅ Limpiados ${contador} registros`)
      return true
    } catch (error) {
      console.error('❌ Error al limpiar:', error)
      return false
    }
  }

  /**
   * 📊 OBTENER ESTADÍSTICAS (útil para debugging)
   */
  async obtenerEstadisticas() {
    const todosLosDatos = await this.listarTodo()
    const tamañoBytes = JSON.stringify(todosLosDatos).length
    const tamañoKB = (tamañoBytes / 1024).toFixed(2)

    return {
      totalRegistros: todosLosDatos.length,
      tamañoKB: tamañoKB,
      espacioUsado: `${tamañoKB} KB / ~5000 KB disponibles`,
    }
  }

  // ========================================
  // 🔧 MÉTODOS PRIVADOS (HELPERS)
  // ========================================

  /**
   * Construir clave completa con prefijo
   * @private
   */
  _construirClave(clave) {
    return `${this.prefijo}${clave}`
  }
}

export default LocalStorageAdapter

// 🔥 CHECKLIST PARA MIGRACIÓN A FIRESTORE:
//
// [ ] Los métodos guardar/obtener/eliminar/listarTodo funcionan correctamente
// [ ] Probaste con datos grandes (productos con muchos precios)
// [ ] Testeaste el manejo de errores (storage lleno, datos corruptos)
// [ ] La lógica de negocio NO depende de características específicas de localStorage
// [ ] Estás usando los mismos nombres de métodos que usará FirestoreAdapter
//
// Cuando migrés a Firestore:
// 1. buscarPorCampo() será MUCHO más rápido (índices server-side)
// 2. listarTodo() puede necesitar paginación si tenés +1000 productos
// 3. Considera agregar método suscribirACambios() para tiempo real
