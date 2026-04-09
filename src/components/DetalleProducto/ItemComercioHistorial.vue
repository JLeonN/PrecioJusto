<template>
  <q-card class="item-comercio" clickable @click="toggleExpandir">
    <!-- ESTADO COLAPSADO -->
    <q-card-section class="comercio-header">
      <div class="row items-center no-wrap">
        <!-- Foto del comercio con borde de frescura, o punto de color si no hay foto -->
        <div v-if="fotoComercio" class="avatar-foto q-mr-md" :style="{ borderColor: colorBordeFoto }">
          <img :src="fotoComercio" class="foto-comercio" />
        </div>
        <q-avatar v-else :color="colorFrescuraMasReciente" size="12px" class="q-mr-md" />

        <!-- Información principal -->
        <div class="comercio-info">
          <div class="row items-center no-wrap q-gutter-xs">
            <span class="text-subtitle1 text-weight-bold">{{ comercio.comercio }}</span>
            <IconExternalLink :size="14" class="text-grey-5 icono-editar" @click="irAEditar" />
          </div>
          <div class="text-caption text-grey-7">{{ comercio.direccion }}</div>

          <!-- Precio más reciente -->
          <div class="row items-center q-gutter-sm q-mt-xs">
            <div class="text-h6 text-weight-bold text-primary">
              {{ formatearPrecioConCodigo(precioMasReciente.valor, precioMasReciente.moneda) }}
            </div>
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
            <IconTrendingDown v-if="tendenciaComercio.tipo === 'bajando'" :size="15" class="q-mr-xs" />
            <IconTrendingUp v-else-if="tendenciaComercio.tipo === 'subiendo'" :size="15" class="q-mr-xs" />
            <IconMinus v-else :size="15" class="q-mr-xs" />
            <span class="text-weight-bold">{{ textoTendencia }}</span>
          </q-chip>

          <!-- Cantidad de registros -->
          <div class="text-caption text-grey-6 q-mt-xs">
            {{ comercio.precios.length }}
            {{ comercio.precios.length === 1 ? 'registro' : 'registros' }}
          </div>
          <div v-if="mostrarEscaleraResumen" class="escalera-resumen q-mt-xs">
            <div class="escalera-resumen-titulo">Escalera mayorista</div>
            <div class="escalera-resumen-linea">
              <span>1 unidad</span>
              <span>{{ formatearPrecioConCodigo(precioMasReciente.valor, precioMasReciente.moneda) }}</span>
            </div>
            <div
              v-for="(escalon, indiceEscalon) in escalonesResumen"
              :key="`resumen_escalon_${comercio.nombreCompleto || comercio.comercio}_${indiceEscalon}`"
              class="escalera-resumen-linea"
            >
              <span>Desde {{ escalon.cantidadMinima }} unidades</span>
              <span>{{ formatearPrecioConCodigo(escalon.precioUnitario, precioMasReciente.moneda) }}</span>
            </div>
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
              <IconTrendingDown v-if="tendenciaComercio.tipo === 'bajando'" :size="16" :color="colorTendenciaText" />
              <IconTrendingUp v-else-if="tendenciaComercio.tipo === 'subiendo'" :size="16" :color="colorTendenciaText" />
              <IconMinus v-else :size="16" :color="colorTendenciaText" />
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
import { useRouter } from 'vue-router'
import { IconThumbUp, IconChevronDown, IconChevronUp, IconTrendingUp, IconTrendingDown, IconMinus, IconExternalLink } from '@tabler/icons-vue'
import ItemPrecioHistorial from './ItemPrecioHistorial.vue'
import { useComerciStore } from 'src/almacenamiento/stores/comerciosStore'
import { MONEDA_DEFAULT } from '../../almacenamiento/constantes/Monedas.js'
import { formatearPrecioConCodigo } from '../../utils/PrecioUtils.js'

const comerciosStore = useComerciStore()
const router = useRouter()

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

// Grupo del comercio en el store (base para foto y navegación)
const grupoComercio = computed(() => {
  const { comercioId } = props.comercio
  if (!comercioId) return null
  return comerciosStore.comerciosAgrupados.find(
    (g) => (g.comerciosOriginales || []).some((c) => c.id === comercioId),
  ) || null
})

// Foto del comercio/dirección correspondiente a este grupo del historial
const fotoComercio = computed(() => {
  if (!grupoComercio.value) return null
  const { comercioId, direccionId } = props.comercio
  if (!direccionId) return null
  const original = (grupoComercio.value.comerciosOriginales || []).find((c) => c.id === comercioId)
  const dir = (original?.direcciones || []).find((d) => d.id === direccionId)
  return dir?.foto || null
})

// Navegar a la edición del comercio, pre-seleccionando la sucursal si aplica
function irAEditar(event) {
  event.stopPropagation()
  // Preferir el nombre del grupo del store; fallback al nombre del precio
  const nombre = grupoComercio.value?.nombre || props.comercio.comercio
  if (!nombre) return
  const nombreNorm = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  const query = props.comercio.direccionId ? { direccionId: props.comercio.direccionId } : {}
  router.push({ path: `/comercios/${encodeURIComponent(nombreNorm)}`, query })
}

// Mapeo del color de frescura a CSS para el borde de la foto
const colorBordeFoto = computed(() => {
  const mapa = {
    positive: 'var(--color-exito)',
    warning: 'var(--color-advertencia)',
    orange: 'var(--color-acento-oscuro)',
    'grey-5': 'var(--texto-deshabilitado)',
  }
  return mapa[colorFrescuraMasReciente.value] || 'var(--texto-deshabilitado)'
})

// Precios ordenados por fecha (más reciente primero)
const preciosOrdenados = computed(() => {
  return [...props.comercio.precios].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
})

// Precio más reciente
const precioMasReciente = computed(() => {
  return preciosOrdenados.value[0]
})
const escalonesResumen = computed(() => {
  const escalas = Array.isArray(precioMasReciente.value?.escalasPorCantidad)
    ? precioMasReciente.value.escalasPorCantidad
    : []
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
const mostrarEscaleraResumen = computed(() => {
  if (!precioMasReciente.value?.activarPreciosMayoristas) return false
  return escalonesResumen.value.length > 0
})

const monedaReferenciaComercio = computed(() => {
  return precioMasReciente.value?.moneda || MONEDA_DEFAULT
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

// Calcular tendencia del comercio (último precio vs el anterior — ignora inflación histórica)
const tendenciaComercio = computed(() => {
  const preciosMismaMoneda = preciosOrdenados.value.filter(
    (precio) => (precio.moneda || MONEDA_DEFAULT) === monedaReferenciaComercio.value,
  )
  if (preciosMismaMoneda.length < 2) return { porcentaje: 0, tipo: 'estable' }

  const precioActual = preciosMismaMoneda[0].valor
  const precioAnterior = preciosMismaMoneda[1].valor

  const diferencia = ((precioActual - precioAnterior) / precioAnterior) * 100
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
.avatar-foto {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  border: 3px solid;
  overflow: hidden;
  flex-shrink: 0;
}
.foto-comercio {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.icono-editar {
  cursor: pointer;
  flex-shrink: 0;
}
.escalera-resumen {
  border-left: 2px solid var(--color-primario);
  padding-left: 8px;
}
.escalera-resumen-titulo {
  font-size: 11px;
  font-weight: 600;
  color: var(--texto-secundario);
}
.escalera-resumen-linea {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  color: var(--texto-primario);
}
</style>
