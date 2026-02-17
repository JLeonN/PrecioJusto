// Formatea una fecha como texto relativo (Hace X minutos/horas/días...)
export function formatearFechaRelativa(fecha) {
  if (!fecha) return 'Sin fecha'

  const d = new Date(fecha)
  const ahora = new Date()
  const diferencia = Math.floor((ahora - d) / 1000)

  if (diferencia < 60) return 'Hace un momento'
  if (diferencia < 3600) return `Hace ${Math.floor(diferencia / 60)} minutos`
  if (diferencia < 86400) return `Hace ${Math.floor(diferencia / 3600)} horas`
  if (diferencia < 604800) return `Hace ${Math.floor(diferencia / 86400)} días`
  if (diferencia < 2592000) return `Hace ${Math.floor(diferencia / 604800)} semanas`
  return `Hace ${Math.floor(diferencia / 2592000)} meses`
}

// Formatea una fecha como texto relativo con prefijo "Última vez:"
export function formatearUltimoUso(fecha) {
  if (!fecha) return 'Sin uso registrado'
  return `Última vez: ${formatearFechaRelativa(fecha)}`
}

// Formatea fecha como texto corto legible (17 feb 2026)
export function formatearFechaCorta(fecha) {
  if (!fecha) return 'Sin fecha'

  const d = new Date(fecha)
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`
}
