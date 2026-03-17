<template>
  <PantallaSplash :appLista="appLista" />
  <router-view />
</template>

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
