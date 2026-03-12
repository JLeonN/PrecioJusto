<template>
  <q-dialog v-model="dialogoAbierto" persistent>
    <q-card style="min-width: 350px; max-width: 500px" :style="estiloTarjeta">
      <!-- Header -->
      <q-card-section class="row items-center q-pb-none">
        <q-icon name="store" color="primary" size="24px" class="q-mr-sm" />
        <div class="text-h6">Agregar comercio rápido</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="cerrar" />
      </q-card-section>

      <!-- Contenido -->
      <q-card-section>
        <p class="text-body2 text-grey-7 q-mb-md">
          Completá los datos básicos. Podés agregar más detalles después desde la sección Comercios.
        </p>

        <!-- Nombre del comercio -->
        <q-input
          v-model="nombreInterno"
          label="Nombre del comercio *"
          outlined
          dense
          autofocus
          placeholder="Ej: Disco ABC"
          :rules="[requerido]"
          :disable="!!validacionPendiente"
          class="q-mb-md"
        />

        <!-- Dirección (obligatoria) -->
        <q-input
          v-model="direccionInterna"
          label="Dirección *"
          outlined
          dense
          placeholder="Ej: Av. Italia 1234"
          :rules="[requerido]"
          :disable="!!validacionPendiente"
        />

        <!-- Foto del local (opcional, discreta) -->
        <div class="seccion-foto-rapida q-mt-sm">
          <div v-if="fotoTemporal" class="foto-miniatura-row">
            <q-img :src="fotoTemporal" class="foto-miniatura" />
            <q-btn flat dense size="sm" color="grey-7">
              <IconCamera :size="14" class="q-mr-xs" />
              Cambiar foto
              <q-menu anchor="bottom left" self="top left">
                <q-list style="min-width: 160px">
                  <q-item v-if="esNativo" clickable v-close-popup @click="seleccionarCamara">
                    <q-item-section avatar><IconCamera :size="18" /></q-item-section>
                    <q-item-section>Tomar foto</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="abrirGaleria">
                    <q-item-section avatar><IconPhoto :size="18" /></q-item-section>
                    <q-item-section>Desde galería</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="fotoTemporal = null">
                    <q-item-section avatar><IconTrash :size="18" class="text-negative" /></q-item-section>
                    <q-item-section class="text-negative">Borrar foto</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
          <q-btn v-else flat dense size="sm" color="grey-6">
            <IconCamera :size="14" class="q-mr-xs" />
            Foto del local (opcional)
            <q-menu anchor="bottom left" self="top left">
              <q-list style="min-width: 160px">
                <q-item v-if="esNativo" clickable v-close-popup @click="seleccionarCamara">
                  <q-item-section avatar><IconCamera :size="18" /></q-item-section>
                  <q-item-section>Tomar foto</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="abrirGaleria">
                  <q-item-section avatar><IconPhoto :size="18" /></q-item-section>
                  <q-item-section>Desde galería</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <p class="text-caption text-grey-5 q-mt-xs q-mb-none">
            Podés cambiarla o quitarla después desde el detalle del comercio
          </p>
        </div>
      </q-card-section>

      <!-- Confirmación inline de validación -->
      <q-card-section v-if="validacionPendiente" class="q-pt-none">
        <q-banner dense rounded class="bg-orange-1 text-dark">
          <template #avatar>
            <q-icon name="warning" color="orange-8" />
          </template>
          <span v-if="validacionPendiente.nivel === 2">
            Ya existe un comercio con nombre similar
            <strong>({{ comercioSimilarNombre }})</strong>.
            ¿Querés agregarlo como nueva sucursal?
          </span>
          <span v-else-if="validacionPendiente.nivel === 3">
            Ya hay otros comercios en esta dirección. ¿Querés agregar este comercio igual?
          </span>
        </q-banner>
      </q-card-section>

      <!-- Acciones -->
      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat label="Cancelar" color="grey-7" @click="cerrar" />

        <!-- Estado normal: botón guardar -->
        <q-btn
          v-if="!validacionPendiente"
          unelevated
          label="Guardar"
          color="primary"
          :loading="guardando"
          :disable="!nombreInterno.trim() || !direccionInterna.trim()"
          @click="guardar"
        />

        <!-- Estado con validación pendiente: volver o confirmar -->
        <template v-else>
          <q-btn flat label="Volver" color="grey-7" @click="validacionPendiente = null" />
          <q-btn
            unelevated
            :label="validacionPendiente.nivel === 2 ? 'Sí, agregar sucursal' : 'Sí, agregar'"
            color="primary"
            :loading="guardando"
            @click="confirmarCrear"
          />
        </template>
      </q-card-actions>
    </q-card>
  </q-dialog>
  <!-- Input oculto para fallback web (cámara) -->
  <input ref="inputArchivoRef" type="file" accept="image/*" class="input-archivo-oculto" @change="alSeleccionarArchivo" />
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { IconCamera, IconPhoto, IconTrash } from '@tabler/icons-vue'
import { useComerciStore } from '../../../almacenamiento/stores/comerciosStore.js'
import ComerciosService from '../../../almacenamiento/servicios/ComerciosService.js'
import { useCamaraFoto } from '../../../composables/useCamaraFoto.js'
import { useTecladoVirtual } from '../../../composables/useTecladoVirtual.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  nombreInicial: {
    type: String,
    default: '',
  },
  direccionInicial: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'comercio-creado'])

