<template>
  <q-page class="q-pa-md configuracion-page">
    <div class="contenedor-configuracion">
      <div class="q-mb-md">
        <h5 class="q-my-none">Configuración</h5>
        <p class="text-grey-7 q-mt-xs q-mb-none">Preferencias globales de la app</p>
      </div>
      <q-card flat bordered>
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">Cuenta</div>
          <p class="text-caption text-grey-7 q-mt-xs q-mb-none">
            {{ textoEstadoCuenta }}
          </p>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="fila-cuenta">
            <div>
              <div class="text-body2 text-weight-medium">{{ etiquetaCuenta }}</div>
              <div class="text-caption text-grey-7">Los datos locales se conservan al cerrar sesión.</div>
            </div>
            <q-btn
              no-caps
              unelevated
              :color="usuarioStore.estaAutenticado ? 'negative' : 'primary'"
              :label="usuarioStore.estaAutenticado ? 'Cerrar sesión' : 'Ingresar'"
              :loading="usuarioStore.cargandoAccion"
              @click="gestionarCuenta"
            />
          </div>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="q-mt-md">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">Fuente de datos</div>
          <p class="text-caption text-grey-7 q-mt-xs q-mb-none">
            Firestore es la lectura principal con sesión Firebase; local queda como respaldo.
          </p>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="grilla-fuentes-datos">
            <q-banner
              v-for="estado in estadosFuenteDatos"
              :key="estado.dominio"
              rounded
              class="banner-fuente-datos"
            >
              <div class="text-body2 text-weight-medium">{{ estado.etiquetaDominio }}</div>
              <div class="text-caption">
                {{ estado.etiquetaFuente }} · {{ estado.mensaje }}
              </div>
            </q-banner>
          </div>
        </q-card-section>
      </q-card>
      <q-card v-if="usuarioStore.estaAutenticado" flat bordered class="q-mt-md">
        <q-card-section>
          <div class="fila-migracion">
            <div>
              <div class="text-subtitle1 text-weight-medium">Migración local a Firebase</div>
              <p class="text-caption text-grey-7 q-mt-xs q-mb-none">
                Datos privados se migran con backup local previo; la app sigue leyendo local.
              </p>
            </div>
            <q-btn
              no-caps
              outline
              color="primary"
              label="Actualizar"
              :loading="cargandoMigracion"
              @click="cargarPanelMigracion"
            />
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="grilla-conteos">
            <q-banner rounded class="banner-migracion">
              Productos: <strong>{{ conteosMigracion.productos }}</strong>
            </q-banner>
            <q-banner rounded class="banner-migracion">
              Precios: <strong>{{ conteosMigracion.precios }}</strong>
            </q-banner>
            <q-banner rounded class="banner-migracion">
              Comercios: <strong>{{ conteosMigracion.comercios }}</strong>
            </q-banner>
            <q-banner rounded class="banner-migracion">
              Direcciones: <strong>{{ conteosMigracion.direcciones }}</strong>
            </q-banner>
            <q-banner rounded class="banner-migracion">
              Listas: <strong>{{ conteosMigracion.listas }}</strong>
            </q-banner>
            <q-banner rounded class="banner-migracion">
              Items: <strong>{{ conteosMigracion.itemsListaJusta }}</strong>
            </q-banner>
            <q-banner rounded class="banner-migracion">
              Preferencias: <strong>{{ conteosMigracion.preferencias }}</strong>
            </q-banner>
            <q-banner rounded class="banner-migracion">
              Confirmaciones: <strong>{{ conteosMigracion.confirmaciones }}</strong>
            </q-banner>
            <q-banner rounded class="banner-migracion">
              Fotos producto: <strong>{{ conteosMigracion.fotosProductos }}</strong>
            </q-banner>
            <q-banner rounded class="banner-migracion">
              Fotos comercio: <strong>{{ conteosMigracion.fotosComercios }}</strong>
            </q-banner>
            <q-banner rounded class="banner-migracion">
              Fotos listas: <strong>{{ conteosMigracion.fotosListas }}</strong>
            </q-banner>
          </div>
          <q-linear-progress v-if="cargandoMigracion" indeterminate color="primary" class="q-mt-md" />
          <q-banner rounded class="banner-tema-info q-mt-md">
            Estado: <strong>{{ textoEstadoMigracion }}</strong> · Conexión:
            <strong>{{ textoConexionMigracion }}</strong>
          </q-banner>
          <q-banner
            v-if="estadoMigracion?.errores?.length"
            rounded
            class="bg-warning text-dark q-mt-sm"
          >
            {{ estadoMigracion.errores.length }} error(es) reintentables. Los datos locales y el
            backup se conservan.
          </q-banner>
          <div class="fila-acciones-migracion q-mt-md">
            <q-btn
              no-caps
              unelevated
              color="secondary"
              label="Crear backup"
              :loading="cargandoMigracion"
              @click="prepararBackupMigracion"
            />
            <q-btn
              no-caps
              unelevated
              color="primary"
              label="Migrar"
              :loading="cargandoMigracion"
              @click="confirmarMigracion"
            />
            <q-btn
              v-if="puedeReintentarMigracion"
              no-caps
              outline
              color="warning"
              label="Reintentar"
              :loading="cargandoMigracion"
              @click="reintentarMigracion"
            />
          </div>
        </q-card-section>
      </q-card>
      <q-card flat bordered class="q-mt-md">
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
import { useRouter } from 'vue-router'
import { MONEDAS } from '../almacenamiento/constantes/Monedas.js'
import { ESTADOS_MIGRACION_FIREBASE } from '../almacenamiento/constantes/PreparacionFirebase.js'
import { usePublicidad } from '../composables/usePublicidad.js'
import fuentePrincipalFirestoreService from '../almacenamiento/servicios/FuentePrincipalFirestoreService.js'
import { useConfirmacionesStore } from '../almacenamiento/stores/confirmacionesStore.js'
import { useListaJustaStore } from '../almacenamiento/stores/ListaJustaStore.js'
import { usePreferenciasStore } from '../almacenamiento/stores/preferenciasStore.js'
import { useProductosStore } from '../almacenamiento/stores/productosStore.js'
import { useSesionEscaneoStore } from '../almacenamiento/stores/sesionEscaneoStore.js'
import { useUsuarioStore } from '../almacenamiento/stores/UsuarioStore.js'
import { useComerciStore } from '../almacenamiento/stores/comerciosStore.js'
import conexionService from '../almacenamiento/servicios/ConexionService.js'
import migracionLocalFirebaseService from '../almacenamiento/servicios/MigracionLocalFirebaseService.js'
import preferenciasService from '../almacenamiento/servicios/PreferenciasService.js'

