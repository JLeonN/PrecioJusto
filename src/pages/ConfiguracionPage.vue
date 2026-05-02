<template>
  <q-page class="q-pa-md configuracion-page">
    <div class="contenedor-configuracion">
      <div class="q-mb-md">
        <h5 class="q-my-none">Configuración</h5>
        <p class="text-grey-7 q-mt-xs q-mb-none">Preferencias globales de la app</p>
      </div>

      <q-list bordered separator class="contenedor-acordeon">
        <q-expansion-item
          v-model="seccionesAbiertas.cuentaPerfil"
          header-class="cabecera-seccion"
          expand-separator
          icon="person"
          label="Cuenta y perfil"
          :caption="resumenCuentaPerfil"
          ref="tarjetaCuentaCorreoRef"
        >
          <div class="bloque-contenido">
            <div class="text-subtitle2 text-weight-medium">Cuenta</div>
            <p class="text-caption text-grey-7 q-mt-xs q-mb-sm">
              Podés usar la app con Google o como invitado.
            </p>
            <q-banner rounded class="banner-cuenta q-mb-sm">
              Estado:
              <strong>{{ etiquetaEstadoCuenta }}</strong>
            </q-banner>
            <div class="column q-gutter-sm">
              <q-btn
                color="primary"
                unelevated
                no-caps
                label="Entrar con Google"
                :loading="cargandoAccionCuenta"
                @click="manejarEntrarConGoogle"
              />
              <q-btn
                outline
                color="primary"
                no-caps
                label="Continuar como invitado"
                :loading="cargandoAccionCuenta"
                @click="manejarContinuarComoInvitado"
              />
            </div>
          </div>

          <q-separator />

          <div class="bloque-contenido">
            <div class="text-subtitle2 text-weight-medium">Perfil</div>
            <p class="text-caption text-grey-7 q-mt-xs q-mb-sm">
              Datos visibles de tu cuenta. Podés editarlos cuando quieras.
            </p>
            <div class="column q-gutter-sm">
              <q-input v-model="perfilEditableNombre" label="Nombre" outlined dense />
              <q-input
                v-model="perfilEditableFoto"
                label="Foto (URL)"
                type="url"
                autocomplete="photo"
                outlined
                dense
              />
              <q-input
                v-model="perfilEditableFechaNacimiento"
                label="Fecha de nacimiento"
                type="date"
                outlined
                dense
              />
              <q-banner rounded class="banner-cuenta">
                Edad calculada: <strong>{{ etiquetaEdadPerfil }}</strong>
              </q-banner>
              <q-btn
                color="primary"
                unelevated
                no-caps
                label="Guardar perfil"
                :loading="usuarioStore.cargandoPerfil"
                @click="manejarGuardarPerfilEditable"
              />
            </div>
          </div>

          <q-separator />

          <div class="bloque-contenido">
            <div class="text-subtitle2 text-weight-medium">Cuenta por correo</div>
            <p class="text-caption text-grey-7 q-mt-xs q-mb-sm">
              Probá iniciar sesión, crear cuenta o recuperar contraseña por correo.
            </p>
            <div class="column q-gutter-sm bloque-correo-form">
              <q-input
                class="input-cuenta"
                v-model="correoCuenta"
                label="Correo"
                type="email"
                autocomplete="email"
                filled
                dense
              />
              <q-input
                class="input-cuenta"
                v-model="contrasenaCuenta"
                label="Contraseña"
                :type="mostrarContrasenaCuenta ? 'text' : 'password'"
                autocomplete="current-password"
                filled
                dense
              >
                <template #append>
                  <q-btn
                    flat
                    round
                    dense
                    :ripple="false"
                    class="boton-ojo-cuenta"
                    :icon="mostrarContrasenaCuenta ? 'visibility_off' : 'visibility'"
                    @click="mostrarContrasenaCuenta = !mostrarContrasenaCuenta"
                  />
                </template>
              </q-input>
              <div class="acciones-correo">
                <q-btn
                  class="full-width boton-accion-correo"
                  color="primary"
                  no-caps
                  label="Entrar con correo"
                  :loading="cargandoAccionCuenta"
                  @click="manejarEntrarConCorreo"
                />
                <q-btn
                  class="full-width boton-accion-correo"
                  outline
                  color="primary"
                  no-caps
                  label="Crear cuenta"
                  :loading="cargandoAccionCuenta"
                  @click="manejarCrearCuentaConCorreo"
                />
                <q-btn
                  class="full-width boton-accion-correo"
                  outline
                  no-caps
                  color="primary"
                  label="Recuperar contraseña"
                  :loading="cargandoAccionCuenta"
                  @click="manejarRecuperarContrasena"
                />
              </div>
            </div>
          </div>
        </q-expansion-item>

        <q-expansion-item
          v-model="seccionesAbiertas.tema"
          header-class="cabecera-seccion"
          expand-separator
          icon="palette"
          label="Tema"
          :caption="resumenTema"
        >
          <div class="bloque-contenido">
            <p class="text-caption text-grey-7 q-mt-none q-mb-sm">
              Elegí cómo querés que se vea la app: claro, oscuro o automático según el sistema.
            </p>
            <div class="selector-modo-tema q-gutter-sm">
              <q-btn
                v-for="opcion in opcionesModoTema"
                :key="opcion.value"
                no-caps
                unelevated
                class="boton-modo-tema"
                :class="{ 'boton-modo-tema-activo': preferenciasStore.modoTema === opcion.value }"
                :label="opcion.label"
                @click="seleccionarModoTema(opcion.value)"
              />
            </div>
            <div class="q-mt-md">
              <q-banner rounded class="banner-tema-efectivo">
                Tema activo: <strong>{{ etiquetaTemaActivo }}</strong>
              </q-banner>
            </div>
            <div class="q-mt-sm">
              <q-banner rounded class="banner-tema-info">
                Si elegís Claro u Oscuro, esa preferencia manual se mantiene hasta volver a Seguir
                sistema.
              </q-banner>
            </div>
          </div>
        </q-expansion-item>

        <q-expansion-item
          v-model="seccionesAbiertas.monedaRegion"
          header-class="cabecera-seccion"
          expand-separator
          icon="payments"
          label="Moneda y región"
          :caption="resumenMoneda"
        >
          <div class="bloque-contenido">
            <p class="text-caption text-grey-7 q-mt-none q-mb-sm">
              Esta moneda se usa como valor inicial en formularios nuevos.
            </p>
            <q-toggle
              :model-value="esModoAutomatico"
              label="Usar moneda automática según país"
              color="primary"
              @update:model-value="cambiarModoAutomatico"
            />
            <div class="q-mt-md">
              <q-banner rounded class="banner-moneda-efectiva">
                Moneda predeterminada efectiva:
                <strong>{{ preferenciasStore.monedaDefaultEfectiva }}</strong>
              </q-banner>
            </div>
            <div v-if="esModoAutomatico" class="q-mt-md column q-gutter-sm">
              <q-banner rounded class="bg-blue-1 text-blue-10">
                País detectado:
                <strong>{{ preferenciasStore.paisDetectado || 'No detectado' }}</strong>
              </q-banner>
              <q-banner v-if="preferenciasStore.monedaDetectada" rounded class="bg-positive text-white">
                Moneda detectada automáticamente:
                <strong>{{ preferenciasStore.monedaDetectada }}</strong>
              </q-banner>
              <q-banner v-else rounded class="bg-warning text-dark">
                No se pudo detectar una moneda por región. Se usa la última moneda manual guardada.
              </q-banner>
            </div>
            <div v-else class="q-mt-md">
              <q-select
                :model-value="preferenciasStore.monedaManual"
                :options="MONEDAS"
                label="Moneda manual"
                emit-value
                map-options
                outlined
                dense
                @update:model-value="cambiarMonedaManual"
              />
            </div>
            <div class="q-mt-md bloque-ayuda-moneda">
              <div class="text-subtitle2">Información de monedas</div>
              <p class="text-body2 q-mt-sm q-mb-none">
                Cambiar la moneda en un precio puntual solo afecta ese registro. No modifica esta
                preferencia global.
              </p>
            </div>
          </div>
        </q-expansion-item>

        <q-expansion-item
          v-model="seccionesAbiertas.datosSincronizacion"
          header-class="cabecera-seccion"
          expand-separator
          icon="sync"
          label="Datos y sincronización"
          :caption="resumenSincronizacion"
        >
          <div class="bloque-contenido">
            <p class="text-caption text-grey-7 q-mt-none q-mb-sm">
              Copia tus datos locales actuales a Firestore sin borrar el almacenamiento local.
            </p>
            <div class="column q-gutter-sm">
              <q-btn
                color="secondary"
                unelevated
                no-caps
                label="Migrar datos locales ahora"
                :loading="usuarioStore.cargandoMigracion"
                @click="manejarMigracionDatos"
              />
              <q-btn
                v-if="esModoDesarrollo"
                color="warning"
                outline
                no-caps
                label="Forzar error controlado de migración (debug)"
                :loading="usuarioStore.cargandoMigracion"
                @click="manejarMigracionConErrorControlado"
              />
              <q-banner v-if="textoResumenMigracion" rounded class="banner-cuenta">
                {{ textoResumenMigracion }}
              </q-banner>
            </div>
          </div>
        </q-expansion-item>

      </q-list>
    </div>

    <ModalConfirmacionReutilizable
      v-model="modalInvitadoAbierto"
      titulo="Modo invitado"
      mensaje="Si continuás como invitado, tus datos se guardarán en este celular. Cuando te registres más adelante, tendrás que migrarlos para mantenerlos."
      texto-principal="Aceptar"
      texto-secundario="Registrarme ahora"
      @accion-principal="confirmarModoInvitado"
      @accion-secundaria="irARegistroDesdeModal"
    />
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { MONEDAS } from '../almacenamiento/constantes/Monedas.js'
import { usePublicidad } from '../composables/usePublicidad.js'
import { usePreferenciasStore } from '../almacenamiento/stores/preferenciasStore.js'
import { useUsuarioStore } from '../almacenamiento/stores/UsuarioStore.js'
import ModalConfirmacionReutilizable from '../components/Compartidos/ModalConfirmacionReutilizable.vue'

