<template>
  <q-dialog v-model="abierto" transition-show="scale" transition-hide="scale">
    <div class="visor-contenedor">
      <!-- Botón cerrar -->
      <q-btn
        round
        flat
        color="white"
        class="visor-btn-cerrar"
        @click="abierto = false"
      >
        <IconX :size="22" />
      </q-btn>

      <!-- Imagen -->
      <q-img
        :src="src"
        fit="contain"
        class="visor-imagen"
        no-spinner
      />

      <!-- Título opcional -->
      <div v-if="titulo" class="visor-titulo">{{ titulo }}</div>
    </div>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { IconX } from '@tabler/icons-vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  src: {
    type: String,
    default: '',
  },
  titulo: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const abierto = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})
</script>

<style scoped>
.visor-contenedor {
  position: relative;
  background: #1a1a1a;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
  width: min(90vw, 480px);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}
.visor-btn-cerrar {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
}
.visor-imagen {
  width: 100%;
  max-height: calc(85vh - 48px);
  border-radius: 16px;
}
.visor-titulo {
  padding: 10px 16px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  background: rgba(0, 0, 0, 0.35);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
</style>
