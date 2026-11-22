const express = require('express');
const { verificarToken } = require('../middlewares/auth');
const tutoresRoutes = require('./tutores.routes');
const animalesRoutes = require('./animales.routes');

const router = express.Router();

router.get('/sesion', verificarToken, (req, res) => {
  res.status(200).json({
    ok: true,
    usuario: req.usuario
  });
});

router.use('/tutores', tutoresRoutes);
router.use('/animales', animalesRoutes);
module.exports = router;