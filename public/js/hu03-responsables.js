const checkComunitario = document.getElementById('hu03-comunitario');
const desplegableHu03 = document.getElementById('hu03-desplegable');

function actualizarDesplegableHu03() {
  const alerta = document.getElementById('hu03-mensaje');
  const cajaResultado = document.getElementById('hu03-resultado');

  if (checkComunitario.checked) {
    desplegableHu03.classList.remove('hidden');
    const sesion = obtenerSesion();
    const inputRespRut = document.getElementById('hu03-responsable-rut');
    if (sesion && sesion.usuario && sesion.usuario.rut && inputRespRut && !inputRespRut.value) {
      inputRespRut.value = sesion.usuario.rut;
    }
  } else {
    desplegableHu03.classList.add('hidden');
    if (alerta) alerta.classList.add('hidden');
    if (cajaResultado) cajaResultado.classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkComunitario.checked = false;
  actualizarDesplegableHu03();
});

checkComunitario.addEventListener('change', actualizarDesplegableHu03);

document.getElementById('form-hu03').addEventListener('submit', async (e) => {
  e.preventDefault();
  const sesion = obtenerSesion();
  const alerta = document.getElementById('hu03-mensaje');
  const cajaResultado = document.getElementById('hu03-resultado');
  const preJson = document.getElementById('hu03-json');

  if (!sesion) return;

  if (!checkComunitario.checked) {
    mostrarAlerta(alerta, 'Debe marcar la casilla de animal comunitario para continuar', true);
    return;
  }

  const payload = {
    comunitario: true,
    responsableRut: document.getElementById('hu03-responsable-rut').value.trim(),
    sector: document.getElementById('hu03-sector').value.trim(),
    nombre: document.getElementById('hu03-nombre').value.trim(),
    especie: document.getElementById('hu03-especie').value.trim().toLowerCase(),
    raza: document.getElementById('hu03-raza').value.trim(),
    razaObservada: document.getElementById('hu03-raza-observada').value.trim(),
    sexo: document.getElementById('hu03-sexo').value.trim().toLowerCase(),
    edadAproximada: Number(document.getElementById('hu03-edad').value),
    color: document.getElementById('hu03-color').value.trim()
  };

  try {
    const res = await fetch('/api/registro/animales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sesion.token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      cajaResultado.classList.add('hidden');
      mostrarAlerta(alerta, `Error ${res.status} (${data.error?.codigo}): ${data.error?.mensaje}`, true);
      return;
    }

    mostrarAlerta(alerta, `Animal comunitario inscrito con ID ${data.animalId} (HTTP ${res.status})`, false);
    preJson.textContent = JSON.stringify(data, null, 2);
    cajaResultado.classList.remove('hidden');
  } catch (err) {
    mostrarAlerta(alerta, 'Error de red al inscribir animal comunitario', true);
  }
});