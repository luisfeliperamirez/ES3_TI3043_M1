const NUCLEO_URL = 'https://nucleo-tr.onrender.com';

function obtenerSesion() {
  const token = sessionStorage.getItem('tr_token');
  const usuarioRaw = sessionStorage.getItem('tr_usuario');
  if (!token || !usuarioRaw) return null;
  return { token, usuario: JSON.parse(usuarioRaw) };
}

function mostrarAlerta(elemento, texto, esError) {
  elemento.textContent = texto;
  elemento.className = `alerta ${esError ? 'alerta-error' : 'alerta-ok'}`;
}

function actualizarVistaSesion() {
  const sesion = obtenerSesion();
  const seccionLogin = document.getElementById('seccion-login');
  const panelModulo = document.getElementById('panel-modulo');
  const sesionInfo = document.getElementById('sesion-info');
  const usuarioActivo = document.getElementById('usuario-activo');

  if (sesion) {
    seccionLogin.classList.add('hidden');
    panelModulo.classList.remove('hidden');
    sesionInfo.classList.remove('hidden');
    usuarioActivo.textContent = `${sesion.usuario.nombre || sesion.usuario.rut} (${sesion.usuario.perfil})`;

    const inputRut = document.getElementById('tutor-rut');
    if (inputRut && sesion.usuario.rut) {
      inputRut.value = sesion.usuario.rut;
    }
  } else {
    seccionLogin.classList.remove('hidden');
    panelModulo.classList.add('hidden');
    sesionInfo.classList.add('hidden');
  }
}

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const rut = document.getElementById('login-rut').value.trim();
  const clave = document.getElementById('login-clave').value;
  const alerta = document.getElementById('login-mensaje');

  try {
    const resNucleo = await fetch(`${NUCLEO_URL}/api/nucleo/sesiones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rut, clave })
    });

    const dataNucleo = await resNucleo.json();
    if (!resNucleo.ok || !dataNucleo.token) {
      mostrarAlerta(alerta, dataNucleo.error?.mensaje || 'Credenciales inválidas en el núcleo', true);
      return;
    }

    const resPerfil = await fetch('/api/registro/sesion', {
      headers: { Authorization: `Bearer ${dataNucleo.token}` }
    });
    const dataPerfil = await resPerfil.json();

    if (!resPerfil.ok) {
      mostrarAlerta(alerta, dataPerfil.error?.mensaje || 'No se pudo validar sesión con el módulo', true);
      return;
    }

    sessionStorage.setItem('tr_token', dataNucleo.token);
    sessionStorage.setItem('tr_usuario', JSON.stringify(dataPerfil.usuario));
    alerta.classList.add('hidden');
    actualizarVistaSesion();
  } catch (err) {
    mostrarAlerta(alerta, 'Error de conexión con el núcleo', true);
  }
});

document.getElementById('btn-logout').addEventListener('click', () => {
  sessionStorage.removeItem('tr_token');
  sessionStorage.removeItem('tr_usuario');
  actualizarVistaSesion();
});

document.addEventListener('DOMContentLoaded', actualizarVistaSesion);