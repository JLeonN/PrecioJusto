<template>
  <q-page class="q-pa-md">
    <!-- Contenedor con ancho máximo -->
    <div class="contenedor-detalle">
      <!-- INDICADOR DE CARGA -->
      <div v-if="cargando" class="text-center q-pa-xl">
        <q-spinner color="primary" size="50px" />
        <p class="text-grey-7 q-mt-md">Cargando producto...</p>
      </div>

      <!-- MENSAJE DE ERROR -->
      <q-banner v-else-if="error" class="bg-negative text-white q-mb-md" rounded>
        <template #avatar>
          <q-icon name="error" color="white" />
        </template>
        {{ error }}
        <template #action>
          <q-btn flat label="Volver" @click="$router.back()" />
        </template>
      </q-banner>

      <!-- CONTENIDO DEL PRODUCTO -->
      <template v-else-if="productoActual">
        <!-- Botón volver -->
        <q-btn
          flat
          dense
          color="primary"
          icon=""
          label="Volver"
          class="q-mb-md"
          @click="$router.back()"
        >
          <IconArrowLeft :size="20" class="q-mr-xs" />
        </q-btn>

        <!-- Cabecera del producto -->
        <InfoProducto :producto="productoActual" class="q-mb-lg" />

        <!-- Estadísticas en cards -->
        <EstadisticasProducto :producto="productoActual" class="q-mb-lg" />

        <!-- Filtros del historial -->
        <FiltrosHistorial
          v-model:comercio="filtroComercio"
          v-model:periodo="filtroPeriodo"
          v-model:orden="ordenSeleccionado"
          :comercios-disponibles="comerciosDisponibles"
          class="q-mb-md"
        />

        <!-- Historial completo de precios -->
        <HistorialPrecios
          :precios="preciosFiltrados"
          :precios-confirmados="confirmacionesStore.preciosConfirmados"
          :orden-seleccionado="ordenSeleccionado"
          @confirmar-precio="confirmarPrecio"
        />
      </template>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { IconArrowLeft } from '@tabler/icons-vue'
import InfoProducto from '../components/DetalleProducto/InfoProducto.vue'
import EstadisticasProducto from '../components/DetalleProducto/EstadisticasProducto.vue'
import FiltrosHistorial from '../components/DetalleProducto/FiltrosHistorial.vue'
import HistorialPrecios from '../components/DetalleProducto/HistorialPrecios.vue'
import { useProductosStore } from '../almacenamiento/stores/productosStore.js'
import { useConfirmacionesStore } from '../almacenamiento/stores/confirmacionesStore.js'
import { useQuasar } from 'quasar'

// ========================================
// 🏪 STORES Y ROUTE
// ========================================

const productosStore = useProductosStore()
const confirmacionesStore = useConfirmacionesStore()
const route = useRoute()
const $q = useQuasar()

// ========================================
// 📊 ESTADO
// ========================================

const cargando = ref(false)
const error = ref(null)
const productoActual = ref(null)

// Filtros
const filtroComercio = ref('todos')
const filtroPeriodo = ref('30')
const ordenSeleccionado = ref('reciente')

// ========================================
// 🧮 COMPUTED
// ========================================

// Comercios únicos disponibles para el filtro
const comerciosDisponibles = computed(() => {
  if (!productoActual.value?.precios) return []
  const comercios = [...new Set(productoActual.value.precios.map((p) => p.nombreCompleto))]
  return comercios.sort()
})

// Precios filtrados según los filtros activos
const preciosFiltrados = computed(() => {
  if (!productoActual.value?.precios) return []

  let precios = [...productoActual.value.precios]

  // Filtrar por comercio
  if (filtroComercio.value !== 'todos') {
    precios = precios.filter((p) => p.nombreCompleto === filtroComercio.value)
  }

  // Filtrar por período
  const ahora = new Date()
  const diasAtras = parseInt(filtroPeriodo.value)
  if (diasAtras !== 0) {
    const fechaLimite = new Date(ahora.getTime() - diasAtras * 24 * 60 * 60 * 1000)
    precios = precios.filter((p) => new Date(p.fecha) >= fechaLimite)
  }

  // Ordenar
  if (ordenSeleccionado.value === 'reciente') {
    precios.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  } else if (ordenSeleccionado.value === 'antiguo') {
    precios.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
  } else if (ordenSeleccionado.value === 'precio-menor') {
    precios.sort((a, b) => a.valor - b.valor)
  } else if (ordenSeleccionado.value === 'precio-mayor') {
    precios.sort((a, b) => b.valor - a.valor)
  } else if (ordenSeleccionado.value === 'confirmaciones') {
    precios.sort((a, b) => b.confirmaciones - a.confirmaciones)
  }

  return precios
})

// ========================================
// 🔄 FUNCIONES
// ========================================

/**
 * 📥 CARGAR PRODUCTO
 * Obtiene el producto desde el store usando el ID de la URL
 */
async function cargarProducto() {
  cargando.value = true
  error.value = null

  try {
    const productoId = parseInt(route.params.id)

    if (isNaN(productoId)) {
      error.value = 'ID de producto inválido'
      return
    }

    console.log(`📥 Cargando producto ${productoId}...`)

    // Buscar en el store (ya cargado en MisProductosPage)
    let producto = productosStore.obtenerProductoPorId(productoId)

    // Si no está en el store, cargar desde el servicio
    if (!producto) {
      producto = await productosStore.obtenerProducto(productoId)
    }

    if (!producto) {
      error.value = 'Producto no encontrado'
      return
    }

    productoActual.value = producto
    console.log('✅ Producto cargado:', producto.nombre)
  } catch (err) {
    console.error('❌ Error al cargar producto:', err)
    error.value = 'Error al cargar el producto'
  } finally {
    cargando.value = false
  }
}

/**
 * 👍 CONFIRMAR PRECIO
 * @param {string} precioId - ID del precio a confirmar
 */
async function confirmarPrecio(precioId) {
  if (!productoActual.value) return

  console.log(`👍 Confirmando precio ${precioId}...`)

  // Verificación local rápida
  if (confirmacionesStore.precioEstaConfirmado(precioId)) {
    $q.notify({
      type: 'warning',
      message: 'Ya confirmaste este precio anteriormente',
      position: 'top',
    })
    return
  }

  // Confirmar usando el store
  const resultado = await confirmacionesStore.confirmarPrecio(productoActual.value.id, precioId)

  if (resultado.exito) {
    // Actualizar producto local con los nuevos datos
    productoActual.value = resultado.producto

    $q.notify({
      type: 'positive',
      message: `Precio confirmado (${resultado.nuevasConfirmaciones} confirmaciones)`,
      position: 'top',
      icon: 'thumb_up',
    })
  } else {
    $q.notify({
      type: 'negative',
      message: resultado.mensaje,
      position: 'top',
    })
  }
}

// ========================================
// ⚡ LIFECYCLE HOOKS
// ========================================

/**
 * Al montar el componente:
 * 1. Cargar confirmaciones del usuario
 * 2. Cargar producto específico
 */
onMounted(async () => {
  // Cargar confirmaciones del usuario
  await confirmacionesStore.cargarConfirmaciones()

  // Cargar producto
  await cargarProducto()
})
</script>

<style scoped>
.contenedor-detalle {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
</style>
