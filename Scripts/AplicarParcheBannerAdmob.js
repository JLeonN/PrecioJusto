import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rutaRaiz = path.resolve(__dirname, '..')
const rutaArchivo = path.join(
  rutaRaiz,
  'node_modules',
  '@capacitor-community',
  'admob',
  'android',
  'src',
  'main',
  'java',
  'com',
  'getcapacitor',
  'community',
  'admob',
  'banner',
  'BannerExecutor.java',
)

async function main() {
  let contenidoArchivo

  try {
    contenidoArchivo = await readFile(rutaArchivo, 'utf8')
  } catch {
    console.log('[Parche AdMob] No se encontró BannerExecutor.java, se omite el ajuste.')
    return
  }

  const contenidoActualizado = contenidoArchivo
    .replace('mAdViewLayoutParams.gravity = Gravity.TOP;', 'mAdViewLayoutParams.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;')
    .replace(
      'mAdViewLayoutParams.gravity = Gravity.BOTTOM;',
      'mAdViewLayoutParams.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;',
    )

  if (contenidoActualizado === contenidoArchivo) {
    console.log('[Parche AdMob] El banner ya estaba centrado o el archivo cambió, no se hizo nada.')
    return
  }

  await writeFile(rutaArchivo, contenidoActualizado, 'utf8')
  console.log('[Parche AdMob] Banner Android centrado horizontalmente.')
}

main().catch((error) => {
  console.error('[Parche AdMob] Error al aplicar el ajuste del banner:', error)
  process.exit(1)
})
