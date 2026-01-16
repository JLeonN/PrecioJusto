<template>
  <q-page class="q-pa-md">
    <!-- Contenedor con ancho máximo -->
    <div class="contenedor-detalle">
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
      <HistorialPrecios :precios="preciosFiltrados" @confirmar-precio="confirmarPrecio" />
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { IconArrowLeft } from '@tabler/icons-vue'
import InfoProducto from '../components/DetalleProducto/InfoProducto.vue'
import EstadisticasProducto from '../components/DetalleProducto/EstadisticasProducto.vue'
import FiltrosHistorial from '../components/DetalleProducto/FiltrosHistorial.vue'
import HistorialPrecios from '../components/DetalleProducto/HistorialPrecios.vue'

// Filtros
const filtroComercio = ref('todos')
const filtroPeriodo = ref('30')
const ordenSeleccionado = ref('reciente')

// DATOS DE EJEMPLO - Después viene de Capacitor/Firebase
const productoActual = ref({
  id: 1,
  nombre: 'Leche La Serenísima 1L',
  imagen: null,
  precioMejor: 850,
  comercioMejor: 'TATA',
  tendenciaGeneral: 'bajando',
  porcentajeTendencia: -5,
  precios: [
    // DEVOTO - Av. 18 de Julio 1234
    {
      id: 1,
      comercio: 'DEVOTO',
      nombreCompleto: 'DEVOTO - Av. 18 de Julio 1234',
      direccion: 'Av. 18 de Julio 1234',
      valor: 980,
      fecha: '2026-01-15T09:00:00',
      confirmaciones: 0,
      usuarioId: 'user789',
    },
    {
      id: 2,
      comercio: 'DEVOTO',
      nombreCompleto: 'DEVOTO - Av. 18 de Julio 1234',
      direccion: 'Av. 18 de Julio 1234',
      valor: 1020,
      fecha: '2026-01-05T14:30:00',
      confirmaciones: 5,
      usuarioId: 'user101',
    },
    {
      id: 3,
      comercio: 'DEVOTO',
      nombreCompleto: 'DEVOTO - Av. 18 de Julio 1234',
      direccion: 'Av. 18 de Julio 1234',
      valor: 1050,
      fecha: '2025-12-20T11:00:00',
      confirmaciones: 18,
      usuarioId: 'user202',
    },

    // TATA - Av. Brasil 2550
    {
      id: 4,
      comercio: 'TATA',
      nombreCompleto: 'TATA - Av. Brasil 2550',
      direccion: 'Av. Brasil 2550',
      valor: 850,
      fecha: '2026-01-13T10:00:00',
      confirmaciones: 75,
      usuarioId: 'user123',
    },
    {
      id: 5,
      comercio: 'TATA',
      nombreCompleto: 'TATA - Av. Brasil 2550',
      direccion: 'Av. Brasil 2550',
      valor: 895,
      fecha: '2025-12-28T11:00:00',
      confirmaciones: 42,
      usuarioId: 'user654',
    },
    {
      id: 6,
      comercio: 'TATA',
      nombreCompleto: 'TATA - Av. Brasil 2550',
      direccion: 'Av. Brasil 2550',
      valor: 920,
      fecha: '2025-12-10T16:20:00',
      confirmaciones: 28,
      usuarioId: 'user777',
    },

    // DISCO - Punta Carretas
    {
      id: 7,
      comercio: 'DISCO',
      nombreCompleto: 'DISCO - Av. Sarmiento 2456',
      direccion: 'Av. Sarmiento 2456, Punta Carretas',
      valor: 920,
      fecha: '2026-01-08T15:30:00',
      confirmaciones: 8,
      usuarioId: 'user456',
    },
    {
      id: 8,
      comercio: 'DISCO',
      nombreCompleto: 'DISCO - Av. Sarmiento 2456',
      direccion: 'Av. Sarmiento 2456, Punta Carretas',
      valor: 950,
      fecha: '2025-12-25T10:15:00',
      confirmaciones: 22,
      usuarioId: 'user888',
    },

    // DON JOSE - Pocitos
    {
      id: 9,
      comercio: 'DON JOSE',
      nombreCompleto: 'DON JOSE - Luis Alberto de Herrera 1420',
      direccion: 'Luis Alberto de Herrera 1420, Pocitos',
      valor: 1100,
      fecha: '2025-12-10T14:00:00',
      confirmaciones: 3,
      usuarioId: 'user321',
    },

    // TATA - Tres Cruces (otro TATA diferente)
    {
      id: 10,
      comercio: 'TATA',
      nombreCompleto: 'TATA - Bv. Artigas 1234',
      direccion: 'Bv. Artigas 1234, Tres Cruces',
      valor: 870,
      fecha: '2026-01-14T12:30:00',
      confirmaciones: 12,
      usuarioId: 'user999',
    },
    {
      id: 11,
      comercio: 'TATA',
      nombreCompleto: 'TATA - Bv. Artigas 1234',
      direccion: 'Bv. Artigas 1234, Tres Cruces',
      valor: 890,
      fecha: '2026-01-02T09:45:00',
      confirmaciones: 7,
      usuarioId: 'user111',
    },
    // TATA - Camino Maldonado (PRECIO SUBIENDO)
    {
      id: 12,
      comercio: 'TATA',
      nombreCompleto: 'TATA - Camino Maldonado 3456',
      direccion: 'Camino Maldonado 3456, Malvín',
      valor: 1000,
      fecha: '2026-01-12T16:20:00',
      confirmaciones: 5,
      usuarioId: 'user444',
    },
    {
      id: 13,
      comercio: 'TATA',
      nombreCompleto: 'TATA - Camino Maldonado 3456',
      direccion: 'Camino Maldonado 3456, Malvín',
      valor: 880,
      fecha: '2025-12-28T10:00:00',
      confirmaciones: 18,
      usuarioId: 'user555',
    },
    {
      id: 14,
      comercio: 'TATA',
      nombreCompleto: 'TATA - Camino Maldonado 3456',
      direccion: 'Camino Maldonado 3456, Malvín',
      valor: 820,
      fecha: '2025-12-08T14:30:00',
      confirmaciones: 32,
      usuarioId: 'user666',
    },
  ],
})

// Comercios únicos disponibles para el filtro
const comerciosDisponibles = computed(() => {
  const comercios = [...new Set(productoActual.value.precios.map((p) => p.comercio))]
  return comercios.sort()
})

// Precios filtrados según los filtros activos
const preciosFiltrados = computed(() => {
  let precios = [...productoActual.value.precios]

  // Filtrar por comercio
  if (filtroComercio.value !== 'todos') {
    precios = precios.filter((p) => p.comercio === filtroComercio.value)
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

// Confirmar precio (dar upvote)
const confirmarPrecio = (precioId) => {
  const precio = productoActual.value.precios.find((p) => p.id === precioId)
  if (precio) {
    precio.confirmaciones++
    console.log(`Precio ${precioId} confirmado. Total: ${precio.confirmaciones}`)
    // Acá después guardar en Capacitor/Firebase
  }
}
</script>

<style scoped>
.contenedor-detalle {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
</style>
