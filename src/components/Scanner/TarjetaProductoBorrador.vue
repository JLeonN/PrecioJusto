<template>
  <TarjetaBase
    tipo="producto"
    :nombre="item.nombre || 'Sin nombre'"
    :imagen="item.imagen"
    :modo-seleccion="modoSeleccion"
    :seleccionado="seleccionado"
    :permite-expansion="true"
    :mostrar-boton-agregar-precio="false"
    :expandido-prop="expandidoLocal"
    @long-press="$emit('long-press')"
    @toggle-seleccion="$emit('toggle-seleccion')"
    @toggle-expansion="
      (v) => {
        expandidoLocal = v
      }
    "
  >
    <template #header-right>
      <BotonConfirmacionEliminar v-if="!modoSeleccion" @confirmar="$emit('eliminar')" />
    </template>
    <!-- Chips de completitud + info de comercio/dirección -->
    <template #tipo>
      <div class="tipo-contenido">
        <!-- Fila 1: chips de estado (botones) -->
        <div class="chips-completitud">
          <q-chip
            clickable
            :color="!!item.nombre?.trim() ? 'positive' : 'grey-4'"
            :text-color="!!item.nombre?.trim() ? 'white' : 'grey-6'"
            size="sm"
            @click.stop="irACampo('nombre')"
          >
            Nombre
          </q-chip>
          <q-chip
            clickable
            :color="item.precio > 0 ? 'positive' : 'grey-4'"
            :text-color="item.precio > 0 ? 'white' : 'grey-6'"
            size="sm"
            @click.stop="irACampo('precio')"
          >
            Precio
          </q-chip>
          <q-chip
            clickable
            :color="!!item.comercio ? 'positive' : 'grey-4'"
            :text-color="!!item.comercio ? 'white' : 'grey-6'"
            size="sm"
            @click.stop="irACampo('comercio')"
          >
            Comercio
          </q-chip>
        </div>
        <!-- Fila 2: nombre del comercio -->
        <div v-if="item.comercio" class="info-comercio">
          <IconBuildingStore :size="14" class="info-icono" />
          <span class="text-weight-medium ellipsis">{{ item.comercio.nombre }}</span>
        </div>
        <!-- Fila 3: dirección -->
        <div v-if="item.comercio?.direccionNombre" class="info-direccion">
          <IconMapPin :size="14" class="info-icono text-grey-6" />
          <span class="text-grey-7 ellipsis">{{ item.comercio.direccionNombre }}</span>
        </div>
      </div>
    </template>
    <!-- Imagen + acciones de foto -->
    <template #imagen>
      <div class="imagen-slot">
        <div v-if="!datosEditando.imagen" class="imagen-slot__placeholder">
          <IconShoppingBag :size="48" class="text-grey-5" />
        </div>
        <q-img
          v-else
          :src="datosEditando.imagen"
          class="imagen-slot__imagen"
          fit="cover"
          @click.stop="verFoto = true"
        />
        <div v-if="datosEditando.imagen" class="imagen-slot__acciones-izquierda">
          <q-btn
            flat
            round
            dense
            size="sm"
            class="boton-foto-overlay"
            @click.stop="verFoto = true"
          >
            <IconSearch :size="18" />
            <q-tooltip>Ver imagen completa</q-tooltip>
          </q-btn>
        </div>
        <div class="imagen-slot__acciones">
          <q-btn flat round dense size="sm" class="boton-foto-overlay" @click.stop>
            <IconCamera :size="18" />
            <q-tooltip>Gestionar foto</q-tooltip>
            <q-menu anchor="bottom right" self="top right">
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
                  v-if="datosEditando.imagen"
                  clickable
                  v-close-popup
                  @click="actualizar('imagen', null)"
                >
                  <q-item-section avatar
                    ><IconTrash :size="16" class="text-negative"
                  /></q-item-section>
                  <q-item-section class="text-negative">Quitar</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <q-btn
            v-if="fotoModificada"
            flat
            round
            dense
            size="sm"
            class="boton-foto-overlay"
            @click.stop="actualizar('imagen', datosOriginales.imagen)"
          >
            <IconRefresh :size="18" />
            <q-tooltip>Recuperar foto original</q-tooltip>
          </q-btn>
        </div>
      </div>
    </template>
    <!-- Precio en overlay si existe -->
    <template v-if="item.precio > 0 || mostrarAvisoSinCoincidencia" #overlay-info>
      <div class="overlay-contenido">
        <div v-if="mostrarAvisoSinCoincidencia" class="sin-coincidencia-overlay">
          <div class="sin-coincidencia-overlay__titulo">
            Este artículo no apareció en nuestras bases.
          </div>
          <div class="sin-coincidencia-overlay__texto">
            Podés editarlo en esta tarjeta o desde el historial del artículo.
          </div>
        </div>
        <div v-if="item.precio > 0" class="precio-overlay">
          {{ formatearPrecio(item.precio, item.moneda) }}
        </div>
      </div>
    </template>
    <!-- Info inferior: código de barras (clickeable para copiar) -->
    <template #info-inferior>
      <div
        class="info-inferior-fila"
        :class="{ 'codigo-copiable': !!item.codigoBarras }"
        @click.stop="copiarCodigo"
      >
        <IconBarcode :size="14" />
        <span v-if="item.codigoBarras" class="codigo-barras-texto">{{ item.codigoBarras }}</span>
        <span v-else class="text-grey-5">Sin código</span>
      </div>
    </template>
    <!-- Header de la sección expandida -->
    <template #expandido-header>
      <div class="expandido-titulo">
        <IconPencil :size="16" />
        <span>EDITAR</span>
      </div>
    </template>
    <!-- Contenido expandido: edición inline -->
    <template #expandido-contenido>
      <div class="edit-campos">
        <!-- Nombre -->
        <q-input
          ref="refInputNombre"
          :model-value="datosEditando.nombre"
          label="Nombre *"
          outlined
          dense
          @update:model-value="(v) => actualizar('nombre', v)"
        />
        <q-input
          :model-value="datosEditando.marca"
          label="Marca"
          outlined
          dense
          hint="Opcional"
          class="q-mt-xs"
          @update:model-value="(v) => actualizar('marca', v)"
        />
        <!-- Precio + Moneda -->
        <div class="row q-col-gutter-sm">
          <div class="col-8">
            <q-input
              ref="refInputPrecio"
              :model-value="precioTexto"
              label="Precio *"
              outlined
              dense
              type="text"
              inputmode="decimal"
              @update:model-value="alCambiarPrecio"
              @blur="alSalirPrecio"
              @keydown="soloNumerosDecimales"
            />
          </div>
          <div class="col-4">
            <q-select
              :model-value="datosEditando.moneda"
              outlined
              dense
              :options="MONEDAS"
              emit-value
              map-options
              @update:model-value="(v) => actualizar('moneda', v)"
            />
          </div>
        </div>
        <SelectorComercioDireccion
          ref="refSelectorComercio"
          :model-value="datosEditando.comercio"
          @update:model-value="(v) => actualizar('comercio', v)"
        />
        <!-- Botón para agregar nuevo comercio -->
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          icon="add_circle"
          label="Agregar comercio rápido"
          size="md"
          class="q-mb-sm"
          @click.stop="$emit('abrir-nuevo-comercio')"
        />
        <!-- Cantidad + Unidad -->
        <div class="row q-col-gutter-sm">
          <div class="col-6">
            <q-input
              :model-value="datosEditando.cantidad"
              label="Cantidad"
              outlined
              dense
              type="number"
              min="0"
              @update:model-value="(v) => actualizar('cantidad', parseFloat(v) || 1)"
            />
          </div>
          <div class="col-6">
            <q-select
              :model-value="datosEditando.unidad"
              label="Unidad"
              outlined
              dense
              :options="OPCIONES_UNIDADES"
              emit-value
              map-options
              @update:model-value="(v) => actualizar('unidad', v)"
            />
          </div>
        </div>
        <q-btn
          v-if="datosModificados"
          flat
          no-caps
          dense
          size="sm"
          color="grey-7"
          class="boton-recuperar-datos"
          @click="recuperarDatos"
        >
          <IconArrowBackUp :size="16" class="q-mr-xs" />
          Recuperar datos
        </q-btn>
        <input
          ref="inputArchivoRef"
          type="file"
          accept="image/*"
          class="input-oculto"
          @change="alSeleccionarArchivo"
        />
      </div>
    </template>
    <!-- Botones de acción -->
    <template #acciones>
      <q-space />
      <q-btn
        unelevated
        no-caps
        size="sm"
        :color="itemCompleto ? 'primary' : 'grey-4'"
        :text-color="itemCompleto ? 'white' : 'grey-6'"
        :disable="!itemCompleto"
        @click.stop="$emit('enviar')"
      >
        <IconSend :size="14" class="q-mr-xs" />
        Enviar
      </q-btn>
    </template>
  </TarjetaBase>
  <DialogoVerImagen
    v-model="verFoto"
    :src="datosEditando.imagen || ''"
    :titulo="datosEditando.nombre || 'Sin nombre'"
    :editable="!!datosEditando.imagen"
    @guardar="alGuardarFotoEditada"
  />
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useQuasar, copyToClipboard } from 'quasar'
import TarjetaBase from '../Tarjetas/TarjetaBase.vue'
import BotonConfirmacionEliminar from '../Compartidos/BotonConfirmacionEliminar.vue'
import SelectorComercioDireccion from '../Compartidos/SelectorComercioDireccion.vue'
import DialogoVerImagen from '../Compartidos/DialogoVerImagen.vue'
import { MONEDAS } from '../../almacenamiento/constantes/Monedas.js'
import { useCamaraFoto } from '../../composables/useCamaraFoto.js'
import {
  filtrarInputPrecio,
  formatearPrecioAlSalir,
  soloNumerosDecimales,
  formatearPrecioDisplay,
} from '../../utils/PrecioUtils.js'
import {
  IconShoppingBag,
  IconSearch,
  IconBarcode,
  IconMapPin,
  IconBuildingStore,
  IconPencil,
  IconCamera,
  IconPhoto,
  IconTrash,
  IconSend,
  IconRefresh,
  IconArrowBackUp,
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
  item: { type: Object, required: true },
  modoSeleccion: { type: Boolean, default: false },
  seleccionado: { type: Boolean, default: false },
})

