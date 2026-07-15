const LONGITUDES_GTIN_ADMITIDAS = new Set([8, 12, 13, 14])

export function normalizarCodigoCatalogo(codigo) {
  return String(codigo || '').replace(/[\s-]/g, '')
}

export function esGtinValido(codigo) {
  const codigoNormalizado = normalizarCodigoCatalogo(codigo)

  if (!/^\d+$/.test(codigoNormalizado) || !LONGITUDES_GTIN_ADMITIDAS.has(codigoNormalizado.length)) {
    return false
  }

  const digitoVerificador = Number(codigoNormalizado.at(-1))
  let suma = 0
  let multiplicador = 3

  for (let indice = codigoNormalizado.length - 2; indice >= 0; indice -= 1) {
    suma += Number(codigoNormalizado[indice]) * multiplicador
    multiplicador = multiplicador === 3 ? 1 : 3
  }

  return (10 - (suma % 10)) % 10 === digitoVerificador
}

export function esImagenApiPublica(imagen, fuenteDato) {
  return Boolean(fuenteDato) && /^https?:\/\//i.test(String(imagen || '').trim())
}

export function crearFichaCatalogoCompartido(producto = {}) {
  const codigoBarras = normalizarCodigoCatalogo(producto.codigoBarras)
  const nombre = String(producto.nombre || '').trim()
  const cantidad = Number(producto.cantidad)
  const unidad = String(producto.unidad || '').trim()

  if (!esGtinValido(codigoBarras) || !nombre || !Number.isFinite(cantidad) || cantidad <= 0 || !unidad) {
    return null
  }

  const ficha = {
    codigoBarras,
    nombre,
    cantidad,
    unidad,
    origenCatalogo: producto.fuenteDato ? 'api' : 'manual',
  }

  const marca = String(producto.marca || '').trim()
  const categoria = String(producto.categoria || '').trim()

  if (marca) ficha.marca = marca
  if (categoria) ficha.categoria = categoria
  if (esImagenApiPublica(producto.imagen, producto.fuenteDato)) ficha.imagenUrl = producto.imagen.trim()

  return ficha
}

export function tieneCambiosCatalogoCompartido(cambios = {}) {
  const campos = ['codigoBarras', 'nombre', 'cantidad', 'unidad', 'marca', 'categoria', 'imagen', 'fuenteDato']
  return campos.some((campo) => Object.prototype.hasOwnProperty.call(cambios, campo))
}
