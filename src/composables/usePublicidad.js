import { ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import {
  AdMob,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
  InterstitialAdPluginEvents,
  RewardAdPluginEvents,
} from '@capacitor-community/admob'
import { CONFIG_PUBLICIDAD, MODO_PRUEBA } from '../almacenamiento/constantes/ConfigPublicidad.js'

const altoBanner = ref(0)
const interstitialListo = ref(false)

let publicidadInicializada = false
let listenersBannerRegistrados = false
let listenersErroresRegistrados = false

const esPlataformaNativa = () => Capacitor.isNativePlatform()

const actualizarVariableEspacioPublicidad = (altura) => {
  if (typeof document === 'undefined') return
  const alturaNormalizada = Number.isFinite(altura) ? Math.max(0, Math.round(altura)) : 0
  document.documentElement.style.setProperty('--espacio-publicidad', `${alturaNormalizada}px`)
}

const registrarListenersBanner = async () => {
  if (listenersBannerRegistrados) return

  await AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
    if (altoBanner.value === 0) altoBanner.value = 50
    actualizarVariableEspacioPublicidad(altoBanner.value)
  })

  await AdMob.addListener(BannerAdPluginEvents.SizeChanged, ({ height }) => {
    altoBanner.value = Number.isFinite(height) ? height : 50
    actualizarVariableEspacioPublicidad(altoBanner.value)
  })

  await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (error) => {
    console.error('[AdMob] Fallo al cargar banner', error)
    altoBanner.value = 0
    actualizarVariableEspacioPublicidad(0)
  })

  listenersBannerRegistrados = true
}

const registrarListenersErrores = async () => {
  if (listenersErroresRegistrados) return

  await AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (error) => {
    console.error('[AdMob] Fallo al cargar interstitial', error)
    interstitialListo.value = false
  })

  await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error) => {
    console.error('[AdMob] Fallo al cargar recompensado', error)
  })

  listenersErroresRegistrados = true
}

const inicializar = async () => {
  if (!esPlataformaNativa() || publicidadInicializada) return

  await AdMob.initialize({
    initializeForTesting: MODO_PRUEBA,
  })

  await registrarListenersBanner()
  await registrarListenersErrores()
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
  } catch (error) {
    console.error('[AdMob] Error al mostrar banner', error)
    altoBanner.value = 0
    actualizarVariableEspacioPublicidad(0)
  }
}

const ocultarBanner = async () => {
  if (!esPlataformaNativa()) return

  try {
    await AdMob.hideBanner()
  } finally {
    altoBanner.value = 0
    actualizarVariableEspacioPublicidad(0)
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
  } catch (error) {
    console.error('[AdMob] Error al precargar interstitial', error)
    interstitialListo.value = false
  }
}

const mostrarInterstitial = async () => {
  if (!esPlataformaNativa() || !interstitialListo.value) return false

  try {
    await AdMob.showInterstitial()
    return true
  } catch (error) {
    console.error('[AdMob] Error al mostrar interstitial', error)
    return false
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
  } catch (error) {
    console.error('[AdMob] Error al mostrar recompensado', error)
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

actualizarVariableEspacioPublicidad(0)
