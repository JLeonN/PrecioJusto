<template>
  <q-dialog v-model="abierto" position="bottom" @show="alAbrir" @hide="alCerrar">
    <q-card class="tarjeta-escaneo-card">

      <!-- FOTO + NOMBRE (con gradiente) -->
      <div class="tarjeta-escaneo-portada">
        <img
          v-if="item?.imagen"
          :src="item.imagen"
          class="tarjeta-escaneo-portada__imagen"
        />
        <div v-else class="tarjeta-escaneo-portada__placeholder">
          <IconShoppingBag :size="56" class="text-grey-4" />
        </div>
        <div class="tarjeta-escaneo-portada__gradiente">
          <div class="tarjeta-escaneo-portada__nombre ellipsis-2-lines">
            {{ datosForm.nombre || 'Sin nombre' }}
          </div>
        </div>
      </div>

      <!-- INFO DEL PRODUCTO -->
      <q-card-section class="tarjeta-escaneo-info">

        <!-- Modo visualización -->
        <template v-if="!editando">
          <div class="tarjeta-escaneo-fila">
            <div class="tarjeta-escaneo-detalle">
              <span v-if="item?.codigoBarras" class="codigo-barras-texto">
                {{ item.codigoBarras }}
              </span>
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
          <div v-if="item?.fuenteDato" class="text-caption text-grey-5 q-mt-xs">
            Fuente: {{ item.fuenteDato }}
          </div>
        </template>

        <!-- Modo edición inline -->
        <template v-else>
          <q-input
            v-model="datosForm.nombre"
            label="Nombre *"
            outlined
            dense
            class="q-mb-sm"
          />
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
          <q-btn flat no-caps dense color="primary" label="Listo" @click="editando = false" />
        </template>

      </q-card-section>

      <q-separator />

      <!-- PRECIO + FOTO -->
      <q-card-section class="tarjeta-escaneo-precio">
        <div class="row q-col-gutter-sm items-end">
          <div class="col-7">
            <q-input
              ref="inputPrecioRef"
              v-model.number="datosForm.precio"
              label="Precio *"
              outlined
              dense
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              :rules="[v => (v > 0) || 'Obligatorio']"
              lazy-rules
            />
          </div>
          <div class="col-3">
            <q-select
              v-model="datosForm.moneda"
              outlined
              dense
              :options="MONEDAS"
              emit-value
              map-options
            />
          </div>
          <div class="col-2 flex flex-center">
            <q-btn flat round dense color="grey-6" @click="abrirMenuFoto">
              <IconCamera :size="22" />
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
                  <q-item v-if="datosForm.imagen" clickable v-close-popup @click="datosForm.imagen = null">
                    <q-item-section avatar><IconTrash :size="16" class="text-negative" /></q-item-section>
                    <q-item-section class="text-negative">Quitar foto</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
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
          <q-btn flat no-caps color="grey-7" @click="emitDescartar">
            Descartar
          </q-btn>
          <q-space />
          <q-btn
            outline
            no-caps
            color="primary"
            :disable="!formularioValido"
            @click="emitIrAMesa"
          >
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
import { MONEDAS, MONEDA_DEFAULT } from '../../almacenamiento/constantes/Monedas.js'
import { useCamaraFoto } from '../../composables/useCamaraFoto.js'
import {
  IconShoppingBag,
  IconPencil,
  IconCamera,
  IconPhoto,
  IconTrash,
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

const inputPrecioRef = ref(null)
const editando = ref(false)

const { inputArchivoRef, esNativo, abrirCamara, abrirGaleria, leerArchivo } = useCamaraFoto()

const datosForm = ref({
  nombre: '',
  marca: null,
  cantidad: 1,
  unidad: 'unidad',
  imagen: null,
  precio: null,
  moneda: MONEDA_DEFAULT,
})

const abierto = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// Precio obligatorio; nombre obligatorio si no viene de API
const formularioValido = computed(() => {
  const precioOk = datosForm.value.precio > 0
  const nombreOk = props.item?.origenApi || !!datosForm.value.nombre?.trim()
  return precioOk && nombreOk
})

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
      moneda: nuevoItem.moneda || MONEDA_DEFAULT,
    }
    editando.value = false
  },
  { immediate: true },
)

function alAbrir() {
  nextTick(() => inputPrecioRef.value?.focus())
}

function alCerrar() {
  datosForm.value = { nombre: '', marca: null, cantidad: 1, unidad: 'unidad', imagen: null, precio: null, moneda: MONEDA_DEFAULT }
  editando.value = false
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
function abrirMenuFoto() {}

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
    comercio: null, // se asigna en la Mesa de trabajo
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
.tarjeta-escaneo-portada {
  position: relative;
  width: 100%;
  height: 180px;
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
}
.tarjeta-escaneo-portada__gradiente {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 32px 14px 12px;
  background: linear-gradient(transparent, rgba(0,0,0,0.65));
}
.tarjeta-escaneo-portada__nombre {
  color: white;
  font-size: 16px;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
  line-height: 1.3;
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
