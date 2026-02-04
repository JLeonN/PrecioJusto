/**
 * CONSTANTES: Opciones de Monedas
 *
 * Monedas principales del mundo organizadas por región.
 * Usadas en FormularioPrecio y otros componentes que manejen precios.
 */

export const MONEDAS = [
  // América
  { label: 'UYU - Peso Uruguayo ($)', value: 'UYU' },
  { label: 'ARS - Peso Argentino ($)', value: 'ARS' },
  { label: 'USD - Dólar Estadounidense ($)', value: 'USD' },
  { label: 'BRL - Real Brasileño (R$)', value: 'BRL' },
  { label: 'CLP - Peso Chileno ($)', value: 'CLP' },
  { label: 'COP - Peso Colombiano ($)', value: 'COP' },
  { label: 'MXN - Peso Mexicano ($)', value: 'MXN' },
  { label: 'PYG - Guaraní Paraguayo (₲)', value: 'PYG' },
  { label: 'PEN - Sol Peruano (S/)', value: 'PEN' },
  { label: 'CAD - Dólar Canadiense ($)', value: 'CAD' },

  // Europa
  { label: 'EUR - Euro (€)', value: 'EUR' },
  { label: 'GBP - Libra Esterlina (£)', value: 'GBP' },
  { label: 'CHF - Franco Suizo (Fr)', value: 'CHF' },
  { label: 'SEK - Corona Sueca (kr)', value: 'SEK' },
  { label: 'NOK - Corona Noruega (kr)', value: 'NOK' },
  { label: 'DKK - Corona Danesa (kr)', value: 'DKK' },
  { label: 'PLN - Zloty Polaco (zł)', value: 'PLN' },
  { label: 'CZK - Corona Checa (Kč)', value: 'CZK' },
  { label: 'HUF - Forinto Húngaro (Ft)', value: 'HUF' },
  { label: 'RON - Leu Rumano (lei)', value: 'RON' },

  // Asia
  { label: 'JPY - Yen Japonés (¥)', value: 'JPY' },
  { label: 'CNY - Yuan Chino (¥)', value: 'CNY' },
  { label: 'INR - Rupia India (₹)', value: 'INR' },
  { label: 'KRW - Won Surcoreano (₩)', value: 'KRW' },
  { label: 'SGD - Dólar de Singapur ($)', value: 'SGD' },
  { label: 'HKD - Dólar de Hong Kong ($)', value: 'HKD' },
  { label: 'THB - Baht Tailandés (฿)', value: 'THB' },
  { label: 'MYR - Ringgit Malasio (RM)', value: 'MYR' },
  { label: 'IDR - Rupia Indonesia (Rp)', value: 'IDR' },
  { label: 'PHP - Peso Filipino (₱)', value: 'PHP' },
  { label: 'VND - Dong Vietnamita (₫)', value: 'VND' },

  // Oceanía
  { label: 'AUD - Dólar Australiano ($)', value: 'AUD' },
  { label: 'NZD - Dólar Neozelandés ($)', value: 'NZD' },

  // África
  { label: 'ZAR - Rand Sudafricano (R)', value: 'ZAR' },
  { label: 'EGP - Libra Egipcia (£)', value: 'EGP' },
  { label: 'NGN - Naira Nigeriana (₦)', value: 'NGN' },

  // Medio Oriente
  { label: 'AED - Dirham de EAU (د.إ)', value: 'AED' },
  { label: 'SAR - Riyal Saudí (﷼)', value: 'SAR' },
  { label: 'ILS - Nuevo Shekel (₪)', value: 'ILS' },
  { label: 'TRY - Lira Turca (₺)', value: 'TRY' },
]

/**
 * Moneda por defecto de la aplicación
 */
export const MONEDA_DEFAULT = 'UYU'
