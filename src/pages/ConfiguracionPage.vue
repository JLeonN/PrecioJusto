<template>
  <q-page class="q-pa-md configuracion-page">
    <div class="contenedor-configuracion">
      <div class="q-mb-md">
        <h5 class="q-my-none">Configuración</h5>
      </div>
      <q-list bordered class="lista-configuracion">
        <q-expansion-item group="configuracion" icon="account_circle" label="Cuenta" :caption="resumenCuenta">
          <q-card flat>
            <q-card-section>
              <div v-if="usuarioStore.estaAutenticado" class="column q-gutter-md">
                <q-banner rounded class="banner-tema-info">
                  <div class="text-body2 text-weight-medium">{{ usuarioStore.email }}</div>
                  <div class="text-caption">Los datos de la cuenta se guardan en Firebase.</div>
                </q-banner>
                <q-input
                  v-model="formularioPerfil.nombreUsuario"
                  label="Nombre de usuario"
                  outlined
                  dense
                  maxlength="60"
                  :disable="guardandoPerfil"
                />
                <q-input
                  v-model="formularioPerfil.fechaNacimiento"
                  label="Fecha de nacimiento (opcional)"
                  type="date"
                  outlined
                  dense
                  :disable="guardandoPerfil"
                />
                <div class="fila-acciones-panel">
                  <q-btn
                    no-caps
                    unelevated
                    color="primary"
                    label="Guardar perfil"
                    :loading="guardandoPerfil"
                    @click="guardarPerfilUsuario"
                  />
                  <q-btn
                    no-caps
                    outline
                    color="negative"
                    label="Cerrar sesión"
                    :loading="usuarioStore.cargandoAccion"
                    @click="gestionarCuenta"
                  />
                </div>
              </div>
              <div v-else class="column q-gutter-md">
                <q-banner rounded class="banner-tema-info">
                  Iniciá sesión para guardar tus datos en tu cuenta y usarlos en otros dispositivos.
                </q-banner>
                <q-btn
                  no-caps
                  unelevated
                  color="primary"
                  label="Ingresar"
                  :loading="usuarioStore.cargandoAccion"
                  @click="gestionarCuenta"
                />
              </div>
            </q-card-section>
          </q-card>
        </q-expansion-item>
        <q-separator />
        <q-expansion-item group="configuracion" icon="palette" label="Apariencia" :caption="resumenApariencia">
          <q-card flat>
            <q-card-section>
              <p class="text-body2 q-mt-none">
                Elegí cómo querés ver la app. Si usás "Según el sistema", la app sigue el tema del
                celular.
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
              <q-banner rounded class="banner-tema-efectivo q-mt-md">
                Tema activo: <strong>{{ etiquetaTemaActivo }}</strong>
              </q-banner>
            </q-card-section>
          </q-card>
        </q-expansion-item>
        <q-separator />
        <q-expansion-item group="configuracion" icon="payments" label="Moneda" :caption="resumenMoneda">
          <q-card flat>
            <q-card-section>
              <p class="text-body2 q-mt-none">
                La moneda principal se usa como valor por defecto al crear precios nuevos.
              </p>
              <q-toggle
                :model-value="esModoAutomatico"
                label="Usar moneda automática según país"
                color="primary"
                @update:model-value="cambiarModoAutomatico"
              />
              <q-banner rounded class="banner-moneda-efectiva q-mt-md">
                Moneda actual: <strong>{{ preferenciasStore.monedaDefaultEfectiva }}</strong>
              </q-banner>
              <div v-if="esModoAutomatico" class="q-mt-md column q-gutter-sm">
                <q-banner rounded class="bg-blue-1 text-blue-10">
                  País detectado: <strong>{{ preferenciasStore.paisDetectado || 'No detectado' }}</strong>
                </q-banner>
                <q-banner v-if="preferenciasStore.monedaDetectada" rounded class="bg-positive text-white">
                  Moneda detectada automáticamente:
                  <strong>{{ preferenciasStore.monedaDetectada }}</strong>
                </q-banner>
                <q-banner v-else rounded class="bg-warning text-dark">
                  No se pudo detectar una moneda por región. Se usa la última moneda manual guardada.
                </q-banner>
              </div>
              <q-select
                v-else
                :model-value="preferenciasStore.monedaManual"
                :options="MONEDAS"
                label="Moneda manual"
                emit-value
                map-options
                outlined
                dense
                class="q-mt-md"
                @update:model-value="cambiarMonedaManual"
              />
              <q-banner rounded class="banner-tema-info q-mt-md">
                Cambiar la moneda no modifica precios ya guardados. Solo cambia el valor por defecto
                para nuevos precios.
              </q-banner>
            </q-card-section>
          </q-card>
        </q-expansion-item>
        <q-separator />
        <q-expansion-item
          group="configuracion"
          icon="sync"
          label="Datos y sincronización"
          :caption="resumenSincronizacion"
        >
          <q-card flat>
            <q-card-section>
              <div class="column q-gutter-md">
                <q-banner rounded class="banner-tema-info">
                  Tus datos se guardan en tu cuenta cuando iniciás sesión. Este dispositivo conserva
                  una copia local como respaldo.
                </q-banner>
                <q-banner rounded class="banner-moneda-efectiva">
                  Estado: <strong>{{ resumenSincronizacion }}</strong>
                </q-banner>
                <q-btn
                  no-caps
                  outline
                  color="primary"
                  label="Actualizar estado"
                  :loading="cargandoMigracion"
                  @click="cargarPanelMigracion"
                />
              </div>
            </q-card-section>
          </q-card>
        </q-expansion-item>
        <q-separator />
        <q-expansion-item
          group="configuracion"
          icon="science"
          label="Herramientas de prueba"
          caption="Información técnica para revisar Firebase"
        >
          <q-card flat>
            <q-card-section>
              <q-banner rounded class="banner-tema-info">
                Información técnica para revisar sincronización mientras probás la app.
              </q-banner>
            </q-card-section>
            <q-card-section>
              <div class="text-subtitle1 text-weight-medium">Fuente de datos</div>
              <p class="text-caption text-grey-7 q-mt-xs">
                Firestore es la lectura principal con sesión Firebase; local queda como respaldo.
              </p>
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
            <q-separator />
            <q-card-section v-if="usuarioStore.estaAutenticado">
              <div class="fila-migracion">
                <div>
                  <div class="text-subtitle1 text-weight-medium">Migración local a Firebase</div>
                  <p class="text-caption text-grey-7 q-mt-xs q-mb-none">
                    Datos privados se migran con copia local previa; la app conserva respaldo local.
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
              <div class="grilla-conteos q-mt-md">
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
                {{ estadoMigracion.errores.length }} error(es) reintentables. Los datos locales y la
                copia se conservan.
              </q-banner>
              <div class="fila-acciones-migracion q-mt-md">
                <q-btn
                  no-caps
                  unelevated
                  color="secondary"
                  label="Crear copia"
                  :loading="cargandoMigracion"
                  @click="prepararBackupMigracion"
                />
                <q-btn
                  no-caps
                  unelevated
                  color="primary"
                  label="Pasar datos a mi cuenta"
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
            <q-card-section v-else>
              <q-banner rounded class="banner-tema-info">
                Iniciá sesión para revisar herramientas de Firebase.
              </q-banner>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </q-list>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
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
import firestorePerfilService from '../almacenamiento/servicios/FirestorePerfilService.js'
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
const cargandoPerfil = ref(false)
const guardandoPerfil = ref(false)
const formularioPerfil = ref({
  nombreUsuario: '',
  fechaNacimiento: '',
})
const TIEMPO_ESPERA_INTERSTICIAL_MS = 60000
const opcionesModoTema = [
  { label: 'Claro', value: 'claro' },
  { label: 'Oscuro', value: 'oscuro' },
  { label: 'Según el sistema', value: 'sistema' },
]

