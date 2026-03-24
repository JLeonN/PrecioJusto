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

      <!-- Footer: título a la izquierda, botón Editar a la derecha (si editable) -->
      <div v-if="titulo || (editable && src)" class="visor-footer">
        <span v-if="titulo" class="visor-titulo">{{ titulo }}</span>
        <q-btn
          v-if="editable && src"
          flat
          dense
          color="primary"
          label="Editar"
          size="sm"
          class="visor-btn-editar"
          @click="abrirEditor"
        />
      </div>
    </div>

    <!-- Editor de imagen (rotación + recorte) -->
    <EditorImagen
      v-model="editorAbierto"
      :src="src"
      @guardar="alGuardarEditor"
      @cancelar="editorAbierto = false"
    />
  </q-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { IconX } from '@tabler/icons-vue'
import EditorImagen from './EditorImagen.vue'

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
  editable: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'guardar'])

const editorAbierto = ref(false)

const abierto = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

function abrirEditor() {
  editorAbierto.value = true
}

function alGuardarEditor(nuevaImagenBase64) {
  editorAbierto.value = false
  emit('guardar', nuevaImagenBase64)
  abierto.value = false
}
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
.visor-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: rgba(0, 0, 0, 0.35);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  gap: 12px;
}
.visor-titulo {
  flex: 1;
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.visor-btn-editar {
  flex-shrink: 0;
}
</style>
