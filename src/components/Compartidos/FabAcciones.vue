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
        :label="accion.label"
        label-position="left"
        @click="accion.accion"
      >
        <component :is="accion.icono" :size="20" />
      </q-fab-action>
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
}
</style>
