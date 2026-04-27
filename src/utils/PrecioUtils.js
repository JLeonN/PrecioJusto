import { MONEDAS_POR_CODIGO, MONEDA_DEFAULT } from '../almacenamiento/constantes/Monedas.js'

function normalizarMoneda(codigoMoneda) {
  return codigoMoneda || MONEDA_DEFAULT
}

export function obtenerSimboloMoneda(codigoMoneda) {
  const moneda = MONEDAS_POR_CODIGO[normalizarMoneda(codigoMoneda)]
  return moneda?.simbolo || ''
}

// Formatea un precio numérico para mostrar al usuario.
// Si mostrarCodigo es true: "$1.250 UYU".
export function formatearPrecioDisplay(valor, codigoMoneda = MONEDA_DEFAULT, opciones = {}) {
  if (valor == null || Number.isNaN(Number(valor))) return '-'

  const {
    mostrarCodigo = false,
    usarSimbolo = true,
    locale = 'es-UY',
    forzarDosDecimales = false,
  } = opciones

  const numero = Number(valor)
  const tieneDecimales = numero % 1 !== 0
  const textoNumero = numero.toLocaleString(locale, {
    minimumFractionDigits: forzarDosDecimales || tieneDecimales ? 2 : 0,
    maximumFractionDigits: forzarDosDecimales || tieneDecimales ? 2 : 0,
  })

  const codigo = normalizarMoneda(codigoMoneda)
  const simbolo = usarSimbolo ? obtenerSimboloMoneda(codigo) : ''

  if (mostrarCodigo && simbolo) return `${simbolo}${textoNumero} ${codigo}`
  if (mostrarCodigo) return `${textoNumero} ${codigo}`
  if (simbolo) return `${simbolo}${textoNumero}`
  return `${textoNumero} ${codigo}`
}

// Formato estándar de UI para evitar ambigüedad entre monedas con igual símbolo.
export function formatearPrecioConCodigo(valor, codigoMoneda = MONEDA_DEFAULT, opciones = {}) {
  return formatearPrecioDisplay(valor, codigoMoneda, {
    mostrarCodigo: true,
    ...opciones,
  })
}

// Previene teclas no numéricas en inputs de precio; usar en @keydown
export function soloNumerosDecimales(event) {
  const esDecimalTecladoNumerico = event.key === 'Decimal' || event.code === 'NumpadDecimal'
  const teclaValida = /^[0-9.,]$/.test(event.key)
  const teclaControl = [
    'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End',
  ].includes(event.key)
  const esAtajo = event.ctrlKey || event.metaKey // Permitir Ctrl+C, Ctrl+V, etc.
  if (!teclaValida && !teclaControl && !esAtajo && !esDecimalTecladoNumerico) {
    event.preventDefault()
  }
}

// Filtra input de precio: solo dígitos y un punto decimal (convierte coma a punto)
export function filtrarInputPrecio(val) {
  if (!val) return ''
  let limpio = String(val).replace(/[^0-9.,]/g, '')
  // Convertir coma a punto (teclados hispanohablantes usan coma como separador)
  limpio = limpio.replace(/,/g, '.')
  // Evitar múltiples puntos decimales
  const partes = limpio.split('.')
  if (partes.length > 2) {
    limpio = `${partes[0]}.${partes.slice(1).join('')}`
  }
  return limpio
}

// Formatea al salir del campo: 2 decimales si tiene parte decimal, entero si no
export function formatearPrecioAlSalir(val) {
  const num = parseFloat(val)
  if (val === '' || val == null || Number.isNaN(num)) return ''
  return num % 1 !== 0 ? num.toFixed(2) : String(num)
}
