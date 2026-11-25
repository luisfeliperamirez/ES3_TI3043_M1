const express = require('express');
const Animal = require('../models/Animal');
const Microchip = require('../models/Microchip');
const Tutor = require('../models/Tutor');
const Contador = require('../models/Contador');
const { verificarToken, permitirPerfiles } = require('../middlewares/auth');
const { limpiarRut, validarRutChileno } = require('../utils/rut');
const { enviarError } = require('../utils/errores');

const router = express.Router();

async function consultarAnimalNucleo(animalId, token) {
  try {
    const respuesta = await fetch(
      `${process.env.NUCLEO_URL}/api/registro/animales/${encodeURIComponent(animalId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      }
    );

    if (respuesta.status === 404) return null;
    if (!respuesta.ok) throw new Error('NUCLEO_NO_DISPONIBLE');
    return await respuesta.json();
  } catch (error) {
    throw new Error('NUCLEO_NO_DISPONIBLE');
  }
}

function formatearAnimal(animal) {
  return {
    animalId: animal.animalId,
    especie: animal.especie,
    especieId: animal.especieId,
    razaId: animal.razaId,
    raza: animal.raza,
    razaObservada: animal.razaObservada,
    nombre: animal.nombre,
    sexo: animal.sexo,
    edadAproximada: animal.edadAproximada,
    color: animal.color,
    microchip: animal.microchip || null,
    estado: animal.estado,
    tutorRut: animal.tutorRut,
    comunitario: animal.comunitario,
    responsableRut: animal.responsableRut,
    sector: animal.sector,
    fechaRegistro: animal.fechaRegistro ? animal.fechaRegistro.toISOString() : null
  };
}

async function generarSiguienteAnimalId() {
  const contador = await Contador.findByIdAndUpdate(
    'animalId',
    { $inc: { secuencia: 1 } },
    { new: true, upsert: true }
  );
  return `A-${String(contador.secuencia).padStart(6, '0')}`;
}

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

function esMayorDeEdad(usuarioNucleo) {
  if (usuarioNucleo.mayorDeEdad === false) return false;
  if (typeof usuarioNucleo.edad === 'number' && usuarioNucleo.edad < 18) return false;
  if (usuarioNucleo.fechaNacimiento) {
    const nacimiento = new Date(usuarioNucleo.fechaNacimiento);
    if (!Number.isNaN(nacimiento.getTime())) {
      const hoy = new Date();
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const mes = hoy.getMonth() - nacimiento.getMonth();
      if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad -= 1;
      }
      return edad >= 18;
    }
  }
  return true;
}

router.post('/', verificarToken, permitirPerfiles('vecino', 'comunitario', 'funcionario', 'admin'), async (req, res) => {
  try {
    const {
      especie,
      especieId,
      razaId,
      raza,
      razaObservada,
      nombre,
      sexo,
      fechaNacimiento,
      edadAproximada,
      color,
      comunitario,
      tutorRut,
      responsableRut,
      sector
    } = req.body;

    const esComunitario = comunitario === true;

    const especieLimpia = String(especie || '').trim().toLowerCase();
    if (!['perro', 'gato'].includes(especieLimpia)) {
      return enviarError(res, 400, 'ESPECIE_INVALIDA', 'La especie debe ser perro o gato');
    }

    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return enviarError(res, 400, 'NOMBRE_REQUERIDO', 'El nombre del animal es obligatorio');
    }

    const sexoLimpio = String(sexo || '').trim().toLowerCase();
    if (!['macho', 'hembra'].includes(sexoLimpio)) {
      return enviarError(res, 400, 'SEXO_INVALIDO', 'El sexo del animal debe ser macho o hembra');
    }

    const edadNumero = Number(edadAproximada);
    if (edadAproximada === undefined || edadAproximada === null || Number.isNaN(edadNumero) || edadNumero < 0) {
      return enviarError(res, 400, 'EDAD_INVALIDA', 'La edad aproximada del animal es obligatoria');
    }

    if (!color || typeof color !== 'string' || !color.trim()) {
      return enviarError(res, 400, 'COLOR_REQUERIDO', 'El color del animal es obligatorio');
    }

    const razaTexto = raza ? String(raza).trim() : '';
    const esMestizo = !razaTexto || razaTexto.toLowerCase() === 'mestizo';
    const razaFinal = esMestizo ? null : razaTexto;
    const razaIdFinal = esMestizo ? null : (razaId ? String(razaId).trim() : null);
    const razaObservadaFinal = esMestizo
      ? (razaObservada && String(razaObservada).trim() ? String(razaObservada).trim() : 'Mestizo')
      : null;

    if (esComunitario) {
      const rutRespLimpio = limpiarRut(responsableRut || req.usuario.rut);
      if (!rutRespLimpio || !validarRutChileno(rutRespLimpio)) {
        return enviarError(res, 400, 'RUT_INVALIDO', 'Debe indicar un RUT válido para el responsable');
      }

      if (['vecino', 'comunitario'].includes(req.usuario.perfil) && limpiarRut(req.usuario.rut) !== rutRespLimpio) {
        return enviarError(res, 403, 'PERFIL_NO_AUTORIZADO', 'Solo puede inscribir animales comunitarios con su propio RUT');
      }

      if (!sector || typeof sector !== 'string' || sector.trim().length < 3) {
        return enviarError(res, 400, 'SECTOR_REQUERIDO', 'Debe indicar el sector geográfico o junta de vecinos donde habita el animal');
      }

      const tutorLocal = await Tutor.findOne({ rut: rutRespLimpio });
      if (tutorLocal && tutorLocal.prohibicionTenencia) {
        return enviarError(res, 409, 'PROHIBICION_TENENCIA', 'El responsable figura con prohibición de tenencia');
      }

      const consultaNucleo = await consultarUsuarioNucleo(rutRespLimpio, req.token);
      if (!consultaNucleo.encontrado) {
        return enviarError(res, 404, 'USUARIO_NO_ENCONTRADO', 'El RUT del responsable no existe en el núcleo');
      }

      if (consultaNucleo.datos.prohibicionTenencia === true) {
        return enviarError(res, 409, 'PROHIBICION_TENENCIA', 'El responsable figura con prohibición de tenencia');
      }

      if (!esMayorDeEdad(consultaNucleo.datos)) {
        return enviarError(res, 409, 'MENOR_DE_EDAD', 'El responsable de un animal comunitario debe ser mayor de edad');
      }

      const animalId = await generarSiguienteAnimalId();
      const nuevoAnimal = await Animal.create({
        animalId,
        especie: especieLimpia,
        especieId: especieId ? String(especieId).trim() : (especieLimpia === 'perro' ? 'ESP-PERRO' : 'ESP-GATO'),
        razaId: razaIdFinal,
        raza: razaFinal,
        razaObservada: razaObservadaFinal,
        nombre: nombre.trim(),
        sexo: sexoLimpio,
        fechaNacimiento: fechaNacimiento || null,
        edadAproximada: edadNumero,
        color: color.trim(),
        estado: 'registrado',
        tutorRut: null,
        comunitario: true,
        responsableRut: rutRespLimpio,
        sector: sector.trim()
      });

      return res.status(201).json(formatearAnimal(nuevoAnimal));
    }

    const rutTutorLimpio = limpiarRut(tutorRut || req.usuario.rut);
    if (!rutTutorLimpio || !validarRutChileno(rutTutorLimpio)) {
      return enviarError(res, 400, 'RUT_INVALIDO', 'Debe indicar un RUT de tutor válido');
    }

    if (req.usuario.perfil === 'vecino' && limpiarRut(req.usuario.rut) !== rutTutorLimpio) {
      return enviarError(res, 403, 'PERFIL_NO_AUTORIZADO', 'Un vecino solo puede registrar mascotas vinculadas a su propio RUT');
    }

    const tutorRegistrado = await Tutor.findOne({ rut: rutTutorLimpio });
    if (!tutorRegistrado) {
      return enviarError(res, 404, 'TUTOR_NO_ENCONTRADO', 'Debe registrar primero los datos personales del tutor');
    }

    if (tutorRegistrado.prohibicionTenencia) {
      return enviarError(res, 409, 'PROHIBICION_TENENCIA', 'El tutor figura con prohibición de tenencia');
    }

    const animalId = await generarSiguienteAnimalId();
    const nuevoAnimal = await Animal.create({
      animalId,
      especie: especieLimpia,
      especieId: especieId ? String(especieId).trim() : (especieLimpia === 'perro' ? 'ESP-PERRO' : 'ESP-GATO'),
      razaId: razaIdFinal,
      raza: razaFinal,
      razaObservada: razaObservadaFinal,
      nombre: nombre.trim(),
      sexo: sexoLimpio,
      fechaNacimiento: fechaNacimiento || null,
      edadAproximada: edadNumero,
      color: color.trim(),
      estado: 'registrado',
      tutorRut: rutTutorLimpio,
      comunitario: false,
      responsableRut: null,
      historialTutores: [{ tutorRut: rutTutorLimpio, fechaDesde: new Date(), fechaHasta: null }]
    });

    return res.status(201).json(formatearAnimal(nuevoAnimal));
  } catch (error) {
    console.error('Error al registrar animal:', error);
    if (error.message === 'NUCLEO_ERROR') {
      return enviarError(res, 503, 'NUCLEO_NO_DISPONIBLE', 'No se pudo validar el responsable en el núcleo');
    }
    return enviarError(res, 500, 'ERROR_INTERNO', 'Ocurrió un error al registrar el animal');
  }
});

router.get('/', verificarToken, async (req, res) => {
  try {
    const { tutorRut, responsableRut, estado, especie } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const filtro = {};

    if (tutorRut !== undefined && tutorRut !== '') {
      const rutLimpio = limpiarRut(tutorRut);
      if (!validarRutChileno(rutLimpio)) {
        return enviarError(res, 400, 'RUT_INVALIDO', 'El parámetro tutorRut no tiene formato válido');
      }
      filtro.tutorRut = rutLimpio;
    }

    if (responsableRut !== undefined && responsableRut !== '') {
      const rutRespLimpio = limpiarRut(responsableRut);
      if (!validarRutChileno(rutRespLimpio)) {
        return enviarError(res, 400, 'RUT_INVALIDO', 'El parámetro responsableRut no tiene formato válido');
      }
      filtro.responsableRut = rutRespLimpio;
    }

    const estadosValidos = ['registrado', 'con_microchip', 'inscrito', 'fallecido'];
    if (estado !== undefined && estado !== '') {
      if (!estadosValidos.includes(estado)) {
        return enviarError(res, 400, 'ESTADO_INVALIDO', 'El estado indicado no es válido');
      }
      filtro.estado = estado;
    }

    const especiesValidas = ['perro', 'gato'];
    if (especie !== undefined && especie !== '') {
      const especieLimpia = String(especie).trim().toLowerCase();
      if (!especiesValidas.includes(especieLimpia)) {
        return enviarError(res, 400, 'ESPECIE_INVALIDA', 'La especie debe ser perro o gato');
      }
      filtro.especie = especieLimpia;
    }

    const perfilesRestringidos = ['vecino', 'comunitario'];
    if (perfilesRestringidos.includes(req.usuario.perfil)) {
      const rutUsuario = limpiarRut(req.usuario.rut);
      if (filtro.tutorRut && filtro.tutorRut !== rutUsuario) {
        return enviarError(res, 403, 'PERFIL_NO_AUTORIZADO', 'Solo puede consultar sus propios animales');
      }
      if (filtro.responsableRut && filtro.responsableRut !== rutUsuario) {
        return enviarError(res, 403, 'PERFIL_NO_AUTORIZADO', 'Solo puede consultar animales comunitarios a su cargo');
      }
      filtro.$or = [{ tutorRut: rutUsuario }, { responsableRut: rutUsuario }];
    }

    const total = await Animal.countDocuments(filtro);
    const totalPaginas = Math.ceil(total / limit);
    const animales = await Animal.find(filtro)
      .sort({ fechaRegistro: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      page,
      limit,
      total,
      totalPaginas,
      datos: animales.map(formatearAnimal)
    });
  } catch (error) {
    return enviarError(res, 500, 'ERROR_INTERNO', 'Ocurrió un error al listar los animales');
  }
});

router.get('/:animalId', verificarToken, async (req, res) => {
  try {
    const animalId = String(req.params.animalId || '').trim().toUpperCase();

    if (animalId.startsWith('SIM-')) {
      const animalNucleo = await consultarAnimalNucleo(animalId, req.token);
      if (!animalNucleo) {
        return enviarError(res, 404, 'ANIMAL_NO_ENCONTRADO', `No existe un animal con identificador ${animalId}`);
      }

      const asociacion = await Microchip.findOne({ animalId });
      if (asociacion) {
        animalNucleo.microchip = asociacion.microchip;
        animalNucleo.estado = 'con_microchip';
      }
      return res.status(200).json(animalNucleo);
    }

    const animal = await Animal.findOne({ animalId });

    if (!animal) {
      return enviarError(res, 404, 'ANIMAL_NO_ENCONTRADO', `No existe un animal con identificador ${animalId}`);
    }

    const perfilesRestringidos = ['vecino', 'comunitario'];
    if (perfilesRestringidos.includes(req.usuario.perfil)) {
      const rutUsuario = limpiarRut(req.usuario.rut);
      const esSuTutor = !animal.comunitario && animal.tutorRut === rutUsuario;
      const esSuResponsable = animal.comunitario && animal.responsableRut === rutUsuario;

      if (!esSuTutor && !esSuResponsable) {
        return enviarError(res, 403, 'PERFIL_NO_AUTORIZADO', 'No tiene permisos para ver los datos de este animal');
      }
    }

    return res.status(200).json(formatearAnimal(animal));
  } catch (error) {
    if (error.message === 'NUCLEO_NO_DISPONIBLE') {
      return enviarError(res, 503, 'NUCLEO_NO_DISPONIBLE', 'No se pudo consultar el animal en el núcleo');
    }
    return enviarError(res, 500, 'ERROR_INTERNO', 'Ocurrió un error al consultar el animal');
  }
});

router.patch('/:animalId/microchip', verificarToken, permitirPerfiles('veterinario', 'funcionario'), async (req, res) => {
  const animalId = String(req.params.animalId || '').trim().toUpperCase();
  const microchip = req.body && typeof req.body.microchip === 'string'
    ? req.body.microchip.trim()
    : '';

  if (!animalId) {
    return enviarError(res, 400, 'ANIMAL_ID_INVALIDO', 'Debe proporcionar un animalId válido');
  }

  if (!/^\d{15}$/.test(microchip)) {
    return enviarError(res, 400, 'MICROCHIP_INVALIDO', 'El microchip debe ser un número de 15 dígitos');
  }

  try {
    const esAnimalSimulado = animalId.toUpperCase().startsWith('SIM-');
    const animal = esAnimalSimulado
      ? await consultarAnimalNucleo(animalId, req.token)
      : await Animal.findOne({ animalId });

    if (!animal) {
      return enviarError(res, 404, 'ANIMAL_NO_ENCONTRADO', `No se encontró un animal con el animalId: ${animalId}`);
    }

    if (animal.estado === 'fallecido') {
      return enviarError(res, 409, 'ANIMAL_FALLECIDO', 'No se puede asociar un microchip a un animal fallecido');
    }

    const asociacionExistente = esAnimalSimulado
      ? await Microchip.findOne({ animalId })
      : null;
    if (asociacionExistente || animal.microchip || animal.estado === 'con_microchip') {
      return enviarError(res, 409, 'ANIMAL_YA_MICROCHIPEADO', 'El animal ya tiene un microchip asociado');
    }

    const animalConMicrochip = await Microchip.findOne({ microchip })
      || await Animal.findOne({ microchip });

    if (animalConMicrochip) {
      return enviarError(res, 409, 'MICROCHIP_REGISTRADO', 'Microchip ya registrado');
    }

    if (esAnimalSimulado) {
      const asociacion = await Microchip.create({ animalId, microchip });
      animal.microchip = asociacion.microchip;
      animal.estado = 'con_microchip';

      return res.status(200).json({
        ok: true,
        mensaje: 'Microchip asignado correctamente',
        animal
      });
    }

    const camposActualizados = { microchip };
    if (animal.estado === 'registrado') {
      camposActualizados.estado = 'con_microchip';
    }

    const animalActualizado = await Animal.findOneAndUpdate(
      { animalId },
      { $set: camposActualizados },
      { new: true, runValidators: false }
    );
    if (!animalActualizado) {
      return enviarError(res, 404, 'ANIMAL_NO_ENCONTRADO', `No se encontró un animal con el animalId: ${animalId}`);
    }

    return res.status(200).json({
      ok: true,
      mensaje: 'Microchip asignado correctamente',
      animal: animalActualizado
    });
  } catch (error) {
    if (error && error.code === 11000) {
      const codigoDuplicado = error.keyPattern
        ? error.keyPattern.microchip
        : error.message && error.message.includes('microchip_1');
      if (codigoDuplicado) {
        return enviarError(res, 409, 'MICROCHIP_REGISTRADO', 'Microchip ya registrado');
      }
      return enviarError(res, 409, 'ANIMAL_YA_MICROCHIPEADO', 'El animal ya tiene un microchip asociado');
    }

    if (error.message === 'NUCLEO_NO_DISPONIBLE') {
      return enviarError(res, 503, 'NUCLEO_NO_DISPONIBLE', 'No se pudo consultar el animal en el núcleo');
    }

    console.error('Error al asignar microchip:', error);
    return enviarError(res, 500, 'ERROR_INTERNO', 'Ocurrió un error al asignar el microchip');
  }
});

module.exports = router;