<template>
  <q-page class="q-pa-md">
    <div class="contenedor-gracias">
      <div class="icono-corazon" :class="{ 'icono-corazon-activo': animarCorazon }">
        <IconHeart :size="76" />
      </div>

      <h5 class="titulo-gracias">Gracias por tu apoyo</h5>
      <p class="texto-gracias">Tu apoyo ayuda a mantener Precio Justo gratis.</p>

      <div class="acciones-apoyo">
        <p class="texto-explicacion-video">
          Mirar un video ayuda a mantener la app gratuita.
        </p>
        <q-btn
          color="primary"
          label="Mirar video y dar gracias"
          icon="favorite"
          unelevated
          no-caps
          :disable="!esPlataformaNativa"
          :loading="procesandoVideo"
          class="boton-gracias"
          @click="darGracias"
        />
        <p v-if="!esPlataformaNativa" class="texto-disponibilidad-video">
          El video de apoyo está disponible desde la app Android.
        </p>
        <q-btn
          color="secondary"
          :label="etiquetaCompartir"
          icon="share"
          outline
          no-caps
          :loading="procesandoCompartir"
          class="boton-compartir"
          @click="compartirApp"
        />
      </div>

      <div v-if="tieneApoyos" class="resumen-apoyos">
        <div class="contador-apoyo contador-videos">
          <q-icon name="favorite" size="22px" />
          <strong class="numero-apoyo">{{ apoyos.graciasVideo }}</strong>
          <span class="etiqueta-apoyo">{{ etiquetaVideos }}</span>
        </div>
        <div class="contador-apoyo contador-compartidos">
          <q-icon name="share" size="22px" />
          <strong class="numero-apoyo">{{ apoyos.compartidosIniciados }}</strong>
          <span class="etiqueta-apoyo">{{ etiquetaCompartidos }}</span>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { useQuasar } from 'quasar'
import { IconHeart } from '@tabler/icons-vue'
import { usePublicidad } from '../composables/usePublicidad.js'
import { useCompartirApp } from '../composables/useCompartirApp.js'
import apoyosAppService from '../almacenamiento/servicios/ApoyosAppService.js'
import firestorePerfilService from '../almacenamiento/servicios/FirestorePerfilService.js'
import { useUsuarioStore } from '../almacenamiento/stores/UsuarioStore.js'

const $q = useQuasar()
const { mostrarRecompensado } = usePublicidad()
const { compartirApp: compartirAppNativa, puedeCompartir } = useCompartirApp()
const usuarioStore = useUsuarioStore()

const apoyos = ref({ graciasVideo: 0, compartidosIniciados: 0 })
const nombreUsuario = ref('')
const procesandoVideo = ref(false)
const procesandoCompartir = ref(false)
const animarCorazon = ref(false)
const esPlataformaNativa = Capacitor.isNativePlatform()
const compartirNativoDisponible = ref(false)

const tieneApoyos = computed(
  () => apoyos.value.graciasVideo > 0 || apoyos.value.compartidosIniciados > 0,
)
const etiquetaCompartir = computed(() =>
  compartirNativoDisponible.value ? 'Compartir la app' : 'Copiar enlace',
)
const etiquetaVideos = computed(() => (apoyos.value.graciasVideo === 1 ? 'video visto' : 'videos vistos'))
const etiquetaCompartidos = computed(() =>
  apoyos.value.compartidosIniciados === 1 ? 'vez compartida' : 'veces compartida',
)

onMounted(async () => {
  apoyos.value = await apoyosAppService.obtenerApoyos()
  compartirNativoDisponible.value = await puedeCompartir()
  await cargarNombreUsuario()
})

async function cargarNombreUsuario() {
  nombreUsuario.value = usuarioStore.nombre
  if (!usuarioStore.estaAutenticado) return

  try {
    const perfil = await firestorePerfilService.obtenerPerfilUsuario()
    nombreUsuario.value = perfil?.nombreUsuario || usuarioStore.nombre
  } catch (error) {
    console.warn('No se pudo cargar el nombre para compartir.', error)
  }
}

function activarAnimacionApoyo() {
  animarCorazon.value = false
  window.requestAnimationFrame(() => {
    animarCorazon.value = true
  })
  window.setTimeout(() => {
    animarCorazon.value = false
  }, 700)
}

