<template>
  <q-dialog v-model="abierto" position="bottom" @show="alAbrir" @hide="alCerrar">
    <q-card class="tarjeta-escaneo-card" :style="estiloTarjeta">
      <!-- FOTO + NOMBRE (con gradiente) -->
      <div class="tarjeta-escaneo-portada">
        <img
          v-if="datosForm.imagen"
          :src="datosForm.imagen"
          class="tarjeta-escaneo-portada__imagen"
        />
        <div v-else class="tarjeta-escaneo-portada__placeholder">
          <div v-if="mostrarAvisoSinCoincidencia" class="tarjeta-escaneo-portada__aviso">
            <div class="tarjeta-escaneo-portada__aviso-titulo">
              No lo encontramos en nuestras bases.
            </div>
            <div class="tarjeta-escaneo-portada__aviso-texto">
              Revisá que el código se haya escaneado bien.
            </div>
            <div class="tarjeta-escaneo-portada__aviso-texto">
              Podés editarlo acá, en la Mesa o desde el historial del artículo.
            </div>
          </div>
          <IconShoppingBag v-else :size="56" class="text-grey-4" />
        </div>
        <div class="tarjeta-escaneo-portada__gradiente">
          <div class="tarjeta-escaneo-portada__nombre ellipsis-2-lines">
            {{ datosForm.nombre || 'Sin nombre' }}
          </div>
        </div>
        <!-- Botones overlay: recuperar foto + cámara -->
        <div class="portada-botones-foto">
          <q-btn
            v-if="fotoModificada"
            round
            dense
            size="md"
            class="boton-foto-overlay"
            @click.stop="datosForm.imagen = datosOriginales.imagen"
          >
            <IconRefresh :size="35" />
            <q-tooltip>Recuperar foto original</q-tooltip>
          </q-btn>
          <q-btn round dense size="md" class="boton-foto-overlay">
            <IconCamera :size="35" />
            <q-tooltip>Foto del producto</q-tooltip>
            <q-menu anchor="top right" self="bottom right">
              <q-list style="min-width: 140px">
                <q-item v-if="esNativo" clickable v-close-popup @click="tomarFotoCamara">
                  <q-item-section avatar><IconCamera :size="16" /></q-item-section>
                  <q-item-section>Tomar foto</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="abrirGaleria">
                  <q-item-section avatar><IconPhoto :size="16" /></q-item-section>
                  <q-item-section>Galería</q-item-section>
                </q-item>
                <q-item
                  v-if="datosForm.imagen"
                  clickable
                  v-close-popup
                  @click="datosForm.imagen = null"
                >
                  <q-item-section avatar
                    ><IconTrash :size="16" class="text-negative"
                  /></q-item-section>
                  <q-item-section class="text-negative">Quitar foto</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </div>

      <!-- INFO DEL PRODUCTO -->
      <q-card-section class="tarjeta-escaneo-info">
        <!-- Modo visualización -->
        <template v-if="!editando">
          <div class="tarjeta-escaneo-fila">
            <div class="tarjeta-escaneo-detalle">
              <!-- Código de barras (clickeable para copiar) -->
              <div v-if="item?.codigoBarras" class="codigo-barras-fila" @click="copiarCodigo">
                <IconBarcode :size="14" class="text-grey-6" />
                <span class="codigo-barras-texto">{{ item.codigoBarras }}</span>
              </div>
              <span v-if="datosForm.marca" class="text-caption text-grey-7">
                {{ datosForm.marca }}
              </span>
              <span v-if="datosForm.cantidad" class="text-caption text-grey-7">
                {{ datosForm.cantidad }} {{ datosForm.unidad }}
              </span>
            </div>
            <q-btn flat round dense size="sm" color="grey-6" @click="editando = true">
              <IconPencil :size="18" />
              <q-tooltip>Editar datos</q-tooltip>
            </q-btn>
          </div>
        </template>

        <!-- Modo edición inline -->
        <template v-else>
          <q-input v-model="datosForm.nombre" label="Nombre *" outlined dense class="q-mb-sm" />
          <q-input
            v-model="datosForm.marca"
            label="Marca"
            outlined
            dense
            hint="Opcional"
            class="q-mb-sm"
          />
          <div class="row q-col-gutter-sm q-mb-sm">
            <div class="col-6">
              <q-input
                v-model.number="datosForm.cantidad"
                label="Cantidad"
                outlined
                dense
                type="number"
                min="0"
              />
            </div>
            <div class="col-6">
              <q-select
                v-model="datosForm.unidad"
                label="Unidad"
                outlined
                dense
                :options="OPCIONES_UNIDADES"
                emit-value
                map-options
              />
            </div>
          </div>
          <div class="row items-center justify-between q-mt-xs">
            <q-btn flat no-caps dense color="primary" label="Listo" @click="editando = false" />
            <!-- Recuperar datos originales de la API/BD -->
            <q-btn
              v-if="datosModificados"
              flat
              no-caps
              dense
              size="sm"
              color="grey-7"
              @click="recuperarDatos"
            >
              <IconArrowBackUp :size="16" class="q-mr-xs" />
              Recuperar datos
            </q-btn>
          </div>
        </template>
      </q-card-section>

      <q-separator />

      <!-- PRECIO + MONEDA -->
      <q-card-section class="tarjeta-escaneo-precio">
        <div class="row q-col-gutter-sm items-center">
          <div class="col-8">
            <q-input
              ref="inputPrecioRef"
              :model-value="precioTexto"
              label="Precio *"
              outlined
              dense
              type="text"
              inputmode="decimal"
              placeholder="0.00"
              :error="mostrarErrorPrecio"
              no-error-icon
              hide-bottom-space
              @update:model-value="alCambiarPrecio"
              @blur="alSalirPrecio"
              @keydown="soloNumerosDecimales"
            >
              <template v-if="mostrarErrorPrecio" #append>
                <span class="text-negative text-caption">Obligatorio</span>
              </template>
            </q-input>
          </div>
          <div class="col-4">
            <q-select
              :model-value="datosForm.moneda"
              outlined
              dense
              :options="MONEDAS"
              emit-value
              map-options
              hide-bottom-space
              @update:model-value="alCambiarMoneda"
            />
          </div>
        </div>
        <input
          ref="inputArchivoRef"
          type="file"
          accept="image/*"
          class="input-archivo-oculto"
          @change="alSeleccionarArchivo"
        />
      </q-card-section>

      <!-- BOTONES DE ACCIÓN -->
      <q-card-section class="tarjeta-escaneo-footer">
        <div class="row items-center no-wrap q-gutter-xs">
          <q-btn flat no-caps color="grey-7" @click="emitDescartar"> Descartar </q-btn>
          <q-space />
          <q-btn outline no-caps color="primary" :disable="!formularioValido" @click="emitIrAMesa">
            <IconClipboardList :size="16" class="q-mr-xs" />
            Ir a mesa
          </q-btn>
          <q-btn
            unelevated
            no-caps
            color="primary"
            :disable="!formularioValido"
            @click="emitSiguiente"
          >
            Siguiente
            <IconArrowRight :size="16" class="q-ml-xs" />
          </q-btn>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useQuasar, copyToClipboard } from 'quasar'
