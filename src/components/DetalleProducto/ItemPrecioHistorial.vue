<template>
  <div class="item-precio">
    <!-- Indicador de frescura -->
    <q-avatar :color="colorFrescura" size="12px" class="q-mr-md" />

    <!-- Información del precio -->
    <div class="precio-info">
      <div class="precio-valor text-h6 text-weight-bold text-primary">
        {{ formatearPrecioConCodigo(precio.valor, precio.moneda) }}
      </div>
      <div class="precio-fecha text-caption text-grey-7">{{ fechaFormateada }}</div>
      <div v-if="mostrarEscalera" class="escalera-precios q-mt-xs">
        <div class="escalera-titulo">Escalera mayorista</div>
        <div class="escalera-linea">
          <span>1 unidad</span>
          <span>{{ formatearPrecioConCodigo(precio.valor, precio.moneda) }}</span>
        </div>
        <div
          v-for="(escalon, indiceEscalon) in escalonesOrdenados"
          :key="`${precio.id || precio.fecha || 'precio'}_escalon_${indiceEscalon}`"
          class="escalera-linea"
        >
          <span>Desde {{ escalon.cantidadMinima }} unidades</span>
          <span>{{ formatearPrecioConCodigo(escalon.precioUnitario, precio.moneda) }}</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatearPrecioConCodigo } from '../../utils/PrecioUtils.js'

const props = defineProps({
  precio: {
    type: Object,
    required: true,
  },
})

// Color del indicador según antigüedad
const colorFrescura = computed(() => {
  const ahora = new Date()
  const fechaPrecio = new Date(props.precio.fecha)
  const diasTranscurridos = Math.floor((ahora - fechaPrecio) / (1000 * 60 * 60 * 24))

  if (diasTranscurridos < 7) return 'positive'
  if (diasTranscurridos < 21) return 'warning'
  if (diasTranscurridos < 60) return 'orange'
  return 'grey-5'
})

const escalonesOrdenados = computed(() => {
  const escalas = Array.isArray(props.precio?.escalasPorCantidad) ? props.precio.escalasPorCantidad : []
  return escalas
    .map((escala) => ({
      cantidadMinima: Number(escala?.cantidadMinima),
      precioUnitario: Number(escala?.precioUnitario),
    }))
    .filter(
      (escala) =>
        Number.isFinite(escala.cantidadMinima) &&
        escala.cantidadMinima >= 2 &&
        Number.isFinite(escala.precioUnitario) &&
        escala.precioUnitario > 0,
    )
    .sort((a, b) => a.cantidadMinima - b.cantidadMinima)
})

const mostrarEscalera = computed(() => {
  if (!props.precio?.activarPreciosMayoristas) return false
  return escalonesOrdenados.value.length > 0
})

// Fecha formateada
const fechaFormateada = computed(() => {
  const ahora = new Date()
  const fechaPrecio = new Date(props.precio.fecha)
  const diferencia = ahora - fechaPrecio
  const minutos = Math.floor(diferencia / (1000 * 60))
  const horas = Math.floor(diferencia / (1000 * 60 * 60))
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24))

  if (minutos < 60) return `Hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`
  if (horas < 24) return `Hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`
  if (dias < 7) return `Hace ${dias} ${dias === 1 ? 'día' : 'días'}`
  if (dias < 30) {
    const semanas = Math.floor(dias / 7)
    return `Hace ${semanas} ${semanas === 1 ? 'semana' : 'semanas'}`
  }
  if (dias < 365) {
    const meses = Math.floor(dias / 30)
    return `Hace ${meses} ${meses === 1 ? 'mes' : 'meses'}`
  }
  const años = Math.floor(dias / 365)
  return `Hace ${años} ${años === 1 ? 'año' : 'años'}`
})
</script>

<style scoped>
.item-precio {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--borde-color);
}
.item-precio:last-child {
  border-bottom: none;
}
.precio-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.escalera-precios {
  border-left: 2px solid var(--color-primario);
  padding-left: 8px;
}
.escalera-titulo {
  font-size: 11px;
  font-weight: 600;
  color: var(--texto-secundario);
}
.escalera-linea {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  color: var(--texto-primario);
}
</style>
