<template>
  <div class="lista-comercios">
    <!-- MENSAJE SI NO HAY COMERCIOS -->
    <div v-if="comercios.length === 0" class="text-center q-pa-xl">
      <q-icon name="store" size="64px" color="grey-5" />
      <p class="text-h6 text-grey-7 q-mt-md">No hay comercios para mostrar</p>
    </div>

    <!-- LISTA DE TARJETAS -->
    <transition-group v-else name="lista" tag="div" class="lista-grid">
      <TarjetaComercio
        v-for="comercio in comercios"
        :key="comercio.id"
        :comercio="comercio"
        :modo-seleccion="modoSeleccion"
        :seleccionado="estaSeleccionado(comercio.id)"
        @long-press="handleLongPress(comercio.id)"
        @toggle-seleccion="handleToggleSeleccion(comercio.id)"
        @editar="handleEditar(comercio)"
      />
    </transition-group>
  </div>
</template>

<script setup>
import TarjetaComercio from './ListaComercios.vue'

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
.lista-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  width: 100%;
}
/* Animaciones de transición */
.lista-enter-active,
.lista-leave-active {
  transition: all 0.3s ease;
}
.lista-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.lista-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
.lista-move {
  transition: transform 0.3s ease;
}
/* Responsive móvil */
@media (max-width: 599px) {
  .lista-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
/* Tablet */
@media (min-width: 600px) and (max-width: 1023px) {
  .lista-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}
</style>
