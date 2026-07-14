<template>
  <div class="autenticacion-page">
    <section class="panel-autenticacion">
      <div class="encabezado-autenticacion">
        <div class="marca-autenticacion">Precio Justo</div>
        <h1>{{ tituloModo }}</h1>
        <p>{{ textoModo }}</p>
      </div>
      <q-card flat bordered class="tarjeta-autenticacion">
        <q-card-section>
          <q-tabs
            v-if="modo !== 'vinculacionGoogle'"
            v-model="modo"
            dense
            no-caps
            active-color="primary"
            indicator-color="primary"
            align="justify"
            @update:model-value="manejarCambioModo"
          >
            <q-tab name="ingreso" label="Ingresar" />
            <q-tab name="registro" label="Crear cuenta" />
            <q-tab name="recuperacion" label="Recuperar" />
          </q-tabs>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-form class="formulario-autenticacion" @submit.prevent="enviarFormulario">
            <q-input
              v-if="modo === 'registro'"
              v-model.trim="nombre"
              label="Nombre"
              outlined
              dense
              autocomplete="name"
            />
            <q-input
              v-model.trim="correo"
              label="Correo"
              type="email"
              outlined
              dense
              autocomplete="email"
              :rules="[validarCorreo]"
              :disable="modo === 'vinculacionGoogle'"
              lazy-rules
            />
            <q-input
              v-if="modo !== 'recuperacion'"
              v-model="contrasena"
              label="Contraseña"
              :type="mostrarContrasena ? 'text' : 'password'"
              outlined
              dense
              autocomplete="current-password"
              :rules="[validarContrasena]"
              lazy-rules
            >
              <template #append>
                <q-btn
                  flat
                  dense
                  round
                  :icon="mostrarContrasena ? 'visibility_off' : 'visibility'"
                  @click="mostrarContrasena = !mostrarContrasena"
                />
              </template>
            </q-input>
            <q-input
              v-if="modo === 'registro'"
              v-model="confirmacionContrasena"
              label="Confirmar contraseña"
              :type="mostrarContrasena ? 'text' : 'password'"
              outlined
              dense
              autocomplete="new-password"
              :rules="[validarConfirmacionContrasena]"
              lazy-rules
            />
            <q-banner v-if="mensajeError" rounded class="banner-error">
              {{ mensajeError }}
            </q-banner>
            <q-btn
              class="boton-autenticacion"
              color="primary"
              type="submit"
              unelevated
              no-caps
              :label="etiquetaBoton"
              :loading="usuarioStore.cargandoAccion"
              :disable="usuarioStore.cargandoAccion"
            >
              <template #loading>
                <span>{{ etiquetaBoton }}</span>
              </template>
            </q-btn>
            <template v-if="modo === 'ingreso' || modo === 'registro'">
              <q-separator />
              <q-btn
                class="boton-autenticacion boton-google"
                outline
                no-caps
                icon="account_circle"
                type="button"
                label="Continuar con Google"
                :loading="usuarioStore.cargandoAccion"
                :disable="usuarioStore.cargandoAccion"
                @click="manejarIngresoGoogle"
              />
            </template>
            <q-btn
              v-if="modo === 'vinculacionGoogle'"
              flat
              no-caps
              type="button"
              label="Volver a ingresar"
              :disable="usuarioStore.cargandoAccion"
              @click="volverAIngreso"
            />
          </q-form>
        </q-card-section>
      </q-card>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { useUsuarioStore } from '../almacenamiento/stores/UsuarioStore.js'
import {
  MENSAJES_VALIDACION_AUTH,
  esCorreoValido,
} from '../almacenamiento/servicios/MensajesErroresFirebaseAuth.js'

const quasar = useQuasar()
const route = useRoute()
const router = useRouter()
const usuarioStore = useUsuarioStore()
const modo = ref('ingreso')
const nombre = ref('')
const correo = ref('')
const contrasena = ref('')
const confirmacionContrasena = ref('')
const mostrarContrasena = ref(false)
const mensajeErrorLocal = ref('')

const tituloModo = computed(() => {
  if (modo.value === 'registro') return 'Crear cuenta'
  if (modo.value === 'recuperacion') return 'Recuperar acceso'
  if (modo.value === 'vinculacionGoogle') return 'Vincular cuenta de Google'
  return 'Ingresar'
})
const textoModo = computed(() => {
  if (modo.value === 'registro') return 'Creá tu cuenta para guardar tus datos.'
  if (modo.value === 'recuperacion') {
    return 'Ingresá tu correo y te enviaremos un enlace para recuperar el acceso.'
  }
  if (modo.value === 'vinculacionGoogle') {
    return 'Esta cuenta ya usa contraseña. Ingresala para vincular Google sin perder tus datos.'
  }
  return 'Entrá para usar tus datos locales de Precio Justo.'
})
const etiquetaBoton = computed(() => {
  if (usuarioStore.cargandoAccion) {
    if (modo.value === 'registro') return 'Creando cuenta…'
    if (modo.value === 'recuperacion') return 'Enviando…'
    if (modo.value === 'vinculacionGoogle') return 'Vinculando…'
    return 'Ingresando…'
  }

  if (modo.value === 'registro') return 'Crear cuenta'
  if (modo.value === 'recuperacion') return 'Enviar correo'
  if (modo.value === 'vinculacionGoogle') return 'Vincular Google'
  return 'Ingresar'
})
const mensajeError = computed(() => mensajeErrorLocal.value || usuarioStore.error)

