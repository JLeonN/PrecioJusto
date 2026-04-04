<template>
  <div class="estadisticas-comercio">
    <div class="estadisticas-comercio__grid">
      <!-- Registrado -->
      <div class="stat-card">
        <IconCalendar :size="20" class="icono-estadistica" />
        <div class="stat-card__info">
          <div class="stat-card__etiqueta">Registrado</div>
          <div class="stat-card__valor">{{ fechaRegistro }}</div>
        </div>
      </div>

      <!-- Último uso -->
      <div class="stat-card">
        <IconClock :size="20" class="icono-estadistica" />
        <div class="stat-card__info">
          <div class="stat-card__etiqueta">Último uso</div>
          <div class="stat-card__valor">{{ textoUltimoUso }}</div>
        </div>
      </div>

      <!-- Último precio -->
      <div class="stat-card">
        <IconCoin :size="20" class="icono-estadistica" />
        <div class="stat-card__info">
          <div class="stat-card__etiqueta">Último precio</div>
          <div class="stat-card__valor">{{ textoUltimoPrecio }}</div>
        </div>
      </div>

      <!-- Productos -->
      <div class="stat-card">
        <IconShoppingBag :size="20" class="icono-estadistica" />
        <div class="stat-card__info">
          <div class="stat-card__etiqueta">Productos</div>
          <div class="stat-card__valor">{{ totalProductos }}</div>
        </div>
      </div>

      <!-- Sucursales -->
      <div class="stat-card">
        <IconMapPin :size="20" class="icono-estadistica" />
        <div class="stat-card__info">
          <div class="stat-card__etiqueta">Sucursales</div>
          <div class="stat-card__valor">{{ comercio.totalSucursales || 1 }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { IconCalendar, IconClock, IconCoin, IconShoppingBag, IconMapPin } from '@tabler/icons-vue'
import { formatearFechaRelativa, formatearFechaCorta } from '../../composables/useFechaRelativa.js'

const props = defineProps({
  comercio: {
    type: Object,
    required: true,
  },
  totalProductos: {
    type: Number,
    default: 0,
  },
  ultimoPrecioFecha: {
    type: String,
    default: null,
  },
})

// Fecha de registro: la más antigua de los comercios originales
const fechaRegistro = computed(() => {
  const originales = props.comercio.comerciosOriginales || []
  if (originales.length === 0) return 'Sin dato'

  const fechas = originales
    .map((c) => c.fechaCreacion)
    .filter(Boolean)
    .sort()

  return fechas.length > 0 ? formatearFechaCorta(fechas[0]) : 'Sin dato'
})

// Último uso
const textoUltimoUso = computed(() => {
  return props.comercio.fechaUltimoUso
    ? formatearFechaRelativa(props.comercio.fechaUltimoUso)
    : 'Sin uso'
})

// Último precio registrado
const textoUltimoPrecio = computed(() => {
  return props.ultimoPrecioFecha
    ? formatearFechaRelativa(props.ultimoPrecioFecha)
    : 'Sin precios'
})
</script>

<style scoped>
.estadisticas-comercio__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  background: color-mix(in srgb, var(--fondo-banner-informativo) 72%, var(--fondo-app-secundario) 28%);
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--color-acento) 30%, transparent 70%);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}
.icono-estadistica {
  color: var(--color-acento);
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--color-acento) 48%, transparent));
}
.stat-card__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.stat-card__etiqueta {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: var(--texto-secundario);
}
.stat-card__valor {
  font-size: 13px;
  font-weight: 500;
  color: var(--texto-primario);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
