<template>
  <q-page class="q-pa-md">
    <!-- Contenedor con ancho máximo -->
    <div class="contenedor-productos">
      <!-- INDICADOR DE CARGA -->
      <div v-if="productosStore.cargando" class="text-center q-pa-xl">
        <q-spinner color="primary" size="50px" />
        <p class="text-grey-7 q-mt-md">Cargando productos...</p>
      </div>

      <!-- MENSAJE DE ERROR -->
      <q-banner v-else-if="productosStore.error" class="bg-negative text-white q-mb-md" rounded>
        <template #avatar>
          <q-icon name="error" color="white" />
        </template>
        {{ productosStore.error }}
        <template #action>
          <q-btn flat label="Reintentar" @click="cargarProductos" />
        </template>
      </q-banner>

      <!-- MENSAJE SI NO HAY PRODUCTOS -->
      <div v-else-if="!productosStore.tieneProductos" class="text-center q-pa-xl">
        <q-icon name="inventory_2" size="64px" color="grey-5" />
        <p class="text-h6 text-grey-7 q-mt-md">No tienes productos guardados</p>
        <p class="text-grey-6">Presiona el botón + para agregar tu primer producto</p>
        <p class="text-grey-6 q-mt-md">
          O presiona el botón verde
          <q-icon name="upload" color="secondary" size="20px" />
          para cargar datos de ejemplo
        </p>
      </div>

      <!-- LISTA DE PRODUCTOS -->
      <ListaProductos v-else :productos="productosStore.productosOrdenadosPorFecha" />
    </div>

    <!-- BOTÓN FLOTANTE AGREGAR -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab color="primary" icon="" size="lg" @click="abrirDialogoAgregar">
        <IconPlus :size="28" />
      </q-btn>
    </q-page-sticky>

    <!-- BOTÓN TEMPORAL PARA SEED (solo desarrollo) -->
    <q-page-sticky position="bottom-left" :offset="[18, 18]">
      <q-btn fab color="secondary" icon="upload" size="md" @click="cargarDatosEjemplo">
        <q-tooltip>Cargar datos de ejemplo</q-tooltip>
      </q-btn>
    </q-page-sticky>

    <!-- DIÁLOGO AGREGAR PRODUCTO -->
    <DialogoAgregarProducto
      v-model="dialogoAgregarAbierto"
      modo="local"
      @producto-guardado="onProductoGuardado"
    />
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { IconPlus } from '@tabler/icons-vue'
import ListaProductos from '../components/MisProductos/ListaProductos.vue'
import DialogoAgregarProducto from '../components/Formularios/Dialogos/DialogoAgregarProducto.vue'
import { useProductosStore } from '../almacenamiento/stores/productosStore.js'
import { ejecutarSeed } from '../almacenamiento/seed.js'
import { useQuasar } from 'quasar'

const productosStore = useProductosStore()
const $q = useQuasar()

// Estado del diálogo
const dialogoAgregarAbierto = ref(false)

async function cargarProductos() {
  await productosStore.cargarProductos()
}

function abrirDialogoAgregar() {
  dialogoAgregarAbierto.value = true
}

function onProductoGuardado() {
  // Recargar productos después de guardar uno nuevo
  cargarProductos()
}

async function cargarDatosEjemplo() {
  $q.notify({
    type: 'info',
    message: 'Cargando productos de ejemplo...',
    position: 'top',
  })

  const resultado = await ejecutarSeed()

  if (resultado.exitosos > 0) {
    $q.notify({
      type: 'positive',
      message: `${resultado.exitosos} productos cargados`,
      position: 'top',
    })

    await cargarProductos()
  } else {
    $q.notify({
      type: 'negative',
      message: 'Error al cargar productos',
      position: 'top',
    })
  }
}

onMounted(async () => {
  await cargarProductos()
})
</script>

<style scoped>
.contenedor-productos {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
</style>
