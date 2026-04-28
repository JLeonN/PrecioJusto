import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const clavesFirebaseObligatorias = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

const obtenerVariablesFirebase = () => {
  const variables = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  }

  const clavesFaltantes = clavesFirebaseObligatorias.filter((clave) => !import.meta.env[clave])

  if (clavesFaltantes.length > 0) {
    throw new Error(
      `Faltan variables de entorno de Firebase: ${clavesFaltantes.join(', ')}. ` +
        'Completá tu archivo .env.local antes de iniciar la app.',
    )
  }

  return variables
}

const configuracionFirebase = obtenerVariablesFirebase()

const appFirebase = getApps().length > 0 ? getApp() : initializeApp(configuracionFirebase)
const authFirebase = getAuth(appFirebase)
const firestoreDb = getFirestore(appFirebase)

export { appFirebase, authFirebase, firestoreDb, configuracionFirebase }
