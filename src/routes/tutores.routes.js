const express = require('express');
const Tutor = require('../models/Tutor');
const Animal = require('../models/Animal');
const { verificarToken, permitirPerfiles } = require('../middlewares/auth');
const { limpiarRut, validarRutChileno } = require('../utils/rut');
const { enviarError } = require('../utils/errores');

const router = express.Router();

async function consultarUsuarioNucleo(rut, token) {
  const respuesta = await fetch(`${process.env.NUCLEO_URL}/api/nucleo/usuarios/${encodeURIComponent(rut)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });

  if (respuesta.status === 404) {
    return { encontrado: false };
  }

  if (!respuesta.ok) {
    throw new Error('NUCLEO_ERROR');
  }

  const datos = await respuesta.json();
  return { encontrado: true, datos };
}

router.post('/', verificarToken, permitirPerfiles('vecino', 'funcionario', 'admin'), async (req, res) => {
  try {
    const { rut, direccion, comuna, telefono, correo } = req.body;
    const rutLimpio = limpiarRut(rut);

    if (!rutLimpio || !validarRutChileno(rutLimpio)) {
      return enviarError(res, 400, 'RUT_INVALIDO', 'El RUT debe tener formato chileno válido (XXXXXXXX-X)');
    }

    if (req.usuario.perfil === 'vecino' && limpiarRut(req.usuario.rut) !== rutLimpio) {
      return enviarError(res, 403, 'PERFIL_NO_AUTORIZADO', 'Un vecino solo puede registrar su propio RUT');
    }

    if (!direccion || typeof direccion !== 'string' || direccion.trim().length < 5) {
      return enviarError(res, 400, 'DIRECCION_INVALIDA', 'La dirección en Antofagasta es obligatoria');
    }

    const comunaNormalizada = comuna ? String(comuna).trim() : 'Antofagasta';
    if (comunaNormalizada.toLowerCase() !== 'antofagasta') {
      return enviarError(res, 400, 'COMUNA_INVALIDA', 'La dirección debe pertenecer a la comuna de Antofagasta');
    }

    if (!telefono || !/^\+?[\d\s-]{8,15}$/.test(String(telefono).trim())) {
      return enviarError(res, 400, 'TELEFONO_INVALIDO', 'Debe ingresar un teléfono de contacto válido');
    }

    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(correo).trim())) {
      return enviarError(res, 400, 'CORREO_INVALIDO', 'Debe ingresar un correo electrónico válido');
    }

    const tutorLocal = await Tutor.findOne({ rut: rutLimpio });
    if (tutorLocal && tutorLocal.prohibicionTenencia) {
      return enviarError(res, 409, 'PROHIBICION_TENENCIA', 'El solicitante figura con prohibición de tenencia de mascotas');
    }

    const consultaNucleo = await consultarUsuarioNucleo(rutLimpio, req.token);
    if (!consultaNucleo.encontrado) {
      return enviarError(res, 404, 'USUARIO_NO_ENCONTRADO', 'El RUT no existe en los registros del núcleo');
    }

    const usuarioNucleo = consultaNucleo.datos;
    if (usuarioNucleo.prohibicionTenencia === true) {
      await Tutor.updateOne(
        { rut: rutLimpio },
        {
          $set: {
            rut: rutLimpio,
            direccion: direccion.trim(),
            comuna: 'Antofagasta',
            telefono: String(telefono).trim(),
            correo: String(correo).trim().toLowerCase(),
            prohibicionTenencia: true
          }
        },
        { upsert: true }
      );
      return enviarError(res, 409, 'PROHIBICION_TENENCIA', 'El solicitante figura con prohibición de tenencia de mascotas');
    }

    const tutorGuardado = await Tutor.findOneAndUpdate(
      { rut: rutLimpio },
      {
        $set: {
          rut: rutLimpio,
          direccion: direccion.trim(),
          comuna: 'Antofagasta',
          telefono: String(telefono).trim(),
          correo: String(correo).trim().toLowerCase(),
          prohibicionTenencia: false
        }
      },
      { new: true, upsert: true }
    );

    return res.status(201).json({
      rut: tutorGuardado.rut,
      nombre: usuarioNucleo.nombre,
      perfil: usuarioNucleo.perfil,
      direccion: tutorGuardado.direccion,
      comuna: tutorGuardado.comuna,
      telefono: tutorGuardado.telefono,
      correo: tutorGuardado.correo,
      prohibicionTenencia: tutorGuardado.prohibicionTenencia,
      fechaRegistro: tutorGuardado.fechaRegistro.toISOString()
    });
  } catch (error) {
    if (error.message === 'NUCLEO_ERROR') {
      return enviarError(res, 503, 'NUCLEO_NO_DISPONIBLE', 'No se pudo consultar el usuario en el núcleo');
    }
    return enviarError(res, 500, 'ERROR_INTERNO', 'Error al registrar los datos del tutor');
  }
});

router.get(
  '/:rut',
  verificarToken,
  permitirPerfiles('vecino', 'comunitario', 'funcionario', 'admin'),
  async (req, res) => {
  try {
    const rutLimpio = limpiarRut(req.params.rut);
    if (!validarRutChileno(rutLimpio)) {
      return enviarError(res, 400, 'RUT_INVALIDO', 'El formato del RUT no es válido');
    }

    const perfilesRestringidos = ['vecino', 'comunitario'];
    if (perfilesRestringidos.includes(req.usuario.perfil) && limpiarRut(req.usuario.rut) !== rutLimpio) {
      return enviarError(res, 403, 'PERFIL_NO_AUTORIZADO', 'Solo puede consultar su propia ficha de tutor');
    }

    const tutor = await Tutor.findOne({ rut: rutLimpio });
    if (!tutor) {
      return enviarError(res, 404, 'TUTOR_NO_ENCONTRADO', 'No existe un tutor registrado con ese RUT');
    }

    const consultaNucleo = await consultarUsuarioNucleo(rutLimpio, req.token);
    const nombre = consultaNucleo.encontrado ? consultaNucleo.datos.nombre : null;
    const perfil = consultaNucleo.encontrado ? consultaNucleo.datos.perfil : 'vecino';
    const prohibicion = Boolean(tutor.prohibicionTenencia || (consultaNucleo.encontrado && consultaNucleo.datos.prohibicionTenencia));

    const mascotasPropias = await Animal.find({ tutorRut: rutLimpio, comunitario: false }).select('animalId');
    const mascotasComunitarias = await Animal.find({ responsableRut: rutLimpio, comunitario: true }).select('animalId');

    const animalIds = [
      ...mascotasPropias.map((a) => a.animalId),
      ...mascotasComunitarias.map((a) => a.animalId)
    ];

    return res.status(200).json({
      rut: tutor.rut,
      nombre,
      perfil,
      prohibicionTenencia: prohibicion,
      animalesACargo: mascotasPropias.length,
      animalesComunitarios: mascotasComunitarias.length,
      animalIds
      }
    );
  } catch (error) {
    if (error.message === 'NUCLEO_ERROR') {
      return enviarError(res, 503, 'NUCLEO_NO_DISPONIBLE', 'No se pudo consultar el usuario en el núcleo');
    }
    return enviarError(res, 500, 'ERROR_INTERNO', 'Error al obtener la ficha del tutor');
  }
});

module.exports = router;