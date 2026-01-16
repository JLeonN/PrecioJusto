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
            <q-icon :name="iconoTendencia" :color="colorTendencia" size="28px" />
            <span class="text-h5 text-weight-bold q-ml-xs" :class="`text-${colorTendencia}`">
              {{ porcentajeTendencia }}%
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

// Total de comercios únicos
const totalComercios = computed(() => {
  if (!props.producto.precios) return 0
  const comerciosUnicos = new Set(props.producto.precios.map((p) => p.comercio))
  return comerciosUnicos.size
})

// Ícono de tendencia
const iconoTendencia = computed(() => {
  if (props.producto.tendenciaGeneral === 'bajando') return 'trending_down'
  if (props.producto.tendenciaGeneral === 'subiendo') return 'trending_up'
  return 'remove'
})

// Color de tendencia
const colorTendencia = computed(() => {
  if (props.producto.tendenciaGeneral === 'bajando') return 'positive'
  if (props.producto.tendenciaGeneral === 'subiendo') return 'negative'
  return 'grey-6'
})

// Porcentaje de tendencia formateado
const porcentajeTendencia = computed(() => {
  const valor = props.producto.porcentajeTendencia || 0
  return valor > 0 ? `+${valor}` : valor
})
</script>

<style scoped>
.stat-card {
  border-top: 3px solid var(--color-primario);
}
</style>