const emit = defineEmits([
  'long-press',
  'toggle-seleccion',
  'update:item',
  'eliminar',
  'enviar',
  'abrir-nuevo-comercio',
])

const $q = useQuasar()
const { inputArchivoRef, esNativo, abrirCamara, abrirGaleria, leerArchivo } = useCamaraFoto()
const verFoto = ref(false)

// Estado de expansión manejado localmente para poder controlarla desde los chips
const expandidoLocal = ref(false)

// Refs a los inputs del área expandida
const refInputNombre = ref(null)
const refInputPrecio = ref(null)
const refSelectorComercio = ref(null)

// Copia local para edición
const datosEditando = ref({ ...props.item })
// String para preservar ceros finales (ej: "3.30"); datosEditando.precio guarda el número
const precioTexto = ref(
  formatearPrecioAlSalir(props.item.precio > 0 ? String(props.item.precio) : ''),
)

// Sincroniza si el item cambia externamente (ej. asignación de comercio en bloque)
watch(
  () => props.item,
  (v) => {
    datosEditando.value = { ...v }
    // Evitar sobreescribir mientras el usuario escribe: solo actualizar si el número cambió
    if (parseFloat(precioTexto.value) !== v.precio) {
      precioTexto.value = formatearPrecioAlSalir(v.precio > 0 ? String(v.precio) : '')
    }
  },
  { deep: true },
)

