<template>
  <q-page class="q-pa-md">
    <ListaProductos :productos="productosEjemplo" />

    <!-- BOTÓN FLOTANTE AGREGAR -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab color="primary" icon="" size="lg">
        <IconPlus :size="28" />
      </q-btn>
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { IconPlus } from '@tabler/icons-vue'
import ListaProductos from '../components/MisProductos/ListaProductos.vue'

// Datos de ejemplo para visualizar
const productosEjemplo = ref([
  {
    id: 1,
    nombre: 'Leche La Serenísima 1L',
    imagen: null,
    precioMejor: 850,
    comercioMejor: 'TATA',
    diferenciaPrecio: 250,
    precios: [
      { comercio: 'TATA', valor: 850, fecha: 'Hace 2 días', esMejor: true },
      { comercio: 'DISCO', valor: 920, fecha: 'Hace 1 día', esMejor: false },
      { comercio: 'DEVOTO', valor: 980, fecha: 'Hoy', esMejor: false },
      { comercio: 'DON JOSE', valor: 1100, fecha: 'Hace 3 días', esMejor: false },
    ],
  },
  {
    id: 2,
    nombre: 'Coca Cola 2.25L',
    imagen: null,
    precioMejor: 1250,
    comercioMejor: 'Kiosco Pepe',
    diferenciaPrecio: 350,
    precios: [
      { comercio: 'Kiosco Pepe', valor: 1250, fecha: 'Hace 1 día', esMejor: true },
      { comercio: 'DISCO', valor: 1400, fecha: 'Hoy', esMejor: false },
      { comercio: 'DEVOTO', valor: 1600, fecha: 'Hace 2 días', esMejor: false },
    ],
  },
  {
    id: 3,
    nombre: 'Pan Lactal Bimbo Grande',
    imagen: null,
    precioMejor: 920,
    comercioMejor: 'Panaderia Maria',
    diferenciaPrecio: 180,
    precios: [
      { comercio: 'Panaderia Maria', valor: 920, fecha: 'Hoy', esMejor: true },
      { comercio: 'TATA', valor: 1050, fecha: 'Hace 1 día', esMejor: false },
      { comercio: 'DISCO', valor: 1100, fecha: 'Hace 2 días', esMejor: false },
    ],
  },
  {
    id: 4,
    nombre: 'Aceite Cocinero 900ml',
    imagen: null,
    precioMejor: 1580,
    comercioMejor: 'Gafi',
    diferenciaPrecio: 420,
    precios: [
      { comercio: 'Gafi', valor: 1580, fecha: 'Hace 3 días', esMejor: true },
      { comercio: 'DEVOTO', valor: 1850, fecha: 'Hace 1 día', esMejor: false },
      { comercio: 'cyber 3.com', valor: 1920, fecha: 'Hoy', esMejor: false },
      { comercio: 'DON JOSE', valor: 2000, fecha: 'Hace 2 días', esMejor: false },
    ],
  },
])
</script>
