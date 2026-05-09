const NOMBRE_BASE_DATOS = 'PrecioJustoAlmacenamiento'
const VERSION_BASE_DATOS = 1
const NOMBRE_ALMACEN = 'datos'

class IndexedDbAdapter {
  constructor() {
    this.prefijoBase = 'precio_justo_'
    this.espacioTrabajo = 'compartido'
    this.baseDatos = null
    this.promesaInicializacion = this._abrirBaseDatos().then(async (baseDatos) => {
      this.baseDatos = baseDatos
      await this._migrarDesdeLocalStorage()
      return baseDatos
    })

    console.log('IndexedDbAdapter inicializado')
  }

  async guardar(clave, valor) {
    try {
      const claveCompleta = this._construirClave(clave)
      const valorNormalizado = this._normalizarValorParaGuardar(valor)
      await this._ejecutarTransaccion('readwrite', (almacen) => {
        almacen.put(valorNormalizado, claveCompleta)
      })

      console.log(`Guardado (IndexedDB): ${clave}`)
      return true
    } catch (error) {
      console.error(`Error al guardar ${clave} en IndexedDB:`, error)
      return false
    }
  }

  async obtener(clave) {
    try {
      const claveCompleta = this._construirClave(clave)
      const valor = await this._ejecutarTransaccion('readonly', (almacen, asignarResultado) => {
        const solicitud = almacen.get(claveCompleta)
        solicitud.onsuccess = () => asignarResultado(solicitud.result ?? null)
      })

      if (valor === null) {
        console.log(`No existe (IndexedDB): ${clave}`)
        return null
      }

      console.log(`Obtenido (IndexedDB): ${clave}`)
      return valor
    } catch (error) {
      console.error(`Error al obtener ${clave} en IndexedDB:`, error)
      return null
    }
  }

  async eliminar(clave) {
    try {
      const claveCompleta = this._construirClave(clave)
      await this._ejecutarTransaccion('readwrite', (almacen) => {
        almacen.delete(claveCompleta)
      })

      console.log(`Eliminado (IndexedDB): ${clave}`)
      return true
    } catch (error) {
      console.error(`Error al eliminar ${clave} en IndexedDB:`, error)
      return false
    }
  }

  async listarTodo(prefijoBusqueda = '') {
    try {
      const resultados = []
      const prefijoActivo = this._construirPrefijoActivo()

      await this._ejecutarTransaccion('readonly', (almacen, asignarResultado) => {
        const solicitud = almacen.openCursor()
        solicitud.onsuccess = (evento) => {
          const cursor = evento.target.result
          if (!cursor) {
            asignarResultado(resultados)
            return
          }

          const claveCompleta = String(cursor.key || '')
          if (this._debeIncluirClave(claveCompleta, prefijoActivo, prefijoBusqueda)) {
            resultados.push({
              clave: claveCompleta.replace(prefijoActivo, ''),
              valor: cursor.value,
            })
          }

          cursor.continue()
        }
      })

      console.log(`Listados ${resultados.length} registros (IndexedDB) (filtro: '${prefijoBusqueda}')`)
      return resultados
    } catch (error) {
      console.error('Error al listar en IndexedDB:', error)
      return []
    }
  }

  async buscarPorCampo(prefijoBusqueda, campo, valorBuscado) {
    try {
      const todosLosDatos = await this.listarTodo(prefijoBusqueda)
      const resultados = todosLosDatos.filter((registro) => registro.valor[campo] === valorBuscado)

      console.log(`Encontrados ${resultados.length} registros (IndexedDB) con ${campo}=${valorBuscado}`)
      return resultados
    } catch (error) {
      console.error('Error al buscar en IndexedDB:', error)
      return []
    }
  }

  async limpiarTodo() {
    try {
      let contador = 0

      await this._ejecutarTransaccion('readwrite', (almacen, asignarResultado) => {
        const solicitud = almacen.openCursor()
        solicitud.onsuccess = (evento) => {
          const cursor = evento.target.result
          if (!cursor) {
            asignarResultado(contador)
            return
          }

          const claveCompleta = String(cursor.key || '')
          if (claveCompleta.startsWith(this.prefijoBase)) {
            cursor.delete()
            contador++
          }

          cursor.continue()
        }
      })

      console.log(`Limpiados ${contador} registros (IndexedDB)`)
      return true
    } catch (error) {
      console.error('Error al limpiar IndexedDB:', error)
      return false
    }
  }

