<template>
  <div class="row q-col-gutter-md">
    <!-- Card: Precio promedio -->
    <div class="col-12 col-sm-4">
      <q-card class="stat-card">
        <q-card-section class="text-center">
          <div class="text-grey-7 text-caption text-uppercase">Precio promedio</div>
          <div class="text-h5 text-weight-bold text-primary q-mt-xs">${{ precioPromedio }}</div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Card: Tendencia general -->
    <div class="col-12 col-sm-4">
      <q-card class="stat-card">
        <q-card-section class="text-center">
          <div class="text-grey-7 text-caption text-uppercase">Tendencia</div>
          <div class="row items-center justify-center q-mt-xs">
            <IconTrendingDown v-if="tendenciaProducto.tipo === 'bajando'" :size="28" class="text-positive" />
            <IconTrendingUp v-else-if="tendenciaProducto.tipo === 'subiendo'" :size="28" class="text-negative" />
            <IconMinus v-else :size="28" class="text-grey-6" />
            <span class="text-h5 text-weight-bold q-ml-xs" :class="colorTendencia">
              {{ tendenciaProducto.porcentaje }}%
            </span>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Card: Comercios registrados -->
    <div class="col-12 col-sm-4">
      <q-card class="stat-card">
        <q-card-section class="text-center">
          <div class="text-grey-7 text-caption text-uppercase">Comercios</div>
          <div class="text-h5 text-weight-bold text-primary q-mt-xs">
            {{ totalComercios }}
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { IconTrendingUp, IconTrendingDown, IconMinus } from '@tabler/icons-vue'

const props = defineProps({
  producto: {
    type: Object,
    required: true,
  },
})

// Calcular precio promedio
const precioPromedio = computed(() => {
  if (!props.producto.precios || props.producto.precios.length === 0) return 0
  const suma = props.producto.precios.reduce((acc, p) => acc + p.valor, 0)
  return Math.round(suma / props.producto.precios.length)
})

// Total de comercios únicos (comercioId cuando existe, p.comercio como fallback para datos legacy)
const totalComercios = computed(() => {
  if (!props.producto.precios) return 0
  const comerciosUnicos = new Set(props.producto.precios.map((p) => p.comercioId || p.comercio))
  return comerciosUnicos.size
})

// Tendencia dinámica — último vs penúltimo por tienda, promediado entre todos los grupos
const tendenciaProducto = computed(() => {
  if (!props.producto.precios || props.producto.precios.length === 0)
    return { tipo: 'estable', porcentaje: '0.0' }

  const grupos = new Map()
  props.producto.precios.forEach((precio) => {
    const clave =
      precio.comercioId && precio.direccionId
        ? `${precio.comercioId}_${precio.direccionId}`
        : precio.nombreCompleto || precio.comercio || 'Sin comercio'
    if (!grupos.has(clave)) grupos.set(clave, [])
    grupos.get(clave).push(precio)
  })

  const variaciones = []
  grupos.forEach((precios) => {
    if (precios.length < 2) return
    const ordenados = [...precios].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    variaciones.push(((ordenados[0].valor - ordenados[1].valor) / ordenados[1].valor) * 100)
  })

  if (variaciones.length === 0) return { tipo: 'estable', porcentaje: '0.0' }

  const promedio = variaciones.reduce((sum, v) => sum + v, 0) / variaciones.length
  const porcentaje = Math.abs(promedio).toFixed(1)

  if (promedio < -2) return { porcentaje, tipo: 'bajando' }
  if (promedio > 2) return { porcentaje, tipo: 'subiendo' }
  return { porcentaje, tipo: 'estable' }
})

const colorTendencia = computed(() => {
  if (tendenciaProducto.value.tipo === 'bajando') return 'text-positive'
  if (tendenciaProducto.value.tipo === 'subiendo') return 'text-negative'
  return 'text-grey-6'
})
</script>

<style scoped>
.stat-card {
  border-top: 3px solid var(--color-primario);
}
</style>
