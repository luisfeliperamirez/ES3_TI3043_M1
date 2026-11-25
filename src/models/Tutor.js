const mongoose = require('mongoose');

const contadorSchema = new mongoose.Schema(
  { _id: String, secuencia: { type: Number, default: 0 } },
  { versionKey: false }
);
const Contador = mongoose.models.ContadorAnimal || mongoose.model('ContadorAnimal', contadorSchema);

const mascotaSchema = new mongoose.Schema(
  {
    animalId: { type: String, required: true },
    especie: { type: String, required: true, enum: ['perro', 'gato'] },
    raza: { type: String, required: true, trim: true },
    nombre: { type: String, required: true, trim: true },
    sexo: { type: String, required: true, trim: true },
    fechaNacimientoEstimada: { type: Date, required: true },
    color: { type: String, required: true, trim: true },
    microchip: { type: String, trim: true },
    estado: { type: String, enum: ['registrado', 'fallecido'], default: 'registrado' },
    fechaDefuncion: Date,
    causaDefuncion: { type: String, trim: true }
  },
  { _id: false }
);

const tutorSchema = new mongoose.Schema(
  {
    rut: { type: String, required: true, unique: true, trim: true, uppercase: true },
    direccion: { type: String, required: true, trim: true },
    comuna: { type: String, required: true, trim: true, default: 'Antofagasta' },
    telefono: { type: String, required: true, trim: true },
    correo: { type: String, required: true, trim: true, lowercase: true },
    prohibicionTenencia: { type: Boolean, default: false },
    fechaRegistro: { type: Date, default: Date.now },
    mascotas: { type: [mascotaSchema], default: [] }
  },
  { versionKey: false }
);

tutorSchema.statics.registrarMascota = async function (rutTutor, datos) {
  const tutor = await this.findOne({ rut: String(rutTutor).trim().toUpperCase() });
  if (!tutor) throw new Error('Tutor no encontrado');

  const contador = await Contador.findOneAndUpdate(
    { _id: 'animalId' },
    { $inc: { secuencia: 1 } },
    { new: true, upsert: true }
  );
  const animalId = `A-${String(contador.secuencia).padStart(6, '0')}`;

  tutor.mascotas.push({ ...datos, animalId, estado: 'registrado' });
  await tutor.save();
  return tutor.mascotas[tutor.mascotas.length - 1];
};

tutorSchema.statics.registrarDefuncion = async function (animalId, fechaDefuncion, causa) {
  const resultado = await this.updateOne(
    { 'mascotas.animalId': animalId, 'mascotas.estado': { $ne: 'fallecido' } },
    {
      $set: {
        'mascotas.$.estado': 'fallecido',
        'mascotas.$.fechaDefuncion': fechaDefuncion,
        'mascotas.$.causaDefuncion': causa
      }
    }
  );
  if (resultado.modifiedCount === 0) throw new Error('Animal no encontrado o ya fallecido');
  return resultado;
};

module.exports = mongoose.model('Tutor', tutorSchema);