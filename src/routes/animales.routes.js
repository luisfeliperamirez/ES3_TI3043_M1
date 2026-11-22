const express = require('express');
const Animal = require('../models/Animal');
const { verificarToken, permitirPerfiles } = require('../middlewares/auth');
const { enviarError } = require('../utils/errores');

const router = express.Router();

router.patch('/:animalId/microchip', verificarToken, permitirPerfiles('veterinario'), async (req, res) => {
  const animalId = String(req.params.animalId || '').trim();
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
    const animal = await Animal.findOne({ animalId });

    if (!animal) {
      return enviarError(res, 404, 'ANIMAL_NO_ENCONTRADO', 'No se encontró un animal con el animalId: ${animalId}');
    }

    animal.microchip = microchip;
    await animal.save();

    return res.status(200).json({
      ok: true,
      mensaje: 'Microchip asignado correctamente',
      animal
    });
  } catch (error) {
    console.error('Error al asignar microchip:', error);
    return enviarError(res, 500, 'ERROR_INTERNO', 'Ocurrió un error al asignar el microchip');
  }
});

module.exports = router;