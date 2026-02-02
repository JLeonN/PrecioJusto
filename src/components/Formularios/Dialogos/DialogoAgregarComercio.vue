<template>
  <q-dialog v-model="dialogoAbierto" @before-hide="alCerrar">
    <q-card class="dialogo-agregar-comercio" :class="clasesResponsivas">
      <!-- HEADER -->
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Agregar Comercio</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="cancelar" />
      </q-card-section>

      <!-- CONTENIDO DEL FORMULARIO -->
      <q-card-section class="q-pt-md contenido-scroll">
        <FormularioComercio v-model="datosComercio" @validar="validarDuplicados" />
      </q-card-section>

      <!-- ACCIONES -->
      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat label="Cancelar" color="grey-7" @click="cancelar" />
        <q-btn
          unelevated
          label="Guardar Comercio"
          color="primary"
          :loading="guardando"
          :disable="!formularioValido"
          @click="guardarComercio"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- DIÁLOGO DE COINCIDENCIAS (duplicados similares) -->
  <DialogoCoincidencias
    v-model="dialogoCoincidenciasAbierto"
    :comercios-similares="comerciosSimilares"
    :nivel-validacion="nivelValidacion"
    @usar-existente="usarComercioExistente"
    @continuar-nuevo="continuarConNuevo"
  />

  <!-- DIÁLOGO MISMA UBICACIÓN -->
  <DialogoMismaUbicacion
    v-model="dialogoMismaUbicacionAbierto"
    :comercios-ubicacion="comerciosEnMismaUbicacion"
    @confirmar="continuarConNuevo"
    @cancelar="dialogoMismaUbicacionAbierto = false"
  />
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import FormularioComercio from '../FormularioComercio.vue'
import DialogoCoincidencias from './DialogoCoincidencias.vue'
import DialogoMismaUbicacion from './DialogoMismaUbicacion.vue'
import { useComerciStore } from '../../../almacenamiento/stores/comerciosStore.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'comercio-guardado'])

const comerciosStore = useComerciStore()
const $q = useQuasar()

// Estado del diálogo
const dialogoAbierto = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Estado de carga
const guardando = ref(false)

// Datos del formulario
const datosComercio = ref({
  nombre: '',
  tipo: 'Supermercado',
  calle: '',
  barrio: '',
  ciudad: '',
})

// Estados de validación
const dialogoCoincidenciasAbierto = ref(false)
const dialogoMismaUbicacionAbierto = ref(false)
const comerciosSimilares = ref([])
const comerciosEnMismaUbicacion = ref([])
const nivelValidacion = ref(0)
const validacionPendiente = ref(null)

// Clases responsivas
const clasesResponsivas = computed(() => {
  return {
    'dialogo-landscape': $q.screen.width > $q.screen.height && $q.screen.lt.sm,
  }
})

// Validación básica del formulario
const formularioValido = computed(() => {
  return (
    datosComercio.value.nombre.trim() !== '' &&
    datosComercio.value.tipo !== '' &&
    datosComercio.value.calle.trim() !== ''
  )
})

// Limpiar formulario al abrir/cerrar
watch(dialogoAbierto, (nuevoValor) => {
  if (nuevoValor) {
    limpiarFormulario()
  }
})

/**
 * Valida duplicados mientras el usuario escribe
 */
async function validarDuplicados(datos) {
  // Guardar datos para validación posterior
  validacionPendiente.value = datos
  // Por ahora no validamos en tiempo real para no saturar
  // Se validará al intentar guardar
}

/**
 * Guardar comercio
 */
async function guardarComercio() {
  guardando.value = true

  try {
    // Validar duplicados antes de guardar
    const resultado = await comerciosStore.agregarComercio(datosComercio.value)

    if (!resultado.exito && resultado.validacion) {
      // Hay duplicados detectados
      manejarValidacionDuplicados(resultado.validacion)
      guardando.value = false
      return
    }

    // Comercio guardado exitosamente
    if (resultado.exito) {
      $q.notify({
        type: 'positive',
        message: 'Comercio agregado exitosamente',
        caption: datosComercio.value.nombre,
        position: 'top',
        icon: 'check_circle',
        timeout: 2500,
      })

      emit('comercio-guardado', resultado.comercio)
      limpiarFormulario()
      cerrarDialogo()
    }
  } catch (error) {
    console.error('❌ Error al guardar comercio:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al guardar el comercio',
      caption: error.message,
      position: 'top',
      timeout: 3000,
    })
  } finally {
    guardando.value = false
  }
}

