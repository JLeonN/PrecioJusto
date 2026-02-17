<template>
  <q-dialog v-model="dialogoAbierto">
    <q-card class="dialogo-coincidencias">
      <!-- HEADER -->
      <q-card-section class="bg-warning text-white header-con-cierre">
        <q-btn
          icon="close"
          flat
          round
          dense
          color="white"
          class="boton-cerrar-absoluto"
          @click="cerrarDialogo"
        />
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
          ¿Es una nueva sucursal de alguno de estos comercios?
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
        <q-btn flat label="Cancelar" color="grey-7" @click="cerrarDialogo" />
        <q-btn unelevated label="No, es nuevo" color="primary" @click="continuarNuevo" />
      </q-card-actions>

      <!-- NOTA INFORMATIVA -->
      <q-card-section class="q-pt-none">
        <q-banner dense class="bg-grey-2" rounded>
          <template #avatar>
            <q-icon name="info" color="primary" />
          </template>
          <span class="text-caption">
            Si es una sucursal de uno de estos, selecciónalo. Si es un comercio completamente nuevo,
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

const emit = defineEmits(['update:modelValue', 'agregar-sucursal', 'continuar-nuevo'])

// Estado del diálogo
const dialogoAbierto = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

/**
 * Usuario selecciona un comercio para agregar sucursal
 */
function seleccionarComercio(comercio) {
  emit('agregar-sucursal', comercio)
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
.header-con-cierre {
  position: relative;
}
.boton-cerrar-absoluto {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
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
