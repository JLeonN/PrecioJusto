<template>
  <TarjetaBase
    :class="{ 'tarjeta-mayorista-ventaja': hayVentajaMayoristaTarjeta }"
    tipo="producto"
    :nombre="producto.nombre"
    :imagen="producto.imagen"
    :modo-seleccion="modoSeleccion"
    :seleccionado="seleccionado"
    @toggle-expansion="manejarExpansion"
    @long-press="$emit('long-press')"
    @toggle-seleccion="$emit('toggle-seleccion')"
    @agregar-precio="$emit('agregar-precio')"
  >
    <template #tipo>
      <div class="tipo-direccion">
        <div class="tipo-direccion__principal">
          <IconMapPin :size="14" />
          <span>{{ producto.comercioMejor }}</span>
        </div>
      </div>
    </template>
    <template #placeholder-icono>
      <IconShoppingBag :size="48" class="text-grey-5" />
    </template>
    <template #imagen>
      <div class="imagen-contenedor-personalizado">
        <div v-if="!producto.imagen" class="tarjeta-yugioh__placeholder">
          <IconShoppingBag :size="48" class="text-grey-5" />
        </div>
        <q-img v-else :src="producto.imagen" class="tarjeta-yugioh__imagen" fit="cover" />

        <div v-if="hayVentajaMayoristaTarjeta" class="overlay-mayorista-tarjeta">
          <div class="precio-base-chip">
            {{ formatearPrecio(precioMejorVigente.valor, precioMejorVigente.moneda) }}
          </div>
          <q-slide-transition>
            <div v-show="mostrarMayoristasEnTarjeta" class="panel-mayoristas-tarjeta">
              <transition-group name="entradaEscalon" tag="div">
                <div
                  v-for="(alternativa, indiceAlternativa) in mayoristasConVentaja"
                  :key="alternativa.clave"
                  class="item-mayorista-tarjeta"
                  :style="{ animationDelay: `${indiceAlternativa * 70}ms` }"
                >
                  <div class="item-mayorista-tarjeta__comercio">{{ alternativa.comercio }}</div>
                  <div class="item-mayorista-tarjeta__linea">
                    <span>Desde 1 unidad</span>
                    <span>{{ formatearPrecio(alternativa.precioBase, precioMejorVigente.moneda) }}</span>
                  </div>
                  <div
                    v-for="(escalon, indiceEscalon) in alternativa.escalones"
                    :key="`${alternativa.clave}_escalon_${indiceEscalon}`"
                    :class="[
                      'item-mayorista-tarjeta__linea',
                      { 'item-mayorista-tarjeta__linea--ventaja': escalon.precioUnitario < precioMejorVigente.valor },
                    ]"
                  >
                    <span>Desde {{ escalon.cantidadMinima }} unidades</span>
                    <span>{{ formatearPrecio(escalon.precioUnitario, precioMejorVigente.moneda) }}</span>
                  </div>
                </div>
              </transition-group>
            </div>
          </q-slide-transition>
          <q-btn
            flat
            dense
            no-caps
            color="primary"
            icon="query_stats"
            :label="
              mostrarMayoristasEnTarjeta
                ? 'Ocultar mejor precio por cantidad'
                : 'Ver mejor precio por cantidad'
            "
            class="boton-ver-mayoristas-tarjeta"
            @click.stop="toggleMayoristasTarjeta"
          />
        </div>
        <div v-else class="overlay-precio-normal">
          <div class="precio-valor">
            {{ formatearPrecio(precioMejorVigente.valor, precioMejorVigente.moneda) }}
          </div>
        </div>
      </div>
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
            <div class="item-precio__valor">{{ formatearPrecio(precio.valor, precio.moneda) }}</div>
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
          <div v-if="index === 0" class="item-precio__badge">
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
import { computed, ref } from 'vue'
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
import { MONEDA_DEFAULT } from '../../almacenamiento/constantes/Monedas.js'
import { formatearPrecioConCodigo } from '../../utils/PrecioUtils.js'

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
const mostrarMayoristasEnTarjeta = ref(false)

