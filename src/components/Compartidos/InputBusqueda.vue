<template>
  <InputFormularioReutilizable
    class="input-busqueda-reutilizable"
    :model-value="modelValue"
    :placeholder="placeholder"
    :color-foco="obtenerColorFoco(color)"
    input-style="font-size: 16px; font-weight: 600; line-height: 1.2;"
    :filled="false"
    :outlined="true"
    :dense="false"
    clearable
    @update:model-value="$emit('update:modelValue', $event ?? '')"
    @clear="$emit('update:modelValue', '')"
  >
    <template #prepend>
      <q-icon name="search" size="22px" class="text-grey-6" />
    </template>
  </InputFormularioReutilizable>
</template>

<script setup>
import InputFormularioReutilizable from './InputFormularioReutilizable.vue'

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Buscar...',
  },
  color: {
    type: String,
    default: 'primary',
  },
})

defineEmits(['update:modelValue'])

function obtenerColorFoco(color) {
  if (color === 'orange') return 'var(--color-acento)'
  if (color === 'secondary') return 'var(--color-secundario)'
  return 'var(--color-primario)'
}
</script>

<style scoped>
.input-busqueda-reutilizable :deep(.q-field__prepend) {
  padding-left: 10px;
  padding-right: 8px;
  border-right: 0 !important;
}
.input-busqueda-reutilizable :deep(.q-field__control-container) {
  padding-top: 0;
  padding-bottom: 0;
}
.input-busqueda-reutilizable :deep(.q-field__native) {
  min-height: 46px;
  padding-top: 0;
  padding-bottom: 0;
  font-size: 16px;
  line-height: 1.2;
}
.input-busqueda-reutilizable :deep(.q-field__native::placeholder) {
  font-size: 16px;
  line-height: 1.2;
}
.input-busqueda-reutilizable :deep(.q-field__control::before),
.input-busqueda-reutilizable :deep(.q-field__control::after),
.input-busqueda-reutilizable :deep(.q-field__control-container::before),
.input-busqueda-reutilizable :deep(.q-field__control-container::after),
.input-busqueda-reutilizable :deep(.q-field__prepend::before),
.input-busqueda-reutilizable :deep(.q-field__prepend::after) {
  border: 0 !important;
  box-shadow: none !important;
}
</style>
