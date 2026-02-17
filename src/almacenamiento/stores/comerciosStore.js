import { defineStore } from 'pinia'
import ComerciosService from '../servicios/ComerciosService'

/**
 * COMERCIOS STORE
 * Store de Pinia para gestión global de comercios
 */
export const useComerciStore = defineStore('comercios', {
  // ═══════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════
  state: () => ({
    comercios: [],
    cargando: false,
    error: null,
  }),

  // ═══════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════
  getters: {
    /**
     * Obtiene comercios ordenados por uso reciente
     */
    comerciosPorUso: (state) => {
      return [...state.comercios].sort((a, b) => {
        const fechaA = new Date(a.fechaUltimoUso || a.fechaCreacion)
        const fechaB = new Date(b.fechaUltimoUso || b.fechaCreacion)
        return fechaB - fechaA
      })
    },

    /**
     * Obtiene total de comercios
     */
    totalComercios: (state) => state.comercios.length,

    /**
     * Obtiene total de direcciones (sumando todas las direcciones de todos los comercios)
     */
    totalDirecciones: (state) => {
      return state.comercios.reduce((total, comercio) => {
        return total + (comercio.direcciones?.length || 0)
      }, 0)
    },

    /**
     * Obtiene comercios agrupados por tipo
     */
    comerciosPorTipo: (state) => {
      const agrupados = {}
      state.comercios.forEach((comercio) => {
        const tipo = comercio.tipo || 'Otro'
        if (!agrupados[tipo]) {
          agrupados[tipo] = []
        }
        agrupados[tipo].push(comercio)
      })
      return agrupados
    },

    /**
     * Agrupa comercios en cadenas (mismo nombre, diferentes direcciones)
     * Ordena direcciones por uso reciente y calcula dirección principal
     * @returns {Array} Comercios agrupados con información de cadenas
     */
    comerciosAgrupados: (state) => {
      const agrupados = new Map()

      // Agrupar comercios por nombre normalizado
      state.comercios.forEach((comercio) => {
        const nombreNormalizado = ComerciosService.normalizar(comercio.nombre)

        if (!agrupados.has(nombreNormalizado)) {
          // Primer comercio con este nombre
          agrupados.set(nombreNormalizado, {
            id: comercio.id,
            nombre: comercio.nombre,
            tipo: comercio.tipo,
            foto: null,
            esCadena: false,
            totalSucursales: 1,
            direcciones: [...comercio.direcciones],
            fechaUltimoUso: comercio.fechaUltimoUso,
            cantidadUsos: comercio.cantidadUsos,
            comerciosOriginales: [comercio], // Para referencia
          })
        } else {
          // Agregar sucursal a la cadena existente
          const grupo = agrupados.get(nombreNormalizado)
          grupo.esCadena = true
          grupo.totalSucursales++
          grupo.direcciones.push(...comercio.direcciones)
          grupo.comerciosOriginales.push(comercio)

          // Actualizar fecha si es más reciente
          if (new Date(comercio.fechaUltimoUso) > new Date(grupo.fechaUltimoUso)) {
            grupo.fechaUltimoUso = comercio.fechaUltimoUso
          }

          // Sumar usos totales
          grupo.cantidadUsos += comercio.cantidadUsos
        }
      })

      // Procesar cada grupo
      const resultado = Array.from(agrupados.values()).map((grupo) => {
        // Ordenar direcciones por uso reciente
        grupo.direcciones.sort((a, b) => {
          const fechaA = new Date(a.fechaUltimoUso || 0)
          const fechaB = new Date(b.fechaUltimoUso || 0)
          return fechaB - fechaA
        })

        // Top 3 direcciones más recientes
        grupo.direccionesTop3 = grupo.direcciones.slice(0, 3)

        // Dirección principal (más reciente)
        grupo.direccionPrincipal = grupo.direcciones[0]

        // Foto de la sucursal más reciente
        const comercioMasReciente = grupo.comerciosOriginales.sort(
          (a, b) => new Date(b.fechaUltimoUso) - new Date(a.fechaUltimoUso),
        )[0]
        grupo.foto = comercioMasReciente.foto

        return grupo
      })

      // Ordenar por uso reciente
      return resultado.sort((a, b) => {
        const fechaA = new Date(a.fechaUltimoUso)
        const fechaB = new Date(b.fechaUltimoUso)
        return fechaB - fechaA
      })
    },
  },

  // ═══════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════
  actions: {
    /**
     * Carga todos los comercios desde el servicio
     */
    async cargarComercios() {
      this.cargando = true
      this.error = null

      try {
        const comercios = await ComerciosService.obtenerTodos()
        this.comercios = comercios
      } catch (error) {
        console.error('Error al cargar comercios:', error)
        this.error = 'No se pudieron cargar los comercios'
        throw error
      } finally {
        this.cargando = false
      }
    },

    /**
     * Busca comercios por nombre
     * @param {string} nombre - Nombre a buscar
     * @returns {Promise<Array>} Comercios encontrados
     */
    async buscarComercios(nombre) {
      try {
        return await ComerciosService.buscarPorNombre(nombre)
      } catch (error) {
        console.error('Error al buscar comercios:', error)
        return []
      }
    },

    /**
     * Obtiene un comercio por ID
     * @param {string} id - ID del comercio
     * @returns {Object|null} Comercio encontrado o null
     */
    obtenerComercioPorId(id) {
      return this.comercios.find((c) => c.id === id) || null
    },

    /**
     * Agrega un nuevo comercio
     * @param {Object} datosComercio - Datos del comercio
     * @returns {Promise<Object>} Comercio agregado
     */
    async agregarComercio(datosComercio) {
      this.cargando = true
      this.error = null

      try {
        // Validar duplicados antes de agregar (usa comercios agrupados)
        const validacion = await ComerciosService.validarDuplicados(
          datosComercio,
          this.comerciosAgrupados,
        )

        if (validacion.esDuplicado) {
          // Retornar validación para que el componente maneje el diálogo
          return {
            exito: false,
            validacion,
          }
        }

        // No es duplicado, agregar
        const nuevoComercio = await ComerciosService.agregarComercio(datosComercio)
        this.comercios.push(nuevoComercio)

        return {
          exito: true,
          comercio: nuevoComercio,
        }
      } catch (error) {
        console.error('Error al agregar comercio:', error)
        this.error = 'No se pudo agregar el comercio'
        throw error
      } finally {
        this.cargando = false
      }
    },

    /**
     * Edita un comercio existente
     * @param {string} id - ID del comercio
     * @param {Object} datosActualizados - Datos a actualizar
     * @returns {Promise<Object|null>} Comercio actualizado o null
     */
    async editarComercio(id, datosActualizados) {
      this.cargando = true
      this.error = null

      try {
        const comercioActualizado = await ComerciosService.editarComercio(id, datosActualizados)

        if (comercioActualizado) {
          const indice = this.comercios.findIndex((c) => c.id === id)
          if (indice !== -1) {
            this.comercios[indice] = comercioActualizado
          }
        }

        return comercioActualizado
      } catch (error) {
        console.error('Error al editar comercio:', error)
        this.error = 'No se pudo editar el comercio'
        throw error
      } finally {
        this.cargando = false
      }
    },

    /**
     * Elimina un comercio
     * @param {string} id - ID del comercio
     * @returns {Promise<boolean>} true si se eliminó
     */
    async eliminarComercio(id) {
      this.cargando = true
      this.error = null

      try {
        const eliminado = await ComerciosService.eliminarComercio(id)

        if (eliminado) {
          this.comercios = this.comercios.filter((c) => c.id !== id)
        }

        return eliminado
      } catch (error) {
        console.error('Error al eliminar comercio:', error)
        this.error = 'No se pudo eliminar el comercio'
        throw error
      } finally {
        this.cargando = false
      }
    },

    /**
     * Elimina múltiples comercios
     * @param {Array<string>} ids - IDs de comercios a eliminar
     * @returns {Promise<Object>} Resultado de la eliminación
     */
    async eliminarComercios(ids) {
      this.cargando = true
      this.error = null

      const resultados = {
        exitosos: [],
        fallidos: [],
      }

      try {
        for (const id of ids) {
          const eliminado = await ComerciosService.eliminarComercio(id)
          if (eliminado) {
            resultados.exitosos.push(id)
          } else {
            resultados.fallidos.push(id)
          }
        }

        // Actualizar estado local
        this.comercios = this.comercios.filter((c) => !resultados.exitosos.includes(c.id))

        return resultados
      } catch (error) {
        console.error('Error al eliminar comercios:', error)
        this.error = 'Error al eliminar algunos comercios'
        throw error
      } finally {
        this.cargando = false
      }
    },

    /**
     * Agrega una dirección a un comercio
     * @param {string} comercioId - ID del comercio
     * @param {Object} datosDireccion - Datos de la dirección
     * @returns {Promise<Object|null>} Comercio actualizado o null
     */
    async agregarDireccion(comercioId, datosDireccion) {
      this.cargando = true
      this.error = null

      try {
        const comercioActualizado = await ComerciosService.agregarDireccion(
          comercioId,
          datosDireccion,
        )

        if (comercioActualizado) {
          const indice = this.comercios.findIndex((c) => c.id === comercioId)
          if (indice !== -1) {
            this.comercios[indice] = comercioActualizado
          }
        }

        return comercioActualizado
      } catch (error) {
        console.error('Error al agregar dirección:', error)
        this.error = 'No se pudo agregar la dirección'
        throw error
      } finally {
        this.cargando = false
      }
    },

    /**
     * Elimina una dirección de un comercio
     * @param {string} comercioId - ID del comercio
     * @param {string} direccionId - ID de la dirección
     * @returns {Promise<boolean>} true si se eliminó
     */
    async eliminarDireccion(comercioId, direccionId) {
      this.cargando = true
      this.error = null

      try {
        const eliminado = await ComerciosService.eliminarDireccion(comercioId, direccionId)

        if (eliminado) {
          // Actualizar estado local
          const comercio = this.comercios.find((c) => c.id === comercioId)
          if (comercio) {
            comercio.direcciones = comercio.direcciones.filter((d) => d.id !== direccionId)
          }
        }

        return eliminado
      } catch (error) {
        console.error('Error al eliminar dirección:', error)
        this.error = 'No se pudo eliminar la dirección'
        throw error
      } finally {
        this.cargando = false
      }
    },

    /**
     * Registra el uso de un comercio
     * @param {string} comercioId - ID del comercio
     * @param {string} direccionId - ID de la dirección (opcional)
     */
    async registrarUso(comercioId, direccionId = null) {
      try {
        await ComerciosService.registrarUsoComercio(comercioId, direccionId)

        // Actualizar estado local
        const comercio = this.comercios.find((c) => c.id === comercioId)
        if (comercio) {
          comercio.fechaUltimoUso = new Date().toISOString()
          comercio.cantidadUsos = (comercio.cantidadUsos || 0) + 1

          if (direccionId) {
            const direccion = comercio.direcciones.find((d) => d.id === direccionId)
            if (direccion) {
              direccion.fechaUltimoUso = new Date().toISOString()
            }
          }
        }
      } catch (error) {
        console.error('Error al registrar uso:', error)
      }
    },

    /**
     * Valida si un comercio es duplicado (usa comercios agrupados)
     * @param {Object} datosComercio - Datos del comercio a validar
     * @returns {Promise<Object>} Resultado de validación
     */
    async validarDuplicados(datosComercio) {
      try {
        return await ComerciosService.validarDuplicados(datosComercio, this.comerciosAgrupados)
      } catch (error) {
        console.error('Error al validar duplicados:', error)
        return {
          esDuplicado: false,
          nivel: 0,
          tipo: 'error',
          mensaje: 'Error al validar',
        }
      }
    },
  },
})
