<template>
  <!-- MODO NATIVO: overlay sobre la cámara -->
  <Teleport to="body">
    <div v-if="activo && esNativo" class="scanner-overlay">
      <!-- Header: botón cerrar -->
      <div class="scanner-header">
        <q-btn round flat @click="alCerrar">
          <IconX :size="28" color="white" />
        </q-btn>
      </div>

      <!-- Área oscura superior -->
      <div class="scanner-fondo-oscuro scanner-fondo-oscuro--arriba" />

      <!-- Fila central: oscuro | ventana | oscuro -->
      <div class="scanner-fila-central">
        <div class="scanner-fondo-oscuro scanner-fondo-oscuro--lado" />
        <div class="scanner-ventana">
          <span class="scanner-corner scanner-corner--tl" />
          <span class="scanner-corner scanner-corner--tr" />
          <span class="scanner-corner scanner-corner--bl" />
          <span class="scanner-corner scanner-corner--br" />
          <div class="scanner-linea" />
        </div>
        <div class="scanner-fondo-oscuro scanner-fondo-oscuro--lado" />
      </div>

      <!-- Área oscura inferior con instrucción -->
      <div class="scanner-fondo-oscuro scanner-fondo-oscuro--abajo">
        <p class="scanner-instruccion">Apuntá el código de barras al recuadro</p>
      </div>
    </div>
  </Teleport>

  <!-- MODO WEB: input manual (solo para desarrollo/testing) -->
  <q-dialog :model-value="activo && !esNativo" persistent @update:model-value="alCerrar">
    <q-card class="scanner-dialogo-web">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold">Ingresar código de barras</div>
        <div class="text-caption text-grey-6">El scanner de cámara solo funciona en la app móvil</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-input
          v-model="codigoManual"
          label="Código EAN"
          outlined
          autofocus
          @keyup.enter="confirmarCodigoManual"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Cancelar" @click="alCerrar" />
        <q-btn
          color="primary"
          label="Confirmar"
          :disable="!codigoManual"
          @click="confirmarCodigoManual"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning'
import { useQuasar } from 'quasar'
import { IconX } from '@tabler/icons-vue'

const props = defineProps({
  activo: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['codigo-detectado', 'cerrar'])

const $q = useQuasar()
const esNativo = Capacitor.isNativePlatform()
const codigoManual = ref('')

// Formatos de código de barras a detectar (los más comunes en supermercados)
const FORMATOS_SOPORTADOS = [
  BarcodeFormat.Ean13,
  BarcodeFormat.Ean8,
  BarcodeFormat.UpcA,
  BarcodeFormat.UpcE,
  BarcodeFormat.Code128,
]

async function iniciarScaneo() {
  if (!esNativo) return

  const tienePermiso = await verificarPermiso()
  if (!tienePermiso) return

  // Hace el webview transparente para que la cámara nativa se vea detrás
  document.body.classList.add('scanner-activo')

  await BarcodeScanner.addListener('barcodeScanned', (resultado) => {
    const codigo = resultado.barcode?.rawValue
    if (codigo) {
      detenerScaneo()
      emit('codigo-detectado', codigo)
    }
  })

  await BarcodeScanner.startScan({ formats: FORMATOS_SOPORTADOS })
}

async function detenerScaneo() {
  if (!esNativo) return
  document.body.classList.remove('scanner-activo')
  await BarcodeScanner.removeAllListeners()
  try {
    await BarcodeScanner.stopScan()
  } catch {
    // Ignorar error si el scan ya estaba detenido
  }
}

async function verificarPermiso() {
  try {
    const { camera } = await BarcodeScanner.checkPermissions()
    if (camera === 'granted') return true

    if (camera === 'denied') {
      $q.notify({
        type: 'negative',
        message: 'Sin acceso a la cámara. Habilitalo en Configuración del dispositivo.',
        position: 'top',
        timeout: 4000,
      })
      emit('cerrar')
      return false
    }

    // Estado 'prompt': solicitar permiso al usuario
    const { camera: nuevoEstado } = await BarcodeScanner.requestPermissions()
    if (nuevoEstado === 'granted') return true

    emit('cerrar')
    return false
  } catch (error) {
    console.error('Error al verificar permisos de cámara:', error)
    emit('cerrar')
    return false
  }
}

function alCerrar() {
  detenerScaneo()
  codigoManual.value = ''
  emit('cerrar')
}

function confirmarCodigoManual() {
  if (!codigoManual.value) return
  emit('codigo-detectado', codigoManual.value.trim())
  codigoManual.value = ''
}

// Inicia o detiene el scaneo cuando cambia la prop activo
watch(
  () => props.activo,
  (nuevoValor) => {
    if (nuevoValor) {
      iniciarScaneo()
    } else {
      detenerScaneo()
    }
  },
)

// Limpieza garantizada al desmontar el componente
onUnmounted(() => {
  detenerScaneo()
})
</script>

<style scoped>
.scanner-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
}
.scanner-header {
  background: rgba(0, 0, 0, 0.6);
  padding: calc(var(--safe-area-top) + 8px) 16px 8px;
  display: flex;
  justify-content: flex-end;
}
.scanner-fondo-oscuro {
  background: rgba(0, 0, 0, 0.65);
}
.scanner-fondo-oscuro--arriba {
  flex: 1;
}
.scanner-fondo-oscuro--lado {
  flex: 1;
}
.scanner-fondo-oscuro--abajo {
  flex: 1.5;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 24px;
}
.scanner-fila-central {
  display: flex;
  flex-direction: row;
  height: min(180px, 45vw);
}
.scanner-ventana {
  width: min(280px, 80vw);
  flex-shrink: 0;
  position: relative;
  background: transparent;
}
.scanner-instruccion {
  color: #ffffff;
  font-size: 14px;
  text-align: center;
  margin: 0;
  padding: 0 16px;
  opacity: 0.9;
}
.scanner-corner {
  position: absolute;
  width: 24px;
  height: 24px;
  border-color: #ffffff;
  border-style: solid;
}
.scanner-corner--tl {
  top: 0;
  left: 0;
  border-width: 3px 0 0 3px;
}
.scanner-corner--tr {
  top: 0;
  right: 0;
  border-width: 3px 3px 0 0;
}
.scanner-corner--bl {
  bottom: 0;
  left: 0;
  border-width: 0 0 3px 3px;
}
.scanner-corner--br {
  bottom: 0;
  right: 0;
  border-width: 0 3px 3px 0;
}
.scanner-linea {
  position: absolute;
  left: 4px;
  right: 4px;
  height: 2px;
  background: linear-gradient(to right, transparent, var(--color-secundario), transparent);
  animation: mover-linea 1.8s ease-in-out infinite;
}
@keyframes mover-linea {
  0%, 100% {
    top: 8%;
  }
  50% {
    top: 88%;
  }
}
.scanner-dialogo-web {
  min-width: 300px;
}
</style>
