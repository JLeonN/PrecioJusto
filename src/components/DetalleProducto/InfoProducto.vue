<template>
  <q-card class="info-producto">
    <q-card-section class="info-contenido q-pb-lg">

      <!-- IMAGEN DEL PRODUCTO (editable) -->
      <div class="info-imagen">
        <q-img
          v-if="producto.imagen"
          :src="producto.imagen"
          :ratio="1"
          class="rounded-borders imagen-clickeable"
          @click="verFoto = true"
        >
          <q-tooltip>Ver foto</q-tooltip>
        </q-img>
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
                <q-item v-if="esNativo" clickable v-close-popup @click="seleccionarCamara">
                  <q-item-section avatar>
                    <IconCamera :size="18" />
                  </q-item-section>
                  <q-item-section>Tomar foto</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="abrirGaleria">
                  <q-item-section avatar>
                    <IconPhoto :size="18" />
                  </q-item-section>
                  <q-item-section>Desde galería</q-item-section>
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

        <!-- Cantidad / Unidad (editable inline) -->
        <div class="cantidad-row q-mb-xs">
          <template v-if="!editandoCantidad">
            <div class="cantidad-icono">
              <IconRuler2 :size="20" class="text-orange" />
            </div>
            <div class="cantidad-contenido">
              <div class="cantidad-etiqueta">Cantidad</div>
              <div class="cantidad-valor">{{ textoTamanio }}</div>
            </div>
            <q-btn flat dense round size="sm" color="grey-6" @click="iniciarEdicionCantidad">
              <IconPencil :size="16" />
              <q-tooltip>Editar cantidad</q-tooltip>
            </q-btn>
          </template>
          <template v-else>
            <div class="cantidad-icono">
              <IconRuler2 :size="20" class="text-orange" />
            </div>
            <div class="cantidad-edicion-inputs">
              <div class="cantidad-etiqueta">Cantidad</div>
              <div class="row q-gutter-xs no-wrap">
                <q-input
                  v-model.number="cantidadTemporal"
                  type="number"
                  dense
                  outlined
                  autofocus
                  :min="0.01"
                  :step="stepCantidad"
                  class="cantidad-input"
                  @keyup.enter="guardarCantidadUnidad"
                  @keyup.esc="cancelarEdicionCantidad"
                />
                <q-select
                  v-model="unidadTemporal"
                  dense
                  outlined
                  emit-value
                  map-options
                  :options="OPCIONES_UNIDADES"
                  class="unidad-select"
                />
              </div>
            </div>
            <div class="cantidad-acciones">
              <q-btn flat dense round size="sm" color="positive" @click="guardarCantidadUnidad">
                <IconCheck :size="18" />
              </q-btn>
              <q-btn flat dense round size="sm" color="grey-6" @click="cancelarEdicionCantidad">
                <IconX :size="18" />
              </q-btn>
            </div>
          </template>
        </div>

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
          <div class="text-h4 text-weight-bold text-primary">{{ formatearPrecioDisplay(producto.precioMejor) }}</div>
          <div class="comercio-info row items-center q-gutter-xs no-wrap q-mt-xs">
            <IconMapPin :size="18" class="text-grey-6" />
            <span class="text-body2 text-grey-7">{{ producto.comercioMejor }}</span>
          </div>
        </div>

        <!-- Chip de tendencia general -->
        <q-chip :color="colorTendencia" text-color="white" class="q-mt-sm">
          <IconTrendingDown v-if="tendenciaProducto.tipo === 'bajando'" :size="15" class="q-mr-xs" />
          <IconTrendingUp v-else-if="tendenciaProducto.tipo === 'subiendo'" :size="15" class="q-mr-xs" />
          <IconMinus v-else :size="15" class="q-mr-xs" />
          <span class="text-weight-bold">{{ textoTendencia }}</span>
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

  <!-- Visor de imagen en grande -->
  <DialogoVerImagen
    v-model="verFoto"
    :src="producto.imagen || ''"
    :titulo="producto.nombre"
    :editable="!!producto.imagen"
    @guardar="alGuardarFotoEditada"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCamaraFoto } from '../../composables/useCamaraFoto.js'
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
  IconPhoto,
  IconTrash,
  IconRefresh,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconRuler2,
} from '@tabler/icons-vue'
import buscadorProductosService from '../../almacenamiento/servicios/BuscadorProductosService.js'
import { useQuasar } from 'quasar'
import CampoEditable from '../EditarComercio/CampoEditable.vue'
import DialogoVerImagen from '../Compartidos/DialogoVerImagen.vue'
import { useProductosStore } from '../../almacenamiento/stores/productosStore.js'
import { formatearPrecioDisplay } from '../../utils/PrecioUtils.js'