const quasar = useQuasar()
const preferenciasStore = usePreferenciasStore()
const usuarioStore = useUsuarioStore()
const { mostrarInterstitial } = usePublicidad()
const ultimoIntersticialMostrado = ref(0)
const cargandoAccionCuenta = ref(false)
const correoCuenta = ref('')
const contrasenaCuenta = ref('')
const mostrarContrasenaCuenta = ref(false)
const modalInvitadoAbierto = ref(false)
const tarjetaCuentaCorreoRef = ref(null)
const perfilEditableNombre = ref('')
const perfilEditableFoto = ref('')
const perfilEditableFechaNacimiento = ref('')
const esModoDesarrollo = import.meta.env.DEV
const TIEMPO_ESPERA_INTERSTICIAL_MS = 60000
const seccionesAbiertas = ref({
  cuentaPerfil: false,
  tema: false,
  monedaRegion: false,
  datosSincronizacion: false,
})
const opcionesModoTema = [
  { label: 'Claro', value: 'claro' },
  { label: 'Oscuro', value: 'oscuro' },
  { label: 'Seguir sistema', value: 'sistema' },
]

const esModoAutomatico = computed(() => preferenciasStore.modoMoneda === 'automatica')
const etiquetaTemaActivo = computed(() => (quasar.dark.isActive ? 'Oscuro' : 'Claro'))
const etiquetaEstadoCuenta = computed(() => {
  if (!usuarioStore.autenticado) return 'Sin sesión'
  if (usuarioStore.esAnonimo) return 'Invitado'
  return usuarioStore.perfil?.email ? `Google (${usuarioStore.perfil.email})` : 'Registrada'
})
const textoResumenMigracion = computed(() => {
  const resumen = usuarioStore.ultimoResumenMigracion
  if (!resumen) return ''

  return `Migración completada. Productos: ${resumen.totalProductos}, comercios: ${resumen.totalComercios}, listas: ${resumen.totalListas}.`
})
const etiquetaEdadPerfil = computed(() => {
  const edad = calcularEdadDesdeFecha(perfilEditableFechaNacimiento.value)
  return Number.isInteger(edad) ? `${edad} años` : 'Sin definir'
})
const resumenCuentaPerfil = computed(() => {
  const nombre = perfilEditableNombre.value?.trim() || 'Sin nombre'
  return `${etiquetaEstadoCuenta.value} - ${nombre}`
})
const resumenTema = computed(() => `Tema activo: ${etiquetaTemaActivo.value}`)
const resumenMoneda = computed(() => {
  const modo = esModoAutomatico.value ? 'Automática' : 'Manual'
  return `${preferenciasStore.monedaDefaultEfectiva} (${modo})`
})
const resumenSincronizacion = computed(() => {
  if (textoResumenMigracion.value) return 'Última migración completada'
  return 'Sin migración reciente'
})

