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
        <TarjetaProducto :producto="producto" @menu-click="abrirMenuProducto(producto)" />
      </div>
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