const $q = useQuasar()
const productosStore = useProductosStore()

const props = defineProps({
  producto: {
    type: Object,
    required: true,
  },
})

defineEmits(['agregar-precio'])

// ── Visor de imagen ──────────────────────────────────────
const verFoto = ref(false)

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
    const resultadoApi = await buscadorProductosService.buscarPorCodigo(props.producto.codigoBarras)
    if (!resultadoApi) {
      $q.notify({ type: 'warning', message: 'No se encontró el producto en la API', position: 'top' })
      return
    }
    const resultado = resultadoApi.producto
    // Si la API devuelve imagen → fuente = 'api'; si no → conservar la fuente existente
    const nuevaFotoFuente = resultado.imagen ? 'api' : (props.producto.fotoFuente ?? null)
    await productosStore.actualizarProducto(props.producto.id, {
      nombre: resultado.nombre || props.producto.nombre,
      marca: resultado.marca || props.producto.marca,
      categoria: resultado.categoria || props.producto.categoria,
      imagen: resultado.imagen || props.producto.imagen,
      fuenteDato: resultadoApi.fuenteDato,
      fotoFuente: nuevaFotoFuente,
    })
    $q.notify({ type: 'positive', message: 'Datos restaurados desde la API', position: 'top', timeout: 2000 })
  } catch {
    $q.notify({ type: 'negative', message: 'Sin conexión. Intentá de nuevo más tarde.', position: 'top' })
  } finally {
    restaurandoApi.value = false
  }
}

// ── Foto editable ────────────────────────────────────────

const { inputArchivoRef, esNativo, abrirCamara, abrirGaleria, leerArchivo } = useCamaraFoto()

async function seleccionarCamara() {
  const resultado = await abrirCamara()
  if (resultado) await actualizarFoto(resultado)
}

async function alSeleccionarArchivo(event) {
  const resultado = await leerArchivo(event)
  if (resultado) await actualizarFoto(resultado)
}

async function actualizarFoto(base64) {
  try {
    // Foto tomada o elegida por el usuario → fotoFuente = 'usuario'
    await productosStore.actualizarProducto(props.producto.id, { imagen: base64, fotoFuente: 'usuario' })
    $q.notify({ type: 'positive', message: 'Foto actualizada', position: 'top', timeout: 1500 })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo guardar la foto', position: 'top' })
  }
}

async function alGuardarFotoEditada(nuevaImagenBase64) {
  await actualizarFoto(nuevaImagenBase64)
}

