/**
 * 🎯 COMPOSABLE: SELECCIÓN MÚLTIPLE
 *
 * Maneja toda la lógica de selección múltiple para listas.
 * Reutilizable en cualquier componente con listas de items.
 *
 * 📌 FEATURES:
 * - Activar/desactivar modo selección
 * - Seleccionar/deseleccionar items individuales
 * - Seleccionar todos / Deseleccionar todos
 * - Long press para activar modo selección
 * - Estado reactivo compartido
 *
 * 🔄 USO:
 * const {
 *   modoSeleccion,
 *   seleccionados,
 *   activarModoSeleccion,
 *   ...
 * } = useSeleccionMultiple()
 */

import { ref, computed } from 'vue'

export function useSeleccionMultiple() {
  // ========================================
  // 📊 ESTADO
  // ========================================

  /**
   * 🎯 Modo selección activo
   */
  const modoSeleccion = ref(false)

  /**
   * ✅ IDs de items seleccionados
   */
  const seleccionados = ref(new Set())

  /**
   * 📋 Lista completa de items disponibles
   * Se actualiza desde el componente padre
   */
  const itemsDisponibles = ref([])

  // ========================================
  // 🧮 COMPUTED
  // ========================================

  /**
   * 🔢 Cantidad de items seleccionados
   */
  const cantidadSeleccionados = computed(() => seleccionados.value.size)

  /**
   * 🔢 Cantidad total de items disponibles
   */
  const totalItems = computed(() => itemsDisponibles.value.length)

  /**
   * ❓ ¿Hay items seleccionados?
   */
  const haySeleccionados = computed(() => seleccionados.value.size > 0)

  /**
   * ❓ ¿Todos los items están seleccionados?
   */
  const todoSeleccionado = computed(() => {
    return (
      itemsDisponibles.value.length > 0 &&
      seleccionados.value.size === itemsDisponibles.value.length
    )
  })

  /**
   * ❓ ¿Algún item está seleccionado pero no todos?
   */
  const seleccionParcial = computed(() => {
    return haySeleccionados.value && !todoSeleccionado.value
  })

  /**
   * 📋 Array de IDs seleccionados (para facilitar iteración)
   */
  const arraySeleccionados = computed(() => {
    return Array.from(seleccionados.value)
  })

  // ========================================
  // 🔄 MÉTODOS - ACTIVAR/DESACTIVAR
  // ========================================

  /**
   * ✅ ACTIVAR MODO SELECCIÓN
   * @param {string|number} itemIdInicial - ID del item que activó el modo (opcional)
   */
  function activarModoSeleccion(itemIdInicial = null) {
    modoSeleccion.value = true

    // Si se especifica un item inicial, marcarlo
    if (itemIdInicial !== null) {
      seleccionados.value.add(itemIdInicial)
    }

    console.log('✅ Modo selección activado')
  }

  /**
   * ❌ DESACTIVAR MODO SELECCIÓN
   */
  function desactivarModoSeleccion() {
    modoSeleccion.value = false
    seleccionados.value.clear()
    console.log('❌ Modo selección desactivado')
  }

  // ========================================
  // 🔄 MÉTODOS - SELECCIONAR/DESELECCIONAR
  // ========================================

  /**
   * 🔄 TOGGLE SELECCIÓN DE UN ITEM
   * @param {string|number} itemId - ID del item
   */
  function toggleSeleccion(itemId) {
    if (seleccionados.value.has(itemId)) {
      seleccionados.value.delete(itemId)
      console.log(`➖ Item ${itemId} deseleccionado`)
    } else {
      seleccionados.value.add(itemId)
      console.log(`➕ Item ${itemId} seleccionado`)
    }
  }

  /**
   * ✅ SELECCIONAR UN ITEM
   * @param {string|number} itemId - ID del item
   */
  function seleccionarItem(itemId) {
    if (!seleccionados.value.has(itemId)) {
      seleccionados.value.add(itemId)
      console.log(`➕ Item ${itemId} seleccionado`)
    }
  }

  /**
   * ❌ DESELECCIONAR UN ITEM
   * @param {string|number} itemId - ID del item
   */
  function deseleccionarItem(itemId) {
    if (seleccionados.value.has(itemId)) {
      seleccionados.value.delete(itemId)
      console.log(`➖ Item ${itemId} deseleccionado`)
    }
  }

  /**
   * ❓ VERIFICAR SI UN ITEM ESTÁ SELECCIONADO
   * @param {string|number} itemId - ID del item
   * @returns {boolean}
   */
  function estaSeleccionado(itemId) {
    return seleccionados.value.has(itemId)
  }

  // ========================================
  // 🔄 MÉTODOS - SELECCIONAR/DESELECCIONAR TODO
  // ========================================

  /**
   * ☑️ SELECCIONAR TODOS LOS ITEMS
   */
  function seleccionarTodos() {
    itemsDisponibles.value.forEach((item) => {
      seleccionados.value.add(item.id)
    })
    console.log(`☑️ Todos los items seleccionados (${itemsDisponibles.value.length})`)
  }

  /**
   * ⬜ DESELECCIONAR TODOS LOS ITEMS
   */
  function deseleccionarTodos() {
    seleccionados.value.clear()
    console.log('⬜ Todos los items deseleccionados')
  }

  /**
   * 🔄 TOGGLE SELECCIONAR TODOS
   * Si están todos seleccionados → deseleccionar todos
   * Si no → seleccionar todos
   */
  function toggleSeleccionarTodos() {
    if (todoSeleccionado.value) {
      deseleccionarTodos()
    } else {
      seleccionarTodos()
    }
  }

  // ========================================
  // 🔄 MÉTODOS - ACTUALIZAR ITEMS
  // ========================================

  /**
   * 🔄 ACTUALIZAR LISTA DE ITEMS DISPONIBLES
   * @param {Array} nuevosItems - Array de items con propiedad 'id'
   */
  function actualizarItems(nuevosItems) {
    itemsDisponibles.value = nuevosItems

    // Limpiar seleccionados que ya no existen
    const idsDisponibles = new Set(nuevosItems.map((item) => item.id))
    const seleccionadosActualizados = new Set()

    seleccionados.value.forEach((id) => {
      if (idsDisponibles.has(id)) {
        seleccionadosActualizados.add(id)
      }
    })

    seleccionados.value = seleccionadosActualizados
  }

  // ========================================
  // 🔄 MÉTODOS - AFTER DELETE (útil para undo)
  // ========================================

  /**
   * 🗑️ LIMPIAR SELECCIÓN DESPUÉS DE ELIMINAR
   * Desactiva modo selección y limpia seleccionados
   */
  function limpiarDespuesDeEliminar() {
    desactivarModoSeleccion()
  }

  // ========================================
  // 📤 RETURN (EXPORTAR)
  // ========================================

  return {
    // Estado
    modoSeleccion,
    seleccionados,
    itemsDisponibles,

    // Computed
    cantidadSeleccionados,
    totalItems,
    haySeleccionados,
    todoSeleccionado,
    seleccionParcial,
    arraySeleccionados,

    // Métodos - Activar/Desactivar
    activarModoSeleccion,
    desactivarModoSeleccion,

    // Métodos - Seleccionar items
    toggleSeleccion,
    seleccionarItem,
    deseleccionarItem,
    estaSeleccionado,

    // Métodos - Seleccionar todos
    seleccionarTodos,
    deseleccionarTodos,
    toggleSeleccionarTodos,

    // Métodos - Actualizar
    actualizarItems,
    limpiarDespuesDeEliminar,
  }
}
