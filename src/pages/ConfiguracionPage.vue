<template>
  <q-page class="q-pa-md configuracion-page">
    <div class="contenedor-configuracion">
      <div class="q-mb-md">
        <h5 class="q-my-none">Configuración</h5>
        <p class="text-grey-7 q-mt-xs q-mb-none">Preferencias globales de la app</p>
      </div>

      <q-card flat bordered>
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">Moneda predeterminada</div>
          <p class="text-caption text-grey-7 q-mt-xs q-mb-none">
            Esta moneda se usa como valor inicial en formularios nuevos.
          </p>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-toggle
            :model-value="esModoAutomatico"
            label="Usar moneda automática según país"
            color="primary"
            @update:model-value="cambiarModoAutomatico"
          />

          <div class="q-mt-md">
            <q-banner rounded class="bg-grey-2 text-grey-9">
              Moneda predeterminada efectiva: <strong>{{ preferenciasStore.monedaDefaultEfectiva }}</strong>
            </q-banner>
          </div>

          <div v-if="esModoAutomatico" class="q-mt-md column q-gutter-sm">
            <q-banner rounded class="bg-blue-1 text-blue-10">
              País detectado:
              <strong>{{ preferenciasStore.paisDetectado || 'No detectado' }}</strong>
            </q-banner>

            <q-banner v-if="preferenciasStore.monedaDetectada" rounded class="bg-positive text-white">
              Moneda detectada automáticamente:
              <strong>{{ preferenciasStore.monedaDetectada }}</strong>
            </q-banner>

            <q-banner
              v-else
              rounded
              class="bg-warning text-dark"
            >
              No se pudo detectar una moneda por región. Se usa la última moneda manual guardada.
            </q-banner>
          </div>

          <div v-else class="q-mt-md">
            <q-select
              :model-value="preferenciasStore.monedaManual"
              :options="MONEDAS"
              label="Moneda manual"
              emit-value
              map-options
              outlined
              dense
              @update:model-value="cambiarMonedaManual"
            />
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="q-mt-md">
        <q-card-section>
          <div class="text-subtitle2">Importante</div>
          <p class="text-body2 q-mt-sm q-mb-none">
            Cambiar la moneda en un precio puntual solo afecta ese registro. No modifica esta preferencia global.
          </p>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { MONEDAS } from '../almacenamiento/constantes/Monedas.js'
import { usePreferenciasStore } from '../almacenamiento/stores/preferenciasStore.js'

const preferenciasStore = usePreferenciasStore()

const esModoAutomatico = computed(() => preferenciasStore.modoMoneda === 'automatica')

async function cambiarModoAutomatico(valor) {
  await preferenciasStore.guardarModoMoneda(valor ? 'automatica' : 'manual')
}

async function cambiarMonedaManual(moneda) {
  await preferenciasStore.guardarMonedaManual(moneda)
}

onMounted(async () => {
  if (preferenciasStore.modoMoneda === 'automatica' && !preferenciasStore.paisDetectado) {
    await preferenciasStore.detectarMonedaAutomatica()
  }
})
</script>

<style scoped>
.configuracion-page {
  background: var(--fondo-app-secundario);
}

.contenedor-configuracion {
  max-width: 720px;
  margin: 0 auto;
}
</style>
