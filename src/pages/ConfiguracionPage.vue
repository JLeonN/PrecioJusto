<template>
  <q-page class="q-pa-md configuracion-page">
    <div class="contenedor-configuracion">
      <div class="q-mb-md">
        <h5 class="q-my-none">Configuración</h5>
        <p class="text-grey-7 q-mt-xs q-mb-none">Preferencias globales de la app</p>
      </div>
      <q-card flat bordered>
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">Modo oscuro</div>
          <p class="text-caption text-grey-7 q-mt-xs q-mb-none">
            Elegí cómo querés que se vea la app: claro, oscuro o automático según el sistema.
          </p>
        </q-card-section>
        <q-separator />
        <q-card-section>
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
        </q-card-section>
      </q-card>
      <q-card flat bordered class="q-mt-md">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">Moneda predeterminada</div>
          <p class="text-caption text-grey-7 q-mt-xs q-mb-none">
            Esta moneda se usa como valor inicial en formularios nuevos.
          </p>
        </q-card-section>
        <q-separator />
        <q-card-section>
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
        </q-card-section>
      </q-card>
      <q-card flat bordered class="q-mt-md">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">Cuenta</div>
          <p class="text-caption text-grey-7 q-mt-xs q-mb-none">
            Podés usar la app con Google o como invitado.
          </p>
        </q-card-section>
        <q-separator />
        <q-card-section class="column q-gutter-sm">
          <q-banner rounded class="banner-cuenta">
            Estado:
            <strong>{{ etiquetaEstadoCuenta }}</strong>
          </q-banner>
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
        </q-card-section>
      </q-card>
      <q-card flat bordered class="q-mt-md">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">Migración a Firebase</div>
          <p class="text-caption text-grey-7 q-mt-xs q-mb-none">
            Copia tus datos locales actuales a Firestore sin borrar el almacenamiento local.
          </p>
        </q-card-section>
        <q-separator />
        <q-card-section class="column q-gutter-sm">
          <q-btn
            color="secondary"
            unelevated
            no-caps
            label="Migrar datos locales ahora"
            :loading="usuarioStore.cargandoMigracion"
            @click="manejarMigracionDatos"
          />
          <q-banner v-if="textoResumenMigracion" rounded class="banner-cuenta">
            {{ textoResumenMigracion }}
          </q-banner>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="q-mt-md">
        <q-card-section>
          <div class="text-subtitle2">Importante</div>
          <p class="text-body2 q-mt-sm q-mb-none">
            Cambiar la moneda en un precio puntual solo afecta ese registro. No modifica esta
            preferencia global.
          </p>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { MONEDAS } from '../almacenamiento/constantes/Monedas.js'
import { usePublicidad } from '../composables/usePublicidad.js'
import { usePreferenciasStore } from '../almacenamiento/stores/preferenciasStore.js'
import { useUsuarioStore } from '../almacenamiento/stores/UsuarioStore.js'

const quasar = useQuasar()
const preferenciasStore = usePreferenciasStore()
const usuarioStore = useUsuarioStore()
const { mostrarInterstitial } = usePublicidad()
const ultimoIntersticialMostrado = ref(0)
const cargandoAccionCuenta = ref(false)
const TIEMPO_ESPERA_INTERSTICIAL_MS = 60000
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
  return usuarioStore.perfil?.email ? `Google (${usuarioStore.perfil.email})` : 'Google'
})
const textoResumenMigracion = computed(() => {
  const resumen = usuarioStore.ultimoResumenMigracion
  if (!resumen) return ''

  return `Migración completada. Productos: ${resumen.totalProductos}, comercios: ${resumen.totalComercios}, listas: ${resumen.totalListas}.`
})

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
    quasar.notify({ type: 'positive', message: 'Sesión con Google iniciada.' })
  } else {
    quasar.notify({
      type: 'negative',
      message: usuarioStore.errorSesion || 'No se pudo iniciar sesión con Google.',
    })
  }

  cargandoAccionCuenta.value = false
}

async function manejarContinuarComoInvitado() {
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

async function manejarMigracionDatos() {
  if (!usuarioStore.tieneSesionActiva) {
    quasar.notify({
      type: 'warning',
      message: 'Necesitas una sesión activa antes de migrar datos.',
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
}
.selector-modo-tema {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.boton-modo-tema {
  color: var(--texto-primario);
  background: var(--fondo-tarjeta);
  border: 1px solid var(--borde-color);
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
  .selector-modo-tema {
    grid-template-columns: 1fr;
  }
}
</style>
