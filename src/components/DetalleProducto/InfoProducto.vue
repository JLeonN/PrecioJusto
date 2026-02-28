<template>
  <q-card class="info-producto">
    <q-card-section class="info-contenido">

      <!-- IMAGEN DEL PRODUCTO (editable) -->
      <div class="info-imagen">
        <q-img v-if="producto.imagen" :src="producto.imagen" :ratio="1" class="rounded-borders" />
        <div v-else class="placeholder-imagen">
          <IconShoppingBag :size="64" class="text-grey-5" />
        </div>
        <!-- Overlay botón restaurar desde API (solo si tiene código de barras) -->
        <div v-if="producto.codigoBarras" class="imagen-overlay-izquierda">
          <q-btn round color="white" text-color="grey-7" size="sm" class="btn-restaurar-api" :loading="restaurandoApi" @click="restaurarDesdeApi">
            <IconRefresh :size="16" />
            <q-tooltip>Restaurar datos desde la API</q-tooltip>
          </q-btn>
        </div>

        <!-- Overlay botón editar foto -->
        <div class="imagen-overlay">
          <q-btn round color="white" text-color="grey-7" size="sm" class="btn-editar-imagen">
            <IconCamera :size="16" />
            <q-tooltip>Editar foto</q-tooltip>
            <q-menu anchor="bottom right" self="top right">
              <q-list style="min-width: 160px">
                <q-item clickable v-close-popup @click="tomarFoto">
                  <q-item-section avatar>
                    <IconCamera :size="18" />
                  </q-item-section>
                  <q-item-section>Tomar foto</q-item-section>
                </q-item>
                <q-item v-if="producto.imagen" clickable v-close-popup @click="quitarFoto">
                  <q-item-section avatar>
                    <IconTrash :size="18" class="text-negative" />
                  </q-item-section>
                  <q-item-section class="text-negative">Quitar foto</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
        <!-- Input file oculto para fallback web -->
        <input
          ref="inputArchivoRef"
          type="file"
          accept="image/*"
          class="input-archivo-oculto"
          @change="alSeleccionarArchivo"
        />
      </div>

      <!-- INFORMACIÓN PRINCIPAL -->
      <div class="info-detalles">

        <!-- Nombre del producto (editable inline) -->
        <div class="nombre-row">
          <template v-if="!editandoNombre">
            <h5 class="q-my-none text-weight-bold nombre-texto">{{ producto.nombre }}</h5>
            <q-btn flat dense round size="sm" color="grey-6" class="q-ml-xs" @click="iniciarEdicionNombre">
              <IconPencil :size="16" />
              <q-tooltip>Editar nombre</q-tooltip>
            </q-btn>
          </template>
          <template v-else>
            <q-input
              v-model="nombreTemporal"
              dense
              outlined
              autofocus
              class="nombre-input"
              @keyup.enter="guardarNombre"
              @keyup.esc="cancelarEdicionNombre"
            />
            <q-btn
              flat dense round size="sm" color="positive"
              class="q-ml-xs"
              :disable="!nombreTemporal.trim() || nombreTemporal === producto.nombre"
              @click="guardarNombre"
            >
              <IconCheck :size="18" />
            </q-btn>
            <q-btn flat dense round size="sm" color="grey-6" @click="cancelarEdicionNombre">
              <IconX :size="18" />
            </q-btn>
          </template>
        </div>

        <!-- Marca (editable) -->
        <CampoEditable
          etiqueta="Marca"
          :valor="producto.marca || ''"
          :icono="IconBuildingStore"
          sin-valor-texto="Sin marca"
          class="q-mb-xs"
          @guardar="actualizarMarca"
        />

        <!-- Categoría (editable) -->
        <CampoEditable
          etiqueta="Categoría"
          :valor="producto.categoria || ''"
          :icono="IconTag"
          sin-valor-texto="Sin categoría"
          class="q-mb-xs"
          @guardar="actualizarCategoria"
        />

        <!-- Código de barras -->
        <div
          v-if="producto.codigoBarras"
          class="codigo-barras"
          @click.stop="copiarCodigoBarras(producto.codigoBarras)"
        >
          <IconBarcode :size="16" class="text-grey-6" />
          <span class="text-caption text-grey-6">{{ producto.codigoBarras }}</span>
          <q-tooltip>Click para copiar</q-tooltip>
        </div>

        <!-- Precio más bajo actual -->
        <div class="precio-principal q-mt-sm">
          <div class="text-h4 text-weight-bold text-primary">${{ producto.precioMejor }}</div>
          <div class="comercio-info row items-center q-gutter-xs no-wrap q-mt-xs">
            <IconMapPin :size="18" class="text-grey-6" />
            <span class="text-body2 text-grey-7">{{ producto.comercioMejor }}</span>
          </div>
        </div>

        <!-- Chip de tendencia general -->
        <q-chip :color="colorTendencia" text-color="white" :icon="iconoTendencia" class="q-mt-sm">
          <span class="text-weight-bold">
            {{ textoTendencia }}
          </span>
        </q-chip>

        <!-- Botón agregar precio -->
        <q-btn
          unelevated
          color="primary"
          label="Agregar precio"
          class="q-mt-md full-width"
          @click="$emit('agregar-precio')"
        >
          <IconPlus :size="20" class="q-mr-xs" />
        </q-btn>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'
