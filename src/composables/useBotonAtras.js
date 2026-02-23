import { onMounted, onUnmounted, ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { useQuasar } from 'quasar'

// Rutas raíz donde se pregunta si salir en lugar de navegar atrás
const RUTAS_RAIZ = ['/', '/comercios']

export function useBotonAtras({ drawerAbierto, router, route }) {
  const $q = useQuasar()
  const ultimoTaqueBack = ref(null)
  let listenerHandle = null

  async function manejadorBack() {
    // 1. Si el drawer está abierto → cerrarlo
    if (drawerAbierto.value) {
      drawerAbierto.value = false
      return
    }

    // 2. Si estamos en una página de detalle → navegar atrás
    if (!RUTAS_RAIZ.includes(route.path)) {
      router.back()
      return
    }

    // 3. Página raíz → doble toque para salir
    const ahora = Date.now()
    const tiempoDesdeUltimo = ahora - (ultimoTaqueBack.value || 0)

    if (ultimoTaqueBack.value && tiempoDesdeUltimo < 2000) {
      await App.exitApp()
    } else {
      ultimoTaqueBack.value = ahora
      $q.notify({
        message: 'Presioná de nuevo para salir',
        position: 'bottom',
        timeout: 2000,
        color: 'grey-8',
      })
    }
  }

  onMounted(async () => {
    // Solo registrar en entorno nativo (no en quasar dev web)
    if (!Capacitor.isNativePlatform()) return
    listenerHandle = await App.addListener('backButton', manejadorBack)
  })

  onUnmounted(() => {
    listenerHandle?.remove()
  })
}
