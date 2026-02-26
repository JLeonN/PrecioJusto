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

      <q-card-actions align="right" class="q-px-md q-pb-md">
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

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  item: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'guardar'])

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
