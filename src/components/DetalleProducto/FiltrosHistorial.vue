<template>
  <q-card class="filtros-card">
    <q-card-section class="q-pa-md">
      <div class="row q-col-gutter-md">
        <!-- Filtro por comercio -->
        <div class="col-12 col-sm-4">
          <q-select
            :model-value="comercio"
            :options="opcionesComercios"
            label="Comercio"
            outlined
            dense
            emit-value
            map-options
            @update:model-value="$emit('update:comercio', $event)"
          >
            <template #prepend>
              <IconFilter :size="18" />
            </template>
          </q-select>
        </div>

        <!-- Filtro por período -->
        <div class="col-12 col-sm-4">
          <q-select
            :model-value="periodo"
            :options="opcionesPeriodo"
            label="Período"
            outlined
            dense
            emit-value
            map-options
            @update:model-value="$emit('update:periodo', $event)"
          >
            <template #prepend>
              <IconCalendar :size="18" />
            </template>
          </q-select>
        </div>

        <!-- Ordenar por -->
        <div class="col-12 col-sm-4">
          <q-select
            :model-value="orden"
            :options="opcionesOrden"
            label="Ordenar por"
            outlined
            dense
            emit-value
            map-options
            @update:model-value="$emit('update:orden', $event)"
          >
            <template #prepend>
              <IconArrowsSort :size="18" />
            </template>
          </q-select>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'
import { IconFilter, IconCalendar, IconArrowsSort } from '@tabler/icons-vue'

const props = defineProps({
  comercio: {
    type: String,
    required: true,
  },
  periodo: {
    type: String,
    required: true,
  },
  orden: {
    type: String,
    required: true,
  },
  comerciosDisponibles: {
    type: Array,
    required: true,
  },
})

defineEmits(['update:comercio', 'update:periodo', 'update:orden'])

// Opciones de comercios (todos + los disponibles)
const opcionesComercios = computed(() => {
  const opciones = [{ label: 'Todos los comercios', value: 'todos' }]
  props.comerciosDisponibles.forEach((comercio) => {
    opciones.push({ label: comercio, value: comercio })
  })
  return opciones
})

// Opciones de período
const opcionesPeriodo = [
  { label: 'Últimos 7 días', value: '7' },
  { label: 'Últimos 30 días', value: '30' },
  { label: 'Últimos 90 días', value: '90' },
  { label: 'Último año', value: '365' },
  { label: 'Todo el historial', value: '0' },
]

// Opciones de ordenamiento
const opcionesOrden = [
  { label: 'Más reciente', value: 'reciente' },
  { label: 'Más antiguo', value: 'antiguo' },
  { label: 'Precio menor', value: 'precio-menor' },
  { label: 'Precio mayor', value: 'precio-mayor' },
  { label: 'Más confirmaciones', value: 'confirmaciones' },
]
</script>

<style scoped>
.filtros-card {
  background-color: var(--fondo-drawer);
}
</style>
