/**
 * 📱 ADAPTADOR DE CAPACITOR STORAGE
 *
 * Este adaptador usa @capacitor/preferences (antes llamado Storage Plugin).
 * Ideal para: Apps móviles nativas (Android/iOS), almacenamiento local seguro.
 *
 * 💡 CARACTERÍSTICAS:
 * - Almacena en SQLite nativo del dispositivo
 * - Datos persisten entre cierres de app
 * - Más rápido que localStorage en móvil
 * - Funciona offline por defecto
 *
 * ⚠️ LIMITACIONES:
 * - Solo almacenamiento local (no sincroniza entre dispositivos)
 * - No soporta queries complejas (todo en memoria)
 * - Límite depende del espacio del dispositivo
 *
 * 🔥 MIGRAR A FIRESTORE:
 * Cuando cambies a Firestore, este adaptador puede seguir funcionando
 * como caché local mientras no hay conexión (modo offline-first).
 */

import { Preferences } from '@capacitor/preferences'

class CapacitorAdapter {
  constructor() {
    this.prefijoBase = 'precio_justo_' // Prefijo para organizar las claves
    this.espacioTrabajo = 'compartido'

    console.log('📱 CapacitorAdapter inicializado')

    // 🔥 NOTA PARA FIRESTORE:
    // Cuando migres a Firestore, podés usar este adaptador como caché.
    // Ejemplo: guardar en ambos lugares (Capacitor = caché, Firestore = fuente de verdad)
  }

  /**
   * 💾 GUARDAR DATO
   * @param {string} clave - Identificador único
   * @param {any} valor - Dato a guardar (se convierte a JSON automáticamente)
   * @returns {Promise<boolean>} - true si guardó exitosamente
   *
   * 🔥 FIRESTORE EQUIVALENTE:
   * await db.collection('productos').doc(clave).set(valor)
   *
   * 💡 ESTRATEGIA HÍBRIDA (Firestore + Capacitor):
   * 1. Guardar en Capacitor primero (rápido, offline)
   * 2. Sincronizar con Firestore en background
   * 3. Si falla Firestore, marcar como "pendiente de sync"
   */
  async guardar(clave, valor) {
    try {
      const claveCompleta = this._construirClave(clave)
      const valorSerializado = JSON.stringify(valor)

      await Preferences.set({
        key: claveCompleta,
        value: valorSerializado,
      })

      console.log(`✅ Guardado (Capacitor): ${clave}`)
      return true
    } catch (error) {
      console.error(`❌ Error al guardar ${clave}:`, error)
      return false
    }
  }

  /**
   * 📖 OBTENER DATO
   * @param {string} clave - Identificador único
   * @returns {Promise<any|null>} - El dato o null si no existe
   *
   * 🔥 FIRESTORE EQUIVALENTE:
   * const doc = await db.collection('productos').doc(clave).get()
   * return doc.exists ? doc.data() : null
   *
   * 💡 ESTRATEGIA HÍBRIDA:
   * 1. Intentar obtener de Capacitor (caché local)
   * 2. Si no existe o está viejo, buscar en Firestore
   * 3. Actualizar caché local con datos frescos de Firestore
   */
  async obtener(clave) {
    try {
      const claveCompleta = this._construirClave(clave)
      const resultado = await Preferences.get({ key: claveCompleta })

      if (!resultado.value) {
        console.log(`ℹ️ No existe (Capacitor): ${clave}`)
        return null
      }

      const valor = JSON.parse(resultado.value)
      console.log(`✅ Obtenido (Capacitor): ${clave}`)
      return valor
    } catch (error) {
      console.error(`❌ Error al obtener ${clave}:`, error)
      return null
    }
  }

