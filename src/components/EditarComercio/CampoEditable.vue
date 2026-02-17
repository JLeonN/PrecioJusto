<template>
  <div class="campo-editable">
    <!-- MODO LECTURA -->
    <div v-if="!editando" class="campo-editable__lectura" @click="iniciarEdicion">
      <div class="campo-editable__icono">
        <component :is="icono" :size="20" class="text-orange" />
      </div>
      <div class="campo-editable__contenido">
        <div class="campo-editable__etiqueta">{{ etiqueta }}</div>
        <div class="campo-editable__valor" :class="{ 'text-grey-5': !valor }">
          {{ valor || sinValorTexto }}
        </div>
      </div>
      <q-btn flat dense round size="sm" color="grey-6" @click.stop="iniciarEdicion">
        <IconPencil :size="16" />
      </q-btn>
    </div>

    <!-- MODO EDICIÓN -->
    <div v-else class="campo-editable__edicion">
      <div class="campo-editable__icono">
        <component :is="icono" :size="20" class="text-orange" />
      </div>
      <div class="campo-editable__input-contenedor">
        <div class="campo-editable__etiqueta">{{ etiqueta }}</div>
        <!-- Input de texto -->
        <q-input
          v-if="tipo === 'text'"
          v-model="valorTemporal"
          dense
          outlined
          autofocus
          :rules="requerido ? [val => !!val || 'Campo requerido'] : []"
          @keyup.enter="guardar"
          @keyup.escape="cancelar"
        />
        <!-- Select -->
        <q-select
          v-else-if="tipo === 'select'"
          v-model="valorTemporal"
          dense
          outlined
          :options="opciones"
          emit-value
          map-options
        />
      </div>
      <div class="campo-editable__acciones">
        <q-btn flat dense round size="sm" color="positive" :disable="!puedeGuardar" @click="guardar">
          <IconCheck :size="18" />
        </q-btn>
        <q-btn flat dense round size="sm" color="grey-6" @click="cancelar">
          <IconX :size="18" />
        </q-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { IconPencil, IconCheck, IconX } from '@tabler/icons-vue'

const props = defineProps({
  etiqueta: {
    type: String,
    required: true,
  },
  valor: {
    type: String,
    default: '',
  },
  icono: {
    type: [Object, Function],
    required: true,
  },
  tipo: {
    type: String,
    default: 'text',
    validator: (v) => ['text', 'select'].includes(v),
  },
  opciones: {
    type: Array,
    default: () => [],
  },
  requerido: {
    type: Boolean,
    default: false,
  },
  sinValorTexto: {
    type: String,
    default: 'Sin definir',
  },
})

const emit = defineEmits(['guardar'])

const editando = ref(false)
const valorTemporal = ref('')

const puedeGuardar = computed(() => {
  if (props.requerido && !valorTemporal.value) return false
  return valorTemporal.value !== props.valor
})

function iniciarEdicion() {
  valorTemporal.value = props.valor || ''
  editando.value = true
}

function guardar() {
  if (!puedeGuardar.value) return
  emit('guardar', valorTemporal.value)
  editando.value = false
}

function cancelar() {
  editando.value = false
  valorTemporal.value = props.valor || ''
}
</script>

<style scoped>
.campo-editable {
  border-bottom: 1px solid var(--color-carta-borde, #e0e0e0);
  padding: 12px 0;
}
.campo-editable__lectura {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 4px 0;
}
.campo-editable__lectura:hover {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}
.campo-editable__edicion {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.campo-editable__icono {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-acento-claro, #fff3e0);
  border-radius: 50%;
}
.campo-editable__contenido {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.campo-editable__input-contenedor {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.campo-editable__etiqueta {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--texto-secundario, #666);
}
.campo-editable__valor {
  font-size: 15px;
  color: var(--texto-primario, #333);
  line-height: 1.4;
}
.campo-editable__acciones {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  padding-top: 16px;
}
</style>
