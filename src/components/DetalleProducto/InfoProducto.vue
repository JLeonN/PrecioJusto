<template>
  <q-card class="info-producto">
    <q-card-section class="info-contenido">
      <!-- IMAGEN DEL PRODUCTO -->
      <div class="info-imagen">
        <q-img v-if="producto.imagen" :src="producto.imagen" :ratio="1" class="rounded-borders" />
        <div v-else class="placeholder-imagen">
          <IconShoppingBag :size="64" class="text-grey-5" />
        </div>
      </div>

      <!-- INFORMACIÓN PRINCIPAL -->
      <div class="info-detalles">
        <!-- Nombre del producto -->
        <h5 class="q-my-none text-weight-bold">{{ producto.nombre }}</h5>

        <!-- Precio más bajo actual -->
        <div class="precio-principal q-mt-sm">
          <div class="text-h4 text-weight-bold text-primary">${{ producto.precioMejor }}</div>
          <div class="comercio-info row items-center q-gutter-xs no-wrap q-mt-xs">
            <IconMapPin :size="18" class="text-grey-6" />
            <span class="text-body2 text-grey-7">{{ producto.comercioMejor }}</span>
          </div>
        </div>

        <!-- Chip de tendencia general -->
        <q-chip :color="colorTendencia" text-color="white" :icon="iconoTendencia" class="q-mt-sm">
          <span class="text-weight-bold">
            {{ textoTendencia }}
          </span>
        </q-chip>

        <!-- Botón agregar precio -->
        <q-btn
          unelevated
          color="primary"
          label="Agregar precio"
          class="q-mt-md full-width"
          @click="$emit('agregar-precio')"
        >
          <IconPlus :size="20" class="q-mr-xs" />
        </q-btn>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'
import { IconShoppingBag, IconMapPin, IconPlus } from '@tabler/icons-vue'

const props = defineProps({
  producto: {
    type: Object,
    required: true,
  },
})

defineEmits(['agregar-precio'])

// Color del chip según tendencia
const colorTendencia = computed(() => {
  if (props.producto.tendenciaGeneral === 'bajando') return 'positive'
  if (props.producto.tendenciaGeneral === 'subiendo') return 'negative'
  return 'grey-6'
})

// Ícono según tendencia
const iconoTendencia = computed(() => {
  if (props.producto.tendenciaGeneral === 'bajando') return 'arrow_downward'
  if (props.producto.tendenciaGeneral === 'subiendo') return 'arrow_upward'
  return 'remove'
})

// Texto descriptivo de la tendencia
const textoTendencia = computed(() => {
  const porcentaje = Math.abs(props.producto.porcentajeTendencia)
  if (props.producto.tendenciaGeneral === 'bajando') {
    return `Bajando ${porcentaje}% (últimos 30 días)`
  }
  if (props.producto.tendenciaGeneral === 'subiendo') {
    return `Subiendo ${porcentaje}% (últimos 30 días)`
  }
  return 'Precio estable (últimos 30 días)'
})
</script>

<style scoped>
.info-producto {
  border-left: 4px solid var(--color-primario);
}
.info-contenido {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 24px;
  align-items: start;
}
/* Responsive móvil */
@media (max-width: 599px) {
  .info-contenido {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .info-imagen {
    max-width: 200px;
    margin: 0 auto;
  }
}
.info-imagen {
  width: 100%;
  height: 120px;
}
.placeholder-imagen {
  width: 100%;
  height: 100%;
  background-color: var(--color-primario-claro);
  border-radius: var(--borde-radio);
  display: flex;
  align-items: center;
  justify-content: center;
}
.info-detalles {
  display: flex;
  flex-direction: column;
}
.precio-principal {
  display: flex;
  flex-direction: column;
}
.comercio-info {
  overflow: hidden;
}
.comercio-info span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
