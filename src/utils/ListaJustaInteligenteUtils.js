function normalizarEscalasValidas(escalas) {
  return (Array.isArray(escalas) ? escalas : [])
    .map((escala) => ({
      cantidadMinima: Number(escala?.cantidadMinima),
      precioUnitario: Number(escala?.precioUnitario),
    }))
    .filter(
      (escala) =>
        Number.isFinite(escala.cantidadMinima) &&
        escala.cantidadMinima >= 2 &&
        Number.isFinite(escala.precioUnitario) &&
        escala.precioUnitario > 0,
    )
    .sort((a, b) => a.cantidadMinima - b.cantidadMinima)
}

function aplicarPrecioPorCantidad(precioBase, escalas, cantidad) {
  const base = Number(precioBase)
  const cantidadNormalizada = Number(cantidad)
  const escalasValidas = normalizarEscalasValidas(escalas)
  let valor = Number.isFinite(base) && base > 0 ? base : null
  let usaMayorista = false

  if (Number.isFinite(cantidadNormalizada) && cantidadNormalizada > 0) {
    for (const escala of escalasValidas) {
      if (cantidadNormalizada < escala.cantidadMinima) continue
      if (valor === null || escala.precioUnitario < valor) {
        valor = escala.precioUnitario
        usaMayorista = true
      }
    }
  }

  return {
    valor,
    usaMayorista,
    escalas: escalasValidas,
  }
}

function obtenerClaveComercioPrecio(precio) {
  return precio?.comercioId && precio?.direccionId
    ? `${precio.comercioId}_${precio.direccionId}`
    : precio?.nombreCompleto || precio?.comercio || precio?.id || 'sin-comercio'
}

function obtenerClaveComercioSeleccionado(comercio) {
  if (!comercio) return ''

  const id = String(comercio.id || '').trim()
  const direccionId = String(comercio.direccionId || '').trim()
  const nombre = String(comercio.nombre || '').trim()
  const direccionNombre = String(comercio.direccionNombre || '').trim()

  if (id && direccionId) return `${id}_${direccionId}`
  if (id) return id
  if (nombre && direccionNombre) return `${nombre}_${direccionNombre}`
  return nombre
}

function obtenerEtiquetaComercio(comercio) {
  const nombre = String(comercio?.nombre || '').trim()
  const direccion = String(comercio?.direccionNombre || '').trim()

  if (nombre && direccion) return `${nombre} - ${direccion}`
  if (nombre) return nombre
  return 'Comercio sin nombre'
}

function tieneComercioSeleccionado(comercio) {
  return Boolean(
    String(comercio?.id || '').trim() ||
      String(comercio?.nombre || '').trim(),
  )
}

function precioCoincideConComercio(precio, comercio) {
  if (!tieneComercioSeleccionado(comercio)) return false

  const comercioId = String(comercio?.id || '').trim()
  const direccionId = String(comercio?.direccionId || '').trim()
  const comercioNombre = String(comercio?.nombre || '').trim()
  const direccionNombre = String(comercio?.direccionNombre || '').trim()
  const precioComercioId = String(precio?.comercioId || '').trim()
  const precioDireccionId = String(precio?.direccionId || '').trim()
  const precioComercio = String(precio?.comercio || '').trim()
  const precioNombreCompleto = String(precio?.nombreCompleto || '').trim()

  if (comercioId && precioComercioId !== comercioId) return false
  if (direccionId && precioDireccionId !== direccionId) return false
  if (comercioId) return true
  if (comercioNombre && precioComercio !== comercioNombre) return false
  if (direccionNombre && !precioNombreCompleto.includes(direccionNombre)) return false
  return Boolean(comercioNombre)
}

function obtenerPreciosVigentesProducto(producto) {
  if (!Array.isArray(producto?.precios) || producto.precios.length === 0) return []

  const mapaVigentes = new Map()

  for (const precio of producto.precios) {
    const clave = obtenerClaveComercioPrecio(precio)
    const actual = mapaVigentes.get(clave)
    if (!actual || new Date(precio.fecha) > new Date(actual.fecha)) {
      mapaVigentes.set(clave, precio)
    }
  }

  return [...mapaVigentes.values()]
}

