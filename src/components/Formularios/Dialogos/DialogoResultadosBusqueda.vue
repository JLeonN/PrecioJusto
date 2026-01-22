<template>
  <q-dialog v-model="dialogoAbierto">
    <q-card style="min-width: 350px; max-width: 500px">
      <!-- HEADER -->
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Resultados de búsqueda</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="cerrarDialogo" />
      </q-card-section>

      <!-- LISTA DE RESULTADOS -->
      <q-card-section>
        <q-list separator>
          <q-item
            v-for="(producto, index) in resultados"
            :key="index"
            clickable
            v-ripple
            @click="seleccionarProducto(producto)"
          >
            <!-- IMAGEN -->
            <q-item-section avatar>
              <q-avatar size="60px" square>
                <q-img
                  v-if="producto.imagen"
                  :src="producto.imagen"
                  :ratio="1"
                  class="rounded-borders"
                />
                <div v-else class="placeholder-resultado">
                  <IconShoppingBag :size="24" class="text-grey-5" />
                </div>
              </q-avatar>
            </q-item-section>

            <!-- INFO -->
            <q-item-section>
              <q-item-label class="text-weight-bold">{{ producto.nombre }}</q-item-label>
              <q-item-label caption>{{ producto.marca }}</q-item-label>
              <q-item-label caption class="text-grey-6">
                {{ producto.cantidad }} {{ producto.unidad }}
              </q-item-label>
            </q-item-section>

            <!-- ÍCONO -->
            <q-item-section side>
              <IconChevronRight :size="20" class="text-grey-5" />
            </q-item-section>
          </q-item>
        </q-list>

        <!-- MENSAJE SI NO HAY RESULTADOS -->
        <div v-if="resultados.length === 0" class="text-center q-pa-lg">
          <IconMoodSad :size="48" class="text-grey-5" />
          <p class="text-grey-7 q-mt-md">No se encontraron productos</p>
          <p class="text-caption text-grey-6">Intenta con otro término de búsqueda</p>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { IconShoppingBag, IconChevronRight, IconMoodSad } from '@tabler/icons-vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  resultados: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'producto-seleccionado'])

const dialogoAbierto = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

function seleccionarProducto(producto) {
  emit('producto-seleccionado', producto)
  cerrarDialogo()
}

function cerrarDialogo() {
  dialogoAbierto.value = false
}
</script>

<style scoped>
.placeholder-resultado {
  width: 100%;
  height: 100%;
  background-color: var(--color-primario-claro);
  border-radius: var(--borde-radio);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
