import { getApps, initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getStorage } from 'firebase/storage'
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

const variablesFirebase = Object.freeze({
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
})

let firebaseApp = null
let firebaseAuth = null
let firestoreDb = null
let firebaseStorage = null
let firestoreOfflineActivo = false
let firestoreOfflineError = null

function leerVariable(nombreVariable) {
  return String(import.meta.env[nombreVariable] || '').trim()
}

function obtenerConfiguracionFirebase() {
  return {
    apiKey: leerVariable(variablesFirebase.apiKey),
    authDomain: leerVariable(variablesFirebase.authDomain),
    projectId: leerVariable(variablesFirebase.projectId),
    storageBucket: leerVariable(variablesFirebase.storageBucket),
    messagingSenderId: leerVariable(variablesFirebase.messagingSenderId),
    appId: leerVariable(variablesFirebase.appId),
  }
}

function obtenerVariablesFaltantes() {
  const configuracion = obtenerConfiguracionFirebase()

  return Object.entries(variablesFirebase)
    .filter(([clave]) => !configuracion[clave])
    .map(([, nombreVariable]) => nombreVariable)
}

function obtenerEstadoConfiguracion() {
  const variablesFaltantes = obtenerVariablesFaltantes()

  return {
    configuracionCompleta: variablesFaltantes.length === 0,
    variablesFaltantes,
    projectId: leerVariable(variablesFirebase.projectId),
  }
}

function crearErrorConfiguracion() {
  const { variablesFaltantes } = obtenerEstadoConfiguracion()
  return new Error(
    `Falta configuración Firebase local: ${variablesFaltantes.join(', ')}. Completá .env.local antes de inicializar Firebase.`,
  )
}

function obtenerFirebaseApp() {
  if (firebaseApp) {
    return firebaseApp
  }

  const estado = obtenerEstadoConfiguracion()
  if (!estado.configuracionCompleta) {
    throw crearErrorConfiguracion()
  }

  firebaseApp = getApps()[0] || initializeApp(obtenerConfiguracionFirebase())
  return firebaseApp
}

function obtenerFirebaseAuth() {
  if (!firebaseAuth) {
    firebaseAuth = getAuth(obtenerFirebaseApp())
  }

  return firebaseAuth
}

function obtenerFirestoreDb() {
  if (firestoreDb) {
    return firestoreDb
  }

  const app = obtenerFirebaseApp()

  try {
    firestoreDb = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
    firestoreOfflineActivo = true
  } catch (error) {
    firestoreOfflineError = error
    firestoreDb = getFirestore(app)
    console.warn('Firestore Offline no pudo usar caché persistente. Se usará caché en memoria.', error)
  }

  return firestoreDb
}

function observarUsuarioAutenticado(callback) {
  return onAuthStateChanged(obtenerFirebaseAuth(), callback)
}

function obtenerFirebaseStorage() {
  if (!firebaseStorage) {
    firebaseStorage = getStorage(obtenerFirebaseApp())
  }

  return firebaseStorage
}

function verificarInicializacionFirebase() {
  const estado = obtenerEstadoConfiguracion()

  if (!estado.configuracionCompleta) {
    return {
      ok: false,
      mensaje: crearErrorConfiguracion().message,
      ...estado,
    }
  }

  obtenerFirebaseApp()
  obtenerFirebaseAuth()
  obtenerFirestoreDb()
  obtenerFirebaseStorage()

  return {
    ok: true,
    mensaje: 'Firebase base inicializado correctamente.',
    projectId: estado.projectId,
    authInicializado: Boolean(firebaseAuth),
    firestoreInicializado: Boolean(firestoreDb),
    storageInicializado: Boolean(firebaseStorage),
    firestoreOfflineActivo,
    firestoreOfflineError: firestoreOfflineError?.code || firestoreOfflineError?.message || null,
  }
}

export default {
  obtenerConfiguracionFirebase,
  obtenerEstadoConfiguracion,
  obtenerFirebaseApp,
  obtenerFirebaseAuth,
  obtenerFirestoreDb,
  obtenerFirebaseStorage,
  observarUsuarioAutenticado,
  verificarInicializacionFirebase,
}
