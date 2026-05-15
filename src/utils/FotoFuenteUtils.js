export function resolverFotoFuenteDesdeImagen(imagen) {
  if (typeof imagen !== 'string') return null

  const imagenNormalizada = imagen.trim()
  if (!imagenNormalizada) return null

  if (imagenNormalizada.startsWith('data:image/')) return 'usuario'
  if (/^https?:\/\//i.test(imagenNormalizada)) return 'api'

  return null
}

