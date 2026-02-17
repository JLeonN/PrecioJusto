<template>
  <div class="estadisticas-comercio">
    <div class="estadisticas-comercio__grid">
      <!-- Registrado -->
      <div class="stat-card">
        <IconCalendar :size="20" class="text-orange" />
        <div class="stat-card__info">
          <div class="stat-card__etiqueta">Registrado</div>
          <div class="stat-card__valor">{{ fechaRegistro }}</div>
        </div>
      </div>

      <!-- Último uso -->
      <div class="stat-card">
        <IconClock :size="20" class="text-orange" />
        <div class="stat-card__info">
          <div class="stat-card__etiqueta">Último uso</div>
          <div class="stat-card__valor">{{ textoUltimoUso }}</div>
        </div>
      </div>

      <!-- Último precio -->
      <div class="stat-card">
        <IconCoin :size="20" class="text-orange" />
        <div class="stat-card__info">
          <div class="stat-card__etiqueta">Último precio</div>
          <div class="stat-card__valor">{{ textoUltimoPrecio }}</div>
        </div>
      </div>

      <!-- Productos -->
      <div class="stat-card">
        <IconShoppingBag :size="20" class="text-orange" />
        <div class="stat-card__info">
          <div class="stat-card__etiqueta">Productos</div>
          <div class="stat-card__valor">{{ totalProductos }}</div>
        </div>
      </div>

      <!-- Sucursales -->
      <div class="stat-card">
        <IconMapPin :size="20" class="text-orange" />
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
  padding: 12px;
  background: var(--color-primario-claro, #f5f5f5);
  border-radius: 10px;
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
  color: var(--texto-secundario, #666);
}
.stat-card__valor {
  font-size: 13px;
  font-weight: 500;
  color: var(--texto-primario, #333);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
