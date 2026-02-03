<template>
  <div class="lista-comercios">
    <!-- MENSAJE SI NO HAY COMERCIOS -->
    <div v-if="comercios.length === 0" class="text-center q-pa-xl">
      <q-icon name="store" size="64px" color="grey-5" />
      <p class="text-h6 text-grey-7 q-mt-md">No hay comercios para mostrar</p>
    </div>

    <!-- LISTA DE TARJETAS CON SISTEMA QUASAR -->
    <div v-else class="row q-col-gutter-md">
      <div
        v-for="comercio in comercios"
        :key="comercio.id"
        class="col-12 col-sm-6 col-md-4 col-xl-3"
      >
        <TarjetaComercio
          :comercio="comercio"
          :modo-seleccion="modoSeleccion"
          :seleccionado="estaSeleccionado(comercio.id)"
          @long-press="handleLongPress(comercio.id)"
          @toggle-seleccion="handleToggleSeleccion(comercio.id)"
          @editar="handleEditar(comercio)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import TarjetaComercio from './TarjetaComercio.vue'

const props = defineProps({
  comercios: {
    type: Array,
    required: true,
    default: () => [],
  },
  modoSeleccion: {
    type: Boolean,
    default: false,
  },
  seleccionados: {
    type: Set,
    default: () => new Set(),
  },
})

const emit = defineEmits(['long-press', 'toggle-seleccion', 'editar'])

/**
 * Verifica si un comercio está seleccionado
 */
function estaSeleccionado(comercioId) {
  return props.seleccionados.has(comercioId)
}

/**
 * Maneja el evento de long-press
 */
function handleLongPress(comercioId) {
  emit('long-press', comercioId)
}

/**
 * Maneja el toggle de selección
 */
function handleToggleSeleccion(comercioId) {
  emit('toggle-seleccion', comercioId)
}

/**
 * Maneja el evento de editar
 */
function handleEditar(comercio) {
  emit('editar', comercio)
}
</script>

<style scoped>
.lista-comercios {
  width: 100%;
}
</style>
