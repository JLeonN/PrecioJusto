import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import {
  CAMPOS_MODELO_FIRESTORE,
  ESTADOS_SINCRONIZACION,
  TIPOS_USUARIO,
} from '../constantes/PreparacionFirebase.js'
import firebaseBaseService from './FirebaseBaseService.js'
import usuarioActualService from './UsuarioActualService.js'

const LIMITE_PRECIOS_POR_PRODUCTO = 200

function obtenerUsuarioFirebaseActual() {
  const usuario = usuarioActualService.obtenerUsuarioActual()

  if (!usuario.id || usuario.esLocal || usuario.tipo !== TIPOS_USUARIO.FIREBASE) {
    return null
  }

  return usuario.id
}

function normalizarIdDocumento(valor) {
  return String(valor || '')
    .trim()
    .replace(/\//g, '-')
}

function obtenerDb() {
  return firebaseBaseService.obtenerFirestoreDb()
}

function obtenerReferenciaProducto(usuarioId, productoId) {
  return doc(
    obtenerDb(),
    'usuarios',
    usuarioId,
    'productos',
    normalizarIdDocumento(productoId),
  )
}

function obtenerColeccionPrecios(usuarioId, productoId) {
  return collection(obtenerReferenciaProducto(usuarioId, productoId), 'precios')
}

function obtenerReferenciaPrecio(usuarioId, productoId, precioId) {
  return doc(obtenerColeccionPrecios(usuarioId, productoId), normalizarIdDocumento(precioId))
}

function seleccionarCamposPermitidos(datos, camposPermitidos) {
  return camposPermitidos.reduce((resultado, campo) => {
    if (datos[campo] !== undefined) {
      resultado[campo] = datos[campo]
    }

    return resultado
  }, {})
}

function normalizarFechaIso(valor) {
  const fecha = valor ? new Date(valor) : new Date()
  return Number.isNaN(fecha.getTime()) ? new Date().toISOString() : fecha.toISOString()
}

function normalizarEscalasPorCantidad(escalas) {
  return Array.isArray(escalas)
    ? escalas.map((escala) => ({
        cantidadMinima: Number(escala?.cantidadMinima) || 0,
        precioUnitario: Number.isFinite(Number(escala?.precioUnitario))
          ? Number(escala.precioUnitario)
          : null,
        estadoEscala: escala?.estadoEscala || 'neutral',
      }))
    : []
}

function normalizarPrecioParaFirestore(precio, productoId, usuarioId) {
  const ahora = new Date().toISOString()
  const precioId = normalizarIdDocumento(precio?.id) || `precio-${Date.now()}`
  const valor = Number(precio?.valor)

  const precioNormalizado = {
    ...precio,
    id: precioId,
    usuarioId,
    productoId: normalizarIdDocumento(productoId),
    valor: Number.isFinite(valor) ? valor : 0,
    moneda: String(precio?.moneda || 'UYU').trim().toUpperCase() || 'UYU',
    comercioId: precio?.comercioId || null,
    direccionId: precio?.direccionId || null,
    comercio: precio?.comercio || 'Desconocido',
    direccion: precio?.direccion || '',
    nombreCompleto: precio?.nombreCompleto || precio?.comercio || 'Desconocido',
    fecha: normalizarFechaIso(precio?.fecha),
    confirmaciones: Number(precio?.confirmaciones || 0),
    activarPreciosMayoristas: Boolean(precio?.activarPreciosMayoristas),
    escalasPorCantidad: normalizarEscalasPorCantidad(precio?.escalasPorCantidad),
    escalasResumen: precio?.escalasResumen || null,
    tieneEscalaMejora: Boolean(precio?.tieneEscalaMejora),
    tieneEscalaSospechosa: Boolean(precio?.tieneEscalaSospechosa),
    origen: precio?.origen || 'app',
    fechaCreacion: normalizarFechaIso(precio?.fechaCreacion || precio?.fecha || ahora),
    fechaActualizacion: ahora,
    eliminado: Boolean(precio?.eliminado),
  }

  return seleccionarCamposPermitidos(precioNormalizado, CAMPOS_MODELO_FIRESTORE.precio)
}

function crearResultadoOmitido() {
  return {
    exito: false,
    omitido: true,
    estado: ESTADOS_SINCRONIZACION.LOCAL,
    mensaje: 'No hay usuario Firebase autenticado.',
  }
}

function obtenerEstadoEscrituraAceptada() {
  return typeof navigator !== 'undefined' && navigator.onLine === false
    ? ESTADOS_SINCRONIZACION.PENDIENTE
    : ESTADOS_SINCRONIZACION.SINCRONIZADO
}

async function guardarPrecio(productoId, precio) {
  const usuarioId = obtenerUsuarioFirebaseActual()
  if (!usuarioId) return crearResultadoOmitido()

  const productoRef = obtenerReferenciaProducto(usuarioId, productoId)
  const productoSnapshot = await getDoc(productoRef)

  if (!productoSnapshot.exists()) {
    return {
      exito: false,
      omitido: false,
      estado: ESTADOS_SINCRONIZACION.ERROR,
      mensaje: 'El producto padre no existe en Firestore.',
    }
  }

  const precioFirestore = normalizarPrecioParaFirestore(precio, productoId, usuarioId)
  const precioRef = obtenerReferenciaPrecio(usuarioId, productoId, precioFirestore.id)
  await setDoc(precioRef, precioFirestore, { merge: true })

  return {
    exito: true,
    estado: obtenerEstadoEscrituraAceptada(),
    precio: precioFirestore,
  }
}

async function guardarPreciosProducto(productoId, precios = []) {
  const resultados = []

  for (const precio of precios) {
    resultados.push(await guardarPrecio(productoId, precio))
  }

  return resultados
}

async function obtenerPreciosProducto(productoId) {
  const usuarioId = obtenerUsuarioFirebaseActual()
  if (!usuarioId) return []

  const consulta = query(
    obtenerColeccionPrecios(usuarioId, productoId),
    orderBy('fecha', 'desc'),
    limit(LIMITE_PRECIOS_POR_PRODUCTO),
  )
  const snapshot = await getDocs(consulta)
  return snapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  }))
}

async function actualizarPrecio(productoId, precioId, cambios) {
  const usuarioId = obtenerUsuarioFirebaseActual()
  if (!usuarioId) return crearResultadoOmitido()

  const cambiosNormalizados = seleccionarCamposPermitidos(
    {
      ...cambios,
      fechaActualizacion: new Date().toISOString(),
    },
    CAMPOS_MODELO_FIRESTORE.precio,
  )
  await updateDoc(obtenerReferenciaPrecio(usuarioId, productoId, precioId), cambiosNormalizados)

  return {
    exito: true,
    estado: obtenerEstadoEscrituraAceptada(),
  }
}

async function eliminarPrecio(productoId, precioId) {
  return actualizarPrecio(productoId, precioId, {
    eliminado: true,
  })
}

export default {
  obtenerColeccionPrecios,
  obtenerReferenciaPrecio,
  normalizarPrecioParaFirestore,
  guardarPrecio,
  guardarPreciosProducto,
  obtenerPreciosProducto,
  actualizarPrecio,
  eliminarPrecio,
}
