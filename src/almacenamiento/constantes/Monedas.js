/**
 * CONSTANTES: Opciones de monedas
 *
 * Monedas principales del mundo organizadas por región.
 * Usadas en formularios y visualización de precios.
 */

export const MONEDAS = [
  // América
  { label: 'UYU - Peso Uruguayo ($)', value: 'UYU', simbolo: '$' },
  { label: 'ARS - Peso Argentino ($)', value: 'ARS', simbolo: '$' },
  { label: 'USD - Dólar Estadounidense ($)', value: 'USD', simbolo: '$' },
  { label: 'BRL - Real Brasileño (R$)', value: 'BRL', simbolo: 'R$' },
  { label: 'CLP - Peso Chileno ($)', value: 'CLP', simbolo: '$' },
  { label: 'COP - Peso Colombiano ($)', value: 'COP', simbolo: '$' },
  { label: 'MXN - Peso Mexicano ($)', value: 'MXN', simbolo: '$' },
  { label: 'PYG - Guaraní Paraguayo (₲)', value: 'PYG', simbolo: '₲' },
  { label: 'PEN - Sol Peruano (S/)', value: 'PEN', simbolo: 'S/' },
  { label: 'CAD - Dólar Canadiense ($)', value: 'CAD', simbolo: '$' },

  // Europa
  { label: 'EUR - Euro (€)', value: 'EUR', simbolo: '€' },
  { label: 'GBP - Libra Esterlina (£)', value: 'GBP', simbolo: '£' },
  { label: 'CHF - Franco Suizo (Fr)', value: 'CHF', simbolo: 'Fr' },
  { label: 'SEK - Corona Sueca (kr)', value: 'SEK', simbolo: 'kr' },
  { label: 'NOK - Corona Noruega (kr)', value: 'NOK', simbolo: 'kr' },
  { label: 'DKK - Corona Danesa (kr)', value: 'DKK', simbolo: 'kr' },
  { label: 'PLN - Zloty Polaco (zł)', value: 'PLN', simbolo: 'zł' },
  { label: 'CZK - Corona Checa (Kč)', value: 'CZK', simbolo: 'Kč' },
  { label: 'HUF - Forinto Húngaro (Ft)', value: 'HUF', simbolo: 'Ft' },
  { label: 'RON - Leu Rumano (lei)', value: 'RON', simbolo: 'lei' },

  // Asia
  { label: 'JPY - Yen Japonés (¥)', value: 'JPY', simbolo: '¥' },
  { label: 'CNY - Yuan Chino (¥)', value: 'CNY', simbolo: '¥' },
  { label: 'INR - Rupia India (₹)', value: 'INR', simbolo: '₹' },
  { label: 'KRW - Won Surcoreano (₩)', value: 'KRW', simbolo: '₩' },
  { label: 'SGD - Dólar de Singapur ($)', value: 'SGD', simbolo: '$' },
  { label: 'HKD - Dólar de Hong Kong ($)', value: 'HKD', simbolo: '$' },
  { label: 'THB - Baht Tailandés (฿)', value: 'THB', simbolo: '฿' },
  { label: 'MYR - Ringgit Malasio (RM)', value: 'MYR', simbolo: 'RM' },
  { label: 'IDR - Rupia Indonesia (Rp)', value: 'IDR', simbolo: 'Rp' },
  { label: 'PHP - Peso Filipino (₱)', value: 'PHP', simbolo: '₱' },
  { label: 'VND - Dong Vietnamita (₫)', value: 'VND', simbolo: '₫' },

  // Oceanía
  { label: 'AUD - Dólar Australiano ($)', value: 'AUD', simbolo: '$' },
  { label: 'NZD - Dólar Neozelandés ($)', value: 'NZD', simbolo: '$' },

  // África
  { label: 'ZAR - Rand Sudafricano (R)', value: 'ZAR', simbolo: 'R' },
  { label: 'EGP - Libra Egipcia (£)', value: 'EGP', simbolo: '£' },
  { label: 'NGN - Naira Nigeriana (₦)', value: 'NGN', simbolo: '₦' },

  // Medio Oriente
  { label: 'AED - Dirham de EAU (د.إ)', value: 'AED', simbolo: 'د.إ' },
  { label: 'SAR - Riyal Saudí (﷼)', value: 'SAR', simbolo: '﷼' },
  { label: 'ILS - Nuevo Shekel (₪)', value: 'ILS', simbolo: '₪' },
  { label: 'TRY - Lira Turca (₺)', value: 'TRY', simbolo: '₺' },
]

export const MONEDAS_POR_CODIGO = Object.freeze(
  MONEDAS.reduce((acumulado, moneda) => {
    acumulado[moneda.value] = moneda
    return acumulado
  }, {}),
)

// Moneda por defecto de la aplicación.
export const MONEDA_DEFAULT = 'UYU'
