<template>
  <!-- Overlay de escaneo (nativo + preview web) -->
  <Teleport to="body">
    <div v-if="activo" class="scanner-overlay">
      <div class="scanner-header">
        <div class="scanner-header-contenido">
          <div class="scanner-header-texto">
            <div class="scanner-header-eyebrow">Escáner</div>
            <div class="scanner-header-titulo">Alineá el código dentro del recuadro</div>
          </div>
          <q-btn round flat class="scanner-header-cerrar" @click="alCerrar">
            <IconX :size="28" color="var(--color-primario-oscuro)" />
          </q-btn>
        </div>
      </div>

      <div class="scanner-fondo-oscuro scanner-fondo-oscuro--arriba" />

      <div class="scanner-fila-central">
        <div class="scanner-fondo-oscuro scanner-fondo-oscuro--lado" />
        <div class="scanner-ventana">
          <div class="scanner-ventana-etiqueta">Zona de lectura</div>
          <span class="scanner-corner scanner-corner--tl" />
          <span class="scanner-corner scanner-corner--tr" />
          <span class="scanner-corner scanner-corner--bl" />
          <span class="scanner-corner scanner-corner--br" />
          <div class="scanner-linea" />
        </div>
        <div class="scanner-fondo-oscuro scanner-fondo-oscuro--lado" />
      </div>

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
</template>

<script setup>
import { onUnmounted, watch } from 'vue'
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

const emit = defineEmits(['codigo-detectado', 'cerrar', 'no-disponible'])

const $q = useQuasar()
const esNativo = Capacitor.isNativePlatform()

// Formatos de código de barras a detectar (los más comunes en supermercados).
const FORMATOS_SOPORTADOS = [
  BarcodeFormat.Ean13,
  BarcodeFormat.Ean8,
  BarcodeFormat.UpcA,
  BarcodeFormat.UpcE,
  BarcodeFormat.Code128,
]

async function iniciarScaneo() {
  if (!esNativo) {
    emit('no-disponible')
    return
  }

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
  if (esNativo) {
    codigosEnCooldown.clear()
    document.body.classList.remove('scanner-activo')
    await BarcodeScanner.removeAllListeners()
    try {
      await BarcodeScanner.stopScan()
    } catch {
      // Ignorar error si el scan ya estaba detenido
    }
    return
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
  emit('cerrar')
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
.scanner-header,
.scanner-fondo-oscuro,
.scanner-fila-central {
  position: relative;
  z-index: 1;
}
.scanner-header {
  padding: calc(var(--safe-area-top) + 10px) 16px 10px;
  background: linear-gradient(
    180deg,
    var(--scanner-overlay-fondo-inicio) 0%,
    rgba(241, 248, 255, 0.24) 100%
  );
}
.scanner-header-contenido {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.scanner-header-texto {
  color: var(--scanner-texto-principal);
}
.scanner-header-eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--scanner-texto-eyebrow);
}
.scanner-header-titulo {
  margin-top: 4px;
  font-size: 18px;
  line-height: 1.15;
  font-weight: 700;
  max-width: 230px;
}
.scanner-header-cerrar {
  background: var(--scanner-cerrar-bg);
  border: 1px solid var(--scanner-cerrar-borde);
  box-shadow: 0 6px 14px rgba(25, 118, 210, 0.14);
}
.scanner-fondo-oscuro {
  background: var(--scanner-overlay-fondo-base);
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
  border-radius: 20px;
  overflow: visible;
  box-shadow: none;
}
.scanner-ventana::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 20px;
  border: 1.5px solid rgba(255, 255, 255, 0.45);
  box-shadow:
    0 0 0 1px rgba(33, 150, 243, 0.18),
    0 0 16px rgba(33, 150, 243, 0.2);
  pointer-events: none;
}
.scanner-ventana-etiqueta {
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--scanner-panel-bg);
  border: 1px solid var(--scanner-panel-borde);
  color: var(--scanner-texto-eyebrow);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
}
.scanner-instruccion {
  color: var(--scanner-texto-principal);
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  margin: 0;
}
.scanner-panel-instruccion {
  width: min(100%, 360px);
  padding: 16px 18px;
  border-radius: 20px;
  background: var(--scanner-panel-bg);
  border: 1px solid var(--scanner-panel-borde);
  box-shadow: var(--scanner-panel-sombra);
}
.scanner-ayuda {
  margin: 8px 0 0;
  color: var(--scanner-texto-secundario);
  font-size: 13px;
  line-height: 1.35;
  text-align: center;
}
.scanner-corner {
  position: absolute;
  width: 32px;
  height: 32px;
  border-color: #ffffff;
  border-style: solid;
  border-width: 4px;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.18));
  pointer-events: none;
  z-index: 2;
}
.scanner-corner--tl {
  top: 2px;
  left: 2px;
  border-right: 0;
  border-bottom: 0;
  border-top-left-radius: 16px;
}
.scanner-corner--tr {
  top: 2px;
  right: 2px;
  border-left: 0;
  border-bottom: 0;
  border-top-right-radius: 16px;
}
.scanner-corner--bl {
  bottom: 2px;
  left: 2px;
  border-top: 0;
  border-right: 0;
  border-bottom-left-radius: 16px;
}
.scanner-corner--br {
  bottom: 2px;
  right: 2px;
  border-top: 0;
  border-left: 0;
  border-bottom-right-radius: 16px;
}
.scanner-linea {
  position: absolute;
  left: 16px;
  right: 16px;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(to right, transparent, #64b5f6, #ffffff, #64b5f6, transparent);
  box-shadow: 0 0 18px rgba(33, 150, 243, 0.4);
  animation: mover-linea 1.8s ease-in-out infinite;
  z-index: 1;
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
</style>
