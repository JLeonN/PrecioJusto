/**
 * 🛒 SERVICIO DE PRODUCTOS
 *
 * Este servicio maneja TODA la lógica de negocio relacionada con productos.
 * NO sabe si usa localStorage, Capacitor o Firestore (eso lo decide el adaptador).
 *
 * 📌 RESPONSABILIDADES:
 * - CRUD de productos (Crear, Leer, Actualizar, Eliminar)
 * - Validaciones de datos
 * - Cálculos de tendencias y estadísticas
 * - Transformaciones de datos
 * - Búsqueda y deduplicación
 *
 * 🔥 MIGRACIÓN A FIRESTORE:
 * Este servicio NO necesita cambios al migrar a Firestore.
 * Solo cambia el adaptador en AlmacenamientoService.js
 */

import { adaptadorActual } from './AlmacenamientoService.js'

class ProductosService {
  constructor() {
    this.adaptador = adaptadorActual
    this.prefijoProductos = 'producto_'

    console.log('🛒 ProductosService inicializado con', this.adaptador.constructor.name)
  }

  // ========================================
  // 📝 CREAR / GUARDAR
  // ========================================

  /**
   * 💾 GUARDAR PRODUCTO
   * @param {Object} producto - Datos del producto
   * @returns {Promise<Object|null>} - Producto guardado o null si falla
   *
   * 🔥 FIRESTORE: Este método NO cambia, solo el adaptador interno.
   * En Firestore se guardará automáticamente con el mismo formato.
   */
  async guardarProducto(producto) {
    try {
      // Validar datos básicos
      const erroresValidacion = this._validarProducto(producto)
      if (erroresValidacion.length > 0) {
        console.error('❌ Validación fallida:', erroresValidacion)
        return null
      }

      // Generar ID si no existe
      if (!producto.id) {
        producto.id = this._generarId()
      }

      // Agregar timestamps
      const ahora = new Date().toISOString()
      producto.fechaCreacion = producto.fechaCreacion || ahora
      producto.fechaActualizacion = ahora

      // Calcular campos automáticos
      producto = this._calcularCamposAutomaticos(producto)

      // Guardar en el adaptador
      const clave = `${this.prefijoProductos}${producto.id}`
      const guardado = await this.adaptador.guardar(clave, producto)

      if (guardado) {
        console.log(`✅ Producto guardado: ${producto.nombre} (ID: ${producto.id})`)
        return producto
      }

      return null
    } catch (error) {
      console.error('❌ Error al guardar producto:', error)
      return null
    }
  }

  /**
   * ➕ AGREGAR PRECIO A PRODUCTO
   * @param {number} productoId - ID del producto
   * @param {Object} precio - Nuevo precio {comercioId, direccionId, valor, moneda, usuarioId}
   * @returns {Promise<Object|null>} - Producto actualizado o null
   *
   * 🔥 FIRESTORE EQUIVALENTE:
   * await db.collection('productos').doc(productoId).update({
   *   precios: firebase.firestore.FieldValue.arrayUnion(precio)
   * })
   */
  async agregarPrecio(productoId, precio) {
    try {
      // Obtener producto actual
      const producto = await this.obtenerProducto(productoId)
      if (!producto) {
        console.error(`❌ Producto ${productoId} no encontrado`)
        return null
      }

      // Validar precio
      if (!precio.valor || precio.valor <= 0) {
        console.error('❌ Precio inválido:', precio)
        return null
      }

      // Validar comercioId y direccionId
      if (!precio.comercioId || !precio.direccionId) {
        console.warn('⚠️ Precio sin comercioId/direccionId (datos legacy)')
        // Mantener compatibilidad con precios viejos
      }

      // Generar ID para el precio
      precio.id = precio.id || this._generarId()
      precio.fecha = precio.fecha || new Date().toISOString()
      precio.confirmaciones = precio.confirmaciones || 0

      // Asegurar que tenga comercio y dirección (strings para compatibilidad)
      if (!precio.comercio) {
        precio.comercio = precio.nombreCompleto?.split(' - ')[0] || 'Desconocido'
      }
      if (!precio.direccion) {
        precio.direccion = precio.nombreCompleto?.split(' - ')[1] || ''
      }

      // Agregar a la lista de precios
      producto.precios = producto.precios || []
      producto.precios.push(precio)

      // Recalcular campos automáticos
      const productoActualizado = this._calcularCamposAutomaticos(producto)

      // Guardar
      return await this.guardarProducto(productoActualizado)
    } catch (error) {
      console.error('❌ Error al agregar precio:', error)
      return null
    }
  }

  // ========================================
  // 📖 LEER / OBTENER
  // ========================================

  /**
   * 📖 OBTENER PRODUCTO POR ID
   * @param {number} productoId - ID del producto
   * @returns {Promise<Object|null>} - Producto o null si no existe
   */
  async obtenerProducto(productoId) {
    try {
      const clave = `${this.prefijoProductos}${productoId}`
      const producto = await this.adaptador.obtener(clave)

      if (producto) {
        console.log(`✅ Producto obtenido: ${producto.nombre}`)
      }

      return producto
    } catch (error) {
      console.error(`❌ Error al obtener producto ${productoId}:`, error)
      return null
    }
  }

