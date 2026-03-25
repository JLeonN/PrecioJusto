<template>
  <!-- MODO NATIVO: overlay sobre la cámara -->
  <Teleport to="body">
    <div v-if="activo && esNativo" class="scanner-overlay">
      <div class="scanner-header">
        <div class="scanner-header-contenido">
          <div class="scanner-header-texto">
            <div class="scanner-header-eyebrow">Escáner</div>
            <div class="scanner-header-titulo">Alineá el código dentro del recuadro</div>
          </div>
          <q-btn round flat class="scanner-header-cerrar" @click="alCerrar">
            <IconX :size="28" color="white" />
          </q-btn>
        </div>
      </div>

      <!-- Área oscura superior -->
      <div class="scanner-fondo-oscuro scanner-fondo-oscuro--arriba" />

      <!-- Fila central: oscuro | ventana | oscuro -->
      <div class="scanner-fila-central">
        <div class="scanner-fondo-oscuro scanner-fondo-oscuro--lado" />
        <div class="scanner-ventana">
          <div class="scanner-ventana-resplandor" />
          <div class="scanner-ventana-etiqueta">Zona de lectura</div>
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
        <div class="scanner-panel-instruccion">
          <p class="scanner-instruccion">Apuntá el código de barras al recuadro</p>
          <p class="scanner-ayuda">
            Mantené el celular firme durante un segundo para una lectura más rápida.
          </p>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- MODO WEB: input manual (solo para desarrollo/testing) -->
  <q-dialog :model-value="activo && !esNativo" persistent @update:model-value="alCerrar">
    <q-card class="scanner-dialogo-web">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold">Ingresar código de barras</div>
        <div class="text-caption text-grey-6">
          El escáner de cámara solo funciona en la app móvil
        </div>
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
  activo: { type: Boolean, default: false },
  // En modo continuo la cámara nunca se detiene: debounce por código para evitar dobles detecciones.
  continuo: { type: Boolean, default: false },
})

// Set de códigos en cooldown (solo modo continuo).
const codigosEnCooldown = new Set()

const emit = defineEmits(['codigo-detectado', 'cerrar'])

const $q = useQuasar()
const esNativo = Capacitor.isNativePlatform()
const codigoManual = ref('')

// Formatos de código de barras a detectar (los más comunes en supermercados).
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

  // Hace el webview transparente para que la cámara nativa se vea detrás.
  document.body.classList.add('scanner-activo')

  await BarcodeScanner.addListener('barcodeScanned', (resultado) => {
    const codigo = resultado.barcode?.rawValue
    if (!codigo) return

    if (props.continuo) {
      // Modo continuo (Ráfaga): la cámara no para; debounce de 2s por código.
      if (codigosEnCooldown.has(codigo)) return
      codigosEnCooldown.add(codigo)
      setTimeout(() => codigosEnCooldown.delete(codigo), 2000)
      emit('codigo-detectado', codigo)
    } else {
      // Modo unitario: detiene la cámara tras el primer código.
      detenerScaneo()
      emit('codigo-detectado', codigo)
    }
  })

  await BarcodeScanner.startScan({ formats: FORMATOS_SOPORTADOS })
}

async function detenerScaneo() {
  if (!esNativo) return
  codigosEnCooldown.clear()
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
  background: transparent;
}
.scanner-header {
  padding: calc(var(--safe-area-top) + 10px) 16px 10px;
  background: linear-gradient(180deg, rgba(3, 11, 24, 0.82) 0%, rgba(3, 11, 24, 0.2) 100%);
}
.scanner-header-contenido {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.scanner-header-texto {
  color: white;
}
.scanner-header-eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.72;
}
.scanner-header-titulo {
  margin-top: 4px;
  font-size: 18px;
  line-height: 1.15;
  font-weight: 700;
  max-width: 230px;
}
.scanner-header-cerrar {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
}
.scanner-fondo-oscuro {
  background: rgba(4, 13, 27, 0.8);
  backdrop-filter: blur(3px);
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
  justify-content: flex-start;
  padding: 24px 18px 0;
}
.scanner-fila-central {
  display: flex;
  flex-direction: row;
  height: min(220px, 52vw);
}
.scanner-ventana {
  width: min(320px, 82vw);
  flex-shrink: 0;
  position: relative;
  background: transparent;
  border-radius: 24px;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 0 0 9999px rgba(0, 0, 0, 0);
}
.scanner-ventana-resplandor {
  position: absolute;
  inset: -8px;
  border-radius: 30px;
  border: 1px solid rgba(74, 180, 255, 0.28);
  box-shadow:
    0 0 24px rgba(56, 161, 255, 0.18),
    inset 0 0 20px rgba(56, 161, 255, 0.06);
}
.scanner-ventana-etiqueta {
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(7, 22, 42, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.92);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
}
.scanner-instruccion {
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  margin: 0;
  opacity: 0.96;
}
.scanner-panel-instruccion {
  width: min(100%, 360px);
  padding: 16px 18px;
  border-radius: 20px;
  background: rgba(9, 22, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}
.scanner-ayuda {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  line-height: 1.35;
  text-align: center;
}
.scanner-corner {
  position: absolute;
  width: 30px;
  height: 30px;
  border-color: #ffffff;
  border-style: solid;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.18));
}
.scanner-corner--tl {
  top: 0;
  left: 0;
  border-width: 4px 0 0 4px;
  border-top-left-radius: 20px;
}
.scanner-corner--tr {
  top: 0;
  right: 0;
  border-width: 4px 4px 0 0;
  border-top-right-radius: 20px;
}
.scanner-corner--bl {
  bottom: 0;
  left: 0;
  border-width: 0 0 4px 4px;
  border-bottom-left-radius: 20px;
}
.scanner-corner--br {
  bottom: 0;
  right: 0;
  border-width: 0 4px 4px 0;
  border-bottom-right-radius: 20px;
}
.scanner-linea {
  position: absolute;
  left: 16px;
  right: 16px;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(to right, transparent, #77d5ff, #ffffff, #77d5ff, transparent);
  box-shadow: 0 0 18px rgba(119, 213, 255, 0.45);
  animation: mover-linea 1.8s ease-in-out infinite;
}
@keyframes mover-linea {
  0%,
  100% {
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
