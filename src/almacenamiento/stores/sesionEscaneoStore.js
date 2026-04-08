import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { adaptadorActual } from '../servicios/AlmacenamientoService.js'

// Clave usada para persistir la sesión en el adaptador
const CLAVE_SESION = 'sesion_escaneo'

export const useSesionEscaneoStore = defineStore('sesionEscaneo', () => {
  // ========================================
  // ESTADO
  // ========================================

  // Items escaneados pendientes de guardar en Mis Productos
  // Cada item tiene su propio { comercio } (null hasta asignarlo en la Mesa de trabajo)
  const items = ref([])

  // true mientras se cargan los datos del almacenamiento al iniciar
  const cargando = ref(false)

  // ========================================
  // GETTERS
  // ========================================

  // Cantidad de items en la mesa (para el badge del DRAWER)
  const cantidadItems = computed(() => items.value.length)

  // true si hay al menos un item pendiente
  const tieneItemsPendientes = computed(() => items.value.length > 0)

  // ========================================
  // PERSISTENCIA
  // ========================================

  // Guarda el estado completo en el adaptador
  async function _persistir() {
    await adaptadorActual.guardar(CLAVE_SESION, { items: items.value })
  }

  // Observa cambios y guarda automáticamente
  watch(items, () => { _persistir() }, { deep: true })

  // ========================================
  // ACCIONES
  // ========================================

  // Carga la sesión guardada al iniciar la app
  async function cargarSesion() {
    cargando.value = true
    try {
      const datos = await adaptadorActual.obtener(CLAVE_SESION)
      if (datos) {
        // Migración: ítems guardados sin campo `comercio` reciben comercio: null
        items.value = (datos.items || []).map((item) => ({
          ...item,
          comercio: item.comercio ?? null,
          sinCoincidencia: item.sinCoincidencia ?? false,
          activarPreciosMayoristas: item.activarPreciosMayoristas ?? false,
          escalasPorCantidad: Array.isArray(item.escalasPorCantidad) ? item.escalasPorCantidad : [],
        }))
      }
    } catch (error) {
      console.error('Error al cargar sesión de escaneo:', error)
    } finally {
      cargando.value = false
    }
  }

  // Agrega un item escaneado a la mesa de trabajo
  function agregarItem(item) {
    items.value.push({
      id: _generarId(),
      codigoBarras: item.codigoBarras || null,
      nombre: item.nombre || '',
      marca: item.marca || null,
      cantidad: item.cantidad || 1,
      unidad: item.unidad || 'unidad',
      imagen: item.imagen || null,
      precio: item.precio || 0,
      moneda: item.moneda || 'UYU',
      activarPreciosMayoristas: item.activarPreciosMayoristas || false,
      escalasPorCantidad: Array.isArray(item.escalasPorCantidad) ? item.escalasPorCantidad : [],
      origenApi: item.origenApi || false,
      fuenteDato: item.fuenteDato || null,
      sinCoincidencia: item.sinCoincidencia || false,
      productoExistenteId: item.productoExistenteId || null,
      comercio: item.comercio ?? null, // { id, nombre, direccionId, direccionNombre } | null
      // Snapshot inmutable del estado original (para poder recuperar foto/datos)
      datosOriginales: (item.origenApi || item.productoExistenteId)
        ? {
            nombre: item.nombre || '',
            marca: item.marca || null,
            cantidad: item.cantidad || 1,
            unidad: item.unidad || 'unidad',
            imagen: item.imagen || null,
          }
        : null,
    })
  }

  // Actualiza campos de un item existente por su id
  function actualizarItem(id, cambios) {
    const indice = items.value.findIndex((i) => i.id === id)
    if (indice !== -1) {
      items.value[indice] = { ...items.value[indice], ...cambios }
    }
  }

  // Asigna un comercio en bloque a los ítems indicados por sus IDs
  function asignarComercio(ids, comercio) {
    const conjuntoIds = new Set(ids)
    items.value = items.value.map((item) =>
      conjuntoIds.has(item.id) ? { ...item, comercio } : item,
    )
  }

  // Elimina un item de la mesa por su id
  function eliminarItem(id) {
    items.value = items.value.filter((i) => i.id !== id)
  }

  // Vacía la mesa de trabajo por completo
  async function limpiarTodo() {
    items.value = []
    await adaptadorActual.eliminar(CLAVE_SESION)
  }

  // ========================================
  // HELPERS PRIVADOS
  // ========================================

  // Genera un ID único simple para cada item
  function _generarId() {
    return `escaneo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  }

  return {
    // Estado
    items,
    cargando,
    // Getters
    cantidadItems,
    tieneItemsPendientes,
    // Acciones
    cargarSesion,
    agregarItem,
    actualizarItem,
    asignarComercio,
    eliminarItem,
    limpiarTodo,
  }
})
