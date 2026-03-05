<template>
  <q-page-sticky :position="posicion" :offset="offset" class="fab-sticky">
    <!-- Multi-acción: speed dial con animación -->
    <q-fab
      v-if="acciones.length > 1"
      :color="color"
      icon="add"
      active-icon="close"
      direction="up"
      padding="md"
    >
      <q-fab-action
        v-for="accion in acciones"
        :key="accion.label"
        :color="accion.color || color"
        text-color="white"
        :label="accion.label"
        label-position="left"
        label-class="fab-label"
        padding="sm"
        @click="() => ejecutarAccion(accion.accion)"
      />
    </q-fab>

    <!-- Acción única: botón directo -->
    <q-btn
      v-else-if="acciones.length === 1"
      fab
      :color="color"
      size="lg"
      @click="acciones[0].accion"
    >
      <component :is="acciones[0].icono" :size="28" />
    </q-btn>
  </q-page-sticky>
</template>

<script setup>
import { nextTick } from 'vue'

// Espera que el FAB termine su animación de cierre antes de ejecutar la acción.
// Sin esto, abrir un q-dialog en el mismo tick falla en Capacitor/Android.
function ejecutarAccion(fn) {
  nextTick(() => fn())
}

defineProps({
  acciones: {
    type: Array,
    default: () => [],
    // Cada acción: { icono: Component, label: String, color: String, accion: Function }
  },
  color: { type: String, default: 'primary' },
  posicion: { type: String, default: 'bottom-right' },
  offset: { type: Array, default: () => [18, 18] },
})
</script>

<style scoped>
.fab-sticky {
  bottom: calc(18px + var(--safe-area-bottom, 0px)) !important;
  z-index: 2000;
}
</style>

<style>
.fab-label {
  width: 150px;
  text-align: left;
}
</style>
