<template>
  <q-card class="item-comercio" clickable @click="toggleExpandir">
    <!-- ESTADO COLAPSADO -->
    <q-card-section class="comercio-header">
      <div class="row items-center no-wrap">
        <!-- Indicador de frescura del precio más reciente -->
        <q-avatar :color="colorFrescuraMasReciente" size="12px" class="q-mr-md" />

        <!-- Información principal -->
        <div class="comercio-info">
          <div class="text-subtitle1 text-weight-bold">{{ comercio.nombreCompleto }}</div>
          <div class="text-caption text-grey-7">{{ comercio.direccion }}</div>

          <!-- Precio más reciente -->
          <div class="row items-center q-gutter-sm q-mt-xs">
            <div class="text-h6 text-weight-bold text-primary">${{ precioMasReciente.valor }}</div>
            <span class="text-caption text-grey-7">({{ fechaFormateada }})</span>
          </div>

          <!-- Badge de confirmaciones del precio más reciente -->
          <q-badge :color="colorConfianzaMasReciente" class="q-mt-xs">
            <div class="row items-center no-wrap q-gutter-xs">
              <IconThumbUp :size="12" />
              <span>{{ precioMasReciente.confirmaciones }}</span>
              <span>- {{ textoConfianzaMasReciente }}</span>
            </div>
          </q-badge>

          <!-- Tendencia del comercio (solo si hay 2+ precios) -->
          <q-chip
            v-if="comercio.precios.length > 1"
            :color="colorTendencia"
            text-color="white"
            size="sm"
            class="q-mt-xs"
          >
            <q-icon :name="iconoTendencia" size="14px" class="q-mr-xs" />
            <span class="text-weight-bold">{{ textoTendencia }}</span>
          </q-chip>

          <!-- Cantidad de registros -->
          <div class="text-caption text-grey-6 q-mt-xs">
            {{ comercio.precios.length }}
            {{ comercio.precios.length === 1 ? 'registro' : 'registros' }}
          </div>
        </div>

        <!-- Ícono expandir/colapsar -->
        <div class="comercio-icono">
          <IconChevronDown v-if="!expandido" :size="20" class="text-grey-5" />
          <IconChevronUp v-else :size="20" class="text-grey-5" />
        </div>
      </div>
    </q-card-section>

    <!-- ESTADO EXPANDIDO -->
    <q-slide-transition>
      <div v-show="expandido">
        <q-separator />
        <div class="comercio-expandido">
          <!-- Título de la sección expandida -->
          <div class="q-px-md q-pt-md q-pb-sm">
            <div class="text-subtitle2 text-weight-bold">Historial de precios</div>
            <div
              v-if="comercio.precios.length > 1"
              class="text-caption text-grey-7 row items-center q-gutter-xs q-mt-xs"
            >
              <q-icon :name="iconoTendencia" :color="colorTendenciaText" size="16px" />
              <span>{{ textoTendenciaCompleto }}</span>
            </div>
          </div>

          <!-- Lista de precios históricos -->
          <div>
            <ItemPrecioHistorial
              v-for="(precio, index) in preciosOrdenados"
              :key="precio.id"
              :precio="precio"
              :es-mas-reciente="index === 0"
              :ya-confirmado="preciosConfirmados.has(precio.id)"
              @confirmar-precio="$emit('confirmar-precio', $event)"
            />
          </div>
        </div>
      </div>
    </q-slide-transition>
  </q-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { IconThumbUp, IconChevronDown, IconChevronUp } from '@tabler/icons-vue'
import ItemPrecioHistorial from './ItemPrecioHistorial.vue'

const props = defineProps({
  comercio: {
    type: Object,
    required: true,
  },
  preciosConfirmados: {
    type: Set,
    required: true,
  },
})

defineEmits(['confirmar-precio'])

const expandido = ref(false)

const toggleExpandir = () => {
  expandido.value = !expandido.value
}

// Precios ordenados por fecha (más reciente primero)
const preciosOrdenados = computed(() => {
  return [...props.comercio.precios].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
})

// Precio más reciente
const precioMasReciente = computed(() => {
  return preciosOrdenados.value[0]
})

// Color de frescura del precio más reciente
const colorFrescuraMasReciente = computed(() => {
  const ahora = new Date()
  const fechaPrecio = new Date(precioMasReciente.value.fecha)
  const diasTranscurridos = Math.floor((ahora - fechaPrecio) / (1000 * 60 * 60 * 24))

  if (diasTranscurridos < 7) return 'positive'
  if (diasTranscurridos < 21) return 'warning'
  if (diasTranscurridos < 60) return 'orange'
  return 'grey-5'
})