import { useTecladoVirtual } from '../../composables/useTecladoVirtual.js'
import { MONEDAS } from '../../almacenamiento/constantes/Monedas.js'
import { usePreferenciasStore } from '../../almacenamiento/stores/preferenciasStore.js'
import { useCamaraFoto } from '../../composables/useCamaraFoto.js'
import { filtrarInputPrecio, formatearPrecioAlSalir, soloNumerosDecimales } from '../../utils/PrecioUtils.js'
import {
  IconShoppingBag,
  IconBarcode,
  IconPencil,
  IconCamera,
  IconPhoto,
  IconTrash,
  IconRefresh,
  IconArrowBackUp,
  IconArrowRight,
  IconClipboardList,
} from '@tabler/icons-vue'

const OPCIONES_UNIDADES = [
  { label: 'Unidad', value: 'unidad' },
  { label: 'Litro', value: 'litro' },
  { label: 'Mililitro', value: 'mililitro' },
  { label: 'Kilo', value: 'kilo' },
  { label: 'Gramo', value: 'gramo' },
  { label: 'Metro', value: 'metro' },
  { label: 'Pack', value: 'pack' },
]

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  item: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'siguiente', 'ir-a-mesa', 'descartar'])

const { estiloTarjeta } = useTecladoVirtual()

