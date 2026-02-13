<template>
  <TarjetaBase
    tipo="producto"
    :nombre="producto.nombre"
    :imagen="producto.imagen"
    :precio="producto.precioMejor"
    :modo-seleccion="modoSeleccion"
    :seleccionado="seleccionado"
    @toggle-expansion="manejarExpansion"
    @long-press="$emit('long-press')"
    @toggle-seleccion="$emit('toggle-seleccion')"
    @agregar-precio="$emit('agregar-precio')"
  >
    <template #tipo>
      <div class="tipo-direccion">
        <IconMapPin :size="14" />
        <span>{{ producto.comercioMejor }}</span>
      </div>
    </template>
    <template #placeholder-icono>
      <IconShoppingBag :size="48" class="text-grey-5" />
    </template>
    <template #info-inferior>
      <div v-if="producto.codigoBarras" class="codigo-barras" @click.stop="copiarCodigoBarras">
        <IconBarcode :size="14" />
        <span class="codigo-barras__texto">{{ producto.codigoBarras }}</span>
        <q-tooltip class="bg-grey-8" :delay="500">Click para copiar</q-tooltip>
      </div>
      <div v-else class="sin-codigo">
        <IconBarcode :size="14" class="text-grey-5" />
        <span class="text-grey-6">Sin código de barras</span>
      </div>
    </template>
    <template #expandido-header>
      <div class="expandido-titulo">
        <IconCurrencyDollar :size="18" />
        <span>TOP 3 PRECIOS ACTUALES</span>
      </div>
    </template>
    <template #expandido-contenido>
      <div class="lista-precios">
        <div v-for="(precio, index) in top3PreciosUnicos" :key="precio.id" class="item-precio">
          <div class="item-precio__posicion">{{ index + 1 }}</div>
          <div class="item-precio__info">
            <div class="item-precio__valor">{{ formatearPrecio(precio.valor) }}</div>
            <div class="item-precio__comercio">
              <IconMapPin :size="14" />
              {{ precio.nombreCompleto || precio.comercio }}
            </div>
            <div class="item-precio__fecha">
              {{ formatearFecha(precio.fecha) }}
            </div>
            <div v-if="calcularDiasPrecio(precio.fecha) > 60" class="badge-desactualizado">
              <IconAlertTriangle :size="12" />
              <span>Hace {{ calcularMesesPrecio(precio.fecha) }}</span>
            </div>
          </div>
          <div v-if="precio.esMejor" class="item-precio__badge">
            <q-chip dense size="sm" color="green" text-color="white"> Mejor precio </q-chip>
          </div>
        </div>
        <div v-if="producto.precios.length === 0" class="sin-precios">
          <IconAlertCircle :size="20" class="text-grey-5" />
          <span class="text-grey-6">No hay precios registrados</span>
        </div>
      </div>
    </template>
    <template #acciones>
      <q-btn
        flat
        dense
        color="primary"
        icon-right="arrow_forward"
        label="Ver historial"
        class="boton-historial"
        :to="`/producto/${producto.id}`"
      />
    </template>
  </TarjetaBase>
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import TarjetaBase from './TarjetaBase.vue'
import {
  IconShoppingBag,
  IconMapPin,
  IconBarcode,
  IconCurrencyDollar,
  IconAlertCircle,
  IconAlertTriangle,
} from '@tabler/icons-vue'

/* Props del componente */
const props = defineProps({
  producto: {
    type: Object,
    required: true,
    validator: (valor) => {
      return (
        valor.id &&
        valor.nombre &&
        typeof valor.precioMejor === 'number' &&
        Array.isArray(valor.precios)
      )
    },
  },
  modoSeleccion: {
    type: Boolean,
    default: false,
  },
  seleccionado: {
    type: Boolean,
    default: false,
  },
})

/* Emits del componente */
defineEmits(['long-press', 'toggle-seleccion', 'agregar-precio'])

/* Quasar */
const $q = useQuasar()

