import { defineBoot } from '#q-app/wrappers'
import { signInAnonymously } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { appFirebase, authFirebase, firestoreDb } from 'src/Firebase/ClienteFirebase.js'

export default defineBoot(({ app }) => {
  app.config.globalProperties.$appFirebase = appFirebase
  app.config.globalProperties.$authFirebase = authFirebase
  app.config.globalProperties.$firestoreDb = firestoreDb

  if (process.env.DEV) {
    console.log('Firebase inicializado correctamente')
  }

  const ejecutarPruebaAutomatica =
    process.env.DEV && import.meta.env.VITE_FIREBASE_PRUEBA_AUTOMATICA === 'true'

  if (!ejecutarPruebaAutomatica) {
    return
  }

  signInAnonymously(authFirebase)
    .then(async (credencialUsuario) => {
      const usuarioId = credencialUsuario.user.uid
      const referenciaPrueba = doc(firestoreDb, 'pruebasIntegracion', usuarioId)

      await setDoc(
        referenciaPrueba,
        {
          usuarioId,
          origen: 'quasar-dev',
          actualizadoEn: serverTimestamp(),
          pruebaFirestoreOk: true,
        },
        { merge: true },
      )

      console.log('Prueba Firestore OK', { usuarioId })
    })
    .catch((error) => {
      console.error('Error en prueba Firestore', error)
    })
})
