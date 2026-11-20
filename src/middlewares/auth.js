const { enviarError } = require('../utils/errores');

async function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return enviarError(res, 401, 'TOKEN_REQUERIDO', 'Debe proporcionar un token Bearer válido');
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return enviarError(res, 401, 'TOKEN_REQUERIDO', 'El token está vacío');
  }

  try {
    const respuesta = await fetch(`${process.env.NUCLEO_URL}/api/nucleo/sesiones/actual`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

    if (respuesta.status === 401 || respuesta.status === 403) {
      return enviarError(res, 401, 'TOKEN_INVALIDO', 'El token es inválido o ha expirado');
    }

    if (!respuesta.ok) {
      return enviarError(res, 503, 'NUCLEO_NO_DISPONIBLE', 'Error al validar sesión con el núcleo');
    }

    const datos = await respuesta.json();
    req.usuario = datos;
    req.token = token;
    return next();
  } catch (error) {
    return enviarError(res, 503, 'NUCLEO_NO_DISPONIBLE', 'No se pudo conectar con el servicio núcleo');
  }
}

function permitirPerfiles(...perfilesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !perfilesPermitidos.includes(req.usuario.perfil)) {
      return enviarError(res, 403, 'PERFIL_NO_AUTORIZADO', 'Su perfil no tiene permisos para esta operación');
    }
    return next();
  };
}

module.exports = { verificarToken, permitirPerfiles };