function resolverPrecioProductoPorComercio(producto, cantidad, comercio, monedaDefault = 'UYU') {
  const preciosVigentes = obtenerPreciosVigentesProducto(producto)
  const monedaReferencia = producto?.monedaReferencia || monedaDefault

  const preciosComercio = preciosVigentes.filter((precio) =>
    precioCoincideConComercio(precio, comercio),
  )

  if (preciosComercio.length === 0) {
    return {
      disponible: false,
      moneda: monedaReferencia,
      valorUnitario: null,
      valorTotal: null,
      usaMayorista: false,
      precioBase: null,
      escalas: [],
    }
  }

  const candidatos = preciosComercio
    .map((precioComercio) => {
      const aplicacion = aplicarPrecioPorCantidad(
        precioComercio.valor,
        precioComercio.escalasPorCantidad,
        cantidad,
      )
      const moneda = precioComercio.moneda || monedaReferencia
      const valorUnitario = Number(aplicacion.valor)
      const cantidadNormalizada =
        Number.isFinite(Number(cantidad)) && Number(cantidad) > 0 ? Number(cantidad) : 1

      return {
        precioComercio,
        aplicacion,
        moneda,
        valorUnitario,
        cantidadNormalizada,
      }
    })
    .filter((candidato) => Number.isFinite(candidato.valorUnitario) && candidato.valorUnitario > 0)
    .sort((a, b) => a.valorUnitario - b.valorUnitario)
  const mejorCandidato = candidatos[0]

  if (!mejorCandidato) {
    const primerPrecio = preciosComercio[0]
    const aplicacion = aplicarPrecioPorCantidad(
      primerPrecio.valor,
      primerPrecio.escalasPorCantidad,
      cantidad,
    )
    const moneda = primerPrecio.moneda || monedaReferencia

    return {
      disponible: false,
      moneda,
      valorUnitario: null,
      valorTotal: null,
      usaMayorista: false,
      precioBase: Number.isFinite(Number(primerPrecio.valor)) ? Number(primerPrecio.valor) : null,
      escalas: aplicacion.escalas,
    }
  }

  const { precioComercio, aplicacion, moneda, valorUnitario, cantidadNormalizada } = mejorCandidato

  return {
    disponible: true,
    moneda,
    valorUnitario,
    valorTotal: valorUnitario * cantidadNormalizada,
    usaMayorista: aplicacion.usaMayorista,
    precioBase: Number.isFinite(Number(precioComercio.valor)) ? Number(precioComercio.valor) : null,
    escalas: aplicacion.escalas,
    precioOriginal: precioComercio,
  }
}

function resolverPrecioManualItem(item, monedaDefault = 'UYU') {
  const aplicacion = aplicarPrecioPorCantidad(
    item?.precioManual,
    item?.escalasPorCantidad,
    item?.cantidad,
  )
  const valorUnitario = Number(aplicacion.valor)
  const cantidadNormalizada =
    Number.isFinite(Number(item?.cantidad)) && Number(item?.cantidad) > 0
      ? Number(item.cantidad)
      : 1
  const moneda = item?.moneda || monedaDefault

  if (!Number.isFinite(valorUnitario) || valorUnitario <= 0) {
    return {
      disponible: false,
      moneda,
      valorUnitario: null,
      valorTotal: null,
      usaMayorista: false,
      precioBase: Number.isFinite(Number(item?.precioManual)) ? Number(item.precioManual) : null,
      escalas: aplicacion.escalas,
    }
  }

  return {
    disponible: true,
    moneda,
    valorUnitario,
    valorTotal: valorUnitario * cantidadNormalizada,
    usaMayorista: aplicacion.usaMayorista,
    precioBase: Number.isFinite(Number(item?.precioManual)) ? Number(item.precioManual) : null,
    escalas: aplicacion.escalas,
  }
}