  /**
   * 🗑️ ELIMINAR DATO
   * @param {string} clave - Identificador único
   * @returns {Promise<boolean>} - true si eliminó exitosamente
   *
   * 🔥 FIRESTORE EQUIVALENTE:
   * await db.collection('productos').doc(clave).delete()
   *
   * 💡 ESTRATEGIA HÍBRIDA:
   * 1. Eliminar de Capacitor (local)
   * 2. Eliminar de Firestore (nube)
   * 3. Si falla Firestore, marcar como "pendiente de eliminar"
   */
  async eliminar(clave) {
    try {
      const claveCompleta = this._construirClave(clave)
      await Preferences.remove({ key: claveCompleta })

      console.log(`✅ Eliminado (Capacitor): ${clave}`)
      return true
    } catch (error) {
      console.error(`❌ Error al eliminar ${clave}:`, error)
      return false
    }
  }

  /**
   * 📋 LISTAR TODOS LOS DATOS (con filtro opcional)
   * @param {string} prefijoBusqueda - Filtro opcional (ej: 'producto_')
   * @returns {Promise<Array>} - Array de objetos {clave, valor}
   *
   * 🔥 FIRESTORE EQUIVALENTE:
   * const snapshot = await db.collection('productos').get()
   * return snapshot.docs.map(doc => ({clave: doc.id, valor: doc.data()}))
   *
   * ⚠️ ADVERTENCIA:
   * Capacitor.keys() devuelve TODAS las claves y luego las filtra en memoria.
   * Esto puede ser lento si tenés miles de registros.
   * En Firestore, esto es mucho más eficiente (servidor hace el filtrado).
   */
  async listarTodo(prefijoBusqueda = '') {
    try {
      // Obtener todas las claves almacenadas
      const { keys } = await Preferences.keys()
      const resultados = []

      const prefijoActivo = this._construirPrefijoActivo()
      // Filtrar claves que pertenecen al espacio activo
      const clavesApp = keys.filter((claveCompleta) => claveCompleta.startsWith(prefijoActivo))

      // Procesar cada clave
      for (const claveCompleta of clavesApp) {
        // Extraer la clave sin prefijo
        const clave = claveCompleta.replace(prefijoActivo, '')

        // Aplicar filtro adicional si existe
        if (prefijoBusqueda && !clave.startsWith(prefijoBusqueda)) continue

        // Obtener el valor
        const resultado = await Preferences.get({ key: claveCompleta })

        if (resultado.value) {
          try {
            const valor = JSON.parse(resultado.value)
            resultados.push({ clave, valor })
          } catch (error) {
            console.warn(`⚠️ Dato corrupto en ${clave}, ignorando...`, error)
          }
        }
      }

      console.log(
        `✅ Listados ${resultados.length} registros (Capacitor) (filtro: '${prefijoBusqueda}')`,
      )
      return resultados
    } catch (error) {
      console.error('❌ Error al listar (Capacitor):', error)
      return []
    }
  }

  /**
   * 🔍 BUSCAR POR CAMPO (útil para queries)
   * @param {string} prefijoBusqueda - Tipo de dato (ej: 'producto_')
   * @param {string} campo - Campo a buscar
   * @param {any} valorBuscado - Valor a comparar
   * @returns {Promise<Array>} - Array de registros que coinciden
   *
   * 🔥 FIRESTORE EQUIVALENTE:
   * const snapshot = await db.collection('productos')
   *   .where(campo, '==', valorBuscado).get()
   *
   * ⚠️ LIMITACIÓN IMPORTANTE:
   * Este método carga TODOS los datos en memoria y filtra localmente.
   * Con 1000+ productos esto puede ser lento.
   * En Firestore, el servidor hace el filtrado con índices optimizados.
   *
   * 💡 RECOMENDACIÓN:
   * Si vas a tener muchos datos, considera usar Firestore para búsquedas
   * y Capacitor solo como caché de los datos más recientes.
   */
  async buscarPorCampo(prefijoBusqueda, campo, valorBuscado) {
    try {
      const todosLosDatos = await this.listarTodo(prefijoBusqueda)

      const resultados = todosLosDatos.filter((registro) => {
        return registro.valor[campo] === valorBuscado
      })

      console.log(
        `✅ Encontrados ${resultados.length} registros (Capacitor) con ${campo}=${valorBuscado}`,
      )
      return resultados
    } catch (error) {
      console.error('❌ Error al buscar (Capacitor):', error)
      return []
    }
  }

