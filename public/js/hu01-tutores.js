document.getElementById('form-hu01').addEventListener('submit', async (e) => {
  e.preventDefault();
  const sesion = obtenerSesion();
  const alerta = document.getElementById('hu01-mensaje');
  const cajaResultado = document.getElementById('hu01-resultado');
  const preJson = document.getElementById('hu01-json');

  if (!sesion) return;

  const payload = {
    rut: document.getElementById('tutor-rut').value.trim(),
    comuna: document.getElementById('tutor-comuna').value.trim(),
    direccion: document.getElementById('tutor-direccion').value.trim(),
    telefono: document.getElementById('tutor-telefono').value.trim(),
    correo: document.getElementById('tutor-correo').value.trim()
  };

  try {
    const res = await fetch('/api/registro/tutores', {
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

    mostrarAlerta(alerta, `Tutor registrado exitosamente (HTTP ${res.status})`, false);
    preJson.textContent = JSON.stringify(data, null, 2);
    cajaResultado.classList.remove('hidden');
  } catch (err) {
    mostrarAlerta(alerta, 'Error de red al registrar tutor', true);
  }
});

document.getElementById('btn-consultar-ficha').addEventListener('click', async () => {
  const sesion = obtenerSesion();
  const alerta = document.getElementById('hu01-mensaje');
  const cajaResultado = document.getElementById('hu01-resultado');
  const preJson = document.getElementById('hu01-json');
  const rut = document.getElementById('tutor-rut').value.trim();

  if (!sesion || !rut) return;

  try {
    const res = await fetch(`/api/registro/tutores/${encodeURIComponent(rut)}`, {
      headers: { Authorization: `Bearer ${sesion.token}` }
    });

    const data = await res.json();

    if (!res.ok) {
      cajaResultado.classList.add('hidden');
      mostrarAlerta(alerta, `Error ${res.status} (${data.error?.codigo}): ${data.error?.mensaje}`, true);
      return;
    }

    mostrarAlerta(alerta, 'Ficha consultada correctamente (HTTP 200)', false);
    preJson.textContent = JSON.stringify(data, null, 2);
    cajaResultado.classList.remove('hidden');
  } catch (err) {
    mostrarAlerta(alerta, 'Error de red al consultar ficha', true);
  }
});