function resolverPrecioItemParaComercio(item, producto, comercio, monedaDefault = 'UYU') {
  if (!tieneComercioSeleccionado(comercio)) {
    return {
      disponible: false,
      moneda: producto?.monedaReferencia || item?.moneda || monedaDefault,
      valorUnitario: null,
      valorTotal: null,
      usaMayorista: false,
      precioBase: null,
      escalas: [],
    }
  }

  if (!item?.productoId || item?.usaPreciosLocales) {
    return resolverPrecioManualItem(item, monedaDefault)
  }

  if (!producto) {
    return {
      disponible: false,
      moneda: item?.moneda || monedaDefault,
      valorUnitario: null,
      valorTotal: null,
      usaMayorista: false,
      precioBase: null,
      escalas: [],
    }
  }

  return resolverPrecioProductoPorComercio(producto, item?.cantidad, comercio, monedaDefault)
}

function obtenerEtiquetaResumenComercio(comercio) {
  const nombre = String(comercio?.nombre || '').trim()
  return nombre || 'comercio seleccionado'
}

function construirResumenPreciosLista({
  lista,
  obtenerProductoPorId,
  monedaDefault = 'UYU',
} = {}) {
  const items = Array.isArray(lista?.items) ? lista.items : []
  const totalProductos = items.length
  const comercio = lista?.comercioActual || null

  if (!tieneComercioSeleccionado(comercio)) {
    return {
      estado: 'sinComercio',
      etiqueta: 'Sin comercio seleccionado',
      total: 0,
      moneda: monedaDefault,
      productosConPrecio: 0,
      productosSinPrecio: totalProductos,
      totalProductos,
      parcial: false,
      mensaje: 'Agregá un comercio para calcular el estimado.',
    }
  }

  const resultados = items.map((item) => {
    const producto = item?.productoId ? obtenerProductoPorId?.(item.productoId) : null
    return resolverPrecioItemParaComercio(item, producto, comercio, monedaDefault)
  })
  const disponibles = resultados.filter((resultado) => resultado.disponible)
  const productosConPrecio = disponibles.length
  const productosSinPrecio = totalProductos - productosConPrecio
  const monedasDisponibles = [...new Set(disponibles.map((resultado) => resultado.moneda).filter(Boolean))]
  const moneda = monedasDisponibles.length === 1 ? monedasDisponibles[0] : monedaDefault
  const total = disponibles.reduce((suma, resultado) => suma + Number(resultado.valorTotal || 0), 0)
  const etiquetaComercio = obtenerEtiquetaResumenComercio(comercio)

  if (totalProductos === 0) {
    return {
      estado: 'sinProductos',
      etiqueta: `Estimado en ${etiquetaComercio}`,
      total: 0,
      moneda,
      productosConPrecio: 0,
      productosSinPrecio: 0,
      totalProductos: 0,
      parcial: false,
      mensaje: 'Agregá productos para calcular el estimado.',
    }
  }

  if (productosConPrecio === 0) {
    return {
      estado: 'sinPrecios',
      etiqueta: `Sin precios en ${etiquetaComercio}`,
      total: 0,
      moneda,
      productosConPrecio,
      productosSinPrecio,
      totalProductos,
      parcial: true,
      mensaje: 'Faltan precios para completar el total.',
    }
  }

  if (monedasDisponibles.length > 1) {
    return {
      estado: 'monedaMixta',
      etiqueta: `Estimado mixto en ${etiquetaComercio}`,
      total,
      moneda,
      productosConPrecio,
      productosSinPrecio,
      totalProductos,
      parcial: true,
      mensaje: 'Hay precios con distintas monedas.',
    }
  }

  const parcial = productosSinPrecio > 0

  return {
    estado: parcial ? 'parcial' : 'completo',
    etiqueta: parcial ? `Estimado parcial en ${etiquetaComercio}` : `Estimado en ${etiquetaComercio}`,
    total,
    moneda,
    productosConPrecio,
    productosSinPrecio,
    totalProductos,
    parcial,
    mensaje: parcial ? 'Faltan precios para completar el total.' : 'Precios completos.',
  }
}

export {
  aplicarPrecioPorCantidad,
  construirResumenPreciosLista,
  normalizarEscalasValidas,
  obtenerClaveComercioPrecio,
  obtenerClaveComercioSeleccionado,
  obtenerEtiquetaComercio,
  obtenerPreciosVigentesProducto,
  precioCoincideConComercio,
  resolverPrecioItemParaComercio,
  resolverPrecioManualItem,
  resolverPrecioProductoPorComercio,
  tieneComercioSeleccionado,
}
