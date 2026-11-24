document.getElementById('form-hu03').addEventListener('submit', async (e) => {
  e.preventDefault();
  const sesion = obtenerSesion();
  const alerta = document.getElementById('hu03-mensaje');
  const cajaResultado = document.getElementById('hu03-resultado');
  const preJson = document.getElementById('hu03-json');

  if (!sesion) return;

  const payload = {
    rut_responsable: document.getElementById('responsableRut').value.trim(),
    telefono_responsable: document.getElementById('telefonoResponsable').value.trim(),
    correo_responsable: document.getElementById('correoResponsable').value.trim(),
    sector_animal: document.getElementById('sectorAnimal').value.trim(),
    sector_residencia: document.getElementById('sector').value.trim()
  };

  try {
    const res = await fetch('/api/registro/responsables', {
        //no estoy seguro de esta ruta
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

    mostrarAlerta(alerta, `Responsable registrado exitosamente (HTTP ${res.status})`, false);
    preJson.textContent = JSON.stringify(data, null, 2);
    cajaResultado.classList.remove('hidden');
  } catch (err) {
    mostrarAlerta(alerta, 'Error de red al registrar responsable', true);
  }
});

document.getElementById('btn-consultar-ficha').addEventListener('click', async () => {
  const sesion = obtenerSesion();
  const alerta = document.getElementById('hu03-mensaje');
  const cajaResultado = document.getElementById('hu03-resultado');
  const preJson = document.getElementById('hu03-json');
  const rut = document.getElementById('responsableRut').value.trim();

  if (!sesion || !rut) return;

  try {
    const res = await fetch(`/api/registro/responsables/${encodeURIComponent(rut)}`, {
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