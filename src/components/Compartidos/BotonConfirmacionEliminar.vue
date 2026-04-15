<template>
  <div
    ref="contenedorBotonRef"
    class="boton-confirmacion-eliminar"
    :class="{
      'boton-confirmacion-eliminar--activo': confirmacionActiva,
      'boton-confirmacion-eliminar--deshabilitado': deshabilitado,
    }"
    @click.stop
  >
    <transition name="transicion-boton-eliminar" mode="out-in">
      <q-btn
        v-if="!confirmacionActiva"
        key="estado-inicial"
        flat
        round
        dense
        size="sm"
        :disable="deshabilitado"
        class="boton-confirmacion-eliminar__accion boton-confirmacion-eliminar__accion--inicial"
        @click.stop="abrirConfirmacion"
      >
        <component :is="iconoBoton" :size="18" />
        <q-tooltip v-if="tooltipInicial">{{ tooltipInicial }}</q-tooltip>
      </q-btn>

      <div
        v-else
        key="estado-confirmacion"
        class="boton-confirmacion-eliminar__panel"
      >
        <q-btn
          unelevated
          dense
          no-caps
          size="sm"
          :disable="deshabilitado"
          class="boton-confirmacion-eliminar__confirmar"
          @click.stop="confirmarEliminacion"
        >
          {{ textoConfirmacion }}
        </q-btn>

        <q-btn
          flat
          round
          dense
          size="sm"
          :disable="deshabilitado"
          class="boton-confirmacion-eliminar__cancelar"
          @click.stop="cancelarConfirmacion"
        >
          <IconX :size="16" />
        </q-btn>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { IconRefresh, IconTrash, IconX } from '@tabler/icons-vue'

const props = defineProps({
  textoConfirmacion: {
    type: String,
    default: 'Confirmar',
  },
  deshabilitado: {
    type: Boolean,
    default: false,
  },
  tooltipInicial: {
    type: String,
    default: 'Eliminar',
  },
  icono: {
    type: String,
    default: 'eliminar',
  },
})

const emit = defineEmits(['confirmar', 'cancelar', 'abrir-confirmacion'])

const contenedorBotonRef = ref(null)
const confirmacionActiva = ref(false)
const iconoBoton = computed(() => (props.icono === 'reiniciar' ? IconRefresh : IconTrash))

function abrirConfirmacion() {
  if (props.deshabilitado || confirmacionActiva.value) return

  confirmacionActiva.value = true
  emit('abrir-confirmacion')
}

function cancelarConfirmacion() {
  if (!confirmacionActiva.value) return

  confirmacionActiva.value = false
  emit('cancelar')
}

function confirmarEliminacion() {
  if (props.deshabilitado) return

  confirmacionActiva.value = false
  emit('confirmar')
}

function manejarPointerDownGlobal(evento) {
  const contenedor = contenedorBotonRef.value
  const objetivo = evento.target

  if (!contenedor || !objetivo || contenedor.contains(objetivo)) return

  cancelarConfirmacion()
}

function manejarTeclaGlobal(evento) {
  if (evento.key === 'Escape') {
    cancelarConfirmacion()
  }
}

function registrarListenersGlobales() {
  document.addEventListener('pointerdown', manejarPointerDownGlobal, true)
  document.addEventListener('keydown', manejarTeclaGlobal)
}

function removerListenersGlobales() {
  document.removeEventListener('pointerdown', manejarPointerDownGlobal, true)
  document.removeEventListener('keydown', manejarTeclaGlobal)
}

watch(confirmacionActiva, (estaActiva) => {
  if (estaActiva) {
    registrarListenersGlobales()
  } else {
    removerListenersGlobales()
  }
})

watch(
  () => props.deshabilitado,
  (estaDeshabilitado) => {
    if (estaDeshabilitado) {
      cancelarConfirmacion()
    }
  },
)

onBeforeUnmount(() => {
  removerListenersGlobales()
})
</script>

<style scoped>
.boton-confirmacion-eliminar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 124px;
  min-height: 34px;
}
.boton-confirmacion-eliminar--deshabilitado {
  opacity: 0.7;
}
.boton-confirmacion-eliminar__accion,
.boton-confirmacion-eliminar__panel {
  background: var(--boton-eliminar-fondo);
  color: var(--boton-eliminar-texto);
  border: 1px solid var(--boton-eliminar-borde);
  box-shadow: var(--sombra-ligera);
  backdrop-filter: blur(2px);
}
.boton-confirmacion-eliminar__accion {
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}
.boton-confirmacion-eliminar__accion:hover,
.boton-confirmacion-eliminar__panel:hover {
  background: var(--boton-eliminar-fondo-hover);
  color: var(--boton-eliminar-texto);
  border-color: var(--boton-eliminar-borde-hover);
}
.boton-confirmacion-eliminar__panel {
  width: 124px;
  min-height: 34px;
  border-radius: 999px;
  padding: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 2px;
  overflow: hidden;
}
.boton-confirmacion-eliminar__confirmar {
  flex: 1;
  min-height: 28px;
  border-radius: 999px;
  background: var(--boton-eliminar-fondo-confirmar);
  color: inherit;
  font-weight: 600;
  letter-spacing: 0.01em;
}
.boton-confirmacion-eliminar__cancelar {
  color: inherit;
}
.transicion-boton-eliminar-enter-active,
.transicion-boton-eliminar-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.transicion-boton-eliminar-enter-from,
.transicion-boton-eliminar-leave-to {
  opacity: 0;
  transform: scale(0.92);
}
</style>
