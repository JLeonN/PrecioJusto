<template>
  <q-page class="acceso-page flex flex-center q-pa-md">
    <q-card class="tarjeta-acceso">
      <q-card-section class="q-pb-none">
        <div class="text-h6 text-weight-bold">Bienvenido a Precio Justo</div>
        <p class="text-caption text-grey-7 q-mt-sm q-mb-none">
          Elegí cómo querés empezar. Después vas a entrar directo con tu sesión activa.
        </p>
      </q-card-section>

      <q-card-section class="q-gutter-sm">
        <q-btn
          color="primary"
          unelevated
          no-caps
          class="full-width"
          label="Entrar con Google"
          :loading="cargandoAcceso"
          @click="manejarEntrarConGoogle"
        />
        <InputFormularioReutilizable
          v-model="correoCuenta"
          label="Correo"
          type="email"
          autocomplete="email"
        />
        <InputFormularioReutilizable
          v-model="contrasenaCuenta"
          label="Contraseña"
          :type="mostrarContrasena ? 'text' : 'password'"
          autocomplete="current-password"
        >
          <template #append>
            <q-btn
              flat
              round
              dense
              :icon="mostrarContrasena ? 'visibility_off' : 'visibility'"
              @click="mostrarContrasena = !mostrarContrasena"
            />
          </template>
        </InputFormularioReutilizable>
        <div class="acciones-correo">
          <q-btn
            color="primary"
            no-caps
            class="full-width"
            label="Entrar con correo"
            :loading="cargandoAcceso"
            @click="manejarEntrarConCorreo"
          />
          <q-btn
            outline
            color="primary"
            no-caps
            class="full-width"
            label="Crear cuenta"
            :loading="cargandoAcceso"
            @click="manejarCrearCuenta"
          />
        </div>
        <q-btn
          outline
          color="primary"
          no-caps
          class="full-width"
          label="Continuar como invitado"
          :loading="cargandoAcceso"
          @click="manejarInvitado"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useUsuarioStore } from 'src/almacenamiento/stores/UsuarioStore.js'
import InputFormularioReutilizable from 'src/components/Compartidos/InputFormularioReutilizable.vue'

const quasar = useQuasar()
const router = useRouter()
const usuarioStore = useUsuarioStore()

const cargandoAcceso = ref(false)
const correoCuenta = ref('')
const contrasenaCuenta = ref('')
const mostrarContrasena = ref(false)

function validarCorreo() {
  if (!correoCuenta.value.trim()) {
    quasar.notify({ type: 'warning', message: 'Ingresá un correo.' })
    return false
  }
  return true
}

function validarCredenciales() {
  if (!validarCorreo()) return false
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

async function cerrarFlujo(ok, mensajeError) {
  if (ok) {
    usuarioStore.marcarAccesoInicialCompletado()
    await router.replace('/')
    return
  }
  quasar.notify({ type: 'negative', message: mensajeError || 'No se pudo iniciar.' })
}

async function manejarEntrarConGoogle() {
  cargandoAcceso.value = true
  const ok = await usuarioStore.iniciarSesionConGoogle()
  await cerrarFlujo(ok, usuarioStore.errorSesion)
  cargandoAcceso.value = false
}

async function manejarEntrarConCorreo() {
  if (!validarCredenciales()) return
  cargandoAcceso.value = true
  const ok = await usuarioStore.iniciarSesionConCorreo(correoCuenta.value.trim(), contrasenaCuenta.value)
  await cerrarFlujo(ok, usuarioStore.errorSesion)
  cargandoAcceso.value = false
}

async function manejarCrearCuenta() {
  if (!validarCredenciales()) return
  cargandoAcceso.value = true
  const ok = await usuarioStore.registrarConCorreo(correoCuenta.value.trim(), contrasenaCuenta.value)
  await cerrarFlujo(ok, usuarioStore.errorSesion)
  cargandoAcceso.value = false
}

async function manejarInvitado() {
  cargandoAcceso.value = true
  const ok = await usuarioStore.continuarComoInvitado()
  await cerrarFlujo(ok, usuarioStore.errorSesion)
  cargandoAcceso.value = false
}
</script>

<style scoped>
.acceso-page {
  background: var(--fondo-app-secundario);
}
.tarjeta-acceso {
  width: 100%;
  max-width: 460px;
  border: 1px solid var(--borde-color);
  background: var(--fondo-tarjeta);
  border-radius: 12px;
}
.acciones-correo {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
@media (max-width: 520px) {
  .acciones-correo {
    grid-template-columns: 1fr;
  }
}
</style>