// Color de confianza del precio más reciente
const colorConfianzaMasReciente = computed(() => {
  const conf = precioMasReciente.value.confirmaciones
  if (conf === 0) return 'grey-6'
  if (conf < 6) return 'grey-7'
  if (conf < 20) return 'primary'
  return 'positive'
})

// Texto de confianza del precio más reciente
const textoConfianzaMasReciente = computed(() => {
  const conf = precioMasReciente.value.confirmaciones
  if (conf === 0) return 'Sin validar'
  if (conf < 6) return 'Poco confirmado'
  if (conf < 20) return 'Confirmado'
  return 'Muy confiable'
})

// Fecha formateada del precio más reciente
const fechaFormateada = computed(() => {
  const ahora = new Date()
  const fechaPrecio = new Date(precioMasReciente.value.fecha)
  const diferencia = ahora - fechaPrecio
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24))

  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Hace 1 día'
  if (dias < 7) return `Hace ${dias} días`
  if (dias < 30) {
    const semanas = Math.floor(dias / 7)
    return `Hace ${semanas} ${semanas === 1 ? 'semana' : 'semanas'}`
  }
  const meses = Math.floor(dias / 30)
  return `Hace ${meses} ${meses === 1 ? 'mes' : 'meses'}`
})

// Calcular tendencia del comercio (precio más reciente vs promedio histórico)
const tendenciaComercio = computed(() => {
  if (props.comercio.precios.length < 2) return { porcentaje: 0, tipo: 'estable' }

  const precioActual = precioMasReciente.value.valor
  const suma = props.comercio.precios.reduce((acc, p) => acc + p.valor, 0)
  const promedio = suma / props.comercio.precios.length

  const diferencia = ((precioActual - promedio) / promedio) * 100
  const porcentaje = Math.abs(diferencia).toFixed(1)

  if (diferencia < -2) return { porcentaje, tipo: 'bajando' }
  if (diferencia > 2) return { porcentaje, tipo: 'subiendo' }
  return { porcentaje, tipo: 'estable' }
})

// Color de la tendencia (chip)
const colorTendencia = computed(() => {
  if (tendenciaComercio.value.tipo === 'bajando') return 'positive'
  if (tendenciaComercio.value.tipo === 'subiendo') return 'negative'
  return 'grey-6'
})

// Color de la tendencia (texto)
const colorTendenciaText = computed(() => {
  if (tendenciaComercio.value.tipo === 'bajando') return 'positive'
  if (tendenciaComercio.value.tipo === 'subiendo') return 'negative'
  return 'grey-6'
})

// Ícono de la tendencia
const iconoTendencia = computed(() => {
  if (tendenciaComercio.value.tipo === 'bajando') return 'trending_down'
  if (tendenciaComercio.value.tipo === 'subiendo') return 'trending_up'
  return 'remove'
})

// Texto de la tendencia (corto)
const textoTendencia = computed(() => {
  if (tendenciaComercio.value.tipo === 'bajando') {
    return `↓ -${tendenciaComercio.value.porcentaje}%`
  }
  if (tendenciaComercio.value.tipo === 'subiendo') {
    return `↑ +${tendenciaComercio.value.porcentaje}%`
  }
  return '→ Estable'
})

// Texto de la tendencia (completo)
const textoTendenciaCompleto = computed(() => {
  if (tendenciaComercio.value.tipo === 'bajando') {
    return `Bajando ${tendenciaComercio.value.porcentaje}% vs promedio histórico`
  }
  if (tendenciaComercio.value.tipo === 'subiendo') {
    return `Subiendo ${tendenciaComercio.value.porcentaje}% vs promedio histórico`
  }
  return 'Precio estable vs promedio histórico'
})
</script>

<style scoped>
.item-comercio {
  margin-bottom: 12px;
  border-left: 4px solid var(--color-primario);
  transition: all 0.2s;
}
.item-comercio:active {
  transform: scale(0.98);
}
.comercio-header {
  cursor: pointer;
}
.comercio-info {
  flex: 1;
  min-width: 0;
}
.comercio-icono {
  flex-shrink: 0;
  margin-left: 8px;
}
.comercio-expandido {
  background-color: var(--fondo-drawer);
}
</style>
