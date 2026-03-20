import { ref, computed, onMounted, onUnmounted } from 'vue'

export function useTecladoVirtual() {
  const alturaViewport = ref(window.visualViewport?.height ?? window.innerHeight)
  const tecladoAbierto = ref(false)

  function alRedimensionar() {
    const nuevaAltura = window.visualViewport?.height ?? window.innerHeight
    // Si la altura se reduce más del 20%, asumimos que el teclado está abierto
    tecladoAbierto.value = nuevaAltura < window.innerHeight * 0.8
    alturaViewport.value = nuevaAltura

    if (tecladoAbierto.value) {
      // Scroll al elemento enfocado para que quede en el centro de la zona visible
      const enfocado = document.activeElement
      if (enfocado && (enfocado.tagName === 'INPUT' || enfocado.tagName === 'TEXTAREA' || enfocado.closest('.q-field'))) {
        setTimeout(() => {
          enfocado.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 300) // Un poco más de tiempo para asegurar que el teclado terminó de subir
      }
    }
  }

  onMounted(() => {
    window.visualViewport?.addEventListener('resize', alRedimensionar)
  })

  onUnmounted(() => {
    window.visualViewport?.removeEventListener('resize', alRedimensionar)
  })

  const estiloTarjeta = computed(() => ({
    maxHeight: `${alturaViewport.value - 40}px`,
    display: 'flex',
    flexDirection: 'column'
  }))

  return { alturaViewport, tecladoAbierto, estiloTarjeta }
}