  /**
   * 🧹 LIMPIAR TODO (PELIGROSO - solo para desarrollo)
   * Elimina TODOS los datos de la app
   *
   * ⚠️ USAR CON CUIDADO: No hay vuelta atrás
   *
   * 🔥 FIRESTORE: En producción, implementar un sistema de "papelera"
   * donde los datos se marquen como eliminados pero no se borren físicamente.
   */
  async limpiarTodo() {
    try {
      const { keys } = await Preferences.keys()
      let contador = 0

      for (const claveCompleta of keys) {
        if (claveCompleta.startsWith(this.prefijoBase)) {
          await Preferences.remove({ key: claveCompleta })
          contador++
        }
      }

      console.log(`✅ Limpiados ${contador} registros (Capacitor)`)
      return true
    } catch (error) {
      console.error('❌ Error al limpiar (Capacitor):', error)
      return false
    }
  }

  /**
   * 📊 OBTENER ESTADÍSTICAS (útil para debugging)
   */
  async obtenerEstadisticas() {
    const todosLosDatos = await this.listarTodo()
    const tamañoBytes = JSON.stringify(todosLosDatos).length
    const tamañoKB = (tamañoBytes / 1024).toFixed(2)
    const tamañoMB = (tamañoBytes / (1024 * 1024)).toFixed(2)

    return {
      totalRegistros: todosLosDatos.length,
      tamañoKB: tamañoKB,
      tamañoMB: tamañoMB,
      dispositivo: 'móvil (SQLite)',
    }
  }

  // ========================================
  // 🔧 MÉTODOS PRIVADOS (HELPERS)
  // ========================================

  /**
   * Construir clave completa con prefijo
   * @private
   */
  _construirClave(clave) {
    return `${this._construirPrefijoActivo()}${clave}`
  }

  _construirPrefijoActivo() {
    if (this.espacioTrabajo === 'compartido') {
      return this.prefijoBase
    }

    return `${this.prefijoBase}${this.espacioTrabajo}_`
  }

  configurarEspacioTrabajo(espacioTrabajo) {
    const valorNormalizado = String(espacioTrabajo || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')

    this.espacioTrabajo = valorNormalizado || 'compartido'
  }
}

export default CapacitorAdapter

// 🔥 CHECKLIST PARA MIGRACIÓN A FIRESTORE:
//
// [ ] Capacitor funciona correctamente en dispositivo Android
// [ ] Testeaste con datos grandes (productos con muchos precios)
// [ ] Verificaste que los datos persisten al cerrar y reabrir la app
// [ ] La app funciona offline (sin conexión a internet)
//
// ESTRATEGIA HÍBRIDA RECOMENDADA (Capacitor + Firestore):
//
// 1. GUARDAR:
//    - Guardar primero en Capacitor (instantáneo)
//    - Sincronizar con Firestore en background
//    - Mostrar indicador "sincronizando..." si hay delay
//
// 2. LEER:
//    - Leer primero de Capacitor (caché)
//    - Si no existe o está viejo, buscar en Firestore
//    - Actualizar caché con datos frescos
//
// 3. SINCRONIZACIÓN:
//    - Marcar registros con timestamp de última sincronización
//    - Sincronizar cambios pendientes cuando haya conexión
//    - Mostrar badge "X pendientes de sincronizar"
//
// 4. CONFLICTOS:
//    - Si el usuario editó offline y hay cambios en Firestore
//    - Mostrar diálogo: "¿Mantener versión local o remota?"
//    - O implementar merge automático si es posible
//
// 💡 VENTAJAS DE ESTE ENFOQUE:
// - App funciona 100% offline
// - Sincronización automática cuando hay internet
// - Experiencia fluida (sin esperas)
// - Escalable a millones de usuarios
