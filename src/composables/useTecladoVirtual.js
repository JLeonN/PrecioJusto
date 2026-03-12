import { ref, computed, onMounted, onUnmounted } from 'vue'

// OPCIÓN B (alternativa más robusta, no implementada):
// Usar el plugin nativo @capacitor/keyboard en lugar de visualViewport.
// Instalación: npm install @capacitor/keyboard && npx cap sync android
//
// import { Keyboard } from '@capacitor/keyboard'
//
// Keyboard.addListener('keyboardWillShow', (info) => {
//   alturaViewport.value = window.innerHeight - info.keyboardHeight
// })
// Keyboard.addListener('keyboardWillHide', () => {
//   alturaViewport.value = window.innerHeight
// })
//
// Ventajas: recibe la altura exacta ANTES de que aparezca el teclado (sin salto visual),
// más confiable en Android con pantallas con notch o barra de navegación en gesture mode.
// Desventaja: requiere nueva dependencia y rebuild nativo.

export function useTecladoVirtual() {
  const alturaViewport = ref(window.visualViewport?.height ?? window.innerHeight)

  function alRedimensionar() {
    alturaViewport.value = window.visualViewport?.height ?? window.innerHeight
    // Scroll al elemento enfocado para que quede visible sobre el teclado
    const enfocado = document.activeElement
    if (enfocado && enfocado !== document.body) {
      setTimeout(() => enfocado.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
    }
  }

  onMounted(() => {
    window.visualViewport?.addEventListener('resize', alRedimensionar)
  })

  onUnmounted(() => {
    window.visualViewport?.removeEventListener('resize', alRedimensionar)
  })

  // Margen de 24px para no quedar pegado al borde de la pantalla
  const estiloTarjeta = computed(() => ({
    maxHeight: `${alturaViewport.value - 24}px`,
    overflowY: 'auto',
  }))

  return { estiloTarjeta }
}