// Datos originales de la API/BD: el store los guarda en agregarItem() como datosOriginales
const datosOriginales = ref(props.item?.datosOriginales ?? null)
const fotoModificada = computed(
  () => datosOriginales.value && datosEditando.value.imagen !== datosOriginales.value.imagen,
)
const datosModificados = computed(
  () =>
    datosOriginales.value &&
    (datosEditando.value.nombre !== datosOriginales.value.nombre ||
      datosEditando.value.marca !== datosOriginales.value.marca ||
      datosEditando.value.cantidad !== datosOriginales.value.cantidad ||
      datosEditando.value.unidad !== datosOriginales.value.unidad),
)

const itemCompleto = computed(
  () =>
    !!datosEditando.value.nombre?.trim() &&
    datosEditando.value.precio > 0 &&
    !!datosEditando.value.comercio,
)
const mostrarAvisoSinCoincidencia = computed(
  () => props.item?.sinCoincidencia === true && !datosEditando.value?.imagen,
)

function alCambiarPrecio(val) {
  precioTexto.value = filtrarInputPrecio(val)
  actualizar('precio', parseFloat(precioTexto.value) || 0)
}

function alSalirPrecio() {
  precioTexto.value = formatearPrecioAlSalir(precioTexto.value)
}

// Actualiza un campo y emite el item completo actualizado
function actualizar(campo, valor) {
  datosEditando.value = { ...datosEditando.value, [campo]: valor }
  emit('update:item', { ...datosEditando.value })
}

