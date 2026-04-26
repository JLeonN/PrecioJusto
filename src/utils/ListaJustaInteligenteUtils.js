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
  const claveComercio = obtenerClaveComercioSeleccionado(comercio)
  const monedaReferencia = producto?.monedaReferencia || monedaDefault

  const precioComercio = preciosVigentes.find(
    (precio) => obtenerClaveComercioPrecio(precio) === claveComercio,
  )

  if (!precioComercio) {
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

  const aplicacion = aplicarPrecioPorCantidad(
    precioComercio.valor,
    precioComercio.escalasPorCantidad,
    cantidad,
  )
  const moneda = precioComercio.moneda || monedaReferencia
  const valorUnitario = Number(aplicacion.valor)
  const cantidadNormalizada =
    Number.isFinite(Number(cantidad)) && Number(cantidad) > 0 ? Number(cantidad) : 1

  if (!Number.isFinite(valorUnitario) || valorUnitario <= 0) {
    return {
      disponible: false,
      moneda,
      valorUnitario: null,
      valorTotal: null,
      usaMayorista: false,
      precioBase: Number.isFinite(Number(precioComercio.valor)) ? Number(precioComercio.valor) : null,
      escalas: aplicacion.escalas,
    }
  }

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

export {
  aplicarPrecioPorCantidad,
  normalizarEscalasValidas,
  obtenerClaveComercioPrecio,
  obtenerClaveComercioSeleccionado,
  obtenerEtiquetaComercio,
  obtenerPreciosVigentesProducto,
  resolverPrecioProductoPorComercio,
}