  /**
   * 📋 OBTENER TODOS LOS PRODUCTOS
   * @returns {Promise<Array>} - Array de productos
   *
   * 🔥 FIRESTORE: Considerar paginación si hay +100 productos
   * const snapshot = await db.collection('productos')
   *   .limit(50)
   *   .orderBy('fechaActualizacion', 'desc')
   *   .get()
   */
  async obtenerTodos() {
    try {
      const resultados = await this.adaptador.listarTodo(this.prefijoProductos)
      const productos = resultados.map((r) => r.valor)

      console.log(`✅ Obtenidos ${productos.length} productos`)
      return productos
    } catch (error) {
      console.error('❌ Error al obtener productos:', error)
      return []
    }
  }

  /**
   * 🔍 BUSCAR PRODUCTOS POR NOMBRE
   * @param {string} termino - Término de búsqueda
   * @returns {Promise<Array>} - Productos que coinciden
   *
   * 🔥 FIRESTORE: Usar índices de texto completo o Algolia para búsqueda avanzada
   */
  async buscarPorNombre(termino) {
    try {
      const todosLosProductos = await this.obtenerTodos()
      const terminoLower = termino.toLowerCase()

      const resultados = todosLosProductos.filter((producto) =>
        producto.nombre.toLowerCase().includes(terminoLower),
      )

      console.log(`✅ Encontrados ${resultados.length} productos con "${termino}"`)
      return resultados
    } catch (error) {
      console.error('❌ Error al buscar productos:', error)
      return []
    }
  }

  /**
   * 🔍 BUSCAR PRODUCTO POR CÓDIGO DE BARRAS
   * @param {string} codigoBarras - Código de barras del producto
   * @returns {Promise<Object|null>} - Producto encontrado o null
   *
   * 🎯 NUEVO: Para evitar duplicados
   */
  async buscarPorCodigoBarras(codigoBarras) {
    try {
      // Si no hay código, retornar null
      if (!codigoBarras || codigoBarras.trim() === '') {
        return null
      }

      const todosLosProductos = await this.obtenerTodos()
      const codigoNormalizado = codigoBarras.trim()

      // Buscar coincidencia exacta
      const productoEncontrado = todosLosProductos.find(
        (producto) => producto.codigoBarras && producto.codigoBarras.trim() === codigoNormalizado,
      )

      if (productoEncontrado) {
        console.log(
          `✅ Producto encontrado por código: ${productoEncontrado.nombre} (${codigoNormalizado})`,
        )
      } else {
        console.log(`ℹ️ No existe producto con código: ${codigoNormalizado}`)
      }

      return productoEncontrado || null
    } catch (error) {
      console.error('❌ Error al buscar por código de barras:', error)
      return null
    }
  }

  // ========================================
  // 🗑️ ELIMINAR
  // ========================================

  /**
   * 🗑️ ELIMINAR PRODUCTO
   * @param {number} productoId - ID del producto
   * @returns {Promise<boolean>} - true si eliminó exitosamente
   *
   * 🔥 FIRESTORE: Considerar "soft delete" (marcar como eliminado en vez de borrar)
   * await db.collection('productos').doc(productoId).update({
   *   eliminado: true,
   *   fechaEliminacion: new Date()
   * })
   */
  async eliminarProducto(productoId) {
    try {
      const clave = `${this.prefijoProductos}${productoId}`
      const eliminado = await this.adaptador.eliminar(clave)

      if (eliminado) {
        console.log(`✅ Producto ${productoId} eliminado`)
      }

      return eliminado
    } catch (error) {
      console.error(`❌ Error al eliminar producto ${productoId}:`, error)
      return false
    }
  }

