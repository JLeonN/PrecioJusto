<template>
  <q-input
    :model-value="modelValue"
    :placeholder="placeholder"
    :color="color"
    input-style="font-size: 15px; font-weight: 600;"
    outlined
    clearable
    @update:model-value="$emit('update:modelValue', $event ?? '')"
    @clear="$emit('update:modelValue', '')"
  >
    <template #prepend>
      <q-icon name="search" size="22px" class="text-grey-6" />
    </template>
  </q-input>
</template>

<script setup>
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
</script>