function calcularEdadDesdeFecha(fechaNacimientoIso) {
  if (!fechaNacimientoIso) return null

  const fechaNacimiento = new Date(`${fechaNacimientoIso}T00:00:00`)
  if (Number.isNaN(fechaNacimiento.getTime())) return null

  const hoy = new Date()
  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear()
  const aunNoCumplio =
    hoy.getMonth() < fechaNacimiento.getMonth() ||
    (hoy.getMonth() === fechaNacimiento.getMonth() && hoy.getDate() < fechaNacimiento.getDate())

  if (aunNoCumplio) edad -= 1
  return edad >= 0 ? edad : null
}

function esUrlValida(textoUrl) {
  if (!textoUrl) return true

  try {
    const url = new URL(textoUrl)
    return ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}

function sincronizarFormularioPerfil(perfil) {
  perfilEditableNombre.value = perfil?.nombre || ''
  perfilEditableFoto.value = perfil?.foto || ''
  perfilEditableFechaNacimiento.value = perfil?.fechaNacimiento || ''
}

function validarPerfilEditable() {
  const nombreNormalizado = perfilEditableNombre.value.trim()
  const fotoNormalizada = perfilEditableFoto.value.trim()
  const fechaNacimiento = perfilEditableFechaNacimiento.value

  if (!nombreNormalizado) {
    quasar.notify({ type: 'warning', message: 'El nombre es obligatorio.' })
    return false
  }

  if (!esUrlValida(fotoNormalizada)) {
    quasar.notify({ type: 'warning', message: 'La foto debe ser una URL válida (http/https).' })
    return false
  }

  if (fechaNacimiento) {
    const hoy = new Date()
    const hoyIso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(
      hoy.getDate(),
    ).padStart(2, '0')}`

    if (fechaNacimiento > hoyIso) {
      quasar.notify({ type: 'warning', message: 'La fecha de nacimiento no puede ser futura.' })
      return false
    }
  }

  return true
}

async function mostrarPublicidadConfiguracion() {
  const ahora = Date.now()
  if (ahora - ultimoIntersticialMostrado.value < TIEMPO_ESPERA_INTERSTICIAL_MS) return
  ultimoIntersticialMostrado.value = ahora
  await mostrarInterstitial()
}

async function seleccionarModoTema(modoTema) {
  const yaEstabaSeleccionado = preferenciasStore.modoTema === modoTema

  if (!yaEstabaSeleccionado) {
    await preferenciasStore.guardarModoTema(modoTema)
  }

  await mostrarPublicidadConfiguracion()
}

async function cambiarModoAutomatico(valor) {
  const nuevoModo = valor ? 'automatica' : 'manual'

  if (preferenciasStore.modoMoneda === nuevoModo) return

  await preferenciasStore.guardarModoMoneda(nuevoModo)
  await mostrarPublicidadConfiguracion()
}

async function cambiarMonedaManual(moneda) {
  await preferenciasStore.guardarMonedaManual(moneda)
}

async function manejarEntrarConGoogle() {
  cargandoAccionCuenta.value = true
  const loginOk = await usuarioStore.iniciarSesionConGoogle()

  if (loginOk) {
    quasar.notify({
      type: 'positive',
      message: 'Continuá con Google si se abrió redirección o popup.',
    })
  } else {
    quasar.notify({
      type: 'negative',
      message: usuarioStore.errorSesion || 'No se pudo iniciar sesión con Google.',
    })
  }

  cargandoAccionCuenta.value = false
}

async function manejarContinuarComoInvitado() {
  modalInvitadoAbierto.value = true
}

async function confirmarModoInvitado() {
  modalInvitadoAbierto.value = false
  cargandoAccionCuenta.value = true
  const invitadoOk = await usuarioStore.continuarComoInvitado()

  if (invitadoOk) {
    quasar.notify({ type: 'positive', message: 'Modo invitado activo.' })
  } else {
    quasar.notify({
      type: 'negative',
      message: usuarioStore.errorSesion || 'No se pudo activar modo invitado.',
    })
  }

  cargandoAccionCuenta.value = false
}

function irARegistroDesdeModal() {
  modalInvitadoAbierto.value = false
  if (seccionesAbiertas.value.cuentaPerfil) return

  seccionesAbiertas.value.cuentaPerfil = true
  const elemento = tarjetaCuentaCorreoRef.value?.$el || tarjetaCuentaCorreoRef.value
  if (elemento?.scrollIntoView) {
    elemento.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

function validarCorreoCuenta() {
  if (!correoCuenta.value.trim()) {
    quasar.notify({ type: 'warning', message: 'Ingresá un correo.' })
    return false
  }

  return true
}

function validarCredencialesCuenta() {
  if (!validarCorreoCuenta()) return false

  if (!contrasenaCuenta.value.trim()) {
    quasar.notify({ type: 'warning', message: 'Ingresá una contraseña.' })
    return false
  }

  if (contrasenaCuenta.value.length < 6) {
    quasar.notify({ type: 'warning', message: 'La contraseña debe tener al menos 6 caracteres.' })
    return false
  }

  return true
}

async function manejarEntrarConCorreo() {
  if (!validarCredencialesCuenta()) return

  cargandoAccionCuenta.value = true
  const loginOk = await usuarioStore.iniciarSesionConCorreo(
    correoCuenta.value.trim(),
    contrasenaCuenta.value,
  )

  if (loginOk) {
    quasar.notify({ type: 'positive', message: 'Sesión iniciada con correo.' })
  } else {
    quasar.notify({
      type: 'negative',
      message: usuarioStore.errorSesion || 'No se pudo iniciar sesión con correo.',
    })
  }

  cargandoAccionCuenta.value = false
}

async function manejarCrearCuentaConCorreo() {
  if (!validarCredencialesCuenta()) return

  cargandoAccionCuenta.value = true
  const registroOk = await usuarioStore.registrarConCorreo(
    correoCuenta.value.trim(),
    contrasenaCuenta.value,
  )

  if (registroOk) {
    quasar.notify({ type: 'positive', message: 'Cuenta creada correctamente.' })
  } else {
    quasar.notify({
      type: 'negative',
      message: usuarioStore.errorSesion || 'No se pudo crear la cuenta.',
    })
  }

  cargandoAccionCuenta.value = false
}

async function manejarRecuperarContrasena() {
  if (!validarCorreoCuenta()) return

  cargandoAccionCuenta.value = true
  const envioOk = await usuarioStore.recuperarContrasena(correoCuenta.value.trim())

  if (envioOk) {
    quasar.notify({
      type: 'positive',
      message: 'Te enviamos un correo para recuperar la contraseña.',
    })
  } else {
    quasar.notify({
      type: 'negative',
      message: usuarioStore.errorSesion || 'No se pudo enviar el correo de recuperación.',
    })
  }

  cargandoAccionCuenta.value = false
}

async function manejarMigracionDatos() {
  if (!usuarioStore.tieneSesionActiva) {
    quasar.notify({
      type: 'warning',
      message: 'Necesitás una sesión activa antes de migrar datos.',
    })
    return
  }

  quasar
    .dialog({
      title: 'Confirmar migración',
      message: 'Se copiarán tus datos locales actuales hacia Firestore. ¿Continuar?',
      persistent: true,
      ok: { label: 'Migrar', color: 'secondary' },
      cancel: { label: 'Cancelar', flat: true },
    })
    .onOk(async () => {
      const resumen = await usuarioStore.migrarDatosLocales()

      if (resumen) {
        quasar.notify({ type: 'positive', message: 'Migración completada en Firebase.' })
        return
      }

      quasar.notify({
        type: 'negative',
        message: usuarioStore.errorMigracion || 'No se pudo completar la migración.',
      })
    })
}

async function manejarMigracionConErrorControlado() {
  if (!usuarioStore.tieneSesionActiva) {
    quasar.notify({
      type: 'warning',
      message: 'Necesitás una sesión activa antes de migrar datos.',
    })
    return
  }

  const resumen = await usuarioStore.migrarDatosLocales({ forzarErrorControlado: true })
  if (resumen) {
    quasar.notify({
      type: 'warning',
      message: 'La prueba de error controlado no falló como se esperaba.',
    })
    return
  }

  quasar.notify({
    type: 'info',
    message: 'Error controlado de migración ejecutado correctamente.',
  })
}

async function manejarGuardarPerfilEditable() {
  if (!usuarioStore.tieneSesionActiva) {
    quasar.notify({ type: 'warning', message: 'Necesitás una sesión activa para guardar perfil.' })
    return
  }

  if (!validarPerfilEditable()) return

  const perfilOk = await usuarioStore.actualizarPerfilEditable({
    nombre: perfilEditableNombre.value.trim(),
    foto: perfilEditableFoto.value.trim(),
    fechaNacimiento: perfilEditableFechaNacimiento.value,
  })

  if (perfilOk) {
    quasar.notify({ type: 'positive', message: 'Perfil actualizado correctamente.' })
    return
  }

  quasar.notify({
    type: 'negative',
    message: usuarioStore.errorPerfil || 'No se pudo guardar el perfil.',
  })
}

watch(
  () => usuarioStore.perfil,
  (perfil) => {
    sincronizarFormularioPerfil(perfil)
  },
  { immediate: true },
)

onMounted(async () => {
  if (preferenciasStore.modoMoneda === 'automatica' && !preferenciasStore.paisDetectado) {
    await preferenciasStore.detectarMonedaAutomatica()
  }
})
</script>

<style scoped>
.configuracion-page {
  background: var(--fondo-app-secundario);
}
.contenedor-configuracion {
  max-width: 720px;
  margin: 0 auto;
  padding-bottom: 20px;
}
.contenedor-acordeon {
  border-radius: 12px;
  background: var(--fondo-tarjeta);
  border: 1px solid var(--borde-color);
  overflow: hidden;
}
.cabecera-seccion {
  color: var(--texto-primario);
  min-height: 64px;
  padding: 6px 4px;
}
.bloque-contenido {
  padding: 18px 16px;
}
.bloque-contenido + .bloque-contenido {
  padding-top: 14px;
}
.bloque-contenido .text-subtitle2 {
  margin-bottom: 6px;
}
.bloque-contenido .text-caption {
  line-height: 1.4;
}
.bloque-contenido .q-banner {
  border-radius: 10px;
}
.bloque-ayuda-moneda {
  margin-top: 14px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--borde-color);
  background: var(--fondo-banner-informativo);
  color: var(--texto-primario);
}
.bloque-correo-form {
  margin-top: 2px;
  padding: 12px;
  border: 1px solid var(--borde-color);
  border-radius: 10px;
  background: var(--fondo-banner-suave);
}
.input-cuenta :deep(.q-field__control) {
  background: var(--fondo-tarjeta) !important;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--color-primario) 28%, var(--borde-color));
  min-height: 44px;
  overflow: hidden;
  padding-left: 0;
  padding-right: 0;
}
.input-cuenta :deep(.q-field:hover .q-field__control),
.input-cuenta :deep(.q-field.q-field--highlighted .q-field__control),
.input-cuenta :deep(.q-field.q-field--focused .q-field__control) {
  background: var(--fondo-tarjeta) !important;
}
.input-cuenta :deep(.q-field__control-container),
.input-cuenta :deep(.q-field__native),
.input-cuenta :deep(.q-field__append),
.input-cuenta :deep(.q-field__prepend),
.input-cuenta :deep(.q-field__marginal) {
  background: var(--fondo-tarjeta) !important;
}
.input-cuenta :deep(.q-field:hover .q-field__control-container),
.input-cuenta :deep(.q-field.q-field--highlighted .q-field__control-container),
.input-cuenta :deep(.q-field.q-field--focused .q-field__control-container),
.input-cuenta :deep(.q-field:hover .q-field__native),
.input-cuenta :deep(.q-field.q-field--highlighted .q-field__native),
.input-cuenta :deep(.q-field.q-field--focused .q-field__native),
.input-cuenta :deep(.q-field:hover .q-field__append),
.input-cuenta :deep(.q-field.q-field--highlighted .q-field__append),
.input-cuenta :deep(.q-field.q-field--focused .q-field__append),
.input-cuenta :deep(.q-field:hover .q-field__marginal),
.input-cuenta :deep(.q-field.q-field--highlighted .q-field__marginal),
.input-cuenta :deep(.q-field.q-field--focused .q-field__marginal) {
  background: var(--fondo-tarjeta) !important;
}
.input-cuenta :deep(.q-field__native),
.input-cuenta :deep(.q-field__label) {
  color: var(--texto-primario);
}
.input-cuenta :deep(.q-field__native) {
  padding-left: 12px;
  padding-right: 12px;
}
.input-cuenta :deep(.q-field__label) {
  opacity: 0.8;
  left: 12px;
}
.input-cuenta :deep(.q-field__append) {
  padding-left: 6px;
  padding-right: 6px;
}
.input-cuenta :deep(.q-field--filled .q-field__control:before),
.input-cuenta :deep(.q-field--filled .q-field__control:after) {
  display: none;
}
.input-cuenta :deep(.q-field--focused .q-field__control) {
  border-color: var(--color-primario);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-primario) 40%, transparent);
}
.input-cuenta :deep(.q-btn.q-btn--round) {
  background: color-mix(in srgb, var(--color-primario) 14%, transparent);
  color: var(--texto-primario);
  border: 1px solid color-mix(in srgb, var(--color-primario) 34%, var(--borde-color));
}
.input-cuenta :deep(.q-field__append .q-btn) {
  margin: 0;
}
.input-cuenta :deep(.q-btn.q-btn--round .q-icon) {
  font-size: 18px;
}
.input-cuenta :deep(.q-focus-helper) {
  display: none;
}
.boton-ojo-cuenta {
  box-shadow: none;
}
.input-cuenta :deep(input:-webkit-autofill),
.input-cuenta :deep(input:-webkit-autofill:hover),
.input-cuenta :deep(input:-webkit-autofill:focus) {
  -webkit-text-fill-color: var(--texto-primario);
  -webkit-box-shadow: 0 0 0 1000px var(--fondo-tarjeta) inset;
  transition: background-color 9999s ease-out 0s;
}
.acciones-correo {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 2px;
}
.boton-accion-correo {
  min-height: 42px;
}
.selector-modo-tema {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.boton-modo-tema {
  color: var(--texto-primario);
  background: var(--fondo-tarjeta);
  border: 1px solid var(--borde-color);
  min-height: 42px;
}
.boton-modo-tema-activo {
  background: color-mix(in srgb, var(--color-primario) 16%, var(--fondo-tarjeta));
  border-color: color-mix(in srgb, var(--color-primario) 52%, var(--borde-color));
  color: var(--texto-primario);
}
.banner-tema-efectivo {
  background: var(--fondo-banner-suave);
  color: var(--texto-primario);
  border: 1px solid var(--borde-color);
}
.banner-tema-info {
  background: var(--fondo-banner-informativo);
  color: var(--texto-primario);
  border: 1px solid var(--borde-color);
}
.banner-moneda-efectiva {
  background: var(--fondo-banner-suave);
  color: var(--texto-primario);
  border: 1px solid var(--borde-color);
}
.banner-cuenta {
  background: var(--fondo-banner-suave);
  color: var(--texto-primario);
  border: 1px solid var(--borde-color);
}
@media (max-width: 640px) {
  .contenedor-configuracion {
    padding-left: 2px;
    padding-right: 2px;
  }
  .cabecera-seccion {
    min-height: 60px;
  }
  .bloque-contenido {
    padding: 14px 12px;
  }
  .acciones-correo {
    grid-template-columns: 1fr;
  }
  .selector-modo-tema {
    grid-template-columns: 1fr;
  }
}
</style>
