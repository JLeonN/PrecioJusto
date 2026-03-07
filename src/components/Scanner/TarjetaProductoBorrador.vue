<template>
  <TarjetaBase
    tipo="producto"
    :nombre="item.nombre || 'Sin nombre'"
    :imagen="item.imagen"
    :modo-seleccion="modoSeleccion"
    :seleccionado="seleccionado"
    :permite-expansion="true"
    :mostrar-boton-agregar-precio="false"
    @long-press="$emit('long-press')"
    @toggle-seleccion="$emit('toggle-seleccion')"
  >
    <!-- Chips de completitud + info de comercio/dirección -->
    <template #tipo>
      <div class="tipo-contenido">
        <!-- Fila 1: chips de estado -->
        <div class="chips-completitud">
          <q-chip
            dense
            :color="!!item.nombre?.trim() ? 'positive' : 'grey-4'"
            :text-color="!!item.nombre?.trim() ? 'white' : 'grey-6'"
            size="sm"
          >
            Nombre
          </q-chip>
          <q-chip
            dense
            :color="item.precio > 0 ? 'positive' : 'grey-4'"
            :text-color="item.precio > 0 ? 'white' : 'grey-6'"
            size="sm"
          >
            Precio
          </q-chip>
          <q-chip
            dense
            :color="!!item.comercio ? 'positive' : 'grey-4'"
            :text-color="!!item.comercio ? 'white' : 'grey-6'"
            size="sm"
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

    <!-- Placeholder icon -->
    <template #placeholder-icono>
      <IconShoppingBag :size="48" class="text-grey-5" />
    </template>

    <!-- Precio en overlay si existe -->
    <template v-if="item.precio > 0" #overlay-info>
      <div class="precio-overlay">{{ formatearPrecio(item.precio, item.moneda) }}</div>
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
          :model-value="datosEditando.nombre"
          label="Nombre *"
          outlined
          dense
          @update:model-value="(v) => actualizar('nombre', v)"
        />
        <!-- Precio + Moneda -->
        <div class="row q-col-gutter-sm">
          <div class="col-8">
            <q-input
              :model-value="datosEditando.precio"
              label="Precio *"
              outlined
              dense
              type="number"
              min="0"
              step="0.01"
              @update:model-value="(v) => actualizar('precio', parseFloat(v) || 0)"
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
        <!-- Comercio -->
        <q-select
          :model-value="datosEditando.comercio"
          label="Comercio *"
          outlined
          dense
          :options="comerciosStore.comerciosAgrupados"
          option-label="nombre"
          clearable
          use-input
          @filter="filtrarComercios"
          @update:model-value="(v) => actualizar('comercio', v ? { id: v.id, nombre: v.nombre, direccionId: null, direccionNombre: null } : null)"
        >
          <template #no-option>
            <q-item>
              <q-item-section class="text-grey">Sin comercios</q-item-section>
            </q-item>
          </template>
        </q-select>
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
        <!-- Foto -->
        <div class="foto-fila">
          <div class="flex items-center gap-sm">
            <img v-if="datosEditando.imagen" :src="datosEditando.imagen" class="foto-miniatura" />
            <q-btn flat round dense size="sm" color="grey-6">
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
                  <q-item v-if="datosEditando.imagen" clickable v-close-popup @click="actualizar('imagen', null)">
                    <q-item-section avatar><IconTrash :size="16" class="text-negative" /></q-item-section>
                    <q-item-section class="text-negative">Quitar</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
          <input ref="inputArchivoRef" type="file" accept="image/*" class="input-oculto" @change="alSeleccionarArchivo" />
        </div>
      </div>
    </template>

    <!-- Botones de acción -->
    <template #acciones>
      <q-btn
        flat
        round
        dense
        size="sm"
        color="negative"
        class="q-mr-auto"
        @click.stop="$emit('eliminar')"
      >
        <IconTrash :size="18" />
        <q-tooltip>Eliminar</q-tooltip>
      </q-btn>
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
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar, copyToClipboard } from 'quasar'
import TarjetaBase from '../Tarjetas/TarjetaBase.vue'
import { MONEDAS } from '../../almacenamiento/constantes/Monedas.js'
import { useComerciStore } from '../../almacenamiento/stores/comerciosStore.js'
import { useCamaraFoto } from '../../composables/useCamaraFoto.js'
import {
  IconShoppingBag,
  IconBarcode,
  IconMapPin,
  IconBuildingStore,
  IconPencil,
  IconCamera,
  IconPhoto,
  IconTrash,
  IconSend,
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

const emit = defineEmits(['long-press', 'toggle-seleccion', 'update:item', 'eliminar', 'enviar'])

const $q = useQuasar()
const comerciosStore = useComerciStore()
const { inputArchivoRef, esNativo, abrirCamara, abrirGaleria, leerArchivo } = useCamaraFoto()

// Copia local para edición
const datosEditando = ref({ ...props.item })

// Sincroniza si el item cambia externamente (ej. asignación de comercio en bloque)
watch(() => props.item, (v) => { datosEditando.value = { ...v } }, { deep: true })

const itemCompleto = computed(() =>
  !!datosEditando.value.nombre?.trim() &&
  datosEditando.value.precio > 0 &&
  !!datosEditando.value.comercio,
)

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

// Filtro del q-select de comercios
function filtrarComercios(val, update) {
  update(() => {
    if (!val) return
    const needle = val.toLowerCase()
    comerciosStore.comerciosAgrupados.filter((c) =>
      c.nombre.toLowerCase().includes(needle),
    )
  })
}

function copiarCodigo() {
  if (!props.item.codigoBarras) return
  copyToClipboard(props.item.codigoBarras).then(() => {
    $q.notify({ type: 'positive', message: 'Código copiado', timeout: 1500 })
  })
}

function formatearPrecio(valor, moneda) {
  return `$${valor.toLocaleString('es-UY')} ${moneda || 'UYU'}`
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
  color: var(--texto-primario, #1a1a1a);
}
.info-icono {
  flex-shrink: 0;
}
.precio-overlay {
  color: white;
  font-size: 20px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0,0,0,0.6);
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
.foto-fila {
  display: flex;
  align-items: center;
  gap: 8px;
}
.foto-miniatura {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 6px;
}
.gap-sm {
  gap: 8px;
}
.input-oculto {
  display: none;
}
</style>
