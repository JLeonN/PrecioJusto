import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { adaptadorActual } from '../servicios/AlmacenamientoService.js'

// Clave usada para persistir la sesión en el adaptador
const CLAVE_SESION = 'sesion_escaneo'

export const useSesionEscaneoStore = defineStore('sesionEscaneo', () => {
  // ========================================
  // ESTADO
  // ========================================

  // Comercio seleccionado para la sesión activa
  // { id, nombre, direccionId, direccionNombre }
  const comercioActivo = ref(null)

  // Items escaneados pendientes de guardar en Mis Productos
  const items = ref([])

  // true mientras se cargan los datos del almacenamiento al iniciar
  const cargando = ref(false)

  // ========================================
  // GETTERS
  // ========================================

  // Cantidad de items en la bandeja (para el badge del DRAWER)
  const cantidadItems = computed(() => items.value.length)

  // true si hay al menos un item pendiente
  const tieneItemsPendientes = computed(() => items.value.length > 0)

  // ========================================
  // PERSISTENCIA
  // ========================================

  // Guarda el estado completo en el adaptador
  async function _persistir() {
    await adaptadorActual.guardar(CLAVE_SESION, {
      comercioActivo: comercioActivo.value,
      items: items.value,
    })
  }

  // Observa cambios y guarda automáticamente
  watch(
    [comercioActivo, items],
    () => {
      _persistir()
    },
    { deep: true },
  )

  // ========================================
  // ACCIONES
  // ========================================

  // Carga la sesión guardada al iniciar la app
  async function cargarSesion() {
    cargando.value = true
    try {
      const datos = await adaptadorActual.obtener(CLAVE_SESION)
      if (datos) {
        comercioActivo.value = datos.comercioActivo || null
        items.value = datos.items || []
      }
    } catch (error) {
      console.error('Error al cargar sesión de escaneo:', error)
    } finally {
      cargando.value = false
    }
  }

  // Establece el comercio de la sesión activa
  function iniciarSesion(comercio) {
    comercioActivo.value = comercio
  }

  // Agrega un item escaneado a la bandeja
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
      origenApi: item.origenApi || false,
      fuenteDato: item.fuenteDato || null,
      productoExistenteId: item.productoExistenteId || null,
    })
  }

  // Actualiza campos de un item existente por su id
  function actualizarItem(id, cambios) {
    const indice = items.value.findIndex((i) => i.id === id)
    if (indice !== -1) {
      items.value[indice] = { ...items.value[indice], ...cambios }
    }
  }

  // Elimina un item de la bandeja por su id
  function eliminarItem(id) {
    items.value = items.value.filter((i) => i.id !== id)
  }

  // Vacía la bandeja y reinicia el comercio activo
  async function limpiarTodo() {
    comercioActivo.value = null
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
    comercioActivo,
    items,
    cargando,
    // Getters
    cantidadItems,
    tieneItemsPendientes,
    // Acciones
    cargarSesion,
    iniciarSesion,
    agregarItem,
    actualizarItem,
    eliminarItem,
    limpiarTodo,
  }
})
