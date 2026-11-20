function limpiarRut(rut) {
  if (typeof rut !== 'string') return '';
  return rut.trim().toUpperCase();
}

function validarRutChileno(rut) {
  const limpio = limpiarRut(rut);
  if (!/^\d{7,8}-[\dK]$/.test(limpio)) return false;

  const [cuerpo, dv] = limpio.split('-');
  let suma = 0;
  let multiplicador = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = 11 - (suma % 11);
  let dvEsperado = String(resto);
  if (resto === 11) dvEsperado = '0';
  if (resto === 10) dvEsperado = 'K';

  return dv === dvEsperado;
}

module.exports = { limpiarRut, validarRutChileno };