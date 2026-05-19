import { defineBoot } from '#q-app/wrappers'
import { Notify } from 'quasar'
import firebaseBaseService from '../almacenamiento/servicios/FirebaseBaseService.js'

function debeVerificarFirebase() {
  return import.meta.env.DEV || import.meta.env.VITE_FIREBASE_PRUEBA_AUTOMATICA === 'true'
}

export default defineBoot(() => {
  if (!debeVerificarFirebase()) {
    return
  }

  const resultado = firebaseBaseService.verificarInicializacionFirebase()

  if (!resultado.ok) {
    console.warn(resultado.mensaje)

    if (import.meta.env.DEV) {
      Notify.create({
        type: 'warning',
        message: resultado.mensaje,
        timeout: 8000,
      })
    }

    return
  }

  console.info('Firebase base inicializado.', {
    projectId: resultado.projectId,
    authInicializado: resultado.authInicializado,
    firestoreInicializado: resultado.firestoreInicializado,
    firestoreOfflineActivo: resultado.firestoreOfflineActivo,
    firestoreOfflineError: resultado.firestoreOfflineError,
  })
})
