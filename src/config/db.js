const mongoose = require('mongoose');
const Tutor = require('../models/Tutor');
const Animal = require('../models/Animal');
const Microchip = require('../models/Microchip');

async function conectarDB() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Conectado a MongoDB');

  await Animal.collection.dropIndex('microchip_1').catch(() => {});
  await Animal.syncIndexes();
  await Microchip.syncIndexes();

  await Tutor.updateOne(
    { rut: '9876543-3' },
    {
      $setOnInsert: {
        rut: '9876543-3',
        direccion: 'Sin registro',
        comuna: 'Antofagasta',
        telefono: '+56900000000',
        correo: 'prohibido@municipalidad.cl',
        prohibicionTenencia: true
      }
    },
    { upsert: true }
  );
}

module.exports = { conectarDB };