const { estiloTarjeta } = useTecladoVirtual()

const $q = useQuasar()
const comerciosStore = useComerciStore()
const { inputArchivoRef, esNativo, abrirCamara, abrirGaleria, leerArchivo } = useCamaraFoto()

const dialogoAbierto = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const nombreInterno = ref('')
const direccionInterna = ref('')
const fotoTemporal = ref(null)
const guardando = ref(false)
const validacionPendiente = ref(null)

// Nombre del comercio similar encontrado (para mostrar en el mensaje)
const comercioSimilarNombre = computed(() => {
  if (!validacionPendiente.value?.comercios?.length) return ''
  return validacionPendiente.value.comercios[0]?.comercio?.nombre || ''
})

// Pre-llenar datos cuando se abra el diálogo
watch(
  () => props.modelValue,
  (nuevoValor) => {
    if (nuevoValor) {
      nombreInterno.value = props.nombreInicial || ''
      direccionInterna.value = props.direccionInicial || ''
      validacionPendiente.value = null
      fotoTemporal.value = null
    }
  },
)

/**
 * Intenta guardar el comercio validando duplicados primero
 */
async function guardar() {
  if (!nombreInterno.value.trim() || !direccionInterna.value.trim()) {
    $q.notify({ type: 'warning', message: 'El nombre y la dirección son obligatorios', position: 'top' })
    return
  }

  guardando.value = true

  try {
    const datos = construirDatos()
    const validacion = await ComerciosService.validarDuplicados(
      datos,
      comerciosStore.comerciosAgrupados,
    )

    if (validacion.esDuplicado) {
      if (validacion.nivel === 1) {
        // Duplicado exacto: bloquear sin opción
        $q.notify({
          type: 'warning',
          message: 'Este comercio ya existe en esa dirección exacta.',
          position: 'top',
          timeout: 3000,
        })
        return
      }
      // Nivel 2 (nombre similar) o Nivel 3 (misma dirección): pedir confirmación
      validacionPendiente.value = validacion
      return
    }

    await crearComercio(datos)
  } catch (error) {
    console.error('Error al guardar comercio:', error)
    $q.notify({ type: 'negative', message: 'Error al crear el comercio', position: 'top' })
  } finally {
    guardando.value = false
  }
}

/**
 * Usuario confirma crear el comercio pese a la advertencia
 */
async function confirmarCrear() {
  guardando.value = true
  try {
    await crearComercio(construirDatos())
  } catch (error) {
    console.error('Error al confirmar comercio:', error)
    $q.notify({ type: 'negative', message: 'Error al crear el comercio', position: 'top' })
  } finally {
    guardando.value = false
  }
}

/**
 * Crea el comercio directamente en el servicio y actualiza el store
 */
async function crearComercio(datos) {
  const nuevoComercio = await ComerciosService.agregarComercio(datos)
  comerciosStore.comercios.push(nuevoComercio)

  $q.notify({
    type: 'positive',
    message: `Comercio "${nuevoComercio.nombre}" agregado correctamente`,
    position: 'top',
  })

  emit('comercio-creado', nuevoComercio)
  cerrar()
}

async function seleccionarCamara() {
  const resultado = await abrirCamara()
  if (resultado) fotoTemporal.value = resultado
}

async function alSeleccionarArchivo(event) {
  const resultado = await leerArchivo(event)
  if (resultado) fotoTemporal.value = resultado
}

function construirDatos() {
  return {
    nombre: nombreInterno.value.trim(),
    tipo: 'Otro',
    calle: direccionInterna.value.trim() || '',
    barrio: '',
    ciudad: '',
    foto: fotoTemporal.value,
  }
}

function cerrar() {
  dialogoAbierto.value = false
  nombreInterno.value = ''
  direccionInterna.value = ''
  fotoTemporal.value = null
  validacionPendiente.value = null
}

function requerido(val) {
  return (val && val.trim().length > 0) || 'Este campo es requerido'
}
</script>

<style scoped>
.q-card {
  border-radius: 8px;
}
.seccion-foto-rapida {
  display: flex;
  flex-direction: column;
}
.foto-miniatura-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.foto-miniatura {
  width: 64px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
}
.input-archivo-oculto {
  display: none;
}
</style>
