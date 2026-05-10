import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { adaptadorActual } from '../servicios/AlmacenamientoService.js'
import { useUsuarioStore } from './UsuarioStore.js'

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
  let persistenciaPausada = false

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
  async function solicitarSincronizacionMesaTrabajo(motivo = 'sesion_escaneo_actualizada') {
    useUsuarioStore().solicitarSincronizacionAutomatica(motivo, { sesionEscaneo: true })
  }

  async function _persistir(motivo = 'sesion_escaneo_actualizada') {
    const guardado = await adaptadorActual.guardar(CLAVE_SESION, {
      items: items.value,
      fechaActualizacion: new Date().toISOString(),
    })
    if (!guardado) {
      throw new Error('No se pudo guardar la sesión de escaneo.')
    }
    await solicitarSincronizacionMesaTrabajo(motivo)
  }

  // Observa cambios y guarda automáticamente
  watch(
    items,
    () => {
      if (persistenciaPausada) return
      _persistir().catch((error) => {
        console.error('Error al persistir sesión de escaneo:', error)
      })
    },
    { deep: true, flush: 'sync' },
  )

  // ========================================
  // ACCIONES
  // ========================================

  // Carga la sesión guardada al iniciar la app
  async function cargarSesion() {
    cargando.value = true
    try {
      const datos = await adaptadorActual.obtener(CLAVE_SESION)
      persistenciaPausada = true
      if (datos) {
        // Migración: ítems guardados sin campo `comercio` reciben comercio: null
        items.value = (datos.items || []).map((item) => ({
          ...item,
          comercio: item.comercio ?? null,
          sinCoincidencia: item.sinCoincidencia ?? false,
          activarPreciosMayoristas: item.activarPreciosMayoristas ?? false,
          escalasPorCantidad: Array.isArray(item.escalasPorCantidad) ? item.escalasPorCantidad : [],
        }))
      } else {
        items.value = []
      }
    } catch (error) {
      console.error('Error al cargar sesión de escaneo:', error)
    } finally {
      persistenciaPausada = false
      cargando.value = false
    }
  }

  // Agrega un item escaneado a la mesa de trabajo
  function agregarItem(item) {
    const itemAgregado = {
      id: _generarId(),
      creadoEn: item.creadoEn || new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
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
      origenListaJusta: item.origenListaJusta || null,
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
    }

    items.value.push(itemAgregado)
    return itemAgregado
  }

  // Actualiza campos de un item existente por su id
  function actualizarItem(id, cambios) {
    const indice = items.value.findIndex((i) => i.id === id)
    if (indice !== -1) {
      items.value[indice] = {
        ...items.value[indice],
        ...cambios,
        actualizadoEn: new Date().toISOString(),
      }
    }
  }

  // Asigna un comercio en bloque a los ítems indicados por sus IDs
  function asignarComercio(ids, comercio) {
    const conjuntoIds = new Set(ids)
    items.value = items.value.map((item) =>
      conjuntoIds.has(item.id)
        ? { ...item, comercio, actualizadoEn: new Date().toISOString() }
        : item,
    )
  }

  // Elimina un item de la mesa por su id
  function eliminarItem(id) {
    items.value = items.value.filter((i) => i.id !== id)
  }

  // Vacía la mesa de trabajo por completo
  async function limpiarTodo() {
    persistenciaPausada = true
    items.value = []
    persistenciaPausada = false
    await _persistir('sesion_escaneo_limpiada')
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
