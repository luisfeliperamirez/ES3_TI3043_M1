function enviarError(res, status, codigo, mensaje) {
  return res.status(status).json({
    error: {
      codigo,
      mensaje
    }
  });
}

module.exports = { enviarError };