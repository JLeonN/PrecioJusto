<template>
  <q-input
    class="input-formulario-reutilizable"
    :model-value="modelValue"
    :label="label"
    :type="type"
    :autocomplete="autocomplete"
    :placeholder="placeholder"
    :disable="disable"
    :readonly="readonly"
    :filled="filled"
    :outlined="outlined"
    :dense="dense"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template v-if="$slots.prepend" #prepend>
      <slot name="prepend" />
    </template>
    <template v-if="$slots.append" #append>
      <slot name="append" />
    </template>
  </q-input>
</template>

<script setup>
defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  autocomplete: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  disable: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  filled: {
    type: Boolean,
    default: true,
  },
  outlined: {
    type: Boolean,
    default: false,
  },
  dense: {
    type: Boolean,
    default: true,
  },
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.input-formulario-reutilizable :deep(.q-field__control) {
  background: var(--fondo-tarjeta) !important;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--color-primario) 28%, var(--borde-color));
  min-height: 44px;
  overflow: hidden;
  padding-left: 0;
  padding-right: 0;
}
.input-formulario-reutilizable :deep(.q-field:hover .q-field__control),
.input-formulario-reutilizable :deep(.q-field.q-field--highlighted .q-field__control),
.input-formulario-reutilizable :deep(.q-field.q-field--focused .q-field__control) {
  background: var(--fondo-tarjeta) !important;
}
.input-formulario-reutilizable :deep(.q-field__control-container),
.input-formulario-reutilizable :deep(.q-field__native),
.input-formulario-reutilizable :deep(.q-field__append),
.input-formulario-reutilizable :deep(.q-field__prepend),
.input-formulario-reutilizable :deep(.q-field__marginal) {
  background: var(--fondo-tarjeta) !important;
}
.input-formulario-reutilizable :deep(.q-field:hover .q-field__control-container),
.input-formulario-reutilizable :deep(.q-field.q-field--highlighted .q-field__control-container),
.input-formulario-reutilizable :deep(.q-field.q-field--focused .q-field__control-container),
.input-formulario-reutilizable :deep(.q-field:hover .q-field__native),
.input-formulario-reutilizable :deep(.q-field.q-field--highlighted .q-field__native),
.input-formulario-reutilizable :deep(.q-field.q-field--focused .q-field__native),
.input-formulario-reutilizable :deep(.q-field:hover .q-field__append),
.input-formulario-reutilizable :deep(.q-field.q-field--highlighted .q-field__append),
.input-formulario-reutilizable :deep(.q-field.q-field--focused .q-field__append),
.input-formulario-reutilizable :deep(.q-field:hover .q-field__marginal),
.input-formulario-reutilizable :deep(.q-field.q-field--highlighted .q-field__marginal),
.input-formulario-reutilizable :deep(.q-field.q-field--focused .q-field__marginal) {
  background: var(--fondo-tarjeta) !important;
}
.input-formulario-reutilizable :deep(.q-field__native),
.input-formulario-reutilizable :deep(.q-field__label) {
  color: var(--texto-primario);
}
.input-formulario-reutilizable :deep(.q-field__native) {
  padding-left: 12px;
  padding-right: 12px;
}
.input-formulario-reutilizable :deep(.q-field__label) {
  opacity: 0.8;
  left: 12px;
}
.input-formulario-reutilizable :deep(.q-field__append) {
  padding-left: 6px;
  padding-right: 6px;
}
.input-formulario-reutilizable :deep(.q-field--focused .q-field__control) {
  border-color: var(--color-primario);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-primario) 40%, transparent);
}
.input-formulario-reutilizable :deep(.q-btn.q-btn--round) {
  background: color-mix(in srgb, var(--color-primario) 14%, transparent);
  color: var(--texto-primario);
  border: 1px solid color-mix(in srgb, var(--color-primario) 34%, var(--borde-color));
}
.input-formulario-reutilizable :deep(.q-field__append .q-btn) {
  margin: 0;
}
.input-formulario-reutilizable :deep(.q-btn.q-btn--round .q-icon) {
  font-size: 18px;
}
.input-formulario-reutilizable :deep(.q-focus-helper) {
  display: none;
}
.input-formulario-reutilizable :deep(input:-webkit-autofill),
.input-formulario-reutilizable :deep(input:-webkit-autofill:hover),
.input-formulario-reutilizable :deep(input:-webkit-autofill:focus) {
  -webkit-text-fill-color: var(--texto-primario);
  -webkit-box-shadow: 0 0 0 1000px var(--fondo-tarjeta) inset;
  transition: background-color 9999s ease-out 0s;
}
</style>