/**
 * Maneja la validación de duplicados según nivel
 */
function manejarValidacionDuplicados(validacion) {
  nivelValidacion.value = validacion.nivel

  if (validacion.nivel === 1) {
    // NIVEL 1: Duplicado exacto - No permitir
    $q.notify({
      type: 'warning',
      message: 'Este comercio ya existe',
      caption: 'Usa el comercio existente o edita la dirección',
      position: 'top',
      icon: 'warning',
      timeout: 4000,
    })
  } else if (validacion.nivel === 2) {
    // NIVEL 2: Nombre similar - Mostrar coincidencias
    comerciosSimilares.value = validacion.comercios || []
    dialogoCoincidenciasAbierto.value = true
  } else if (validacion.nivel === 3) {
    // NIVEL 3: Misma ubicación - Confirmar
    comerciosEnMismaUbicacion.value = validacion.comercios || []
    dialogoMismaUbicacionAbierto.value = true
  }
}

/**
 * Usuario elige usar comercio existente
 */
function usarComercioExistente(comercio) {
  dialogoCoincidenciasAbierto.value = false

  $q.notify({
    type: 'info',
    message: `Comercio "${comercio.nombre}" ya existe`,
    caption: 'Puedes agregar una nueva dirección editando el comercio',
    position: 'top',
    icon: 'info',
  })

  // Cerrar este diálogo
  cerrarDialogo()
}

/**
 * Usuario confirma que es un comercio nuevo
 */
async function continuarConNuevo() {
  dialogoCoincidenciasAbierto.value = false
  dialogoMismaUbicacionAbierto.value = false

  guardando.value = true

  try {
    // Forzar guardado sin validación
    const comercio = {
      ...datosComercio.value,
      id: `${Date.now()}${Math.random().toString(36).substring(2, 9)}`,
      direcciones: [
        {
          id: `${Date.now()}${Math.random().toString(36).substring(2, 9)}`,
          calle: datosComercio.value.calle.trim(),
          barrio: datosComercio.value.barrio?.trim() || '',
          ciudad: datosComercio.value.ciudad?.trim() || '',
          nombreCompleto: `${datosComercio.value.nombre.trim()} - ${datosComercio.value.calle.trim()}`,
          fechaUltimoUso: new Date().toISOString(),
        },
      ],
      foto: null,
      fechaCreacion: new Date().toISOString(),
      fechaUltimoUso: new Date().toISOString(),
      cantidadUsos: 0,
    }

    // Agregar directamente al store sin validación
    comerciosStore.comercios.push(comercio)

    $q.notify({
      type: 'positive',
      message: 'Comercio agregado como nuevo',
      caption: datosComercio.value.nombre,
      position: 'top',
      icon: 'check_circle',
    })

    emit('comercio-guardado', comercio)
    limpiarFormulario()
    cerrarDialogo()
  } catch (error) {
    console.error('❌ Error al guardar comercio:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al guardar el comercio',
      position: 'top',
    })
  } finally {
    guardando.value = false
  }
}

/**
 * Limpiar formulario
 */
function limpiarFormulario() {
  datosComercio.value = {
    nombre: '',
    tipo: 'Supermercado',
    calle: '',
    barrio: '',
    ciudad: '',
  }
}

/**
 * Cancelar
 */
function cancelar() {
  limpiarFormulario()
  cerrarDialogo()
}

/**
 * Al cerrar
 */
function alCerrar() {
  limpiarFormulario()
}

/**
 * Cerrar diálogo
 */
function cerrarDialogo() {
  dialogoAbierto.value = false
}
</script>

<style scoped>
.dialogo-agregar-comercio {
  min-width: 350px;
  max-width: 500px;
}
/* Modo landscape (horizontal) en móvil */
.dialogo-landscape {
  max-width: 90vw;
  max-height: 90vh;
}
.contenido-scroll {
  max-height: 60vh;
  overflow-y: auto;
}
/* En landscape, reducir altura */
.dialogo-landscape .contenido-scroll {
  max-height: 50vh;
}
/* Transiciones suaves */
.dialogo-agregar-comercio {
  transition: all 0.3s ease;
}
</style>
