const MENSAJE_GENERICO_AUTENTICACION =
  'No se pudo completar la autenticación. Revisá los datos e intentá de nuevo.'

const MENSAJES_POR_CODIGO = {
  'auth/email-already-in-use':
    'Ya existe una cuenta con ese correo. Iniciá sesión o recuperá tu contraseña.',
  'auth/invalid-email': 'Revisá el correo. Parece incompleto.',
  'auth/missing-email': 'Ingresá tu correo.',
  'auth/missing-password': 'Ingresá tu contraseña.',
  'auth/weak-password': 'La contraseña no cumple los requisitos.',
  'auth/invalid-credential': 'El correo o la contraseña no coinciden.',
  'auth/wrong-password': 'El correo o la contraseña no coinciden.',
  'auth/user-not-found': 'No encontramos una cuenta con ese correo. Podés crear una cuenta nueva.',
  'auth/too-many-requests': 'Hubo demasiados intentos. Esperá un momento y probá de nuevo.',
  'auth/network-request-failed':
    'No hay conexión. Necesitás internet para ingresar o crear una cuenta.',
  'auth/operation-not-allowed': 'El ingreso con correo no está disponible en este momento.',
}

export function obtenerMensajeErrorFirebaseAuth(error) {
  return MENSAJES_POR_CODIGO[error?.code] || MENSAJE_GENERICO_AUTENTICACION
}

export function esCorreoValido(correo) {
  const correoNormalizado = String(correo || '').trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoNormalizado)
}

export const MENSAJES_VALIDACION_AUTH = {
  correoVacio: 'Ingresá tu correo.',
  correoInvalido: 'Revisá el correo. Parece incompleto.',
  contrasenaVacia: 'Ingresá tu contraseña.',
  contrasenaNoValida: 'La contraseña no cumple los requisitos.',
  confirmacionVacia: 'Confirmá tu contraseña.',
  contrasenasDistintas: 'Las contraseñas no coinciden.',
  recuperacionEnviada: 'Te enviamos un correo para recuperar el acceso. Revisá tu bandeja de entrada.',
}
