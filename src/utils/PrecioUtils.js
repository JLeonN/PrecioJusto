// Formatea un precio numérico para mostrar al usuario (2 decimales si tiene parte decimal, entero si no)
export function formatearPrecioDisplay(valor) {
  if (valor == null || isNaN(Number(valor))) return '-'
  const num = Number(valor)
  return num % 1 !== 0
    ? `$${num.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$${num.toLocaleString('es-UY')}`
}

// Previene teclas no numéricas en inputs de precio — usar en @keydown
export function soloNumerosDecimales(event) {
  const teclaValida = /^[0-9.,]$/.test(event.key)
  const teclaControl = [
    'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End',
  ].includes(event.key)
  const esAtajo = event.ctrlKey || event.metaKey // Permitir Ctrl+C, Ctrl+V, etc.
  if (!teclaValida && !teclaControl && !esAtajo) {
    event.preventDefault()
  }
}

// Filtra input de precio: solo dígitos y un punto decimal (convierte coma a punto)
export function filtrarInputPrecio(val) {
  if (!val) return ''
  let limpio = String(val).replace(/[^0-9.,]/g, '')
  // Convertir coma a punto (teclados hispanohablantes usan coma como separador)
  limpio = limpio.replace(',', '.')
  // Evitar múltiples puntos decimales
  const partes = limpio.split('.')
  if (partes.length > 2) {
    limpio = partes[0] + '.' + partes.slice(1).join('')
  }
  return limpio
}

// Formatea al salir del campo: 2 decimales si tiene parte decimal, entero si no
export function formatearPrecioAlSalir(val) {
  const num = parseFloat(val)
  if (val === '' || val == null || isNaN(num)) return ''
  return num % 1 !== 0 ? num.toFixed(2) : String(num)
}
