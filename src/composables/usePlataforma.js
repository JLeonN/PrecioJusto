import { Capacitor } from '@capacitor/core'
import { computed } from 'vue'

export function usePlataforma() {
  const esNativo = computed(() => Capacitor.isNativePlatform())
  const esWeb = computed(() => !Capacitor.isNativePlatform())
  const esAndroid = computed(() => Capacitor.getPlatform() === 'android')

  const nombrePlataforma = computed(() => Capacitor.getPlatform())

  return {
    esNativo,
    esWeb,
    esAndroid,
    nombrePlataforma,
  }
}