const $q = useQuasar()
const inputPrecioRef = ref(null)
const editando = ref(false)
// String para preservar ceros finales (ej: "3.30"); datosForm.precio guarda el número
const precioTexto = ref('')

const { inputArchivoRef, esNativo, abrirCamara, abrirGaleria, leerArchivo } = useCamaraFoto()
const preferenciasStore = usePreferenciasStore()

const datosForm = ref({
  nombre: '',
  marca: null,
  cantidad: 1,
  unidad: 'unidad',
  imagen: null,
  precio: null,
  moneda: preferenciasStore.moneda,
})

const abierto = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// Solo el precio es obligatorio para poder continuar
const formularioValido = computed(() => datosForm.value.precio > 0)
const precioTocado = ref(false)
const mostrarErrorPrecio = computed(() => precioTocado.value && !formularioValido.value)
const mostrarAvisoSinCoincidencia = computed(
  () => props.item?.sinCoincidencia === true && !datosForm.value.imagen,
)

// Snapshot original: el item llega ANTES de pasar por el store, se deriva de sus flags
const datosOriginales = computed(() => {
  if (!props.item) return null
  if (props.item.origenApi || props.item.productoExistenteId) {
    return {
      nombre: props.item.nombre || '',
      marca: props.item.marca || null,
      cantidad: props.item.cantidad || 1,
      unidad: props.item.unidad || 'unidad',
      imagen: props.item.imagen || null,
    }
  }
  return null
})

// Detección de cambios respecto a los datos originales
const fotoModificada = computed(
  () => datosOriginales.value && datosForm.value.imagen !== datosOriginales.value.imagen,
)
const datosModificados = computed(
  () =>
    datosOriginales.value &&
    (datosForm.value.nombre !== datosOriginales.value.nombre ||
      datosForm.value.marca !== datosOriginales.value.marca ||
      datosForm.value.cantidad !== datosOriginales.value.cantidad ||
      datosForm.value.unidad !== datosOriginales.value.unidad),
)

// Sincroniza el form cuando llega un nuevo item escaneado
watch(
  () => props.item,
  (nuevoItem) => {
    if (!nuevoItem) return
    datosForm.value = {
      nombre: nuevoItem.nombre || '',
      marca: nuevoItem.marca || null,
      cantidad: nuevoItem.cantidad || 1,
      unidad: nuevoItem.unidad || 'unidad',
      imagen: nuevoItem.imagen || null,
      precio: nuevoItem.precio || null,
      moneda: nuevoItem.moneda || preferenciasStore.moneda,
    }
    precioTexto.value = formatearPrecioAlSalir(nuevoItem.precio ? String(nuevoItem.precio) : '')
    editando.value = false
  },
  { immediate: true },
)

function alAbrir() {
  nextTick(() => inputPrecioRef.value?.focus())
}

function alCerrar() {
  datosForm.value = {
    nombre: '',
    marca: null,
    cantidad: 1,
    unidad: 'unidad',
    imagen: null,
    precio: null,
    moneda: preferenciasStore.moneda,
  }
  precioTexto.value = ''
  editando.value = false
}

function alCambiarMoneda(val) {
  datosForm.value.moneda = val
  preferenciasStore.guardarMoneda(val)
}

function alCambiarPrecio(val) {
  precioTexto.value = filtrarInputPrecio(val)
  datosForm.value.precio = parseFloat(precioTexto.value) || null
}

