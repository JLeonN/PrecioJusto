<template>
  <div class="row q-col-gutter-md items-stretch">
    <!-- Card: Precio promedio -->
    <div class="col-12 col-sm-4">
      <q-card class="stat-card full-height">
        <q-card-section class="text-center column justify-center full-height">
          <div class="text-grey-7 text-caption text-uppercase">Precio promedio</div>
          <div v-if="precioPromedio > 0" class="text-h5 text-weight-bold text-primary q-mt-xs">
            {{ formatearPrecioConCodigo(precioPromedio, monedaReferencia) }}
          </div>
          <div v-else class="text-caption text-grey-5 q-mt-xs">Sin datos recientes</div>
          <div class="text-caption text-grey-5 q-mt-xs">últimos 6 meses</div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Card: Tendencia general -->
    <div class="col-12 col-sm-4">
      <q-card class="stat-card full-height">
        <q-card-section class="text-center column justify-center full-height">
          <div class="text-grey-7 text-caption text-uppercase">Tendencia</div>
          <div class="row items-center justify-center q-mt-xs">
            <IconTrendingDown v-if="tendenciaProducto.tipo === 'bajando'" :size="28" class="text-positive" />
            <IconTrendingUp v-else-if="tendenciaProducto.tipo === 'subiendo'" :size="28" class="text-negative" />
            <IconMinus v-else :size="28" class="text-grey-6" />
            <span class="text-h5 text-weight-bold q-ml-xs" :class="colorTendencia">
              {{ tendenciaProducto.porcentaje }}%
            </span>
          </div>
          <div class="text-caption text-grey-5 q-mt-xs">vs visita anterior</div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Card: Comercios registrados -->
    <div class="col-12 col-sm-4">
      <q-card class="stat-card full-height">
        <q-card-section class="text-center column justify-center full-height">
          <div class="text-grey-7 text-caption text-uppercase">Comercios</div>
          <div class="text-h5 text-weight-bold text-primary q-mt-xs">{{ totalComercios }}</div>
          <div class="text-caption text-grey-5 q-mt-xs">con precios registrados</div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { IconTrendingUp, IconTrendingDown, IconMinus } from '@tabler/icons-vue'
import { MONEDA_DEFAULT } from '../../almacenamiento/constantes/Monedas.js'
import { formatearPrecioConCodigo } from '../../utils/PrecioUtils.js'

const props = defineProps({
  producto: {
    type: Object,
    required: true,
  },
})

const monedaReferencia = computed(() => {
  if (!props.producto.precios || props.producto.precios.length === 0) return MONEDA_DEFAULT
  const masReciente = [...props.producto.precios].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0]
  return masReciente?.moneda || props.producto.monedaReferencia || MONEDA_DEFAULT
})

// Precio promedio — más reciente por tienda, solo comercios visitados en los últimos 6 meses
const precioPromedio = computed(() => {
  if (!props.producto.precios || props.producto.precios.length === 0) return 0

  const hace6Meses = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
  const grupos = new Map()

  props.producto.precios.forEach((precio) => {
    const clave =
      precio.comercioId && precio.direccionId
        ? `${precio.comercioId}_${precio.direccionId}`
        : precio.nombreCompleto || precio.comercio || 'Sin comercio'
    if (!grupos.has(clave)) grupos.set(clave, [])
    grupos.get(clave).push(precio)
  })

  const preciosVigentes = []
  grupos.forEach((precios) => {
    const ordenados = [...precios].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    // Solo incluir si la visita más reciente fue dentro de los últimos 6 meses
    if (
      new Date(ordenados[0].fecha) >= hace6Meses &&
      (ordenados[0].moneda || MONEDA_DEFAULT) === monedaReferencia.value
    ) {
      preciosVigentes.push(ordenados[0].valor)
    }
  })

  if (preciosVigentes.length === 0) return 0
  return Math.round(preciosVigentes.reduce((sum, v) => sum + v, 0) / preciosVigentes.length)
})

// Total de comercios únicos agrupados por ID de sucursal
const totalComercios = computed(() => {
  if (!props.producto.precios) return 0
  const claves = new Set(
    props.producto.precios.map((p) =>
      p.comercioId && p.direccionId
        ? `${p.comercioId}_${p.direccionId}`
        : p.nombreCompleto || p.comercio || 'Sin comercio',
    ),
  )
  return claves.size
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
    const preciosMismaMoneda = precios.filter(
      (precio) => (precio.moneda || MONEDA_DEFAULT) === monedaReferencia.value,
    )
    if (preciosMismaMoneda.length < 2) return
    const ordenados = [...preciosMismaMoneda].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
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
