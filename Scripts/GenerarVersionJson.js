import { execSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rutaRaiz = path.resolve(__dirname, '..')

function obtenerOwnerRepoDesdeRemote() {
  try {
    const urlRemote = execSync('git remote get-url origin', {
      cwd: rutaRaiz,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()

    const coincidenciaHttp = urlRemote.match(/github\.com[:/](?<owner>[^/]+)\/(?<repo>[^/.]+)(?:\.git)?$/i)
    if (coincidenciaHttp?.groups?.owner && coincidenciaHttp?.groups?.repo) {
      return {
        owner: coincidenciaHttp.groups.owner,
        repo: coincidenciaHttp.groups.repo,
      }
    }
  } catch {
    // Si falla git, se usan variables de entorno o valores vacíos.
  }

  return {
    owner: process.env.GITHUB_OWNER || '',
    repo: process.env.GITHUB_REPO || '',
  }
}

async function leerJson(rutaRelativa, valorPredeterminado = null) {
  const rutaAbsoluta = path.join(rutaRaiz, rutaRelativa)
  try {
    const contenido = await readFile(rutaAbsoluta, 'utf8')
    return JSON.parse(contenido)
  } catch (error) {
    if (error.code === 'ENOENT' && valorPredeterminado !== null) {
      return valorPredeterminado
    }
    throw error
  }
}

function construirUrlPlayStore(appId) {
  if (!appId) return ''
  return `https://play.google.com/store/apps/details?id=${appId}`
}

function construirUrlVersion(owner, repo) {
  if (!owner || !repo) return ''
  return `https://${owner}.github.io/${repo}/version.json`
}

function crearContenidoConstantes(datos) {
  const lineas = [
    '// Archivo generado automáticamente por Scripts/GenerarVersionJson.js',
    '// No editar manualmente: ejecutar `npm run generarVersionJson`.',
    `export const versionLocalBuild = '${datos.versionDisponible}'`,
    `export const urlVersionRemota = '${datos.urlVersionRemota}'`,
    `export const urlPlayStoreDefecto = '${datos.urlPlayStore}'`,
  ]

  return `${lineas.join('\n')}\n`
}

async function main() {
  const packageJson = await leerJson('package.json')
  const capacitorConfig = await leerJson('capacitor.config.json')
  const versionJsonActual = await leerJson('public/version.json', {})
  const catalogoIdiomas = await leerJson('src/i18n/IdiomasApp.json', {
    idiomas: [{ codigoApp: 'es-AR', habilitado: true }],
  })
  const { owner, repo } = obtenerOwnerRepoDesdeRemote()

  const versionDisponible = packageJson.version || '0.0.0'
  const urlPlayStoreCalculada = construirUrlPlayStore(capacitorConfig.appId)
  const urlVersionCalculada = construirUrlVersion(owner, repo)

  const urlPlayStore = process.env.URL_PLAY_STORE || urlPlayStoreCalculada
  const urlVersionRemota = process.env.URL_VERSION_REMOTA || urlVersionCalculada
  const cambiosActuales =
    versionJsonActual.cambios && typeof versionJsonActual.cambios === 'object'
      ? versionJsonActual.cambios
      : {}
  const idiomasHabilitados = Array.isArray(catalogoIdiomas.idiomas)
    ? catalogoIdiomas.idiomas.filter((idioma) => idioma.habilitado && idioma.codigoApp)
    : []
  const cambios = Object.fromEntries(
    idiomasHabilitados.map((idioma) => [
      idioma.codigoApp,
      cambiosActuales[idioma.codigoApp] ?? [],
    ]),
  )

  const versionJson = {
    versionDisponible,
    urlPlayStore,
    mostrarActualizacion: versionJsonActual.mostrarActualizacion === true,
    cambios,
  }

  const rutaPublic = path.join(rutaRaiz, 'public')
  const rutaConstantes = path.join(rutaRaiz, 'src', 'almacenamiento', 'constantes')
  await mkdir(rutaPublic, { recursive: true })
  await mkdir(rutaConstantes, { recursive: true })

  await writeFile(path.join(rutaPublic, 'version.json'), `${JSON.stringify(versionJson, null, 2)}\n`, 'utf8')
  await writeFile(
    path.join(rutaConstantes, 'ActualizacionApp.js'),
    crearContenidoConstantes({ ...versionJson, urlVersionRemota }),
    'utf8',
  )

  console.log('version.json y constantes de actualización generados.')
}

main().catch((error) => {
  console.error('Error al generar version.json:', error)
  process.exit(1)
})
