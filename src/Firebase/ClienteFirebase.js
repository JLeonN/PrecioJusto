import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const camposFirebase = [
  { campo: 'apiKey', variable: 'API_KEY' },
  { campo: 'authDomain', variable: 'AUTH_DOMAIN' },
  { campo: 'projectId', variable: 'PROJECT_ID' },
  { campo: 'storageBucket', variable: 'STORAGE_BUCKET' },
  { campo: 'messagingSenderId', variable: 'MESSAGING_SENDER_ID' },
  { campo: 'appId', variable: 'APP_ID' },
  { campo: 'measurementId', variable: 'MEASUREMENT_ID', opcional: true },
]

const obtenerEntornoFirebase = () => {
  const entorno = (import.meta.env.VITE_FIREBASE_ENTORNO || 'pruebas').toLowerCase()
  return entorno === 'produccion' ? 'produccion' : 'pruebas'
}

const obtenerVariablesFirebase = () => {
  const entorno = obtenerEntornoFirebase()
  const prefijoEntorno = entorno === 'produccion' ? 'VITE_FIREBASE_PROD_' : 'VITE_FIREBASE_PRUEBAS_'
  const variables = {}
  const clavesFaltantes = []

  camposFirebase.forEach(({ campo, variable, opcional }) => {
    const claveEntorno = `${prefijoEntorno}${variable}`
    const claveLegacy = `VITE_FIREBASE_${variable}`
    const valor = import.meta.env[claveEntorno] || import.meta.env[claveLegacy]

    variables[campo] = valor

    if (!opcional && !valor) {
      clavesFaltantes.push(`${claveEntorno} (o ${claveLegacy})`)
    }
  })

  if (clavesFaltantes.length > 0) {
    throw new Error(
      `Faltan variables de entorno de Firebase: ${clavesFaltantes.join(', ')}. ` +
        'Completá tu archivo .env.local antes de iniciar la app.',
    )
  }

  return {
    ...variables,
    entorno,
  }
}

const configuracionFirebase = obtenerVariablesFirebase()
const credencialesFirebase = { ...configuracionFirebase }
delete credencialesFirebase.entorno

const appFirebase = getApps().length > 0 ? getApp() : initializeApp(credencialesFirebase)
const authFirebase = getAuth(appFirebase)
const firestoreDb = getFirestore(appFirebase)

export { appFirebase, authFirebase, firestoreDb, configuracionFirebase }
