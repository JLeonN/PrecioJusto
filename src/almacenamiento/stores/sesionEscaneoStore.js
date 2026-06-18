import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import {
  ESTADOS_SINCRONIZACION,
  ORIGENES_FOTO,
} from '../constantes/PreparacionFirebase.js'
import firestoreMesaTrabajoService from '../servicios/FirestoreMesaTrabajoService.js'
import fuentePrincipalFirestoreService from '../servicios/FuentePrincipalFirestoreService.js'
import sesionEscaneoService from '../servicios/SesionEscaneoService.js'
import { useUsuarioStore } from './UsuarioStore.js'

const RETARDO_PERSISTENCIA_MS = 220

export const useSesionEscaneoStore = defineStore('sesionEscaneo', () => {
  const items = ref([])
  const cargando = ref(false)
  const fuenteDatos = ref(
    fuentePrincipalFirestoreService.crearEstadoInicial(
      fuentePrincipalFirestoreService.DOMINIOS.MESA_TRABAJO,
    ),
  )
  const sincronizacionFirestore = ref({
    estado: ESTADOS_SINCRONIZACION.LOCAL,
    mensaje: 'Datos locales.',
    fecha: null,
    error: null,
  })

  const suprimirPersistencia = ref(false)
  const temporizadorPersistencia = ref(null)
  let colaPersistencia = Promise.resolve()

  const cantidadItems = computed(() => items.value.length)
  const tieneItemsPendientes = computed(() => items.value.length > 0)

  function limpiarTimerPersistencia() {
    if (!temporizadorPersistencia.value) return
    clearTimeout(temporizadorPersistencia.value)
    temporizadorPersistencia.value = null
  }

  function normalizarItem(item) {
    return {
      ...item,
      comercio: item?.comercio ?? null,
      fotoFuente: item?.fotoFuente || normalizarFotoFuente(item),
      sinCoincidencia: item?.sinCoincidencia ?? false,
      activarPreciosMayoristas: item?.activarPreciosMayoristas ?? false,
      escalasPorCantidad: Array.isArray(item?.escalasPorCantidad) ? item.escalasPorCantidad : [],
      fechaCreacion: item?.fechaCreacion || item?.creadoEn || new Date().toISOString(),
      fechaActualizacion: item?.fechaActualizacion || item?.actualizadoEn || new Date().toISOString(),
    }
  }

  function normalizarFotoFuente(item) {
    if (!item?.imagen) return null
    if (item.origenApi || item.fuenteDato) return ORIGENES_FOTO.API
    return ORIGENES_FOTO.USUARIO
  }

  async function sincronizarEstadosListaJusta() {
    try {
      const { useListaJustaStore } = await import('./ListaJustaStore.js')
      const listaStore = useListaJustaStore()
      await listaStore.sincronizarEstadosMesaTrabajo()
    } catch (error) {
      console.warn('No se pudieron sincronizar estados de Mesa en Lista Justa:', error)
    }
  }

  function debeSincronizarConFirestore() {
    return fuentePrincipalFirestoreService.debeUsarFirestore()
  }

  function actualizarEstadoSincronizacion(resultado) {
    if (!resultado) return

    sincronizacionFirestore.value = {
      estado: resultado.estado || ESTADOS_SINCRONIZACION.SINCRONIZADO,
      mensaje: resultado.mensaje || 'Mesa de trabajo sincronizada.',
      fecha: new Date().toISOString(),
      error: resultado.exito === false ? resultado.mensaje || 'Error de sincronización.' : null,
    }
  }

  async function sincronizarFirestoreItems() {
    if (!debeSincronizarConFirestore()) {
      sincronizacionFirestore.value = {
        estado: ESTADOS_SINCRONIZACION.LOCAL,
        mensaje: 'Usuario local: sincronización Firestore omitida.',
        fecha: new Date().toISOString(),
        error: null,
      }
      return
    }

    if (items.value.length === 0) {
      const resultadoLimpieza = await firestoreMesaTrabajoService.limpiarMesaTrabajoUsuario()
      actualizarEstadoSincronizacion(resultadoLimpieza)
      return
    }

    const resultado = await firestoreMesaTrabajoService.guardarItemsMesaTrabajo(items.value)
    actualizarEstadoSincronizacion(resultado)
  }

  async function ejecutarPersistencia() {
    await sesionEscaneoService.guardarSesion(items.value)
    await sincronizarFirestoreItems()
  }

  function encolarPersistencia() {
    colaPersistencia = colaPersistencia
      .then(() => ejecutarPersistencia())
      .catch((error) => {
        console.error('Error al persistir sesión de escaneo:', error)
        sincronizacionFirestore.value = {
          estado: ESTADOS_SINCRONIZACION.ERROR,
          mensaje: 'No se pudo sincronizar la mesa de trabajo.',
          fecha: new Date().toISOString(),
          error: error?.message || 'Error de persistencia.',
        }
      })

    return colaPersistencia
  }

  function programarPersistencia() {
    if (suprimirPersistencia.value) return
    limpiarTimerPersistencia()
    temporizadorPersistencia.value = setTimeout(() => {
      encolarPersistencia()
    }, RETARDO_PERSISTENCIA_MS)
  }

  watch(
    items,
    () => {
      programarPersistencia()
    },
    { deep: true },
  )

  async function cargarSesion() {
    cargando.value = true
    const usuarioStore = useUsuarioStore()

    try {
      await usuarioStore.esperarSesionLista()

      const resultado = await fuentePrincipalFirestoreService.cargarMesaTrabajo({
        cargarLocal: () => sesionEscaneoService.obtenerItemsSesion(),
      })

      const datos = Array.isArray(resultado?.datos) ? resultado.datos : []
      const itemsNormalizados = datos.map((item) => normalizarItem(item))

      suprimirPersistencia.value = true
      items.value = itemsNormalizados
      suprimirPersistencia.value = false
      fuenteDatos.value = resultado

      if (
        resultado?.fuente === fuentePrincipalFirestoreService.FUENTES_DATOS.FALLBACK_LOCAL &&
        itemsNormalizados.length > 0 &&
        debeSincronizarConFirestore()
      ) {
        const resultadoMigracion = await firestoreMesaTrabajoService.guardarItemsMesaTrabajo(itemsNormalizados)
        actualizarEstadoSincronizacion({
          ...resultadoMigracion,
          mensaje: resultadoMigracion.exito
            ? 'Mesa local migrada a Firestore para el usuario actual.'
            : resultadoMigracion.mensaje,
        })
      }
    } catch (error) {
      console.error('Error al cargar sesión de escaneo:', error)
      suprimirPersistencia.value = true
      items.value = []
      suprimirPersistencia.value = false
      sincronizacionFirestore.value = {
        estado: ESTADOS_SINCRONIZACION.ERROR,
        mensaje: 'No se pudo cargar la mesa de trabajo.',
        fecha: new Date().toISOString(),
        error: error?.message || 'Error de carga.',
      }
    } finally {
      cargando.value = false
    }
  }

  function agregarItem(item) {
    const ahora = new Date().toISOString()
    const itemAgregado = normalizarItem({
      id: generarId(),
      codigoBarras: item.codigoBarras || null,
      nombre: item.nombre || '',
      marca: item.marca || null,
      cantidad: item.cantidad || 1,
      unidad: item.unidad || 'unidad',
      imagen: item.imagen || null,
      fotoFuente: item.fotoFuente || normalizarFotoFuente(item),
      precio: item.precio || 0,
      moneda: item.moneda || 'UYU',
      activarPreciosMayoristas: item.activarPreciosMayoristas || false,
      escalasPorCantidad: Array.isArray(item.escalasPorCantidad) ? item.escalasPorCantidad : [],
      origenApi: item.origenApi || false,
      fuenteDato: item.fuenteDato || null,
      sinCoincidencia: item.sinCoincidencia || false,
      productoExistenteId: item.productoExistenteId || null,
      comercio: item.comercio ?? null,
      origenListaJusta: item.origenListaJusta || null,
      datosOriginales: item.origenApi || item.productoExistenteId
        ? {
          nombre: item.nombre || '',
          marca: item.marca || null,
          cantidad: item.cantidad || 1,
          unidad: item.unidad || 'unidad',
          imagen: item.imagen || null,
          fotoFuente: item.fotoFuente || normalizarFotoFuente(item),
        }
        : null,
      fechaCreacion: ahora,
      fechaActualizacion: ahora,
    })

    items.value.push(itemAgregado)
    void encolarPersistencia()
    return itemAgregado
  }

  function actualizarItem(id, cambios) {
    const indice = items.value.findIndex((item) => item.id === id)
    if (indice === -1) return

    items.value[indice] = normalizarItem({
      ...items.value[indice],
      ...cambios,
      fechaActualizacion: new Date().toISOString(),
    })
    void encolarPersistencia()
  }

  function asignarComercio(ids, comercio) {
    const ahora = new Date().toISOString()
    const conjuntoIds = new Set(ids)

    items.value = items.value.map((item) =>
      conjuntoIds.has(item.id)
        ? normalizarItem({
          ...item,
          comercio,
          fechaActualizacion: ahora,
        })
        : item,
    )
    void encolarPersistencia()
  }

  async function eliminarItem(id) {
    items.value = items.value.filter((item) => item.id !== id)

    if (debeSincronizarConFirestore()) {
      const resultado = await firestoreMesaTrabajoService.eliminarItemMesaTrabajo(id)
      actualizarEstadoSincronizacion(resultado)
    }

    await sincronizarEstadosListaJusta()
  }

  async function limpiarTodo() {
    suprimirPersistencia.value = true
    items.value = []
    suprimirPersistencia.value = false
    limpiarTimerPersistencia()

    await sesionEscaneoService.eliminarSesion()

    if (debeSincronizarConFirestore()) {
      const resultado = await firestoreMesaTrabajoService.limpiarMesaTrabajoUsuario()
      actualizarEstadoSincronizacion(resultado)
    } else {
      sincronizacionFirestore.value = {
        estado: ESTADOS_SINCRONIZACION.LOCAL,
        mensaje: 'Mesa limpiada en almacenamiento local.',
        fecha: new Date().toISOString(),
        error: null,
      }
    }

    await sincronizarEstadosListaJusta()
  }

  function limpiarEstado() {
    suprimirPersistencia.value = true
    items.value = []
    suprimirPersistencia.value = false
    limpiarTimerPersistencia()
    fuenteDatos.value = fuentePrincipalFirestoreService.crearEstadoInicial(
      fuentePrincipalFirestoreService.DOMINIOS.MESA_TRABAJO,
    )
    sincronizacionFirestore.value = {
      estado: ESTADOS_SINCRONIZACION.LOCAL,
      mensaje: 'Estado reiniciado.',
      fecha: null,
      error: null,
    }
  }

  function generarId() {
    return `escaneo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  }

  async function forzarPersistencia() {
    limpiarTimerPersistencia()
    await encolarPersistencia()
  }

  return {
    items,
    cargando,
    fuenteDatos,
    sincronizacionFirestore,
    cantidadItems,
    tieneItemsPendientes,
    cargarSesion,
    agregarItem,
    actualizarItem,
    asignarComercio,
    eliminarItem,
    limpiarTodo,
    limpiarEstado,
    forzarPersistencia,
  }
})
