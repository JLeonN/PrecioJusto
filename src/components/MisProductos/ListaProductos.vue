<template>
  <div>
    <!-- HEADER DE LA PÁGINA -->
    <div class="q-mb-md">
      <h5 class="q-my-none text-weight-bold">Mis Productos</h5>
      <p class="text-grey-7 q-mb-none">{{ productos.length }} productos guardados</p>
    </div>

    <!-- LISTA DE PRODUCTOS -->
    <div class="q-gutter-md">
      <TarjetaProducto
        v-for="producto in productos"
        :key="producto.id"
        :producto="producto"
        @menu-click="abrirMenuProducto(producto)"
      />
    </div>
  </div>
</template>

<script setup>
import TarjetaProducto from '../Tarjetas/TarjetaProducto.vue'

defineProps({
  productos: {
    type: Array,
    required: true,
  },
})

const abrirMenuProducto = (producto) => {
  console.log('Abrir menú para:', producto.nombre)
  // Acá después vas a poner la lógica del menú
}
</script>