import {
  IconShoppingBag,
  IconMapPin,
  IconPlus,
  IconBarcode,
  IconTag,
  IconBuildingStore,
  IconPencil,
  IconCheck,
  IconX,
  IconCamera,
  IconTrash,
  IconRefresh,
} from '@tabler/icons-vue'
import openFoodFactsService from '../../almacenamiento/servicios/OpenFoodFactsService.js'
import { useQuasar } from 'quasar'
import CampoEditable from '../EditarComercio/CampoEditable.vue'
import { useProductosStore } from '../../almacenamiento/stores/productosStore.js'

const $q = useQuasar()
const productosStore = useProductosStore()

const props = defineProps({
  producto: {
    type: Object,
    required: true,
  },
})

defineEmits(['agregar-precio'])

// ── Nombre editable ──────────────────────────────────────

const editandoNombre = ref(false)
const nombreTemporal = ref('')

function iniciarEdicionNombre() {
  nombreTemporal.value = props.producto.nombre
  editandoNombre.value = true
}

async function guardarNombre() {
  const nombre = nombreTemporal.value.trim()
  if (!nombre || nombre === props.producto.nombre) {
    cancelarEdicionNombre()
    return
  }
  try {
    await productosStore.actualizarProducto(props.producto.id, { nombre })
    $q.notify({ type: 'positive', message: 'Nombre actualizado', position: 'top', timeout: 1500 })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo guardar el nombre', position: 'top' })
  }
  editandoNombre.value = false
}

function cancelarEdicionNombre() {
  editandoNombre.value = false
  nombreTemporal.value = ''
}

// ── Restaurar desde API ──────────────────────────────────

const restaurandoApi = ref(false)

async function restaurarDesdeApi() {
  if (!props.producto.codigoBarras) return
  restaurandoApi.value = true
  try {
    const resultado = await openFoodFactsService.buscarPorCodigoBarras(props.producto.codigoBarras)
    if (!resultado) {
      $q.notify({ type: 'warning', message: 'No se encontró el producto en la API', position: 'top' })
      return
    }
    await productosStore.actualizarProducto(props.producto.id, {
      nombre: resultado.nombre || props.producto.nombre,
      marca: resultado.marca || props.producto.marca,
      categoria: resultado.categoria || props.producto.categoria,
      imagen: resultado.imagen || props.producto.imagen,
    })
    $q.notify({ type: 'positive', message: 'Datos restaurados desde la API', position: 'top', timeout: 2000 })
  } catch {
    $q.notify({ type: 'negative', message: 'Sin conexión. Intentá de nuevo más tarde.', position: 'top' })
  } finally {
    restaurandoApi.value = false
  }
}

// ── Foto editable ────────────────────────────────────────

const inputArchivoRef = ref(null)

async function tomarFoto() {
  try {
    if (Capacitor.isNativePlatform()) {
      const foto = await Camera.getPhoto({
        quality: 70,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      })
      await actualizarFoto(`data:image/jpeg;base64,${foto.base64String}`)
    } else {
      // Fallback web: selector de archivo
      inputArchivoRef.value?.click()
    }
  } catch (error) {
    if (!error.message?.toLowerCase().includes('cancel')) {
      $q.notify({ type: 'negative', message: 'No se pudo tomar la foto', position: 'top' })
    }
  }
}

async function alSeleccionarArchivo(event) {
  const archivo = event.target.files?.[0]
  if (!archivo) return
  const reader = new FileReader()
  reader.onload = async (e) => {
    await actualizarFoto(e.target.result)
  }
  reader.readAsDataURL(archivo)
  event.target.value = ''
}

