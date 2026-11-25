const mongoose = require('mongoose');

const tutorSchema = new mongoose.Schema(
  {
    rut: { type: String, required: true, unique: true, trim: true, uppercase: true },
    direccion: { type: String, required: true, trim: true },
    comuna: { type: String, required: true, trim: true, default: 'Antofagasta' },
    telefono: { type: String, required: true, trim: true },
    correo: { type: String, required: true, trim: true, lowercase: true },
    prohibicionTenencia: { type: Boolean, default: false },
    fechaRegistro: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

module.exports = mongoose.model('Tutor', tutorSchema);