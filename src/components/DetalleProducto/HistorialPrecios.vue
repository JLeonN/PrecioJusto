<template>
  <div>
    <!-- Título de la sección -->
    <div class="q-mb-md">
      <h6 class="q-my-none text-weight-bold">Historial completo de precios</h6>
      <p class="text-grey-7 q-mb-none text-caption">
        {{ totalRegistros }} {{ totalRegistros === 1 ? 'registro' : 'registros' }} en
        {{ comerciosAgrupados.length }}
        {{ comerciosAgrupados.length === 1 ? 'comercio' : 'comercios' }}
      </p>
    </div>

    <!-- Lista de comercios -->
    <div v-if="comerciosAgrupados.length > 0" class="lista-comercios">
      <ItemComercioHistorial
        v-for="comercio in comerciosAgrupados"
        :key="comercio.nombreCompleto"
        :comercio="comercio"
        @confirmar-precio="$emit('confirmar-precio', $event)"
      />
    </div>

    <!-- Mensaje si no hay precios -->
    <q-card v-else class="text-center q-pa-lg">
      <IconMoodSad :size="48" class="text-grey-5" />
      <p class="text-grey-7 q-mt-md q-mb-none">
        No se encontraron precios con los filtros aplicados
      </p>
    </q-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { IconMoodSad } from '@tabler/icons-vue'
import ItemComercioHistorial from './ItemComercioHistorial.vue'

const props = defineProps({
  precios: {
    type: Array,
    required: true,
  },
})

defineEmits(['confirmar-precio'])

// Agrupar precios por comercio (nombreCompleto)
const comerciosAgrupados = computed(() => {
  // Crear un mapa con los comercios
  const mapaGrupos = new Map()

  props.precios.forEach((precio) => {
    const clave = precio.nombreCompleto

    if (!mapaGrupos.has(clave)) {
      mapaGrupos.set(clave, {
        nombreCompleto: precio.nombreCompleto,
        direccion: precio.direccion,
        comercio: precio.comercio,
        precios: [],
      })
    }

    mapaGrupos.get(clave).precios.push(precio)
  })

  // Convertir el mapa a array
  const grupos = Array.from(mapaGrupos.values())

  // Ordenar comercios por el precio más bajo de cada uno
  grupos.sort((a, b) => {
    const precioMinimoA = Math.min(...a.precios.map((p) => p.valor))
    const precioMinimoB = Math.min(...b.precios.map((p) => p.valor))
    return precioMinimoA - precioMinimoB
  })

  return grupos
})

// Total de registros
const totalRegistros = computed(() => {
  return props.precios.length
})
</script>

<style scoped>
.lista-comercios {
  display: flex;
  flex-direction: column;
}
</style>
