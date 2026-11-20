require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { conectarDB } = require('./config/db');
const registroRoutes = require('./routes/registro.routes');
const { enviarError } = require('./utils/errores');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/registro', registroRoutes);

app.use('/api', (req, res) => {
  return enviarError(res, 404, 'RUTA_NO_ENCONTRADA', 'El recurso solicitado no existe');
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return enviarError(res, 400, 'JSON_INVALIDO', 'El cuerpo de la petición no es un JSON válido');
  }
  return enviarError(res, 500, 'ERROR_INTERNO', 'Ocurrió un error interno en el servidor');
});

const PORT = process.env.PORT || 3000;

conectarDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Módulo 1 ejecutándose en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error al iniciar la aplicación:', err.message);
    process.exit(1);
  });