  async obtenerEstadisticas() {
    const todosLosDatos = await this.listarTodo()
    const tamanoBytes = JSON.stringify(todosLosDatos).length
    const tamanoKB = (tamanoBytes / 1024).toFixed(2)
    const tamanoMB = (tamanoBytes / (1024 * 1024)).toFixed(2)

    return {
      totalRegistros: todosLosDatos.length,
      tamanoKB,
      tamanoMB,
      espacioUsado: `${tamanoMB} MB en IndexedDB`,
    }
  }

  configurarEspacioTrabajo(espacioTrabajo) {
    const valorNormalizado = String(espacioTrabajo || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')

    this.espacioTrabajo = valorNormalizado || 'compartido'
  }

  async _obtenerBaseDatos() {
    if (this.baseDatos) return this.baseDatos
    return this.promesaInicializacion
  }

  async _ejecutarTransaccion(modo, operacion) {
    const baseDatos = await this._obtenerBaseDatos()

    return new Promise((resolve, reject) => {
      const transaccion = baseDatos.transaction(NOMBRE_ALMACEN, modo)
      const almacen = transaccion.objectStore(NOMBRE_ALMACEN)
      let resultado

      const asignarResultado = (valor) => {
        resultado = valor
      }

      transaccion.oncomplete = () => resolve(resultado)
      transaccion.onerror = () => reject(transaccion.error)
      transaccion.onabort = () => reject(transaccion.error || new Error('Transacción abortada'))

      try {
        operacion(almacen, asignarResultado)
      } catch (error) {
        transaccion.abort()
        reject(error)
      }
    })
  }

  _abrirBaseDatos() {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB no está disponible'))
        return
      }

      const solicitud = window.indexedDB.open(NOMBRE_BASE_DATOS, VERSION_BASE_DATOS)

      solicitud.onupgradeneeded = () => {
        const baseDatos = solicitud.result
        if (!baseDatos.objectStoreNames.contains(NOMBRE_ALMACEN)) {
          baseDatos.createObjectStore(NOMBRE_ALMACEN)
        }
      }

      solicitud.onsuccess = () => resolve(solicitud.result)
      solicitud.onerror = () => reject(solicitud.error)
    })
  }

  async _migrarDesdeLocalStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return

    const claves = Object.keys(window.localStorage).filter((clave) =>
      clave.startsWith(this.prefijoBase),
    )
    if (claves.length === 0) return

    const clavesMigradas = []

    await this._ejecutarTransaccion('readwrite', (almacen) => {
      claves.forEach((claveCompleta) => {
        const valorSerializado = window.localStorage.getItem(claveCompleta)
        if (valorSerializado === null) return

        try {
          almacen.put(JSON.parse(valorSerializado), claveCompleta)
          clavesMigradas.push(claveCompleta)
        } catch (error) {
          console.warn(`Dato local corrupto no migrado: ${claveCompleta}`, error)
        }
      })
    })

    clavesMigradas.forEach((claveCompleta) => {
      window.localStorage.removeItem(claveCompleta)
    })

    console.log(`Migrados ${clavesMigradas.length} registros de localStorage a IndexedDB`)
  }

  _debeIncluirClave(claveCompleta, prefijoActivo, prefijoBusqueda) {
    if (!claveCompleta.startsWith(prefijoActivo)) return false
    if (this.espacioTrabajo === 'compartido' && this._esClaveEspacioUid(claveCompleta)) return false

    const clave = claveCompleta.replace(prefijoActivo, '')
    if (prefijoBusqueda && !clave.startsWith(prefijoBusqueda)) return false
    return true
  }

  _normalizarValorParaGuardar(valor) {
    if (valor === undefined) return null
    return JSON.parse(JSON.stringify(valor))
  }

  _construirClave(clave) {
    return `${this._construirPrefijoActivo()}${clave}`
  }

  _esClaveEspacioUid(claveCompleta) {
    return /^precio_justo_uid-[^_]+_/i.test(claveCompleta)
  }

  _construirPrefijoActivo() {
    if (this.espacioTrabajo === 'compartido') {
      return this.prefijoBase
    }

    return `${this.prefijoBase}${this.espacioTrabajo}_`
  }
}

export default IndexedDbAdapter