const darGracias = async () => {
  procesandoVideo.value = true

  try {
    const videoCompletado = await mostrarRecompensado()
    if (!videoCompletado) return

    apoyos.value = await apoyosAppService.incrementarGraciasVideo()
    activarAnimacionApoyo()
    $q.notify({
      type: 'positive',
      message: obtenerMensajeGracias(apoyos.value.graciasVideo),
      position: 'top',
      timeout: 1800,
    })
  } finally {
    procesandoVideo.value = false
  }
}

const compartirApp = async () => {
  procesandoCompartir.value = true

  try {
    const resultado = await compartirAppNativa(nombreUsuario.value)
    if (!resultado.exito) return

    if (resultado.contabilizar) {
      apoyos.value = await apoyosAppService.incrementarCompartidosIniciados()
      activarAnimacionApoyo()
      $q.notify({
        type: 'positive',
        message:
          resultado.tipo === 'copiado'
            ? 'Enlace copiado para compartir. Gracias por apoyar Precio Justo.'
            : 'Gracias por compartir Precio Justo.',
        position: 'top',
        timeout: 1800,
      })
      return
    }

    $q.notify({
      type: 'positive',
      message: 'Enlace copiado para compartir.',
      position: 'top',
      timeout: 1800,
    })
  } catch {
    $q.notify({
      type: 'negative',
      message: 'No se pudo preparar el enlace para compartir.',
      position: 'top',
      timeout: 1800,
    })
  } finally {
    procesandoCompartir.value = false
  }
}

function obtenerMensajeGracias(contadorGracias) {
  const mensajesIniciales = [
    'Gracias por tu apoyo.',
    'Cada gracias ayuda a que Precio Justo siga creciendo.',
    'Tu apoyo ayuda mucho. Gracias.',
    'Gracias por ser parte de Precio Justo.',
  ]
  const mensajesHitos = {
    1: 'Tu primer gracias hace una diferencia. Gracias por apoyar Precio Justo.',
    10: 'Ya diste 10 gracias. Muchas gracias por tu apoyo.',
    25: '25 gracias recibidos. Gracias por estar ahí.',
    50: '50 gracias recibidos. Tu apoyo es enorme.',
    100: '100 gracias recibidos. Gracias por acompañar este proyecto.',
  }

  if (mensajesHitos[contadorGracias]) return mensajesHitos[contadorGracias]
  return mensajesIniciales[(contadorGracias - 2) % mensajesIniciales.length]
}
</script>

<style scoped>
.contenedor-gracias {
  min-height: calc(100vh - 180px);
  max-width: 520px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 12px;
}
.icono-corazon {
  color: var(--color-error);
  display: flex;
  align-items: center;
  justify-content: center;
}
.icono-corazon-activo {
  animation: latido-apoyo 700ms ease-in-out;
}
.titulo-gracias {
  margin: 0;
  font-weight: 700;
  color: var(--texto-primario);
}
.texto-gracias {
  margin: 0;
  color: var(--texto-secundario);
  line-height: 1.45;
}
.acciones-apoyo {
  width: min(100%, 330px);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
}
.texto-explicacion-video,
.texto-disponibilidad-video {
  margin: 0;
  color: var(--texto-secundario);
  line-height: 1.4;
}
.texto-explicacion-video {
  font-size: 0.92rem;
}
.texto-disponibilidad-video {
  font-size: 0.82rem;
}
.boton-gracias,
.boton-compartir {
  min-height: 44px;
}
.resumen-apoyos {
  width: min(100%, 330px);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 4px;
  padding: 12px 0;
  border-top: 1px solid var(--borde-color);
  border-bottom: 1px solid var(--borde-color);
}
.contador-apoyo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.contador-videos {
  color: var(--color-error);
}
.contador-compartidos {
  color: var(--color-secundario);
  border-left: 1px solid var(--borde-color);
}
.numero-apoyo {
  font-size: 1.55rem;
  line-height: 1;
}
.etiqueta-apoyo {
  color: var(--texto-secundario);
  font-size: 0.82rem;
}
@keyframes latido-apoyo {
  0%,
  100% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.14);
  }
}
</style>
