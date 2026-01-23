<template>
  <div>
    <!-- HEADER DE LA PÁGINA -->
    <div class="q-mb-md">
      <h5 class="q-my-none text-weight-bold">Mis Productos</h5>
      <p class="text-grey-7 q-mb-none">{{ productos.length }} productos guardados</p>
    </div>

    <!-- LISTA DE PRODUCTOS - Sistema de Grilla Responsivo -->
    <div class="row q-col-gutter-md">
      <div
        v-for="producto in productos"
        :key="producto.id"
        class="col-12 col-sm-6 col-md-4 col-xl-3"
      >
        <TarjetaProducto
          :producto="producto"
          :modo-seleccion="modoSeleccion"
          :seleccionado="estaSeleccionado(producto.id)"
          @menu-click="abrirMenuProducto(producto)"
          @long-press="$emit('long-press', $event)"
          @toggle-seleccion="$emit('toggle-seleccion', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import TarjetaProducto from '../Tarjetas/TarjetaProducto.vue'

const props = defineProps({
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

defineEmits(['long-press', 'toggle-seleccion'])

// Verificar si un producto está seleccionado
const estaSeleccionado = (productoId) => {
  return props.seleccionados.has(productoId)
}

const abrirMenuProducto = (producto) => {
  console.log('Abrir menú para:', producto.nombre)
  // Acá después vas a poner la lógica del menú
}
</script>
