<template>
  <div class="contenedor-boton-sticky">
    <q-btn
      unelevated
      :color="color"
      no-caps
      :icon="icono"
      :label="etiqueta"
      :disable="deshabilitado"
      :loading="cargando"
      class="boton-sticky"
      @click="emit('click')"
    />
  </div>
</template>

<script setup>
defineProps({
  etiqueta: {
    type: String,
    required: true,
  },
  icono: {
    type: String,
    default: 'add',
  },
  color: {
    type: String,
    default: 'secondary',
  },
  deshabilitado: {
    type: Boolean,
    default: false,
  },
  cargando: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['click'])
</script>

<style scoped>
.contenedor-boton-sticky {
  position: sticky;
  bottom: calc(12px + var(--safe-area-bottom, 0px) + var(--espacio-publicidad, 0px));
  z-index: 20;
  padding: 0 16px;
  display: flex;
  justify-content: center;
  pointer-events: none;
}
.boton-sticky {
  pointer-events: auto;
  min-width: min(100%, 380px);
  box-shadow: var(--sombra-media);
}
</style>
