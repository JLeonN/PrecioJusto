<template>
  <div class="row q-col-gutter-md">
    <div v-for="comercio in comercios" :key="comercio.id" class="col-12 col-sm-6 col-md-4 col-xl-3">
      <TarjetaComercioYugioh
        :comercio="comercio"
        :modo-seleccion="modoSeleccion"
        :seleccionado="seleccionados.has(comercio.id)"
        @long-press="$emit('long-press', comercio.id)"
        @toggle-seleccion="$emit('toggle-seleccion', comercio.id)"
        @editar="$emit('editar', comercio.id)"
      />
    </div>
    <div v-if="comercios.length === 0" class="col-12">
      <div class="text-center q-pa-xl">
        <IconBuilding :size="64" class="text-grey-5 q-mb-md" />
        <p class="text-h6 text-grey-6 q-mb-none">No hay comercios registrados</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import TarjetaComercioYugioh from '../Tarjetas/TarjetaComercioYugioh.vue'
import { IconBuilding } from '@tabler/icons-vue'

/* Props del componente */
defineProps({
  comercios: {
    type: Array,
    required: true,
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

/* Emits del componente */
defineEmits(['long-press', 'toggle-seleccion', 'editar'])
</script>
