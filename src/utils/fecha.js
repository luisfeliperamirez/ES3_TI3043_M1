const FECHA_ISO_REGEX = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|([+-])(\d{2}):(\d{2})))?$/;

function normalizarFechaUtc(valor) {
  if (typeof valor !== 'string') return null;

  const fecha = valor.trim();
  const partes = FECHA_ISO_REGEX.exec(fecha);
  if (!partes) return null;

  const [, anioTexto, mesTexto, diaTexto, horaTexto, minutoTexto, segundoTexto, , zona, , zonaHora, zonaMinuto] = partes;
  const anio = Number(anioTexto);
  const mes = Number(mesTexto);
  const dia = Number(diaTexto);

  const fechaCalendario = new Date(0);
  fechaCalendario.setUTCFullYear(anio, mes - 1, dia);
  fechaCalendario.setUTCHours(0, 0, 0, 0);
  if (
    fechaCalendario.getUTCFullYear() !== anio
    || fechaCalendario.getUTCMonth() !== mes - 1
    || fechaCalendario.getUTCDate() !== dia
  ) {
    return null;
  }

  if (horaTexto !== undefined) {
    const hora = Number(horaTexto);
    const minuto = Number(minutoTexto);
    const segundo = Number(segundoTexto);
    if (hora > 23 || minuto > 59 || segundo > 59) return null;

    if (zona !== 'Z') {
      const horasZona = Number(zonaHora);
      const minutosZona = Number(zonaMinuto);
      if (horasZona > 14 || minutosZona > 59 || (horasZona === 14 && minutosZona !== 0)) {
        return null;
      }
    }
  }

  const fechaParseada = new Date(fecha.length === 10 ? `${fecha}T00:00:00.000Z` : fecha);
  if (Number.isNaN(fechaParseada.getTime())) return null;

  return fechaParseada.toISOString();
}

module.exports = { normalizarFechaUtc };
