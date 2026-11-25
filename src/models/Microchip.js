const mongoose = require('mongoose');

const microchipSchema = new mongoose.Schema(
  {
    animalId: { type: String, required: true, unique: true, trim: true },
    microchip: { type: String, required: true, unique: true, match: /^\d{15}$/ },
    fechaAsociacion: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

module.exports = mongoose.model('Microchip', microchipSchema);
