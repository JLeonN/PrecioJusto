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
        <FormularioComercio v-model="datosComercio" />
      </q-card-section>

      <!-- ACCIONES -->
      <q-card-actions align="right" class="q-px-md q-pb-md acciones-safe-area-publicidad">
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
    @agregar-sucursal="agregarSucursal"
    @continuar-nuevo="continuarConNuevo"
  />

  <!-- DIÁLOGO MISMA UBICACIÓN -->
  <DialogoMismaUbicacion
    v-model="dialogoMismaUbicacionAbierto"
    :comercios-ubicacion="comerciosEnMismaUbicacion"
    @confirmar="continuarConNuevo"
    @cancelar="dialogoMismaUbicacionAbierto = false"
  />

  <!-- DIÁLOGO DUPLICADO EXACTO -->
  <DialogoDuplicadoExacto
    v-model="dialogoDuplicadoExactoAbierto"
    :comercio-existente="comercioDuplicadoExacto"
    :datos-nuevos="datosComercio"
    @continuar="forzarCrearDuplicado"
    @cancelar="dialogoDuplicadoExactoAbierto = false"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import FormularioComercio from '../FormularioComercio.vue'
import DialogoCoincidencias from './DialogoCoincidencias.vue'
import DialogoMismaUbicacion from './DialogoMismaUbicacion.vue'
import DialogoDuplicadoExacto from './DialogoDuplicadoExacto.vue'
import { useComerciStore } from '../../../almacenamiento/stores/comerciosStore.js'
import ComerciosService from '../../../almacenamiento/servicios/ComerciosService.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'comercio-guardado'])

const $q = useQuasar()
const comerciosStore = useComerciStore()

// ════════════════════════════════════════════════════════════
// ESTADO LOCAL
// ════════════════════════════════════════════════════════════

const guardando = ref(false)
const dialogoCoincidenciasAbierto = ref(false)
const dialogoMismaUbicacionAbierto = ref(false)
const dialogoDuplicadoExactoAbierto = ref(false)

// Datos del comercio
const datosComercio = ref({
  nombre: '',
  tipo: 'Supermercado',
  calle: '',
  barrio: '',
  ciudad: '',
  foto: null,
})

// Comercios similares encontrados (para diálogo de coincidencias)
const comerciosSimilares = ref([])
const nivelValidacion = ref(1)

// Comercios en misma ubicación (para diálogo de ubicación)
const comerciosEnMismaUbicacion = ref([])

// Comercio duplicado exacto (para diálogo de confirmación)
const comercioDuplicadoExacto = ref(null)

// ════════════════════════════════════════════════════════════
// COMPUTED
// ════════════════════════════════════════════════════════════

const dialogoAbierto = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const formularioValido = computed(() => {
  return (
    datosComercio.value.nombre.trim() !== '' &&
    datosComercio.value.calle.trim() !== ''
  )
})

const clasesResponsivas = computed(() => {
  return {
    'dialogo-landscape': window.innerHeight < window.innerWidth,
  }
})

// ════════════════════════════════════════════════════════════
// MÉTODOS - VALIDACIÓN
// ════════════════════════════════════════════════════════════

/**
 * Valida si hay duplicados antes de guardar
 * Usa comercios agrupados para evitar mostrar cadenas duplicadas
 */
async function validarDuplicados() {
  if (!formularioValido.value) return

  try {
    const resultado = await ComerciosService.validarDuplicados(
      datosComercio.value,
      comerciosStore.comerciosAgrupados,
    )

    if (resultado.esDuplicado) {
      // Hay duplicados - mostrar diálogo correspondiente
      nivelValidacion.value = resultado.nivel

      if (resultado.nivel === 1) {
        // Duplicado exacto - mostrar confirmación
        comercioDuplicadoExacto.value = resultado.comercio
        dialogoDuplicadoExactoAbierto.value = true
      } else if (resultado.nivel === 2) {
        // Nombres similares
        comerciosSimilares.value = resultado.comercios
        dialogoCoincidenciasAbierto.value = true
      } else if (resultado.nivel === 3) {
        // Misma ubicación
        comerciosEnMismaUbicacion.value = resultado.comercios
        dialogoMismaUbicacionAbierto.value = true
      }

      return false
    }

    return true
  } catch (error) {
    console.error('❌ Error al validar duplicados:', error)
    return true // Continuar si hay error
  }
}

// ════════════════════════════════════════════════════════════
// MÉTODOS - GUARDADO
// ════════════════════════════════════════════════════════════

/**
 * Guardar comercio (con validación de duplicados)
 */
async function guardarComercio() {
  if (!formularioValido.value) {
    $q.notify({
      type: 'warning',
      message: 'Por favor completa todos los campos obligatorios',
      position: 'top',
    })
    return
  }

  guardando.value = true

  try {
    // Validar duplicados primero
    const esDuplicado = await validarDuplicados()

    if (esDuplicado === false) {
      // Se detectó duplicado y se abrió el diálogo correspondiente
      guardando.value = false
      return
    }

    // No hay duplicados, continuar con guardado
    await continuarConNuevo()
  } catch (error) {
    console.error('❌ Error al guardar comercio:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al guardar el comercio',
      position: 'top',
    })
    guardando.value = false
  }
}

/**
 * Usuario confirma que quiere crear comercio nuevo
 */
async function continuarConNuevo() {
  guardando.value = true
  dialogoCoincidenciasAbierto.value = false
  dialogoMismaUbicacionAbierto.value = false

  try {
    console.log('💾 Guardando comercio nuevo...')

    // Agregar comercio usando el servicio (esto SÍ persiste en storage)
    const nuevoComercio = await ComerciosService.agregarComercio(datosComercio.value)

    // Agregar al store local para actualizar UI
    comerciosStore.comercios.push(nuevoComercio)

    $q.notify({
      type: 'positive',
      message: 'Comercio agregado exitosamente',
      caption: datosComercio.value.nombre,
      position: 'top',
      icon: 'check_circle',
    })

    emit('comercio-guardado', nuevoComercio)
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
 * Usuario elige agregar como nueva sucursal
 */
async function agregarSucursal(comercio) {
  console.log('📍 Agregando nueva sucursal de:', comercio.nombre)

  dialogoCoincidenciasAbierto.value = false

  // Crear el nuevo comercio (se agrupará automáticamente como sucursal)
  await continuarConNuevo()
}

/**
 * Forzar creación de duplicado (usuario confirmó)
 */
async function forzarCrearDuplicado() {
  console.log('⚠️ Usuario confirmó crear duplicado')
  dialogoDuplicadoExactoAbierto.value = false
  await continuarConNuevo()
}

// ════════════════════════════════════════════════════════════
// MÉTODOS - UTILIDADES
// ════════════════════════════════════════════════════════════

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
    foto: null,
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
