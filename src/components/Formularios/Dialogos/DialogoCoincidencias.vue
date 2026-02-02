<template>
  <q-dialog v-model="dialogoAbierto" persistent>
    <q-card class="dialogo-coincidencias">
      <!-- HEADER -->
      <q-card-section class="bg-warning text-white">
        <div class="row items-center">
          <q-icon name="warning" size="32px" class="q-mr-md" />
          <div>
            <div class="text-h6">Comercios similares encontrados</div>
            <div class="text-body2">Verifica si es alguno de estos</div>
          </div>
        </div>
      </q-card-section>

      <!-- CONTENIDO: LISTA DE COMERCIOS SIMILARES -->
      <q-card-section class="contenido-scroll">
        <p class="text-body2 text-grey-7 q-mb-md">
          Encontramos comercios con nombres similares. ¿Es alguno de estos?
        </p>

        <q-list bordered separator class="rounded-borders">
          <q-item
            v-for="item in comerciosSimilares"
            :key="item.comercio.id"
            clickable
            v-ripple
            @click="seleccionarComercio(item.comercio)"
          >
            <q-item-section avatar>
              <q-avatar color="primary" text-color="white">
                <q-icon name="store" />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-bold">
                {{ item.comercio.nombre }}
              </q-item-label>
              <q-item-label caption>
                {{ item.comercio.tipo }}
              </q-item-label>
              <q-item-label caption class="text-grey-7">
                {{ item.comercio.direcciones.length }}
                {{ item.comercio.direcciones.length === 1 ? 'dirección' : 'direcciones' }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-chip dense color="primary" text-color="white" size="sm">
                {{ item.similitud }}% similar
              </q-chip>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <!-- ACCIONES -->
      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat label="No, es nuevo" color="primary" @click="continuarNuevo" />
      </q-card-actions>

      <!-- NOTA INFORMATIVA -->
      <q-card-section class="q-pt-none">
        <q-banner dense class="bg-grey-2" rounded>
          <template #avatar>
            <q-icon name="info" color="primary" />
          </template>
          <span class="text-caption">
            Si es uno de estos, selecciónalo para evitar duplicados. Si es un comercio nuevo,
            presiona "No, es nuevo".
          </span>
        </q-banner>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  comerciosSimilares: {
    type: Array,
    default: () => [],
  },
  nivelValidacion: {
    type: Number,
    default: 2,
  },
})

const emit = defineEmits(['update:modelValue', 'usar-existente', 'continuar-nuevo'])

// Estado del diálogo
const dialogoAbierto = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

/**
 * Usuario selecciona un comercio existente
 */
function seleccionarComercio(comercio) {
  emit('usar-existente', comercio)
  cerrarDialogo()
}

/**
 * Usuario confirma que es un comercio nuevo
 */
function continuarNuevo() {
  emit('continuar-nuevo')
  cerrarDialogo()
}

/**
 * Cerrar diálogo
 */
function cerrarDialogo() {
  dialogoAbierto.value = false
}
</script>

<style scoped>
.dialogo-coincidencias {
  min-width: 350px;
  max-width: 500px;
}
.contenido-scroll {
  max-height: 400px;
  overflow-y: auto;
}
/* Items clickables con hover */
.q-item {
  transition: background-color 0.2s ease;
}
.q-item:hover {
  background-color: var(--fondo-drawer);
}
</style>
