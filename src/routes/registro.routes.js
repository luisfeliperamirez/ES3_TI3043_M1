const express = require('express');
const { verificarToken } = require('../middlewares/auth');
const tutoresRoutes = require('./tutores.routes');

const router = express.Router();

router.get('/sesion', verificarToken, (req, res) => {
  res.status(200).json({
    ok: true,
    usuario: req.usuario
  });
});

router.use('/tutores', tutoresRoutes);

module.exports = router;