const esModoAutomatico = computed(() => preferenciasStore.modoMoneda === 'automatica')
const etiquetaTemaActivo = computed(() => (quasar.dark.isActive ? 'Oscuro' : 'Claro'))
const etiquetaModoTema = computed(() => {
  const etiquetas = {
    claro: 'Claro',
    oscuro: 'Oscuro',
    sistema: 'Según el sistema',
  }

  return etiquetas[preferenciasStore.modoTema] || 'Según el sistema'
})
const resumenCuenta = computed(() => {
  if (!usuarioStore.estaAutenticado) return 'Sin sesión iniciada'
  return formularioPerfil.value.nombreUsuario || usuarioStore.email || 'Sesión activa'
})
const resumenApariencia = computed(() => `Actual: ${etiquetaModoTema.value}`)
const resumenMoneda = computed(() => `Actual: ${preferenciasStore.monedaDefaultEfectiva}`)
const resumenSincronizacion = computed(() =>
  usuarioStore.estaAutenticado ? 'Sincronización activa' : 'Solo datos de este dispositivo',
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

function limpiarFormularioPerfil() {
  formularioPerfil.value = {
    nombreUsuario: '',
    fechaNacimiento: '',
  }
}

async function cargarPerfilUsuario() {
  if (!usuarioStore.estaAutenticado) {
    limpiarFormularioPerfil()
    return
  }

  cargandoPerfil.value = true

  try {
    const perfil = await firestorePerfilService.obtenerPerfilUsuario()
    formularioPerfil.value = {
      nombreUsuario: perfil?.nombreUsuario || usuarioStore.nombre || '',
      fechaNacimiento: perfil?.fechaNacimiento || '',
    }
  } catch (error) {
    quasar.notify({
      type: 'warning',
      message: error.message || 'No se pudo cargar el perfil.',
    })
  } finally {
    cargandoPerfil.value = false
  }
}

async function guardarPerfilUsuario() {
  if (!usuarioStore.estaAutenticado) return

  guardandoPerfil.value = true

  try {
    await firestorePerfilService.guardarPerfil({
      nombreUsuario: formularioPerfil.value.nombreUsuario,
      fechaNacimiento: formularioPerfil.value.fechaNacimiento || null,
    })
    quasar.notify({
      type: 'positive',
      message: 'Perfil guardado.',
    })
  } catch (error) {
    quasar.notify({
      type: 'negative',
      message: error.message || 'No se pudo guardar el perfil.',
    })
  } finally {
    guardandoPerfil.value = false
  }
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
      limpiarFormularioPerfil()
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
      message: 'Copia local creada y verificada.',
    })
  })
}

function confirmarMigracion() {
  quasar
    .dialog({
      title: 'Pasar datos a mi cuenta',
      message:
        'Se creará o usará una copia local previa. Tus datos locales no se borrarán al terminar.',
      cancel: true,
      persistent: true,
      ok: {
        label: 'Pasar datos',
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
        ? 'Datos pasados a tu cuenta y validados.'
        : 'Quedaron datos pendientes. Revisá errores y reintentá cuando haya conexión.',
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
  await Promise.all([cargarPerfilUsuario(), cargarPanelMigracion(), cargarDiagnosticoPreferenciasDev()])
})

watch(
  () => usuarioStore.usuarioId,
  async () => {
    await Promise.all([cargarPerfilUsuario(), cargarPanelMigracion()])
  },
)
</script>

<style scoped>
.configuracion-page {
  background: var(--fondo-app-secundario);
}
.contenedor-configuracion {
  max-width: 720px;
  margin: 0 auto;
}
.lista-configuracion {
  background: var(--fondo-tarjeta);
  border-color: var(--borde-color);
  border-radius: 8px;
  overflow: hidden;
}
.fila-acciones-panel {
  display: flex;
  gap: var(--espaciado-sm);
  flex-wrap: wrap;
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
