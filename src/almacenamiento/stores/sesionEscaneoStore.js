import { defineStore } from 'pinia'
import { ref, computed, nextTick, watch } from 'vue'
import {
  ESTADOS_SINCRONIZACION,
  ORIGENES_FOTO,
} from '../constantes/PreparacionFirebase.js'
import firestoreMesaTrabajoService from '../servicios/FirestoreMesaTrabajoService.js'
import fuentePrincipalFirestoreService from '../servicios/FuentePrincipalFirestoreService.js'
import fotosLegacyCacheService from '../servicios/FotosLegacyCacheService.js'
import sesionEscaneoService from '../servicios/SesionEscaneoService.js'
import { useUsuarioStore } from './UsuarioStore.js'

const RETARDO_PERSISTENCIA_MS = 220
const TIEMPO_MINIMO_REFRESCO_FIRESTORE_MS = 3 * 60 * 1000

export const useSesionEscaneoStore = defineStore('sesionEscaneo', () => {
  const items = ref([])
  const cargando = ref(true)
  const sesionCargada = ref(false)
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
  let promesaCargaSesion = null

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
    if (!suprimirPersistencia.value && !cargando.value) {
      sesionEscaneoService.guardarRespaldoUrgente(items.value)
    }

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
    if (suprimirPersistencia.value || cargando.value) return
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

  async function asignarItemsCargados(itemsCargados) {
    suprimirPersistencia.value = true
    items.value = itemsCargados
    await nextTick()
    suprimirPersistencia.value = false
  }

  async function ejecutarCargaSesion() {
    cargando.value = true
    sesionCargada.value = false
    limpiarTimerPersistencia()
    const usuarioStore = useUsuarioStore()

    try {
      await usuarioStore.esperarSesionLista()
      const usuarioActual = fuentePrincipalFirestoreService.obtenerUsuarioActual()
      const usaFirestore = fuentePrincipalFirestoreService.debeUsarFirestore(usuarioActual)
      const datosLocales = await sesionEscaneoService.obtenerItemsSesion({
        usarRespaldoUrgente: !usaFirestore,
      })
      const itemsLocalesBase = fuentePrincipalFirestoreService.fusionarMesaLocalFirestore(
        datosLocales,
        [],
      )
      const itemsLocalesConFotos = await fotosLegacyCacheService.recuperarFotosMesa(itemsLocalesBase)
      const itemsNormalizados = itemsLocalesConFotos.map((item) => normalizarItem(item))

      await asignarItemsCargados(itemsNormalizados)
      if (itemsNormalizados.length > 0) {
        await sesionEscaneoService.guardarItemsEnCacheLocal(itemsNormalizados)
      }
      fuenteDatos.value = {
        ...fuentePrincipalFirestoreService.crearEstadoInicial(
          fuentePrincipalFirestoreService.DOMINIOS.MESA_TRABAJO,
        ),
        datos: itemsNormalizados,
        fechaActualizacion: new Date().toISOString(),
      }

      if (!usaFirestore) return

      if (itemsNormalizados.length > 0) {
        void sincronizarMesaDesdeFirestore({ datosLocales: itemsNormalizados })
      } else {
        await sincronizarMesaDesdeFirestore({ datosLocales: itemsNormalizados, forzar: true })
      }
    } catch (error) {
      console.error('Error al cargar sesión de escaneo:', error)
      await asignarItemsCargados([])
      sincronizacionFirestore.value = {
        estado: ESTADOS_SINCRONIZACION.ERROR,
        mensaje: 'No se pudo cargar la mesa de trabajo.',
        fecha: new Date().toISOString(),
        error: error?.message || 'Error de carga.',
      }
    } finally {
      sesionCargada.value = true
      cargando.value = false
    }
  }

  async function sincronizarMesaDesdeFirestore({ datosLocales = [], forzar = false } = {}) {
    const usuarioActual = fuentePrincipalFirestoreService.obtenerUsuarioActual()
    if (!fuentePrincipalFirestoreService.debeUsarFirestore(usuarioActual)) return
    if (!forzar && (await cacheFirestoreReciente(usuarioActual.id))) return

    try {
      const resultado = await fuentePrincipalFirestoreService.cargarMesaTrabajoFirestoreCruda({
        usuarioId: usuarioActual.id,
      })
      fuenteDatos.value = resultado

      if (resultado.error || !Array.isArray(resultado.datos)) return

      const itemsFusionadosBase = fuentePrincipalFirestoreService.fusionarMesaLocalFirestore(
        datosLocales,
        resultado.datos,
      )
      const itemsFusionadosConFotos =
        await fotosLegacyCacheService.recuperarFotosMesa(itemsFusionadosBase)
      const itemsNormalizados = itemsFusionadosConFotos.map((item) => normalizarItem(item))

      await asignarItemsCargados(itemsNormalizados)
      await sesionEscaneoService.guardarItemsEnCacheLocal(itemsNormalizados)
      await sesionEscaneoService.guardarMetaCacheFirestore({
        usuarioId: usuarioActual.id,
        fechaUltimaSincronizacion: new Date().toISOString(),
        fechaUltimoIntento: new Date().toISOString(),
        cantidadRemota: resultado.datos.length,
        versionCache: 1,
      })
    } catch (error) {
      console.error('Error al sincronizar Mesa desde Firestore:', error)
    }
  }

  async function cacheFirestoreReciente(usuarioId) {
    const meta = await sesionEscaneoService.obtenerMetaCacheFirestore()
    if (!meta || meta.usuarioId !== usuarioId || !meta.fechaUltimaSincronizacion) return false

    const fecha = new Date(meta.fechaUltimaSincronizacion).getTime()
    if (!Number.isFinite(fecha)) return false

    return Date.now() - fecha < TIEMPO_MINIMO_REFRESCO_FIRESTORE_MS
  }

  async function cargarSesion() {
    if (promesaCargaSesion) return promesaCargaSesion

    promesaCargaSesion = ejecutarCargaSesion().finally(() => {
      promesaCargaSesion = null
    })

    return promesaCargaSesion
  }

  async function asegurarSesionCargada() {
    if (sesionCargada.value && !cargando.value) return
    await cargarSesion()
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
    void encolarPersistencia()

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
    cargando.value = false
    sesionCargada.value = false
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
    sesionCargada,
    fuenteDatos,
    sincronizacionFirestore,
    cantidadItems,
    tieneItemsPendientes,
    cargarSesion,
    sincronizarMesaDesdeFirestore,
    asegurarSesionCargada,
    agregarItem,
    actualizarItem,
    asignarComercio,
    eliminarItem,
    limpiarTodo,
    limpiarEstado,
    forzarPersistencia,
  }
})