async function actualizarFoto(base64) {
  try {
    await productosStore.actualizarProducto(props.producto.id, { imagen: base64 })
    $q.notify({ type: 'positive', message: 'Foto actualizada', position: 'top', timeout: 1500 })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo guardar la foto', position: 'top' })
  }
}

async function quitarFoto() {
  try {
    await productosStore.actualizarProducto(props.producto.id, { imagen: null })
    $q.notify({ type: 'positive', message: 'Foto eliminada', position: 'top', timeout: 1500 })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo quitar la foto', position: 'top' })
  }
}

// ── Marca editable ───────────────────────────────────────

async function actualizarMarca(nuevaMarca) {
  try {
    await productosStore.actualizarProducto(props.producto.id, { marca: nuevaMarca })
    $q.notify({ type: 'positive', message: 'Marca actualizada', position: 'top', timeout: 1500 })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo guardar la marca', position: 'top' })
  }
}

// ── Categoría editable (ya existía) ─────────────────────

async function actualizarCategoria(nuevaCategoria) {
  try {
    await productosStore.actualizarProducto(props.producto.id, { categoria: nuevaCategoria })
    $q.notify({ type: 'positive', message: 'Categoría actualizada', position: 'top', timeout: 1500 })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo guardar la categoría', position: 'top' })
  }
}

// ── Tendencia ────────────────────────────────────────────

const colorTendencia = computed(() => {
  if (props.producto.tendenciaGeneral === 'bajando') return 'positive'
  if (props.producto.tendenciaGeneral === 'subiendo') return 'negative'
  return 'grey-6'
})

const iconoTendencia = computed(() => {
  if (props.producto.tendenciaGeneral === 'bajando') return 'arrow_downward'
  if (props.producto.tendenciaGeneral === 'subiendo') return 'arrow_upward'
  return 'remove'
})

const textoTendencia = computed(() => {
  const porcentaje = Math.abs(props.producto.porcentajeTendencia)
  if (props.producto.tendenciaGeneral === 'bajando') return `Bajando ${porcentaje}% (últimos 30 días)`
  if (props.producto.tendenciaGeneral === 'subiendo') return `Subiendo ${porcentaje}% (últimos 30 días)`
  return 'Precio estable (últimos 30 días)'
})

// ── Copiar código de barras ──────────────────────────────

const copiarCodigoBarras = async (codigo) => {
  try {
    await navigator.clipboard.writeText(codigo)
    $q.notify({
      type: 'positive',
      message: 'Código copiado',
      caption: codigo,
      position: 'top',
      timeout: 1500,
      icon: 'content_copy',
    })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo copiar el código', position: 'top', timeout: 1500 })
  }
}
</script>

<style scoped>
.info-producto {
  border-left: 4px solid var(--color-primario);
}
.info-contenido {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 24px;
  align-items: start;
}
@media (max-width: 599px) {
  .info-contenido {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .info-imagen {
    max-width: 180px;
    width: 45vw;
    height: auto;
    aspect-ratio: 1/1;
    margin: 0 auto;
  }
}
.info-imagen {
  width: 100%;
  height: 180px;
  position: relative;
}
.placeholder-imagen {
  width: 100%;
  height: 100%;
  background-color: var(--color-primario-claro);
  border-radius: var(--borde-radio);
  display: flex;
  align-items: center;
  justify-content: center;
}
.imagen-overlay {
  position: absolute;
  bottom: 8px;
  right: 8px;
}
.imagen-overlay-izquierda {
  position: absolute;
  bottom: 8px;
  left: 8px;
}
.btn-editar-imagen {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
}
.input-archivo-oculto {
  display: none;
}
.info-detalles {
  display: flex;
  flex-direction: column;
}
.nombre-row {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 40px;
}
.nombre-texto {
  flex: 1;
  font-size: clamp(16px, 4vw, 22px);
  line-height: 1.3;
}
.nombre-input {
  flex: 1;
}
.precio-principal {
  display: flex;
  flex-direction: column;
}
.comercio-info {
  overflow: hidden;
}
.comercio-info span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.codigo-barras {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  margin-bottom: 4px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  transition: background-color 0.2s;
  width: fit-content;
}
.codigo-barras:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
.codigo-barras:active {
  background-color: rgba(0, 0, 0, 0.1);
}
.codigo-barras span {
  font-size: 12px;
  line-height: 1;
  letter-spacing: 0.5px;
  font-family: 'Courier New', monospace;
}
</style>
