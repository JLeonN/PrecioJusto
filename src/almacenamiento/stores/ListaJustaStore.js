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
    lista.fechaActualizacion = new Date().toISOString()
    await persistir()
    return true
  }

  async function actualizarComercioLista(listaId, comercioActual) {
    const lista = obtenerListaPorId(listaId)
    if (!lista) return false

    lista.comercioActual = comercioActual || null
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
    const cantidad = Number(datosItem.cantidad)

    if (!nombre || !Number.isFinite(cantidad) || cantidad <= 0) {
      return { exito: false, motivo: 'datos-minimos' }
    }

    if (detectarDuplicado(lista, datosItem)) {
      return { exito: false, motivo: 'duplicado' }
    }

    const itemNormalizado = ListaJustaService.normalizarItem(datosItem)
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

    const itemActualizado = {
      ...itemActual,
      ...cambios,
      actualizadoEn: new Date().toISOString(),
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
    if (!item || item.productoId || item.estadoDerivacion === 'enMisProductos') return false

    sesionEscaneoStore.agregarItem({
      codigoBarras: item.codigoBarras,
      nombre: item.nombre,
      marca: item.marca,
      cantidad: item.cantidad,
      unidad: item.unidad,
      imagen: item.imagen,
      precio: item.precioManual || 0,
      moneda: 'UYU',
      origenApi: false,
      productoExistenteId: null,
      sinCoincidencia: true,
      comercio: item.comercio
        ? {
            id: 'lista-justa',
            nombre: item.comercio,
            direccionId: 'lista-justa',
            direccionNombre: item.comercio,
          }
        : null,
    })

    item.estadoDerivacion = 'enMesa'
    item.actualizadoEn = new Date().toISOString()
    lista.fechaActualizacion = new Date().toISOString()
    await persistir()

    return true
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
          moneda: 'UYU',
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
    item.actualizadoEn = new Date().toISOString()
    lista.fechaActualizacion = new Date().toISOString()
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
    registrarUsoLista,
    actualizarComercioLista,
  }
})
