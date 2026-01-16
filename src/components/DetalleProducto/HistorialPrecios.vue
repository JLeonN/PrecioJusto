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
        :precios-confirmados="preciosConfirmados"
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
  preciosConfirmados: {
    type: Set,
    required: true,
  },
  ordenSeleccionado: {
    type: String,
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

  // Para cada grupo, obtener el precio más reciente
  grupos.forEach((grupo) => {
    grupo.precios.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    grupo.precioMasReciente = grupo.precios[0]
  })

  // Ordenar comercios según el filtro seleccionado (usando SOLO el precio más reciente)
  if (props.ordenSeleccionado === 'precio-menor') {
    // Ordenar por precio más reciente (menor a mayor)
    grupos.sort((a, b) => a.precioMasReciente.valor - b.precioMasReciente.valor)
  } else if (props.ordenSeleccionado === 'precio-mayor') {
    // Ordenar por precio más reciente (mayor a menor)
    grupos.sort((a, b) => b.precioMasReciente.valor - a.precioMasReciente.valor)
  } else if (props.ordenSeleccionado === 'reciente') {
    // Ordenar por fecha más reciente (más nuevo primero)
    grupos.sort(
      (a, b) =>
        new Date(b.precioMasReciente.fecha).getTime() -
        new Date(a.precioMasReciente.fecha).getTime(),
    )
  } else if (props.ordenSeleccionado === 'antiguo') {
    // Ordenar por fecha más reciente (más viejo primero)
    grupos.sort(
      (a, b) =>
        new Date(a.precioMasReciente.fecha).getTime() -
        new Date(b.precioMasReciente.fecha).getTime(),
    )
  } else if (props.ordenSeleccionado === 'confirmaciones') {
    // Ordenar por confirmaciones del precio más reciente
    grupos.sort((a, b) => b.precioMasReciente.confirmaciones - a.precioMasReciente.confirmaciones)
  }

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
