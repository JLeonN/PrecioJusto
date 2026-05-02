import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { deleteApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc, getFirestore, setDoc, serverTimestamp } from 'firebase/firestore'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const raizProyecto = path.resolve(__dirname, '..')

function cargarEnvLocal() {
  const rutas = [path.join(raizProyecto, '.env.local'), path.join(raizProyecto, '.env')]

  rutas.forEach((rutaEnv) => {
    if (!fs.existsSync(rutaEnv)) return
    const contenido = fs.readFileSync(rutaEnv, 'utf8')
    contenido.split(/\r?\n/).forEach((linea) => {
      const limpia = linea.trim()
      if (!limpia || limpia.startsWith('#')) return
      const indice = limpia.indexOf('=')
      if (indice < 1) return
      const clave = limpia.slice(0, indice).trim()
      const valor = limpia.slice(indice + 1).trim().replace(/^['"]|['"]$/g, '')
      if (!process.env[clave]) {
        process.env[clave] = valor
      }
    })
  })
}

function obtenerConfigFirebase() {
  const campos = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ]

  const faltantes = campos.filter((clave) => !process.env[clave])
  if (faltantes.length > 0) {
    throw new Error(`Faltan variables de entorno: ${faltantes.join(', ')}`)
  }

  return {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
  }
}

function esperarCodigoPermisoDenegado(error) {
  return error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')
}

async function ejecutar() {
  cargarEnvLocal()
  const configFirebase = obtenerConfigFirebase()

  const correoA = process.argv[2]
  const contrasenaA = process.argv[3]
  const correoB = process.argv[4]
  const contrasenaB = process.argv[5]

  if (!correoA || !contrasenaA || !correoB || !contrasenaB) {
    throw new Error(
      'Uso: node Scripts/VerificarAislamientoFirestore.js <correoA> <contrasenaA> <correoB> <contrasenaB>',
    )
  }

  const appA = initializeApp(configFirebase, `verificadorA-${Date.now()}`)
  const appB = initializeApp(configFirebase, `verificadorB-${Date.now()}`)
  const authA = getAuth(appA)
  const authB = getAuth(appB)
  const dbA = getFirestore(appA)
  const dbB = getFirestore(appB)

  const credA = await signInWithEmailAndPassword(authA, correoA, contrasenaA)
  const credB = await signInWithEmailAndPassword(authB, correoB, contrasenaB)
  const uidA = credA.user.uid
  const uidB = credB.user.uid

  const intentoId = `aislamiento_${Date.now()}`
  const docPropioA = doc(dbA, 'users', uidA, 'pruebasIntegracion', intentoId)
  const docAjenoDesdeA = doc(dbA, 'users', uidB, 'pruebasIntegracion', intentoId)
  const docAjenoDesdeB = doc(dbB, 'users', uidA, 'pruebasIntegracion', intentoId)

  await setDoc(
    docPropioA,
    {
      tipo: 'propio',
      intentoId,
      creadoEn: serverTimestamp(),
    },
    { merge: true },
  )

  let escrituraAjenaDenegadaA = false
  let lecturaAjenaDenegadaA = false
  let escrituraAjenaDenegadaB = false

  try {
    await setDoc(
      docAjenoDesdeA,
      {
        tipo: 'ajeno_desde_a',
        intentoId,
        creadoEn: serverTimestamp(),
      },
      { merge: true },
    )
  } catch (error) {
    escrituraAjenaDenegadaA = esperarCodigoPermisoDenegado(error)
  }

  try {
    await getDoc(docAjenoDesdeA)
  } catch (error) {
    lecturaAjenaDenegadaA = esperarCodigoPermisoDenegado(error)
  }

  try {
    await setDoc(
      docAjenoDesdeB,
      {
        tipo: 'ajeno_desde_b',
        intentoId,
        creadoEn: serverTimestamp(),
      },
      { merge: true },
    )
  } catch (error) {
    escrituraAjenaDenegadaB = esperarCodigoPermisoDenegado(error)
  }

  const resultado = {
    uidA,
    uidB,
    intentoId,
    escrituraPropiaA: true,
    escrituraAjenaDenegadaA,
    lecturaAjenaDenegadaA,
    escrituraAjenaDenegadaB,
    ok:
      escrituraAjenaDenegadaA === true &&
      lecturaAjenaDenegadaA === true &&
      escrituraAjenaDenegadaB === true,
  }

  console.log(JSON.stringify(resultado, null, 2))

  await signOut(authA)
  await signOut(authB)
  if (getApps().length > 0) {
    await Promise.all(getApps().map((app) => deleteApp(app)))
  }

  if (!resultado.ok) {
    process.exitCode = 2
  }
}

ejecutar().catch((error) => {
  console.error('Error en verificación de aislamiento Firestore:', error)
  process.exitCode = 1
})
