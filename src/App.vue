<template>
  <PantallaSplash :appLista="appLista" />
  <router-view />
  <div class="version-badge">v1.0.6</div>
</template>

<style scoped>
.version-badge {
  position: fixed;
  bottom: 2px;
  right: 5px;
  font-size: 10px;
  color: rgba(0,0,0,0.3);
  z-index: 99999;
  pointer-events: none;
}
</style>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import './css/Variables.css'
import './css/app.css'
import PantallaSplash from './components/Compartidos/PantallaSplash.vue'

const appLista = ref(false)

onMounted(async () => {
  // Esperar un ciclo de render antes de señalar que la app está lista
  await nextTick()
  appLista.value = true
})
</script>
