const mongoose = require('mongoose');

const historialTutorSchema = new mongoose.Schema(
  {
    tutorRut: { type: String, required: true },
    fechaDesde: { type: Date, default: Date.now },
    fechaHasta: { type: Date, default: null }
  },
  { _id: false }
);

const animalSchema = new mongoose.Schema(
  {
    animalId: { type: String, required: true, unique: true, index: true },
    especie: { type: String, required: true, enum: ['perro', 'gato'], lowercase: true },
    especieId: { type: String, default: null },
    razaId: { type: String, default: null },
    raza: { type: String, default: null },
    razaObservada: { type: String, default: null },
    nombre: { type: String, required: true, trim: true },
    sexo: { type: String, required: true, enum: ['macho', 'hembra'], lowercase: true },
    fechaNacimiento: { type: String, default: null },
    edadAproximada: { type: Number, required: true, min: 0 },
    color: { type: String, required: true, trim: true },
    microchip: { type: String, unique: true, sparse: true, default: null },
    estado: {
      type: String,
      enum: ['registrado', 'con_microchip', 'inscrito', 'fallecido'],
      default: 'registrado'
    },
    tutorRut: { type: String, default: null, uppercase: true },
    comunitario: { type: Boolean, default: false },
    responsableRut: { type: String, default: null, uppercase: true },
    sector: { type: String, default: null, trim: true },
    historialTutores: { type: [historialTutorSchema], default: [] },
    defuncion: {
      fecha: { type: Date, default: null },
      causa: { type: String, default: null },
      respaldo: { type: String, default: null }
    },
    fechaRegistro: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

module.exports = mongoose.model('Animal', animalSchema);