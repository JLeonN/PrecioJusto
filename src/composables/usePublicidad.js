import { ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import {
  AdMob,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
} from '@capacitor-community/admob'
import { CONFIG_PUBLICIDAD, MODO_PRUEBA } from '../almacenamiento/constantes/ConfigPublicidad.js'

const altoBanner = ref(0)
const interstitialListo = ref(false)

let publicidadInicializada = false
let listenersBannerRegistrados = false

const esPlataformaNativa = () => Capacitor.isNativePlatform()

const registrarListenersBanner = async () => {
  if (listenersBannerRegistrados) return

  await AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
    if (altoBanner.value === 0) altoBanner.value = 50
  })

  await AdMob.addListener(BannerAdPluginEvents.SizeChanged, ({ height }) => {
    altoBanner.value = Number.isFinite(height) ? height : 50
  })

  await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, () => {
    altoBanner.value = 0
  })

  listenersBannerRegistrados = true
}

const inicializar = async () => {
  if (!esPlataformaNativa() || publicidadInicializada) return

  await AdMob.initialize({
    initializeForTesting: MODO_PRUEBA,
  })

  await registrarListenersBanner()
  publicidadInicializada = true
}

const mostrarBanner = async () => {
  if (!esPlataformaNativa()) return

  try {
    await AdMob.showBanner({
      adId: CONFIG_PUBLICIDAD.banner,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: MODO_PRUEBA,
    })
  } catch {
    altoBanner.value = 0
  }
}

const ocultarBanner = async () => {
  if (!esPlataformaNativa()) return

  try {
    await AdMob.hideBanner()
  } finally {
    altoBanner.value = 0
  }
}

const precargarInterstitial = async () => {
  if (!esPlataformaNativa()) return

  try {
    await AdMob.prepareInterstitial({
      adId: CONFIG_PUBLICIDAD.interstitial,
      isTesting: MODO_PRUEBA,
    })
    interstitialListo.value = true
  } catch {
    interstitialListo.value = false
  }
}

const mostrarInterstitial = async () => {
  if (!esPlataformaNativa() || !interstitialListo.value) return

  try {
    await AdMob.showInterstitial()
  } finally {
    interstitialListo.value = false
  }
}

const mostrarRecompensado = async () => {
  if (!esPlataformaNativa()) return false

  try {
    await AdMob.prepareRewardVideoAd({
      adId: CONFIG_PUBLICIDAD.recompensado,
      isTesting: MODO_PRUEBA,
    })
    const recompensa = await AdMob.showRewardVideoAd()
    return Boolean(recompensa)
  } catch {
    return false
  }
}

export const usePublicidad = () => ({
  altoBanner,
  interstitialListo,
  inicializar,
  mostrarBanner,
  ocultarBanner,
  precargarInterstitial,
  mostrarInterstitial,
  mostrarRecompensado,
})
