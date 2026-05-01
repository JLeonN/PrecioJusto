<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="emitirCierre">
    <q-card class="modal-confirmacion-reutilizable">
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium">{{ titulo }}</div>
        <p class="text-body2 q-mt-sm q-mb-none">{{ mensaje }}</p>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right" class="q-gutter-sm">
        <q-btn
          v-if="textoSecundario"
          flat
          no-caps
          color="primary"
          :label="textoSecundario"
          @click="$emit('accionSecundaria')"
        />
        <q-btn
          unelevated
          no-caps
          color="primary"
          :label="textoPrincipal"
          @click="$emit('accionPrincipal')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  titulo: {
    type: String,
    default: 'Confirmar',
  },
  mensaje: {
    type: String,
    default: '',
  },
  textoPrincipal: {
    type: String,
    default: 'Aceptar',
  },
  textoSecundario: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'accionPrincipal', 'accionSecundaria'])

function emitirCierre(valor) {
  emit('update:modelValue', valor)
}
</script>

<style scoped>
.modal-confirmacion-reutilizable {
  width: min(520px, 92vw);
}
</style>
