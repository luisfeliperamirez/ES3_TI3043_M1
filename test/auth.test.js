const test = require('node:test');
const assert = require('node:assert/strict');
const { verificarToken } = require('../src/middlewares/auth');

test('acepta una sesión con perfil conocido', async () => {
  const fetchOriginal = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ rut: '11111111-1', perfil: 'vecino' })
  });

  const req = { headers: { authorization: 'Bearer token-valido' } };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
  let continuo = false;

  try {
    await verificarToken(req, res, () => {
      continuo = true;
    });
  } finally {
    global.fetch = fetchOriginal;
  }

  assert.equal(continuo, true);
  assert.equal(req.usuario.perfil, 'vecino');
});

test('rechaza una sesión con perfil desconocido usando error 403 estándar', async () => {
  const fetchOriginal = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ rut: '11111111-1', perfil: 'desconocido' })
  });

  const req = { headers: { authorization: 'Bearer token-valido' } };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
  let continuo = false;

  try {
    await verificarToken(req, res, () => {
      continuo = true;
    });
  } finally {
    global.fetch = fetchOriginal;
  }

  assert.equal(continuo, false);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, {
    error: {
      codigo: 'PERFIL_NO_AUTORIZADO',
      mensaje: 'El perfil del usuario no está habilitado para este módulo'
    }
  });
});