  // ========================================
  // 🧮 CÁLCULOS Y TRANSFORMACIONES
  // ========================================
  /* Calcular campos automáticos del producto (precio vigente por comercio) */
  _calcularCamposAutomaticos(producto) {
    if (!producto.precios || producto.precios.length === 0) {
      producto.precioMejor = 0
      producto.comercioMejor = 'Sin datos'
      producto.diferenciaPrecio = 0
      producto.tendenciaGeneral = 'estable'
      producto.porcentajeTendencia = 0
      return producto
    }

    /* 1. Agrupar precios por comercio — usar IDs si existen, sino nombreCompleto como fallback legacy */
    const preciosPorComercio = {}

    producto.precios.forEach((precio) => {
      const clave =
        precio.comercioId && precio.direccionId
          ? `${precio.comercioId}_${precio.direccionId}`
          : precio.nombreCompleto || precio.comercio || 'Sin comercio'

      if (!preciosPorComercio[clave]) {
        preciosPorComercio[clave] = []
      }

      preciosPorComercio[clave].push(precio)
    })

    /* 2. Tomar el precio MÁS RECIENTE de cada comercio (precio vigente) */
    const preciosVigentes = Object.values(preciosPorComercio).map((preciosDelComercio) => {
      const ordenadosPorFecha = [...preciosDelComercio].sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha),
      )
      return ordenadosPorFecha[0]
    })

    /* 3. De los precios vigentes, encontrar el más bajo */
    const vigentesOrdenados = [...preciosVigentes].sort((a, b) => a.valor - b.valor)
    const mejorPrecioVigente = vigentesOrdenados[0]

    producto.precioMejor = mejorPrecioVigente.valor
    producto.comercioMejor = mejorPrecioVigente.nombreCompleto || mejorPrecioVigente.comercio

    /* 4. Marcar cuál es el mejor precio vigente */
    producto.precios.forEach((precio) => {
      precio.esMejor = precio.id === mejorPrecioVigente.id
    })

    /* 5. Diferencia entre mejor y peor precio VIGENTE */
    const peorPrecioVigente = vigentesOrdenados[vigentesOrdenados.length - 1]
    producto.diferenciaPrecio = peorPrecioVigente.valor - mejorPrecioVigente.valor

    /* 6. Tendencia y porcentaje (conservar lógica existente) */
    producto.tendenciaGeneral = this._calcularTendencia(producto.precios)
    producto.porcentajeTendencia = this._calcularPorcentajeTendencia(producto.precios)

    return producto
  }

  /**
   * 📊 CALCULAR TENDENCIA GENERAL
   * Compara precios recientes con históricos
   * @private
   */
  _calcularTendencia(precios) {
    if (precios.length < 2) return 'estable'

    const ahora = new Date()
    const hace30Dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Precios recientes (últimos 30 días)
    const preciosRecientes = precios.filter((p) => new Date(p.fecha) >= hace30Dias)

    if (preciosRecientes.length === 0) return 'estable'

    // Calcular promedio reciente
    const promedioReciente =
      preciosRecientes.reduce((sum, p) => sum + p.valor, 0) / preciosRecientes.length

    // Calcular promedio histórico (antes de 30 días)
    const preciosHistoricos = precios.filter((p) => new Date(p.fecha) < hace30Dias)

    if (preciosHistoricos.length === 0) return 'estable'

    const promedioHistorico =
      preciosHistoricos.reduce((sum, p) => sum + p.valor, 0) / preciosHistoricos.length

    // Comparar
    const diferenciaPorcentaje = ((promedioReciente - promedioHistorico) / promedioHistorico) * 100

    if (diferenciaPorcentaje < -2) return 'bajando'
    if (diferenciaPorcentaje > 2) return 'subiendo'
    return 'estable'
  }

  /**
   * 📊 CALCULAR PORCENTAJE DE TENDENCIA
   * @private
   */
  _calcularPorcentajeTendencia(precios) {
    if (precios.length < 2) return 0

    const ahora = new Date()
    const hace30Dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000)

    const preciosRecientes = precios.filter((p) => new Date(p.fecha) >= hace30Dias)
    const preciosHistoricos = precios.filter((p) => new Date(p.fecha) < hace30Dias)

    if (preciosRecientes.length === 0 || preciosHistoricos.length === 0) return 0

    const promedioReciente =
      preciosRecientes.reduce((sum, p) => sum + p.valor, 0) / preciosRecientes.length
    const promedioHistorico =
      preciosHistoricos.reduce((sum, p) => sum + p.valor, 0) / preciosHistoricos.length

    const diferencia = ((promedioReciente - promedioHistorico) / promedioHistorico) * 100

    return Math.round(diferencia)
  }

  // ========================================
  // ✅ VALIDACIONES
  // ========================================

  /**
   * ✅ VALIDAR PRODUCTO
   * @private
   */
  _validarProducto(producto) {
    const errores = []

    if (!producto.nombre || producto.nombre.trim() === '') {
      errores.push('El nombre es obligatorio')
    }

    if (producto.nombre && producto.nombre.length > 200) {
      errores.push('El nombre no puede superar 200 caracteres')
    }

    if (producto.precios && !Array.isArray(producto.precios)) {
      errores.push('precios debe ser un array')
    }

    return errores
  }

  // ========================================
  // 🔧 UTILIDADES
  // ========================================

  /**
   * 🆔 GENERAR ID ÚNICO
   * @private
   *
   * 🔥 FIRESTORE: Firestore genera IDs automáticamente con doc().
   * Este método es solo para localStorage/Capacitor.
   */
  _generarId() {
    return Date.now() + Math.random().toString(36).substr(2, 9)
  }

  /**
   * 📊 OBTENER ESTADÍSTICAS GENERALES
   */
  async obtenerEstadisticas() {
    const productos = await this.obtenerTodos()
    const totalPrecios = productos.reduce((sum, p) => sum + (p.precios?.length || 0), 0)

    return {
      totalProductos: productos.length,
      totalPrecios: totalPrecios,
      promedioPrecios: productos.length > 0 ? Math.round(totalPrecios / productos.length) : 0,
    }
  }
}

// Exportar instancia única (Singleton)
export default new ProductosService()