// Combina formateo y marca de campo tocado al salir
function alSalirPrecio() {
  precioTexto.value = formatearPrecioAlSalir(precioTexto.value)
  precioTocado.value = true
}

// Copiar código de barras al portapapeles
function copiarCodigo() {
  if (!props.item?.codigoBarras) return
  copyToClipboard(props.item.codigoBarras).then(() => {
    $q.notify({ type: 'positive', message: 'Código copiado', timeout: 1500 })
  })
}

// Recupera nombre, marca, cantidad y unidad originales de la API/BD (NO toca imagen ni precio)
function recuperarDatos() {
  if (!datosOriginales.value) return
  const { nombre, marca, cantidad, unidad } = datosOriginales.value
  datosForm.value = { ...datosForm.value, nombre, marca, cantidad, unidad }
}

// Foto
async function tomarFotoCamara() {
  const resultado = await abrirCamara()
  if (resultado) datosForm.value.imagen = resultado
}
async function alSeleccionarArchivo(event) {
  const resultado = await leerArchivo(event)
  if (resultado) datosForm.value.imagen = resultado
}

// Construye el item actualizado con los datos del form
function _itemActualizado() {
  return {
    ...props.item,
    nombre: datosForm.value.nombre.trim() || props.item?.nombre || '',
    marca: datosForm.value.marca,
    cantidad: datosForm.value.cantidad,
    unidad: datosForm.value.unidad,
    imagen: datosForm.value.imagen,
    precio: datosForm.value.precio,
    moneda: datosForm.value.moneda,
    comercio: null,
  }
}

function emitSiguiente() {
  if (!formularioValido.value) return
  emit('siguiente', _itemActualizado())
}

function emitIrAMesa() {
  if (!formularioValido.value) return
  emit('ir-a-mesa', _itemActualizado())
}

function emitDescartar() {
  emit('descartar')
}
</script>

<style scoped>
.tarjeta-escaneo-card {
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-width: 100vw;
  padding-bottom: var(--safe-area-bottom);
}
@media (min-width: 768px) {
  .tarjeta-escaneo-card {
    max-width: 480px;
    margin: 0 auto;
  }
}
.tarjeta-escaneo-portada {
  position: relative;
  width: 100%;
  height: 230px;
  overflow: hidden;
  border-radius: 16px 16px 0 0;
  background: var(--fondo-tarjeta, #f5f5f5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.tarjeta-escaneo-portada__imagen {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.tarjeta-escaneo-portada__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 20px;
}
.tarjeta-escaneo-portada__aviso {
  max-width: 260px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  text-align: center;
  color: var(--texto-secundario, #616161);
}
.tarjeta-escaneo-portada__aviso-titulo {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--texto-primario, #424242);
}
.tarjeta-escaneo-portada__aviso-texto {
  font-size: 13px;
  line-height: 1.4;
}
.tarjeta-escaneo-portada__gradiente {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 32px 14px 12px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.65));
}
.tarjeta-escaneo-portada__nombre {
  color: white;
  font-size: 16px;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  line-height: 1.3;
}
.portada-botones-foto {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  gap: 6px;
  z-index: 2;
}
.boton-foto-overlay {
  background: rgba(0, 0, 0, 0.45);
  color: white;
}
.boton-foto-overlay:hover {
  background: rgba(0, 0, 0, 0.65);
}
.codigo-barras-fila {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}
.tarjeta-escaneo-info {
  padding: 10px 16px 8px;
}
.tarjeta-escaneo-fila {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.tarjeta-escaneo-detalle {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.codigo-barras-texto {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  font-weight: 500;
  color: var(--texto-secundario, #666);
  letter-spacing: 0.5px;
}
.tarjeta-escaneo-precio {
  padding: 8px 16px 10px;
}
.tarjeta-escaneo-footer {
  padding: 8px 16px 12px;
  border-top: 1px solid var(--borde-color, #e0e0e0);
}
.input-archivo-oculto {
  display: none;
}
</style>
