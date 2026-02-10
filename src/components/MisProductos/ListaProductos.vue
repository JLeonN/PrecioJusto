<template>
  <div class="row q-col-gutter-md">
    <div v-for="producto in productos" :key="producto.id" class="col-12 col-sm-6 col-md-4 col-xl-3">
      <TarjetaProductoYugioh
        :producto="producto"
        :modo-seleccion="modoSeleccion"
        :seleccionado="seleccionados.has(producto.id)"
        @long-press="$emit('long-press', producto.id)"
        @toggle-seleccion="$emit('toggle-seleccion', producto.id)"
        @agregar-precio="$emit('agregar-precio', producto.id)"
        @ver-detalle="$emit('ver-detalle', producto.id)"
      />
    </div>
    <div v-if="productos.length === 0" class="col-12">
      <div class="text-center q-pa-xl">
        <IconShoppingBag :size="64" class="text-grey-5 q-mb-md" />
        <p class="text-h6 text-grey-6 q-mb-none">No hay productos registrados</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import TarjetaProductoYugioh from '../Tarjetas/TarjetaProductoYugioh.vue'
import { IconShoppingBag } from '@tabler/icons-vue'

/* Props del componente */
defineProps({
  productos: {
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
defineEmits(['long-press', 'toggle-seleccion', 'agregar-precio', 'ver-detalle'])
</script>
