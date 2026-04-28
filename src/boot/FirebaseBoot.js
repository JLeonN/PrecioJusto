import { defineBoot } from '#q-app/wrappers'
import { appFirebase, authFirebase, firestoreDb } from 'src/Firebase/ClienteFirebase.js'

export default defineBoot(({ app }) => {
  app.config.globalProperties.$appFirebase = appFirebase
  app.config.globalProperties.$authFirebase = authFirebase
  app.config.globalProperties.$firestoreDb = firestoreDb

  if (process.env.DEV) {
    console.log('Firebase inicializado correctamente')
  }
})
