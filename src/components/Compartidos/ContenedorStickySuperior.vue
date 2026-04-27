<template>
  <div class="contenedor-sticky-superior" :style="estiloSticky">
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  topExtra: {
    type: Number,
    default: 0,
  },
  zIndex: {
    type: Number,
    default: 24,
  },
  margenInferior: {
    type: Number,
    default: 10,
  },
})

const estiloSticky = computed(() => ({
  top: `calc(var(--safe-area-top, 0px) + 56px + ${props.topExtra}px)`,
  zIndex: String(props.zIndex),
  marginBottom: `${props.margenInferior}px`,
}))
</script>

<style scoped>
.contenedor-sticky-superior {
  position: sticky;
  padding-top: 2px;
  background: var(--fondo-app);
}
</style>
