<template>
  <div class="item-precio">
    <!-- Indicador de frescura -->
    <q-avatar :color="colorFrescura" size="12px" class="q-mr-md" />

    <!-- Información del precio -->
    <div class="precio-info">
      <div class="precio-valor text-h6 text-weight-bold text-primary">${{ precio.valor }}</div>
      <div class="precio-fecha text-caption text-grey-7">{{ fechaFormateada }}</div>
      <q-badge :color="colorConfianza" class="q-mt-xs">
        <div class="row items-center no-wrap q-gutter-xs">
          <IconThumbUp :size="12" />
          <span>{{ precio.confirmaciones }}</span>
          <span>- {{ textoConfianza }}</span>
        </div>
      </q-badge>
    </div>

    <!-- Botón confirmar (solo si es el más reciente) -->
    <div v-if="esMasReciente" class="precio-acciones">
      <q-btn flat dense color="primary" size="sm" @click="$emit('confirmar-precio', precio.id)">
        <IconThumbUp :size="16" class="q-mr-xs" />
        Confirmar
      </q-btn>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { IconThumbUp } from '@tabler/icons-vue'

const props = defineProps({
  precio: {
    type: Object,
    required: true,
  },
  esMasReciente: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['confirmar-precio'])

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

// Color del badge de confianza
const colorConfianza = computed(() => {
  if (props.precio.confirmaciones === 0) return 'grey-6'
  if (props.precio.confirmaciones < 6) return 'grey-7'
  if (props.precio.confirmaciones < 20) return 'primary'
  return 'positive'
})

// Texto de confianza
const textoConfianza = computed(() => {
  if (props.precio.confirmaciones === 0) return 'Sin validar'
  if (props.precio.confirmaciones < 6) return 'Poco confirmado'
  if (props.precio.confirmaciones < 20) return 'Confirmado'
  return 'Muy confiable'
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
.precio-acciones {
  flex-shrink: 0;
}
</style>
