<template>
  <Transition name="splash-fade">
    <div v-if="visible" class="pantalla-splash">
      <img :src="imagenActual" class="imagen-splash" :style="{ objectPosition: posicion }" alt="" />
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const IMAGENES = [
  '/Splash/PrecioJustoFondo-1.jpg',
  '/Splash/PrecioJustoFondo-2.png',
  '/Splash/PrecioJustoFondo-3.png',
  '/Splash/PrecioJustoFondo-4.jpg',
  '/Splash/PrecioJustoFondo-6.png',
]
const DURACION_MINIMA = 2000

const props = defineProps({
  appLista: { type: Boolean, default: false },
})

const visible = ref(true)
// Imagen y posición aleatorias al crear el componente
const imagenActual = IMAGENES[Math.floor(Math.random() * IMAGENES.length)]
const posicion = `${Math.floor(Math.random() * 100)}% ${Math.floor(Math.random() * 100)}%`

let tiempoInicio = 0

onMounted(() => {
  tiempoInicio = Date.now()
})

watch(
  () => props.appLista,
  (lista) => {
    if (!lista) return
    // Esperar el tiempo restante para completar los 2 segundos mínimos
    const transcurrido = Date.now() - tiempoInicio
    const espera = Math.max(0, DURACION_MINIMA - transcurrido)
    setTimeout(() => {
      visible.value = false
    }, espera)
  },
)
</script>

<style scoped>
.pantalla-splash {
  position: fixed;
  inset: 0;
  z-index: 9999;
  overflow: hidden;
}
.imagen-splash {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.splash-fade-leave-active {
  transition: opacity 0.4s ease;
}
.splash-fade-leave-to {
  opacity: 0;
}
</style>