async function quitarFoto() {
  try {
    await productosStore.actualizarProducto(props.producto.id, { imagen: null, fotoFuente: null })
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

const tendenciaProducto = computed(() => {
  if (!props.producto.precios || props.producto.precios.length === 0)
    return { tipo: 'estable', porcentaje: '0.0' }

  const grupos = new Map()
  props.producto.precios.forEach((precio) => {
    const clave =
      precio.comercioId && precio.direccionId
        ? `${precio.comercioId}_${precio.direccionId}`
        : precio.nombreCompleto || precio.comercio || 'Sin comercio'
    if (!grupos.has(clave)) grupos.set(clave, [])
    grupos.get(clave).push(precio)
  })

  const variaciones = []
  grupos.forEach((precios) => {
    if (precios.length < 2) return
    const ordenados = [...precios].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    variaciones.push(((ordenados[0].valor - ordenados[1].valor) / ordenados[1].valor) * 100)
  })

  if (variaciones.length === 0) return { tipo: 'estable', porcentaje: '0.0' }

  const promedio = variaciones.reduce((sum, v) => sum + v, 0) / variaciones.length
  const porcentaje = Math.abs(promedio).toFixed(1)

  if (promedio < -2) return { porcentaje, tipo: 'bajando' }
  if (promedio > 2) return { porcentaje, tipo: 'subiendo' }
  return { porcentaje, tipo: 'estable' }
})

const colorTendencia = computed(() => {
  if (tendenciaProducto.value.tipo === 'bajando') return 'positive'
  if (tendenciaProducto.value.tipo === 'subiendo') return 'negative'
  return 'grey-6'
})

const textoTendencia = computed(() => {
  if (tendenciaProducto.value.tipo === 'bajando') return `Bajando ${tendenciaProducto.value.porcentaje}% vs visita anterior`
  if (tendenciaProducto.value.tipo === 'subiendo') return `Subiendo ${tendenciaProducto.value.porcentaje}% vs visita anterior`
  return 'Precio estable vs visita anterior'
})

// ── Cantidad / Unidad editable ───────────────────────────

const OPCIONES_UNIDADES = [
  { label: 'Unidad', value: 'unidad' },
  { label: 'Litro (L)', value: 'litro' },
  { label: 'Mililitro (ml)', value: 'mililitro' },
  { label: 'Kilo (kg)', value: 'kilo' },
  { label: 'Gramo (g)', value: 'gramo' },
  { label: 'Metro (m)', value: 'metro' },
  { label: 'Pack', value: 'pack' },
]

const ABREVIATURAS_UNIDAD = {
  unidad: 'u.',
  litro: 'L',
  mililitro: 'ml',
  kilo: 'kg',
  gramo: 'g',
  metro: 'm',
  pack: 'pack',
}

const editandoCantidad = ref(false)
const cantidadTemporal = ref(1)
const unidadTemporal = ref('unidad')

const textoTamanio = computed(() => {
  const cantidad = props.producto.cantidad ?? 1
  const unidad = props.producto.unidad ?? 'unidad'
  const abrev = ABREVIATURAS_UNIDAD[unidad] || unidad
  return `${cantidad} ${abrev}`
})

const stepCantidad = computed(() => {
  const unidadesEnteras = ['unidad', 'pack', 'metro']
  return unidadesEnteras.includes(unidadTemporal.value) ? 1 : 0.01
})

function iniciarEdicionCantidad() {
  cantidadTemporal.value = props.producto.cantidad ?? 1
  unidadTemporal.value = props.producto.unidad ?? 'unidad'
  editandoCantidad.value = true
}

async function guardarCantidadUnidad() {
  try {
    await productosStore.actualizarProducto(props.producto.id, {
      cantidad: cantidadTemporal.value,
      unidad: unidadTemporal.value,
    })
    $q.notify({ type: 'positive', message: 'Tamaño actualizado', position: 'top', timeout: 1500 })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo guardar', position: 'top' })
  }
  editandoCantidad.value = false
}

function cancelarEdicionCantidad() {
  editandoCantidad.value = false
}

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
.imagen-clickeable {
  cursor: zoom-in;
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
.fuente-dato-texto {
  font-size: 11px;
  color: #9e9e9e;
  margin: 8px 0 0 0;
  text-align: center;
}
.cantidad-row {
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--color-carta-borde, #e0e0e0);
  padding: 12px 0;
}
.cantidad-icono {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-acento-claro, #fff3e0);
  border-radius: 50%;
}
.cantidad-contenido {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.cantidad-etiqueta {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--texto-secundario, #666);
}
.cantidad-valor {
  font-size: 15px;
  color: var(--texto-primario, #333);
  line-height: 1.4;
}
.cantidad-edicion-inputs {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cantidad-input {
  width: 90px;
}
.unidad-select {
  flex: 1;
}
.cantidad-acciones {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  padding-top: 16px;
}
</style>
