<template>
  <q-dialog v-model="visible" full-width full-height transition-show="fade" transition-hide="fade">
    <div class="editor-contenedor">
      <div class="editor-header">
        <h6 class="editor-titulo q-ma-none">Editar imagen</h6>
        <q-btn round flat color="white" size="sm" @click="alCancelar">
          <IconX :size="22" />
        </q-btn>
      </div>
      <div class="editor-cropper">
        <Cropper
          v-if="src"
          ref="cropperRef"
          :src="src"
          class="cropper"
          :resize-image="{ touch: true, wheel: true }"
          :move-image="{ touch: true, mouse: true }"
        />
      </div>
      <div class="editor-toolbar">
        <div class="editor-rotacion">
          <q-btn flat round color="white" size="md" @click="rotarIzquierda">
            <IconRotate2 :size="24" />
            <q-tooltip>Rotar 90° izquierda</q-tooltip>
          </q-btn>
          <q-btn flat round color="white" size="md" @click="rotarDerecha">
            <IconRotate2 :size="24" class="rotar-derecha" />
            <q-tooltip>Rotar 90° derecha</q-tooltip>
          </q-btn>
        </div>
        <div class="editor-acciones">
          <q-btn flat color="grey-4" label="Cancelar" @click="alCancelar" />
          <q-btn unelevated color="primary" label="Guardar" :loading="guardando" @click="alGuardar" />
        </div>
      </div>
    </div>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { IconX, IconRotate2 } from '@tabler/icons-vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  src: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'guardar', 'cancelar'])

const cropperRef = ref(null)
const guardando = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// Reset del cropper cuando se abre con nueva imagen
watch(() => props.src, () => {
  if (props.modelValue && cropperRef.value) {
    cropperRef.value.refresh?.()
  }
})

function rotarIzquierda() {
  cropperRef.value?.rotate?.(-90)
}

function rotarDerecha() {
  cropperRef.value?.rotate?.(90)
}

function alCancelar() {
  visible.value = false
  emit('cancelar')
}

async function alGuardar() {
  if (!cropperRef.value || !props.src) return
  guardando.value = true
  try {
    const resultado = cropperRef.value.getResult?.()
    const canvas = resultado?.canvas
    if (!canvas) {
      emit('guardar', props.src)
      visible.value = false
      return
    }
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    emit('guardar', dataUrl)
    visible.value = false
  } catch (err) {
    console.error('Error al exportar imagen:', err)
    emit('guardar', props.src)
    visible.value = false
  } finally {
    guardando.value = false
  }
}
</script>

<style scoped>
.editor-contenedor {
  background: var(--fondo-oscuro);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 70vh;
}
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(12px + var(--safe-area-top, 0px)) 16px 12px;
  background: var(--overlay-oscuro-medio);
  flex-shrink: 0;
}
.editor-titulo {
  color: var(--texto-sobre-primario);
  font-size: 16px;
  font-weight: 600;
}
.editor-cropper {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cropper {
  width: 100%;
  height: 100%;
  min-height: 300px;
  background: var(--fondo-oscuro-secundario);
}
.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px calc(12px + var(--safe-area-bottom, 0px));
  background: var(--overlay-oscuro-fuerte);
  border-top: 1px solid var(--borde-blanco-sutil);
  flex-shrink: 0;
}
.editor-rotacion {
  display: flex;
  gap: 8px;
}
.editor-acciones {
  display: flex;
  gap: 12px;
}
.rotar-derecha {
  transform: scaleX(-1);
}
</style>