// Foto
async function tomarFotoCamara() {
  const res = await abrirCamara()
  if (res) actualizar('imagen', res)
}
async function alSeleccionarArchivo(event) {
  const res = await leerArchivo(event)
  if (res) actualizar('imagen', res)
}
function alGuardarFotoEditada(nuevaImagenBase64) {
  actualizar('imagen', nuevaImagenBase64)
}

function recuperarDatos() {
  if (!datosOriginales.value) return
  const { nombre, marca, cantidad, unidad } = datosOriginales.value
  actualizar('nombre', nombre)
  actualizar('marca', marca)
  actualizar('cantidad', cantidad)
  actualizar('unidad', unidad)
}

function copiarCodigo() {
  if (!props.item.codigoBarras) return
  copyToClipboard(props.item.codigoBarras).then(() => {
    $q.notify({ type: 'positive', message: 'Código copiado', timeout: 1500 })
  })
}

// Abre la tarjeta (si está cerrada) y hace focus en el campo indicado
function irACampo(campo) {
  expandidoLocal.value = true
  nextTick(() => {
    if (campo === 'nombre') {
      refInputNombre.value?.focus()
      if (datosEditando.value.nombre?.trim()) refInputNombre.value?.select()
    } else if (campo === 'precio') {
      refInputPrecio.value?.focus()
      if (datosEditando.value.precio > 0) refInputPrecio.value?.select()
    } else if (campo === 'comercio') {
      refSelectorComercio.value?.focus()
    }
  })
}

function formatearPrecio(valor, moneda) {
  return `${formatearPrecioDisplay(valor)} ${moneda || 'UYU'}`
}
</script>

<style scoped>
.tipo-contenido {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.chips-completitud {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.info-comercio,
.info-direccion {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  min-width: 0;
}
.info-comercio {
  color: var(--texto-primario);
}
.info-icono {
  flex-shrink: 0;
}
.precio-overlay {
  position: absolute;
  right: 0;
  bottom: 0;
  color: var(--texto-sobre-primario);
  font-size: 20px;
  font-weight: bold;
  text-shadow: var(--sombra-texto-overlay);
}
.overlay-contenido {
  position: relative;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  width: 100%;
  min-height: 92px;
}
.sin-coincidencia-overlay {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translate(-50%, calc(-50% - 18px));
  width: calc(100% - 24px);
  max-width: 240px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--overlay-oscuro-medio);
  backdrop-filter: blur(4px);
  text-align: center;
  color: var(--texto-sobre-primario);
}
.sin-coincidencia-overlay__titulo {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
}
.sin-coincidencia-overlay__texto {
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.35;
}
.info-inferior-fila {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.codigo-copiable {
  cursor: pointer;
}
.codigo-barras-texto {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.5px;
}
.expandido-titulo {
  display: flex;
  align-items: center;
  gap: 8px;
}
.edit-campos {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.boton-recuperar-datos {
  align-self: flex-end;
}
.imagen-slot {
  position: relative;
  width: 100%;
  height: 100%;
}
.imagen-slot__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primario-claro);
}
.imagen-slot__imagen {
  width: 100%;
  height: 100%;
}
.imagen-slot__acciones-izquierda {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 4;
  display: flex;
}
.imagen-slot__acciones {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 4;
  display: flex;
  gap: 6px;
}
.boton-foto-overlay {
  background: var(--overlay-oscuro-medio);
  color: var(--texto-sobre-primario);
}
.boton-foto-overlay:hover {
  background: var(--overlay-oscuro-intenso);
}
.input-oculto {
  display: none;
}
</style>
