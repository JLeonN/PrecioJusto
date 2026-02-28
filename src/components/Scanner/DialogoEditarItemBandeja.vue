<template>
  <q-dialog v-model="abierto" persistent>
    <q-card class="dialogo-editar-item">

      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Editar producto</div>
        <q-space />
        <q-btn flat round dense icon="close" @click="cancelar" />
      </q-card-section>

      <q-card-section class="q-pt-sm">
        <q-input
          v-model="nombreLocal"
          label="Nombre *"
          dense
          outlined
          autofocus
          class="q-mb-sm"
          :rules="[val => !!val.trim() || 'El nombre es requerido']"
          @keyup.enter="guardar"
        />
        <q-input
          v-model="marcaLocal"
          label="Marca"
          dense
          outlined
          class="q-mb-sm"
          @keyup.enter="guardar"
        />
        <q-input
          v-model="categoriaLocal"
          label="Categoría"
          dense
          outlined
          @keyup.enter="guardar"
        />
      </q-card-section>

      <q-card-actions class="q-px-md q-pb-md">
        <!-- Restaurar desde API solo si el item tiene código de barras -->
        <q-btn
          v-if="props.item?.codigoBarras"
          flat
          no-caps
          color="grey-6"
          size="sm"
          :loading="restaurandoApi"
          @click="restaurarDesdeApi"
        >
          <IconRefresh :size="16" class="q-mr-xs" />
          Restaurar API
        </q-btn>
        <q-space />
        <q-btn flat no-caps label="Cancelar" color="grey-7" @click="cancelar" />
        <q-btn
          unelevated
          no-caps
          label="Guardar"
          color="primary"
          :disable="!nombreLocal.trim()"
          @click="guardar"
        />
      </q-card-actions>

    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { IconRefresh } from '@tabler/icons-vue'
import openFoodFactsService from '../../almacenamiento/servicios/OpenFoodFactsService.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  item: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'guardar'])

const $q = useQuasar()

const abierto = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const nombreLocal = ref('')
const marcaLocal = ref('')
const categoriaLocal = ref('')

// Sincroniza los campos cuando cambia el item
watch(
  () => props.item,
  (item) => {
    if (item) {
      nombreLocal.value = item.nombre || ''
      marcaLocal.value = item.marca || ''
      categoriaLocal.value = item.categoria || ''
    }
  },
  { immediate: true },
)

// ── Restaurar desde API ──────────────────────────────────

const restaurandoApi = ref(false)

async function restaurarDesdeApi() {
  if (!props.item?.codigoBarras) return
  restaurandoApi.value = true
  try {
    const resultado = await openFoodFactsService.buscarPorCodigoBarras(props.item.codigoBarras)
    if (!resultado) {
      $q.notify({ type: 'warning', message: 'No se encontró el producto en la API', position: 'top' })
      return
    }
    // Solo rellena los campos si hay datos nuevos distintos al valor actual
    let huboCambios = false
    if (resultado.nombre && resultado.nombre !== nombreLocal.value) { nombreLocal.value = resultado.nombre; huboCambios = true }
    if (resultado.marca && resultado.marca !== marcaLocal.value) { marcaLocal.value = resultado.marca; huboCambios = true }
    if (resultado.categoria && resultado.categoria !== categoriaLocal.value) { categoriaLocal.value = resultado.categoria; huboCambios = true }
    if (huboCambios) {
      $q.notify({ type: 'positive', message: 'Campos actualizados desde la API', position: 'top', timeout: 1800 })
    } else {
      $q.notify({ type: 'info', message: 'Los datos ya están actualizados', position: 'top', timeout: 1800 })
    }
  } catch {
    $q.notify({ type: 'negative', message: 'Sin conexión. Intentá de nuevo más tarde.', position: 'top' })
  } finally {
    restaurandoApi.value = false
  }
}

function guardar() {
  if (!nombreLocal.value.trim()) return
  emit('guardar', {
    nombre: nombreLocal.value.trim(),
    marca: marcaLocal.value.trim() || null,
    categoria: categoriaLocal.value.trim() || null,
  })
  abierto.value = false
}

function cancelar() {
  abierto.value = false
}
</script>

<style scoped>
.dialogo-editar-item {
  min-width: 300px;
  max-width: 90vw;
  width: 400px;
}
</style>
