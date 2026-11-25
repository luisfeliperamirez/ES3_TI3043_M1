const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizarFechaUtc } = require('../src/utils/fecha');

test('normaliza una fecha calendario al inicio del día UTC', () => {
  assert.equal(normalizarFechaUtc('2026-11-25'), '2026-11-25T00:00:00.000Z');
});

test('convierte una fecha con desfase horario a UTC', () => {
  assert.equal(normalizarFechaUtc('2026-11-25T10:30:00-03:00'), '2026-11-25T13:30:00.000Z');
});

test('rechaza fechas inválidas o marcas de tiempo sin zona horaria', () => {
  assert.equal(normalizarFechaUtc('2026-02-30'), null);
  assert.equal(normalizarFechaUtc('2026-11-25T10:30:00'), null);
  assert.equal(normalizarFechaUtc(20261125), null);
});
