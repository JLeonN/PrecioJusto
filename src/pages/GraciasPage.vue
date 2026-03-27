<template>
  <q-page class="q-pa-md">
    <div class="contenedor-gracias">
      <div class="icono-corazon">
        <IconHeart :size="76" />
      </div>

      <h5 class="titulo-gracias">Gracias por tu apoyo</h5>
      <p class="texto-gracias">Tu apoyo nos ayuda a mantener la app gratuita para todos.</p>

      <p v-if="contadorGracias > 0" class="contador-gracias">Has dado {{ contadorGracias }} gracias</p>

      <q-btn
        color="primary"
        label="Dar gracias"
        icon="favorite"
        unelevated
        no-caps
        class="boton-gracias"
        @click="darGracias"
      />
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { IconHeart } from '@tabler/icons-vue'

const CLAVE_CONTADOR_GRACIAS = 'contadorGracias'
const $q = useQuasar()

const valorInicial = Number.parseInt(localStorage.getItem(CLAVE_CONTADOR_GRACIAS) ?? '0', 10)
const contadorGracias = ref(Number.isNaN(valorInicial) ? 0 : valorInicial)

const darGracias = () => {
  contadorGracias.value += 1
  localStorage.setItem(CLAVE_CONTADOR_GRACIAS, String(contadorGracias.value))

  $q.notify({
    type: 'positive',
    message: 'Gracias por apoyar Precio Justo',
    position: 'top',
    timeout: 1800,
  })
}
</script>

<style scoped>
.contenedor-gracias {
  min-height: calc(100vh - 180px);
  max-width: 520px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
}

.icono-corazon {
  color: var(--color-primario);
  display: flex;
  align-items: center;
  justify-content: center;
}

.titulo-gracias {
  margin: 0;
  font-weight: 700;
  color: #1f2937;
}

.texto-gracias {
  margin: 0;
  color: #4b5563;
  line-height: 1.45;
}

.contador-gracias {
  margin: 4px 0;
  font-weight: 600;
  color: #374151;
}

.boton-gracias {
  margin-top: 8px;
  min-width: 170px;
}
</style>