const quasar = useQuasar()
const router = useRouter()
const preferenciasStore = usePreferenciasStore()
const usuarioStore = useUsuarioStore()
const productosStore = useProductosStore()
const sesionEscaneoStore = useSesionEscaneoStore()
const comerciosStore = useComerciStore()
const listaJustaStore = useListaJustaStore()
const confirmacionesStore = useConfirmacionesStore()
const { mostrarInterstitial } = usePublicidad()
const ultimoIntersticialMostrado = ref(0)
const resumenMigracion = ref(null)
const estadoMigracion = ref(null)
const conexionMigracion = ref(null)
const cargandoMigracion = ref(false)
const TIEMPO_ESPERA_INTERSTICIAL_MS = 60000
const opcionesModoTema = [
  { label: 'Claro', value: 'claro' },
  { label: 'Oscuro', value: 'oscuro' },
  { label: 'Seguir sistema', value: 'sistema' },
]

const esModoAutomatico = computed(() => preferenciasStore.modoMoneda === 'automatica')
const etiquetaTemaActivo = computed(() => (quasar.dark.isActive ? 'Oscuro' : 'Claro'))
const etiquetaCuenta = computed(() => usuarioStore.email || 'Sin sesión iniciada')
const textoEstadoCuenta = computed(() =>
  usuarioStore.estaAutenticado
    ? 'Sesión activa con Firebase Auth.'
    : 'Ingresá para usar la app con una cuenta Firebase.',
)
const conteosMigracion = computed(
  () =>
    resumenMigracion.value?.conteosMigrables || {
      productos: 0,
      precios: 0,
      comercios: 0,
      direcciones: 0,
      listas: 0,
      itemsListaJusta: 0,
      preferencias: 0,
      confirmaciones: 0,
      fotosProductos: 0,
      fotosComercios: 0,
      fotosListas: 0,
    },
)
const textoEstadoMigracion = computed(() => estadoMigracion.value?.estado || 'sinIniciar')
const textoConexionMigracion = computed(() =>
  conexionMigracion.value?.conectado ? 'activa' : 'sin conexión',
)
const puedeReintentarMigracion = computed(() =>
  [ESTADOS_MIGRACION_FIREBASE.PARCIAL, ESTADOS_MIGRACION_FIREBASE.ERROR].includes(
    estadoMigracion.value?.estado,
  ),
)
const estadosFuenteDatos = computed(() => {
  const estados = [
    { dominio: 'productos', etiquetaDominio: 'Productos', estado: productosStore.fuenteDatos },
    { dominio: 'comercios', etiquetaDominio: 'Comercios', estado: comerciosStore.fuenteDatos },
    { dominio: 'listas', etiquetaDominio: 'Listas', estado: listaJustaStore.fuenteDatos },
    {
      dominio: 'mesaTrabajo',
      etiquetaDominio: 'Mesa de trabajo',
      estado: sesionEscaneoStore.fuenteDatos,
    },
    { dominio: 'preferencias', etiquetaDominio: 'Preferencias', estado: preferenciasStore.fuenteDatos },
    {
      dominio: 'confirmaciones',
      etiquetaDominio: 'Confirmaciones',
      estado: confirmacionesStore.fuenteDatos,
    },
  ]

  return estados.map(({ dominio, etiquetaDominio, estado }) => ({
    dominio,
    etiquetaDominio,
    etiquetaFuente: fuentePrincipalFirestoreService.obtenerEtiquetaFuente(estado?.fuente),
    mensaje: estado?.mensaje || 'Sin carga registrada.',
  }))
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

async function gestionarCuenta() {
  if (!usuarioStore.estaAutenticado) {
    await router.push('/acceso')
    return
  }

  quasar
    .dialog({
      title: 'Cerrar sesión',
      message: 'No se borrarán productos, comercios, listas ni preferencias locales.',
      cancel: true,
      persistent: true,
      ok: {
        label: 'Cerrar sesión',
        color: 'negative',
        noCaps: true,
      },
    })
    .onOk(async () => {
      await usuarioStore.cerrarSesion()
      quasar.notify({
        type: 'positive',
        message: 'Sesión cerrada.',
      })
      await router.push('/acceso')
    })
}

async function cargarPanelMigracion() {
  if (!usuarioStore.estaAutenticado) return

  cargandoMigracion.value = true

  try {
    const [resumen, estado, conexion] = await Promise.all([
      migracionLocalFirebaseService.obtenerResumenLocal(),
      migracionLocalFirebaseService.obtenerEstadoActual(),
      conexionService.obtenerEstadoConexion(),
    ])
    resumenMigracion.value = resumen
    estadoMigracion.value = estado
    conexionMigracion.value = conexion
  } catch (error) {
    quasar.notify({
      type: 'warning',
      message: error.message || 'No se pudo cargar el panel de migración.',
    })
  } finally {
    cargandoMigracion.value = false
  }
}

async function prepararBackupMigracion() {
  await ejecutarAccionMigracion(async () => {
    estadoMigracion.value = await migracionLocalFirebaseService.prepararMigracionLocal()
    quasar.notify({
      type: 'positive',
      message: 'Backup local creado y verificado.',
    })
  })
}

function confirmarMigracion() {
  quasar
    .dialog({
      title: 'Migrar datos locales',
      message:
        'Se creará o usará un backup local previo. Firestore no será fuente principal todavía y no se borrarán datos locales.',
      cancel: true,
      persistent: true,
      ok: {
        label: 'Migrar datos',
        color: 'primary',
        noCaps: true,
      },
    })
    .onOk(async () => {
      await ejecutarAccionMigracion(async () => {
        estadoMigracion.value = await migracionLocalFirebaseService.iniciarMigracion({
          confirmarMigracion: true,
        })
        notificarResultadoMigracion()
      })
    })
}

async function reintentarMigracion() {
  await ejecutarAccionMigracion(async () => {
    estadoMigracion.value = await migracionLocalFirebaseService.reintentarMigracion()
    notificarResultadoMigracion()
  })
}

async function ejecutarAccionMigracion(accion) {
  cargandoMigracion.value = true

  try {
    await accion()
    await cargarPanelMigracion()
  } catch (error) {
    quasar.notify({
      type: 'negative',
      message: error.message || 'No se pudo ejecutar la migración.',
    })
  } finally {
    cargandoMigracion.value = false
  }
}

function notificarResultadoMigracion() {
  const estado = estadoMigracion.value?.estado
  quasar.notify({
    type: estado === ESTADOS_MIGRACION_FIREBASE.COMPLETADA ? 'positive' : 'warning',
    message:
      estado === ESTADOS_MIGRACION_FIREBASE.COMPLETADA
        ? 'Migración completada y validada.'
        : 'Migración parcial. Revisá errores y reintentá cuando haya conexión.',
  })
}

async function cargarDiagnosticoPreferenciasDev() {
  if (!import.meta.env.DEV || !usuarioStore.estaAutenticado) return

  const diagnostico = await preferenciasService.obtenerDiagnosticoSincronizacion()

  console.info('Diagnóstico preferencias local/firestore', {
    firestoreDisponible: diagnostico.firestoreDisponible,
    mensajeFirestore: diagnostico.mensajeFirestore,
    local: diagnostico.local,
    firestore: diagnostico.firestore,
  })
}

onMounted(async () => {
  if (preferenciasStore.modoMoneda === 'automatica' && !preferenciasStore.paisDetectado) {
    await preferenciasStore.detectarMonedaAutomatica()
  }
  await cargarPanelMigracion()
  await cargarDiagnosticoPreferenciasDev()
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
.fila-cuenta {
  display: flex;
  gap: var(--espaciado-md);
  align-items: center;
  justify-content: space-between;
}
.fila-migracion {
  display: flex;
  gap: var(--espaciado-md);
  align-items: center;
  justify-content: space-between;
}
.grilla-conteos {
  display: grid;
  gap: var(--espaciado-sm);
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.banner-migracion {
  background: var(--fondo-banner-suave);
  color: var(--texto-primario);
  border: 1px solid var(--borde-color);
}
.grilla-fuentes-datos {
  display: grid;
  gap: var(--espaciado-sm);
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.banner-fuente-datos {
  background: var(--fondo-banner-suave);
  color: var(--texto-primario);
  border: 1px solid var(--borde-color);
}
.fila-acciones-migracion {
  display: flex;
  gap: var(--espaciado-sm);
  flex-wrap: wrap;
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
@media (max-width: 640px) {
  .fila-cuenta {
    align-items: stretch;
    flex-direction: column;
  }
  .fila-migracion {
    align-items: stretch;
    flex-direction: column;
  }
  .grilla-conteos {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .grilla-fuentes-datos {
    grid-template-columns: 1fr;
  }
  .selector-modo-tema {
    grid-template-columns: 1fr;
  }
}
</style>
