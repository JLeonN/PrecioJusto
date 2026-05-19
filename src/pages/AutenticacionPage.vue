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
            v-model="modo"
            dense
            no-caps
            active-color="primary"
            indicator-color="primary"
            align="justify"
            @update:model-value="limpiarEstadoFormulario"
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
  return 'Ingresar'
})
const textoModo = computed(() => {
  if (modo.value === 'registro') return 'Tu sesión queda lista para la futura sincronización.'
  if (modo.value === 'recuperacion') return 'Te enviamos un correo para cambiar la contraseña.'
  return 'Entrá para usar tus datos locales de Precio Justo.'
})
const etiquetaBoton = computed(() => {
  if (modo.value === 'registro') return 'Crear cuenta'
  if (modo.value === 'recuperacion') return 'Enviar correo'
  return 'Ingresar'
})
const mensajeError = computed(() => mensajeErrorLocal.value || usuarioStore.error)

function limpiarEstadoFormulario() {
  mensajeErrorLocal.value = ''
  usuarioStore.limpiarError()
}

function validarCorreo(valor) {
  const correoNormalizado = String(valor || '').trim()
  const esValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoNormalizado)
  return esValido || 'Ingresá un correo válido.'
}

function validarContrasena(valor) {
  if (!valor) return 'Ingresá una contraseña.'

  if (modo.value === 'registro' && valor.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres.'
  }

  return true
}

function validarConfirmacionContrasena(valor) {
  return valor === contrasena.value || 'Las contraseñas no coinciden.'
}

function obtenerRutaDestino() {
  return typeof route.query.redirigir === 'string' ? route.query.redirigir : '/'
}

async function enviarFormulario() {
  limpiarEstadoFormulario()

  try {
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
        message: 'Correo de recuperación enviado.',
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
