const mongoose = require('mongoose');
const Tutor = require('../models/Tutor');

async function conectarDB() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Conectado a MongoDB');

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