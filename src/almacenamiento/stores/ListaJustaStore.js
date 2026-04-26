import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import ListaJustaService from '../servicios/ListaJustaService.js'
import productosService from '../servicios/ProductosService.js'
import { useProductosStore } from './productosStore.js'
import { useSesionEscaneoStore } from './sesionEscaneoStore.js'

export const useListaJustaStore = defineStore('listaJusta', () => {
  const quasar = useQuasar()
  const productosStore = useProductosStore()
  const sesionEscaneoStore = useSesionEscaneoStore()

  const listas = ref([])
  const cargando = ref(false)
  const error = ref(null)

  const tieneListas = computed(() => listas.value.length > 0)
  const totalListas = computed(() => listas.value.length)
  const listasOrdenadas = computed(() => {
    return [...listas.value].sort((a, b) => obtenerMarcaUso(b) - obtenerMarcaUso(a))
  })

  function obtenerListaPorId(listaId) {
    return listas.value.find((lista) => lista.id === listaId) || null
  }

  async function cargarListas() {
    cargando.value = true
    error.value = null

    try {
      listas.value = await ListaJustaService.obtenerListas()
    } catch (err) {
      error.value = 'No se pudieron cargar las listas.'
      console.error('Error al cargar listas de Lista Justa:', err)
    } finally {
      cargando.value = false
    }
  }

  async function crearLista(nombre) {
    const nombreLimpio = (nombre || '').trim()
    if (!nombreLimpio) {
      throw new Error('El nombre de la lista es obligatorio.')
    }

    const nuevaLista = ListaJustaService.crearListaVacia(nombreLimpio, listas.value.length)
    listas.value.unshift(nuevaLista)
    await persistir()

    return nuevaLista
  }

  async function actualizarNombreLista(listaId, nombre) {
    const lista = obtenerListaPorId(listaId)
    if (!lista) return false

    const nombreLimpio = (nombre || '').trim()
    if (!nombreLimpio) return false

    lista.nombre = nombreLimpio
    lista.fechaActualizacion = new Date().toISOString()
    await persistir()
    return true
  }

  async function reiniciarLista(listaId) {
    const lista = obtenerListaPorId(listaId)
    if (!lista) return false

    lista.items = lista.items.map((item) => ({
      ...item,
      comprado: false,
    }))
    lista.preferenciaPrecioFaltante = 'preguntar'
    lista.comercioActual = null
    lista.configuracionInteligente = ListaJustaService._normalizarConfiguracionInteligente(null, null)
    lista.fechaActualizacion = new Date().toISOString()
    await persistir()
    return true
  }

  async function actualizarComercioLista(listaId, comercioActual) {
    const lista = obtenerListaPorId(listaId)
    if (!lista) return false

    lista.comercioActual = comercioActual || null
    if (!lista.configuracionInteligente?.comercioBase && comercioActual) {
      lista.configuracionInteligente = ListaJustaService._normalizarConfiguracionInteligente(
        {
          ...lista.configuracionInteligente,
          comercioBase: comercioActual,
          heredarComercioActual: true,
        },
        comercioActual,
      )
    }
    lista.fechaActualizacion = new Date().toISOString()
    await persistir()
    return true
  }

  async function actualizarConfiguracionInteligente(listaId, cambios = {}) {
    const lista = obtenerListaPorId(listaId)
    if (!lista) return false

    lista.configuracionInteligente = ListaJustaService._normalizarConfiguracionInteligente(
      {
        ...lista.configuracionInteligente,
        ...cambios,
      },
      lista.comercioActual,
    )
    lista.fechaActualizacion = new Date().toISOString()
    await persistir()
    return true
  }

  async function sincronizarComercioBaseInteligente(listaId) {
    const lista = obtenerListaPorId(listaId)
    if (!lista) return false
    if (lista.configuracionInteligente?.heredarComercioActual === false) return false
    if (lista.configuracionInteligente?.comercioBase || !lista.comercioActual) return false

    lista.configuracionInteligente = ListaJustaService._normalizarConfiguracionInteligente(
      {
        ...lista.configuracionInteligente,
        comercioBase: lista.comercioActual,
        heredarComercioActual: true,
      },
      lista.comercioActual,
    )
    lista.fechaActualizacion = new Date().toISOString()
    await persistir()
    return true
  }

  async function eliminarLista(listaId) {
    listas.value = listas.value.filter((lista) => lista.id !== listaId)
    await persistir()
    return true
  }

  async function registrarUsoLista(listaId) {
    const lista = obtenerListaPorId(listaId)
    if (!lista) return false

    const ahora = new Date().toISOString()
    lista.fechaUltimoUso = ahora
    lista.fechaActualizacion = ahora
    await persistir()
    return true
  }

  function detectarDuplicado(lista, datosItem) {
    const codigoBarras = (datosItem.codigoBarras || '').trim()

    return lista.items.some((item) => {
      if (datosItem.productoId && item.productoId) {
        return item.productoId === datosItem.productoId
      }

      if (codigoBarras && item.codigoBarras) {
        return item.codigoBarras.trim() === codigoBarras
      }

      return false
    })
  }

  async function agregarItem(listaId, datosItem) {
    const lista = obtenerListaPorId(listaId)
    if (!lista) return { exito: false }

    const nombre = (datosItem.nombre || '').trim()
    const cantidadOriginal = Number(datosItem.cantidad)
    const cantidad = Number.isFinite(cantidadOriginal) && cantidadOriginal > 0 ? cantidadOriginal : 1

    if (!nombre) {
      return { exito: false, motivo: 'datos-minimos' }
    }

    if (detectarDuplicado(lista, datosItem)) {
      return { exito: false, motivo: 'duplicado' }
    }

    const itemNormalizado = ListaJustaService.normalizarItem({
      ...datosItem,
      cantidad,
    })
    lista.items.unshift(itemNormalizado)
    lista.fechaActualizacion = new Date().toISOString()

    await intentarEnviarAMisProductosSiCorresponde(lista, itemNormalizado)
    await persistir()

    return { exito: true, item: itemNormalizado }
  }

  async function actualizarItem(listaId, itemId, cambios = {}) {
    const lista = obtenerListaPorId(listaId)
    if (!lista) return false

    const indice = lista.items.findIndex((item) => item.id === itemId)
    if (indice === -1) return false

    const itemActual = lista.items[indice]

    if (cambios.cantidad !== undefined) {
      const nuevaCantidad = Number(cambios.cantidad)
      if (!Number.isFinite(nuevaCantidad) || nuevaCantidad <= 0) {
        return false
      }
    }

    if (cambios.nombre !== undefined) {
      const nombreNuevo = String(cambios.nombre || '').trim()
      if (!nombreNuevo) return false
      cambios.nombre = nombreNuevo
    }

    if (cambios.precioManual !== undefined) {
      if (cambios.precioManual === null || cambios.precioManual === '') {
        cambios.precioManual = null
      } else {
        const precioNumero = Number(cambios.precioManual)
        cambios.precioManual = Number.isFinite(precioNumero) && precioNumero > 0 ? precioNumero : null
      }
    }

    if (cambios.moneda !== undefined) {
      const monedaNormalizada = String(cambios.moneda || '').trim().toUpperCase()
      cambios.moneda = monedaNormalizada || itemActual.moneda || 'UYU'
    }

    if (cambios.activarPreciosMayoristas !== undefined) {
      cambios.activarPreciosMayoristas = Boolean(cambios.activarPreciosMayoristas)
    }

    if (cambios.escalasPorCantidad !== undefined) {
      cambios.escalasPorCantidad = Array.isArray(cambios.escalasPorCantidad)
        ? ListaJustaService.normalizarItem({ escalasPorCantidad: cambios.escalasPorCantidad }).escalasPorCantidad
        : []
    }

    const itemActualizado = {
      ...itemActual,
      ...cambios,
      actualizadoEn: new Date().toISOString(),
    }

    const cambioPrecioLocal =
      itemActual.productoId &&
      (
        cambios.precioManual !== undefined ||
        cambios.moneda !== undefined ||
        cambios.activarPreciosMayoristas !== undefined ||
        cambios.escalasPorCantidad !== undefined
      )

    if (cambioPrecioLocal) {
      const comparacionPrecio = compararConPrecioOriginal(itemActualizado)
      itemActualizado.usaPreciosLocales = comparacionPrecio.usaPreciosLocales
      itemActualizado.precioManual = comparacionPrecio.precioManual
      itemActualizado.moneda = comparacionPrecio.moneda
      itemActualizado.activarPreciosMayoristas = comparacionPrecio.activarPreciosMayoristas
      itemActualizado.escalasPorCantidad = comparacionPrecio.escalasPorCantidad
      itemActualizado.estadoDerivacion = itemActualizado.mesaTrabajoItemId
        ? 'enMesa'
        : 'enMisProductos'
    }

    itemActualizado.advertencias = {
      sinNombre: !String(itemActualizado.nombre || '').trim(),
      sinPrecio: !Number.isFinite(Number(itemActualizado.precioManual)) || Number(itemActualizado.precioManual) <= 0,
    }

    lista.items[indice] = itemActualizado
    lista.fechaActualizacion = new Date().toISOString()

    await intentarEnviarAMisProductosSiCorresponde(lista, itemActualizado)
    await persistir()

    return true
  }

  async function ajustarCantidad(listaId, itemId, variacion) {
    const lista = obtenerListaPorId(listaId)
    if (!lista) return false

    const item = lista.items.find((actual) => actual.id === itemId)
    if (!item) return false

    const cantidadActual = Number(item.cantidad || 1)
    const cantidadNueva = Math.max(1, cantidadActual + variacion)

    return actualizarItem(listaId, itemId, { cantidad: cantidadNueva })
  }

  async function alternarComprado(listaId, itemId) {
    const lista = obtenerListaPorId(listaId)
    if (!lista) return false

    const item = lista.items.find((actual) => actual.id === itemId)
    if (!item) return false

    const compradoSiguiente = !item.comprado
    const actualizado = await actualizarItem(listaId, itemId, { comprado: compradoSiguiente })

    if (!actualizado) return false

    if (compradoSiguiente && !obtenerPrecioVisualItem(item)) {
      manejarPrecioFaltante(lista)
    }

    return true
  }

  async function eliminarItem(listaId, itemId) {
    const lista = obtenerListaPorId(listaId)
    if (!lista) return false

    lista.items = lista.items.filter((item) => item.id !== itemId)
    lista.fechaActualizacion = new Date().toISOString()
    await persistir()
    return true
  }

  async function enviarItemAMesaTrabajo(listaId, itemId) {
    const lista = obtenerListaPorId(listaId)
    if (!lista) return false

    const item = lista.items.find((actual) => actual.id === itemId)
    if (!item) return false

    const puedeDerivarDesdeMisProductos = Boolean(item.productoId && item.usaPreciosLocales)
    const puedeDerivarManual = !item.productoId && item.estadoDerivacion !== 'enMisProductos'
    if (!puedeDerivarDesdeMisProductos && !puedeDerivarManual) return false

    const escalasPorCantidad = Array.isArray(item.escalasPorCantidad) ? item.escalasPorCantidad : []
    const comercioMesa = resolverComercioParaMesa(lista, item)

    const itemMesa = sesionEscaneoStore.agregarItem({
      codigoBarras: item.codigoBarras,
      nombre: item.nombre,
      marca: item.marca,
      cantidad: item.cantidad,
      unidad: item.unidad,
      imagen: item.imagen,
      precio: item.precioManual || 0,
      moneda: item.moneda || 'UYU',
      origenApi: false,
      productoExistenteId: item.productoId || null,
      sinCoincidencia: !item.productoId,
      activarPreciosMayoristas: Boolean(item.activarPreciosMayoristas) && escalasPorCantidad.length > 0,
      escalasPorCantidad,
      origenListaJusta: {
        listaId,
        itemId,
      },
      comercio: comercioMesa,
    })

    item.estadoDerivacion = 'enMesa'
    item.mesaTrabajoItemId = itemMesa?.id || null
    item.actualizadoEn = new Date().toISOString()
    lista.fechaActualizacion = new Date().toISOString()
    await persistir()

    return true
  }

  function resolverComercioParaMesa(lista, item) {
    const comercioActual = lista?.comercioActual
    const nombreComercioActual = String(comercioActual?.nombre || '').trim()

    if (nombreComercioActual) {
      return {
        id: comercioActual.id || 'lista-justa',
        nombre: nombreComercioActual,
        direccionId: comercioActual.direccionId || 'lista-justa',
        direccionNombre: String(comercioActual.direccionNombre || '').trim(),
      }
    }

    const comercioItem = String(item?.comercio || '').trim()
    if (!comercioItem) return null

    return {
      id: 'lista-justa',
      nombre: comercioItem,
      direccionId: 'lista-justa',
      direccionNombre: comercioItem,
    }
  }

  function obtenerPrecioVisualItem(item) {
    if (Number.isFinite(Number(item.precioManual)) && Number(item.precioManual) > 0) {
      return Number(item.precioManual)
    }

    if (!item.productoId) return null

    const producto = productosStore.obtenerProductoPorId(item.productoId)
    if (!producto) return null

    return Number.isFinite(Number(producto.precioMejor)) && Number(producto.precioMejor) > 0
      ? Number(producto.precioMejor)
      : null
  }

  function estimadoLista(lista) {
    const itemsConPrecio = lista.items.filter((item) => Number.isFinite(obtenerPrecioVisualItem(item)))

    if (lista.items.length === 0 || itemsConPrecio.length === 0) {
      return {
        etiqueta: 'Sin precios',
        total: 0,
        parcial: false,
      }
    }

    const total = itemsConPrecio.reduce((suma, item) => {
      const precio = Number(obtenerPrecioVisualItem(item) || 0)
      const cantidad = Number(item.cantidad || 1)
      return suma + precio * cantidad
    }, 0)

    const parcial = itemsConPrecio.length !== lista.items.length

    return {
      etiqueta: parcial ? 'Estimado parcial' : 'Estimado de la lista',
      total,
      parcial,
    }
  }

  function resumenCompra(lista) {
    const totalItems = lista.items.length
    const comprados = lista.items.filter((item) => item.comprado).length

    const compradosConPrecio = lista.items.filter(
      (item) => item.comprado && Number.isFinite(obtenerPrecioVisualItem(item)),
    )

    const totalComprado = compradosConPrecio.reduce((suma, item) => {
      const precio = Number(obtenerPrecioVisualItem(item) || 0)
      const cantidad = Number(item.cantidad || 1)
      return suma + precio * cantidad
    }, 0)

    const compradosSinPrecio = lista.items.filter(
      (item) => item.comprado && !Number.isFinite(obtenerPrecioVisualItem(item)),
    ).length

    return {
      totalItems,
      comprados,
      totalComprado,
      compradosSinPrecio,
      etiquetaTotal: compradosSinPrecio > 0 ? 'Total parcial' : 'Total',
    }
  }

  async function sincronizarRelacionConMisProductos() {
    let huboCambios = false

    for (const lista of listas.value) {
      for (const item of lista.items) {
        if (item.productoId || !item.codigoBarras) continue

        const productoCoincidente = productosStore.productos.find(
          (producto) => (producto.codigoBarras || '').trim() === (item.codigoBarras || '').trim(),
        )

        if (!productoCoincidente) continue

        item.productoId = productoCoincidente.id
        item.estadoDerivacion = 'enMisProductos'
        item.mesaTrabajoItemId = null
        item.actualizadoEn = new Date().toISOString()
        huboCambios = true
      }
    }

    if (!huboCambios) return

    await persistir()
  }

  function manejarPrecioFaltante(lista) {
    if (lista.preferenciaPrecioFaltante === 'nunca') return

    if (lista.preferenciaPrecioFaltante === 'avisar') {
      quasar.notify({
        type: 'warning',
        message: 'Hay productos comprados sin precio. Se mostrará total parcial.',
        position: 'top',
      })
      return
    }

    quasar.dialog({
      title: 'Producto sin precio',
      message: '¿Qué preferís hacer en esta lista cuando marques productos sin precio?',
      options: {
        type: 'radio',
        model: 'preguntar',
        items: [
          { label: 'Preguntar siempre', value: 'preguntar' },
          { label: 'Solo avisar', value: 'avisar' },
          { label: 'No volver a preguntar', value: 'nunca' },
        ],
      },
      cancel: true,
      persistent: true,
    }).onOk(async (valor) => {
      lista.preferenciaPrecioFaltante = valor
      lista.fechaActualizacion = new Date().toISOString()
      await persistir()
    })
  }

  async function intentarEnviarAMisProductosSiCorresponde(lista, item) {
    if (item.origen !== 'manual' || item.productoId) return

    const estaCompleto = validarItemManualCompleto(item)
    if (!estaCompleto) return

    let productoExistente = null

    if (item.codigoBarras) {
      productoExistente = await productosService.buscarPorCodigoBarras(item.codigoBarras)
    }

    if (productoExistente) {
      item.productoId = productoExistente.id
      item.estadoDerivacion = 'enMisProductos'
      item.actualizadoEn = new Date().toISOString()
      return
    }

    const nuevoProducto = {
      nombre: item.nombre,
      marca: item.marca,
      categoria: item.categoria,
      codigoBarras: item.codigoBarras,
      cantidad: item.cantidad,
      unidad: item.unidad,
      imagen: item.imagen,
      precios: [
        {
          id: `precio_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          valor: Number(item.precioManual),
          moneda: item.moneda || 'UYU',
          comercio: item.comercio,
          direccion: item.comercio,
          nombreCompleto: item.comercio,
          fecha: new Date().toISOString(),
          confirmaciones: 0,
        },
      ],
    }

    const productoGuardado = await productosStore.agregarProducto(nuevoProducto)
    if (!productoGuardado) return

    item.productoId = productoGuardado.id
    item.estadoDerivacion = 'enMisProductos'
    item.mesaTrabajoItemId = null
    item.actualizadoEn = new Date().toISOString()
    lista.fechaActualizacion = new Date().toISOString()
  }

  async function sincronizarEstadosMesaTrabajo() {
    const idsMesa = new Set(sesionEscaneoStore.items.map((item) => item.id))
    let huboCambios = false

    for (const lista of listas.value) {
      for (const item of lista.items) {
        if (!item.mesaTrabajoItemId) continue
        if (idsMesa.has(item.mesaTrabajoItemId)) continue

        item.estadoDerivacion = item.productoId ? 'enMisProductos' : 'ninguno'
        item.mesaTrabajoItemId = null
        item.actualizadoEn = new Date().toISOString()
        lista.fechaActualizacion = new Date().toISOString()
        huboCambios = true
      }
    }

    if (!huboCambios) return

    await persistir()
  }

  async function marcarItemComoEnMisProductos(listaId, itemId, productoId = null) {
    const lista = obtenerListaPorId(listaId)
    if (!lista) return false

    const item = lista.items.find((actual) => actual.id === itemId)
    if (!item) return false

    item.estadoDerivacion = 'enMisProductos'
    item.mesaTrabajoItemId = null
    item.usaPreciosLocales = false
    item.precioManual = null
    item.activarPreciosMayoristas = false
    item.escalasPorCantidad = []
    if (productoId) {
      item.productoId = productoId
    }
    item.actualizadoEn = new Date().toISOString()
    lista.fechaActualizacion = new Date().toISOString()
    await persistir()
    return true
  }

  function validarItemManualCompleto(item) {
    const tieneNombre = Boolean(String(item.nombre || '').trim())
    const tienePrecio = Number.isFinite(Number(item.precioManual)) && Number(item.precioManual) > 0
    const tieneComercio = Boolean(String(item.comercio || '').trim())
    const tieneCantidad = Number.isFinite(Number(item.cantidad)) && Number(item.cantidad) > 0
    const tieneGramosOLitros = Boolean(String(item.gramosOLitros || '').trim())
    const tieneMarca = Boolean(String(item.marca || '').trim())
    const tieneCodigo = Boolean(String(item.codigoBarras || '').trim())
    const tieneCategoria = Boolean(String(item.categoria || '').trim())

    return (
      tieneNombre &&
      tienePrecio &&
      tieneComercio &&
      tieneCantidad &&
      tieneGramosOLitros &&
      tieneMarca &&
      tieneCodigo &&
      tieneCategoria
    )
  }

  async function restaurarPreciosOriginales(listaId, itemId) {
    const lista = obtenerListaPorId(listaId)
    if (!lista) return false

    const item = lista.items.find((actual) => actual.id === itemId)
    if (!item || !item.productoId) return false

    item.usaPreciosLocales = false
    item.precioManual = null
    item.activarPreciosMayoristas = false
    item.escalasPorCantidad = []
    item.estadoDerivacion = item.mesaTrabajoItemId ? 'enMesa' : 'enMisProductos'
    item.actualizadoEn = new Date().toISOString()
    lista.fechaActualizacion = new Date().toISOString()
    await persistir()
    return true
  }

  function compararConPrecioOriginal(item) {
    const precioLocal = normalizarPrecioComparable(item)
    const precioOriginal = obtenerPrecioOriginalComparable(item.productoId)

    if (!precioOriginal) {
      return {
        usaPreciosLocales: true,
        precioManual: precioLocal.precioManual,
        moneda: precioLocal.moneda,
        activarPreciosMayoristas: precioLocal.activarPreciosMayoristas,
        escalasPorCantidad: precioLocal.escalasPorCantidad,
      }
    }

    const coincidePrecio = precioLocal.precioManual === precioOriginal.precioManual
    const coincideMoneda = precioLocal.moneda === precioOriginal.moneda
    const coincideActivacion =
      precioLocal.activarPreciosMayoristas === precioOriginal.activarPreciosMayoristas
    const coincideEscalas = sonEscalasIguales(
      precioLocal.escalasPorCantidad,
      precioOriginal.escalasPorCantidad,
    )

    if (coincidePrecio && coincideMoneda && coincideActivacion && coincideEscalas) {
      return {
        usaPreciosLocales: false,
        precioManual: null,
        moneda: item.moneda || precioOriginal.moneda || 'UYU',
        activarPreciosMayoristas: false,
        escalasPorCantidad: [],
      }
    }

    return {
      usaPreciosLocales: true,
      precioManual: precioLocal.precioManual,
      moneda: precioLocal.moneda,
      activarPreciosMayoristas: precioLocal.activarPreciosMayoristas,
      escalasPorCantidad: precioLocal.escalasPorCantidad,
    }
  }

  function normalizarPrecioComparable(origen = {}) {
    const precioBase = Number(origen.precioManual)
    const precioManual = Number.isFinite(precioBase) && precioBase > 0 ? precioBase : null
    const moneda = String(origen.moneda || '').trim().toUpperCase() || 'UYU'
    const escalasPorCantidad = Array.isArray(origen.escalasPorCantidad)
      ? ListaJustaService.normalizarItem({ escalasPorCantidad: origen.escalasPorCantidad }).escalasPorCantidad
      : []
    const activarPreciosMayoristas =
      Boolean(origen.activarPreciosMayoristas) && escalasPorCantidad.length > 0

    return {
      precioManual,
      moneda,
      activarPreciosMayoristas,
      escalasPorCantidad,
    }
  }

  function obtenerPrecioOriginalComparable(productoId) {
    if (!productoId) return null

    const producto = productosStore.obtenerProductoPorId(productoId)
    if (!producto) return null

    const precioOriginal = obtenerMejorPrecioProducto(producto)
    if (!precioOriginal) return null

    return normalizarPrecioComparable({
      precioManual: precioOriginal.valor,
      moneda: precioOriginal.moneda || producto.monedaReferencia || 'UYU',
      activarPreciosMayoristas: precioOriginal.activarPreciosMayoristas,
      escalasPorCantidad: precioOriginal.escalasPorCantidad,
    })
  }

  function obtenerMejorPrecioProducto(producto) {
    if (!Array.isArray(producto?.precios) || producto.precios.length === 0) return null

    const preciosVigentes = new Map()

    for (const precio of producto.precios) {
      const clave =
        precio?.comercioId && precio?.direccionId
          ? `${precio.comercioId}_${precio.direccionId}`
          : precio?.nombreCompleto || precio?.comercio || precio?.id
      const actual = preciosVigentes.get(clave)
      if (!actual || new Date(precio.fecha) > new Date(actual.fecha)) {
        preciosVigentes.set(clave, precio)
      }
    }

    const candidatos = [...preciosVigentes.values()]
      .map((precio) => ({
        ...precio,
        moneda: precio?.moneda || producto.monedaReferencia || 'UYU',
        valor: Number(precio?.valor),
      }))
      .filter((precio) => Number.isFinite(precio.valor) && precio.valor > 0)

    if (candidatos.length === 0) return null

    const monedaReferencia =
      producto.monedaReferencia || candidatos[0]?.moneda || 'UYU'
    const comparables = candidatos.filter((precio) => precio.moneda === monedaReferencia)
    const baseComparacion = comparables.length > 0 ? comparables : candidatos

    return [...baseComparacion].sort((a, b) => a.valor - b.valor)[0]
  }

  function sonEscalasIguales(escalasA = [], escalasB = []) {
    if (escalasA.length !== escalasB.length) return false

    return escalasA.every((escala, indice) => {
      const otraEscala = escalasB[indice]
      return (
        Number(escala?.cantidadMinima) === Number(otraEscala?.cantidadMinima) &&
        Number(escala?.precioUnitario) === Number(otraEscala?.precioUnitario)
      )
    })
  }

  function obtenerMarcaUso(lista) {
    const base = lista.fechaUltimoUso || lista.fechaActualizacion || lista.fechaCreacion || 0
    const marca = new Date(base).getTime()
    return Number.isFinite(marca) ? marca : 0
  }

  async function persistir() {
    const guardado = await ListaJustaService.guardarListas(listas.value)

    if (!guardado) {
      throw new Error('No se pudo persistir Lista Justa.')
    }
  }

  return {
    listas,
    cargando,
    error,
    tieneListas,
    totalListas,
    listasOrdenadas,
    cargarListas,
    obtenerListaPorId,
    crearLista,
    actualizarNombreLista,
    reiniciarLista,
    eliminarLista,
    agregarItem,
    actualizarItem,
    ajustarCantidad,
    alternarComprado,
    eliminarItem,
    enviarItemAMesaTrabajo,
    estimadoLista,
    resumenCompra,
    obtenerPrecioVisualItem,
    sincronizarRelacionConMisProductos,
    sincronizarEstadosMesaTrabajo,
    registrarUsoLista,
    actualizarComercioLista,
    actualizarConfiguracionInteligente,
    sincronizarComercioBaseInteligente,
    marcarItemComoEnMisProductos,
    restaurarPreciosOriginales,
  }
})