/* TOP de precios vigentes por comercio en la moneda de referencia */
const preciosVigentesPorComercio = computed(() => {
  if (!props.producto.precios || props.producto.precios.length === 0) return []

  /* 1. Agrupar por comercio — usar IDs si existen, sino nombreCompleto como fallback legacy */
  const preciosPorComercio = {}

  props.producto.precios.forEach((precio) => {
    const clave =
      precio.comercioId && precio.direccionId
        ? `${precio.comercioId}_${precio.direccionId}`
        : precio.nombreCompleto || precio.comercio || 'Sin comercio'

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

  return preciosVigentes
})

const monedaReferencia = computed(() => {
  if (preciosVigentesPorComercio.value.length === 0) return MONEDA_DEFAULT
  const precioVigenteMasReciente = [...preciosVigentesPorComercio.value].sort(
    (a, b) => new Date(b.fecha) - new Date(a.fecha),
  )[0]
  return precioVigenteMasReciente?.moneda || MONEDA_DEFAULT
})

const top3PreciosUnicos = computed(() => {
  return preciosVigentesPorComercio.value
    .filter((precio) => (precio.moneda || MONEDA_DEFAULT) === monedaReferencia.value)
    .sort((a, b) => a.valor - b.valor)
    .slice(0, 3)
})

/* Precio más bajo vigente en la moneda de referencia */
const precioMejorVigente = computed(() => {
  if (top3PreciosUnicos.value.length > 0) return top3PreciosUnicos.value[0]
  return {
    valor: props.producto.precioMejor ?? 0,
    moneda: monedaReferencia.value,
  }
})

const mayoristasConVentaja = computed(() => {
  const base = Number(precioMejorVigente.value?.valor)
  if (!Number.isFinite(base) || base <= 0) return []

  return preciosVigentesPorComercio.value
    .map((precioVigente) => {
      if (!precioVigente?.activarPreciosMayoristas) {
        return null
      }
      const escalas = Array.isArray(precioVigente.escalasPorCantidad)
        ? precioVigente.escalasPorCantidad
        : []
      const escalones = escalas
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

      if (escalones.length === 0) return null
      const tieneVentaja = escalones.some((escalon) => escalon.precioUnitario < base)
      if (!tieneVentaja) return null

      const clave =
        precioVigente.comercioId && precioVigente.direccionId
          ? `${precioVigente.comercioId}_${precioVigente.direccionId}`
          : precioVigente.nombreCompleto || precioVigente.comercio || 'sin-comercio'

      return {
        clave,
        comercio: precioVigente.comercio || 'Sin comercio',
        precioBase: Number(precioVigente.valor),
        escalones,
        mejorEscalon: Math.min(...escalones.map((e) => e.precioUnitario)),
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.mejorEscalon - b.mejorEscalon)
})

const hayVentajaMayoristaTarjeta = computed(() => mayoristasConVentaja.value.length > 0)

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
const formatearPrecio = (valor, moneda) => formatearPrecioConCodigo(valor, moneda)

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

const toggleMayoristasTarjeta = () => {
  mostrarMayoristasEnTarjeta.value = !mostrarMayoristasEnTarjeta.value
}
</script>

<style scoped>
.precio-valor {
  color: var(--texto-sobre-primario);
  font-size: 24px;
  font-weight: bold;
  text-shadow: var(--sombra-texto-overlay);
}
.imagen-contenedor-personalizado {
  position: relative;
  width: 100%;
  height: 100%;
}
.overlay-precio-normal {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 24px 12px 8px 12px;
  background: var(--degradado-precio-overlay);
}
.overlay-mayorista-tarjeta {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
  padding: 10px;
  background: linear-gradient(
    to top,
    color-mix(in srgb, var(--fondo-oscuro) 70%, transparent) 0%,
    color-mix(in srgb, var(--fondo-oscuro) 25%, transparent) 45%,
    transparent 100%
  );
}
.precio-base-chip {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 4px 8px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--fondo-tarjeta) 75%, transparent);
  border: 1px solid color-mix(in srgb, var(--borde-color) 85%, transparent);
  color: var(--texto-sobre-primario);
  font-size: 14px;
  font-weight: 700;
  text-shadow: var(--sombra-texto-overlay);
}
.boton-ver-mayoristas-tarjeta {
  width: fit-content;
  margin-top: auto;
  border: 1px solid var(--mayorista-destacado-borde-fuerte);
  border-radius: 8px;
  background: color-mix(in srgb, var(--overlay-oscuro-intenso) 72%, transparent) !important;
  color: var(--mayorista-destacado-texto);
  box-shadow:
    0 0 0 1px var(--mayorista-destacado-borde),
    0 0 14px var(--mayorista-destacado-sombra-media);
  animation: pulsoBotonMayorista 2.4s ease-in-out infinite;
}
.panel-mayoristas-tarjeta {
  margin-top: 34px;
  width: 100%;
  max-height: 112px;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  scrollbar-width: none;
  -ms-overflow-style: none;
  background: color-mix(in srgb, var(--fondo-oscuro) 72%, transparent);
  border: 1px solid color-mix(in srgb, var(--overlay-blanco-medio) 60%, transparent);
  border-radius: 10px;
  backdrop-filter: blur(2px);
  padding: 8px;
}
.panel-mayoristas-tarjeta::-webkit-scrollbar {
  display: none;
}
.item-mayorista-tarjeta {
  padding: 6px 6px 4px;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--overlay-blanco-medio) 40%, transparent);
  background: color-mix(in srgb, var(--overlay-oscuro-fuerte) 65%, transparent);
  margin-bottom: 6px;
  animation: entradaEscalonItem 0.25s ease both;
}
.item-mayorista-tarjeta:last-child {
  margin-bottom: 0;
}
.item-mayorista-tarjeta__comercio {
  color: var(--texto-sobre-primario);
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 4px;
}
.item-mayorista-tarjeta__linea {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: var(--texto-sobre-primario);
  font-size: 12px;
}
.item-mayorista-tarjeta__linea--ventaja {
  color: var(--mayorista-destacado-texto);
  text-shadow: 0 0 12px var(--mayorista-destacado-texto-sombra);
  animation: pulsoLineaVentaja 1.7s ease-in-out infinite;
}
.tarjeta-mayorista-ventaja:deep(.tarjeta-yugioh) {
  border-color: var(--mayorista-destacado-color);
  box-shadow:
    var(--sombra-carta),
    0 0 0 1px var(--mayorista-destacado-borde),
    0 0 18px var(--mayorista-destacado-sombra-media);
  animation: pulsoVentajaMayorista 2.4s ease-in-out infinite;
}
.tipo-direccion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--texto-secundario);
}
.tipo-direccion__principal {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
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
  color: var(--texto-sobre-primario);
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
  color: var(--texto-sobre-primario);
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
  background: var(--color-acento-fondo-suave);
  color: var(--color-acento);
}
@keyframes entradaEscalonItem {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes pulsoVentajaMayorista {
  0%, 100% {
    box-shadow:
      var(--sombra-carta),
      0 0 0 1px var(--mayorista-destacado-borde),
      0 0 12px var(--mayorista-destacado-sombra-suave);
  }
  50% {
    box-shadow:
      var(--sombra-carta-hover),
      0 0 0 1px var(--mayorista-destacado-borde-fuerte),
      0 0 24px var(--mayorista-destacado-sombra-fuerte);
  }
}
@keyframes pulsoLineaVentaja {
  0%, 100% {
    opacity: 1;
    transform: translateX(0);
  }
  50% {
    opacity: 0.88;
    transform: translateX(1px);
  }
}
@keyframes pulsoBotonMayorista {
  0%, 100% {
    transform: translateY(0);
    box-shadow:
      0 0 0 1px var(--mayorista-destacado-borde),
      0 0 12px var(--mayorista-destacado-sombra-suave);
  }
  50% {
    transform: translateY(-1px);
    box-shadow:
      0 0 0 1px var(--mayorista-destacado-borde-fuerte),
      0 0 20px var(--mayorista-destacado-sombra-fuerte);
  }
}
</style>
