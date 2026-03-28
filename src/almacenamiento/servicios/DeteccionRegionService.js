import { MONEDA_DEFAULT } from '../constantes/Monedas.js'

const MAPA_MONEDA_POR_PAIS = {
  UY: 'UYU',
  AR: 'ARS',
  US: 'USD',
  BR: 'BRL',
  CL: 'CLP',
  CO: 'COP',
  MX: 'MXN',
  PY: 'PYG',
  PE: 'PEN',
  CA: 'CAD',
  ES: 'EUR',
  PT: 'EUR',
  FR: 'EUR',
  DE: 'EUR',
  IT: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  IE: 'EUR',
  FI: 'EUR',
  SK: 'EUR',
  SI: 'EUR',
  LV: 'EUR',
  LT: 'EUR',
  EE: 'EUR',
  CY: 'EUR',
  MT: 'EUR',
  GR: 'EUR',
  GB: 'GBP',
  CH: 'CHF',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  PL: 'PLN',
  CZ: 'CZK',
  HU: 'HUF',
  RO: 'RON',
  JP: 'JPY',
  CN: 'CNY',
  IN: 'INR',
  KR: 'KRW',
  SG: 'SGD',
  HK: 'HKD',
  TH: 'THB',
  MY: 'MYR',
  ID: 'IDR',
  PH: 'PHP',
  VN: 'VND',
  AU: 'AUD',
  NZ: 'NZD',
  ZA: 'ZAR',
  EG: 'EGP',
  NG: 'NGN',
  AE: 'AED',
  SA: 'SAR',
  IL: 'ILS',
  TR: 'TRY',
}

function extraerPaisDesdeLocale(locale) {
  if (!locale || typeof locale !== 'string') return null

  try {
    if (typeof Intl !== 'undefined' && typeof Intl.Locale === 'function') {
      const localeNormalizada = new Intl.Locale(locale)
      if (localeNormalizada.region) return localeNormalizada.region.toUpperCase()
    }
  } catch {
    // Ignora locales inválidas y usa fallback manual
  }

  const coincidencia = locale.match(/[-_]([a-zA-Z]{2})\b/)
  return coincidencia ? coincidencia[1].toUpperCase() : null
}

function obtenerLocalesPreferidos() {
  if (typeof navigator === 'undefined') return []

  const locales = Array.isArray(navigator.languages) ? [...navigator.languages] : []
  if (navigator.language) locales.push(navigator.language)

  return [...new Set(locales.filter((locale) => typeof locale === 'string' && locale.trim() !== ''))]
}

export function obtenerMonedaPorPais(pais) {
  if (!pais) return null
  return MAPA_MONEDA_POR_PAIS[pais.toUpperCase()] || null
}

export function detectarMonedaPorRegion() {
  const locales = obtenerLocalesPreferidos()

  for (const locale of locales) {
    const paisDetectado = extraerPaisDesdeLocale(locale)
    if (!paisDetectado) continue

    const monedaDetectada = obtenerMonedaPorPais(paisDetectado)

    return {
      paisDetectado,
      monedaDetectada,
      localeOrigen: locale,
    }
  }

  return {
    paisDetectado: null,
    monedaDetectada: null,
    localeOrigen: null,
  }
}

export function obtenerMonedaFallback() {
  return MONEDA_DEFAULT
}