/* TOP 3 precios actuales con comercios únicos */
const top3PreciosUnicos = computed(() => {
  if (!props.producto.precios || props.producto.precios.length === 0) return []

  /* 1. Agrupar por comercio */
  const preciosPorComercio = {}

  props.producto.precios.forEach((precio) => {
    const clave = precio.nombreCompleto || precio.comercio || 'Sin comercio'

    if (!preciosPorComercio[clave]) {
      preciosPorComercio[clave] = []
    }

    preciosPorComercio[clave].push(precio)
  })

  /* 2. Tomar el más reciente de cada comercio */
  const preciosVigentes = Object.values(preciosPorComercio).map((preciosDelComercio) => {
    const ordenadosPorFecha = [...preciosDelComercio].sort(
      (a, b) => new Date(b.fecha) - new Date(a.fecha),
    )
    return ordenadosPorFecha[0]
  })

  /* 3. Ordenar por valor ASC y tomar máximo 3 */
  return [...preciosVigentes].sort((a, b) => a.valor - b.valor).slice(0, 3)
})

/* Calcular días transcurridos desde una fecha */
const calcularDiasPrecio = (fechaISO) => {
  const fecha = new Date(fechaISO)
  const ahora = new Date()
  return Math.floor((ahora - fecha) / (1000 * 60 * 60 * 24))
}

/* Calcular meses en texto legible */
const calcularMesesPrecio = (fechaISO) => {
  const dias = calcularDiasPrecio(fechaISO)
  const meses = Math.floor(dias / 30)
  if (meses <= 1) return '2 meses'
  return `${meses} meses`
}

/* Formatear precio */
const formatearPrecio = (valor) => {
  return `$${valor.toLocaleString('es-UY')}`
}

/* Formatear fecha relativa */
const formatearFecha = (fechaISO) => {
  const fecha = new Date(fechaISO)
  const ahora = new Date()
  const diferencia = Math.floor((ahora - fecha) / 1000)

  if (diferencia < 60) return 'Hace un momento'
  if (diferencia < 3600) return `Hace ${Math.floor(diferencia / 60)} minutos`
  if (diferencia < 86400) return `Hace ${Math.floor(diferencia / 3600)} horas`
  if (diferencia < 604800) return `Hace ${Math.floor(diferencia / 86400)} días`
  if (diferencia < 2592000) return `Hace ${Math.floor(diferencia / 604800)} semanas`
  return `Hace ${Math.floor(diferencia / 2592000)} meses`
}

/* Copiar código de barras al portapapeles */
const copiarCodigoBarras = async () => {
  try {
    await navigator.clipboard.writeText(props.producto.codigoBarras)
    $q.notify({
      type: 'positive',
      message: 'Código copiado',
      caption: props.producto.codigoBarras,
      timeout: 1500,
      position: 'top',
    })
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Error al copiar',
      timeout: 1500,
      position: 'top',
    })
  }
}

/* Manejar expansión */
const manejarExpansion = (expandido) => {
  console.log('Tarjeta expandida:', expandido)
}
</script>

<style scoped>
.tipo-direccion {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--texto-secundario);
}
.codigo-barras {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}
.codigo-barras:hover {
  background-color: var(--color-primario-claro);
}
.codigo-barras:active {
  background-color: var(--color-primario);
  color: white;
}
.codigo-barras__texto {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.5px;
}
.sin-codigo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}
.expandido-titulo {
  display: flex;
  align-items: center;
  gap: 8px;
}
.lista-precios {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.item-precio {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--fondo-drawer);
  border-radius: 8px;
  border-left: 3px solid var(--color-primario);
}
.item-precio__posicion {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--color-primario);
  color: white;
  border-radius: 50%;
  font-weight: bold;
  font-size: 16px;
  flex-shrink: 0;
}
.item-precio__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.item-precio__valor {
  font-size: 20px;
  font-weight: bold;
  color: var(--color-primario);
}
.item-precio__comercio {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--texto-secundario);
  font-weight: 500;
}
.item-precio__fecha {
  font-size: 11px;
  color: var(--texto-deshabilitado);
}
.item-precio__badge {
  flex-shrink: 0;
}
.sin-precios {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  text-align: center;
  font-size: 13px;
}
.boton-historial {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.badge-desactualizado {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  background: rgba(255, 152, 0, 0.15);
  color: var(--color-acento, #ff9800);
}
</style>