function limpiarEstadoFormulario() {
  mensajeErrorLocal.value = ''
  usuarioStore.limpiarError()
}

function validarCorreo(valor) {
  const correoNormalizado = String(valor || '').trim()
  if (!correoNormalizado) return MENSAJES_VALIDACION_AUTH.correoVacio
  return esCorreoValido(correoNormalizado) || MENSAJES_VALIDACION_AUTH.correoInvalido
}

function manejarCambioModo(nuevoModo) {
  if (nuevoModo !== 'vinculacionGoogle') {
    usuarioStore.cancelarVinculacionGoogle()
  }

  limpiarEstadoFormulario()
}

function volverAIngreso() {
  usuarioStore.cancelarVinculacionGoogle()
  contrasena.value = ''
  modo.value = 'ingreso'
  limpiarEstadoFormulario()
}

function validarContrasena(valor) {
  if (!valor) return MENSAJES_VALIDACION_AUTH.contrasenaVacia

  if (modo.value === 'registro' && valor.length < 6) {
    return MENSAJES_VALIDACION_AUTH.contrasenaNoValida
  }

  return true
}

function validarConfirmacionContrasena(valor) {
  if (!valor) return MENSAJES_VALIDACION_AUTH.confirmacionVacia
  return valor === contrasena.value || MENSAJES_VALIDACION_AUTH.contrasenasDistintas
}

function obtenerRutaDestino() {
  return typeof route.query.redirigir === 'string' ? route.query.redirigir : '/'
}

async function enviarFormulario() {
  limpiarEstadoFormulario()

  try {
    if (!validarCamposFormulario()) return

    if (modo.value === 'vinculacionGoogle') {
      await usuarioStore.vincularGoogleConCorreo({
        correo: correo.value,
        contrasena: contrasena.value,
      })
      await router.replace(obtenerRutaDestino())
      return
    }

    if (modo.value === 'registro') {
      await usuarioStore.registrarUsuario({
        correo: correo.value,
        contrasena: contrasena.value,
        nombre: nombre.value || correo.value.split('@')[0],
      })
      await router.replace(obtenerRutaDestino())
      return
    }

    if (modo.value === 'recuperacion') {
      await usuarioStore.recuperarContrasena(correo.value)
      quasar.notify({
        type: 'positive',
        message: MENSAJES_VALIDACION_AUTH.recuperacionEnviada,
      })
      modo.value = 'ingreso'
      return
    }

    await usuarioStore.iniciarSesion({
      correo: correo.value,
      contrasena: contrasena.value,
    })
    await router.replace(obtenerRutaDestino())
  } catch (error) {
    mensajeErrorLocal.value = error.message || 'No se pudo completar la autenticación.'
  }
}

async function manejarIngresoGoogle() {
  limpiarEstadoFormulario()

  try {
    await usuarioStore.iniciarSesionConGoogle()
    await router.replace(obtenerRutaDestino())
  } catch (error) {
    if (error.code === 'auth/account-exists-with-different-credential') {
      correo.value = error.correo || correo.value
      contrasena.value = ''
      confirmacionContrasena.value = ''
      modo.value = 'vinculacionGoogle'
    }

    mensajeErrorLocal.value = error.message || 'No se pudo completar la autenticación.'
  }
}

function validarCamposFormulario() {
  const validacionCorreo = validarCorreo(correo.value)
  if (validacionCorreo !== true) {
    mensajeErrorLocal.value = validacionCorreo
    return false
  }

  if (modo.value === 'recuperacion') return true

  const validacionContrasena = validarContrasena(contrasena.value)
  if (validacionContrasena !== true) {
    mensajeErrorLocal.value = validacionContrasena
    return false
  }

  if (modo.value !== 'registro') return true

  const validacionConfirmacion = validarConfirmacionContrasena(confirmacionContrasena.value)
  if (validacionConfirmacion !== true) {
    mensajeErrorLocal.value = validacionConfirmacion
    return false
  }

  return true
}
</script>

<style scoped>
.autenticacion-page {
  min-height: 100vh;
  background: var(--fondo-app-secundario);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--espaciado-lg);
}
.panel-autenticacion {
  width: min(100%, 420px);
}
.encabezado-autenticacion {
  margin-bottom: var(--espaciado-md);
}
.marca-autenticacion {
  color: var(--color-primario);
  font-size: 0.95rem;
  font-weight: 700;
}
.encabezado-autenticacion h1 {
  color: var(--texto-primario);
  font-size: 2rem;
  line-height: 1.15;
  margin: var(--espaciado-xs) 0;
}
.encabezado-autenticacion p {
  color: var(--texto-secundario);
  margin: 0;
}
.tarjeta-autenticacion {
  background: var(--fondo-tarjeta);
  border-color: var(--borde-color);
  border-radius: var(--borde-radio);
}
.formulario-autenticacion {
  display: grid;
  gap: var(--espaciado-md);
}
.banner-error {
  background: var(--color-error-fondo-suave);
  color: var(--color-error);
  border: 1px solid var(--color-error-borde);
}
.boton-autenticacion {
  min-height: 42px;
}
.boton-google {
  color: var(--texto-primario);
  border-color: var(--borde-color);
}
@media (max-width: 480px) {
  .autenticacion-page {
    align-items: flex-start;
    padding: var(--espaciado-md);
  }
  .encabezado-autenticacion h1 {
    font-size: 1.7rem;
  }
}
</style>
