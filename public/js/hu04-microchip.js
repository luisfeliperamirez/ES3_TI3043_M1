document.getElementById('form-buscar-animal').addEventListener('submit', async (e) => {
  e.preventDefault();
  const sesion = obtenerSesion();
  const alerta = document.getElementById('busqueda-animal-mensaje');
  const cajaResultado = document.getElementById('animal-encontrado');
  const preJson = document.getElementById('animal-encontrado-json');
  const formAsociar = document.getElementById('form-asociar-microchip');
  const animalId = document.getElementById('microchip-animal-id').value.trim().toUpperCase();

  cajaResultado.classList.add('hidden');
  formAsociar.classList.add('hidden');

  if (!sesion) {
    mostrarAlerta(alerta, 'Debe iniciar sesión para buscar un animal', true);
    return;
  }

  try {
    const res = await fetch(`/api/registro/animales/${encodeURIComponent(animalId)}`, {
      headers: { Authorization: `Bearer ${sesion.token}` }
    });
    const data = await res.json();

    if (!res.ok) {
      mostrarAlerta(alerta, `Error ${res.status} (${data.error?.codigo}): ${data.error?.mensaje}`, true);
      return;
    }

    mostrarAlerta(alerta, `Animal ${data.animalId} encontrado`, false);
    preJson.textContent = JSON.stringify(data, null, 2);
    cajaResultado.classList.remove('hidden');
    formAsociar.classList.remove('hidden');
  } catch (err) {
    mostrarAlerta(alerta, 'Error de red al buscar el animal', true);
  }
});

document.getElementById('form-asociar-microchip').addEventListener('submit', async (e) => {
  e.preventDefault();
  const sesion = obtenerSesion();
  const alerta = document.getElementById('asociacion-microchip-mensaje');
  const animalId = document.getElementById('microchip-animal-id').value.trim().toUpperCase();
  const microchip = document.getElementById('microchip-codigo').value.trim();

  if (!sesion) {
    mostrarAlerta(alerta, 'Debe iniciar sesión para asociar un microchip', true);
    return;
  }

  try {
    const res = await fetch(`/api/registro/animales/${encodeURIComponent(animalId)}/microchip`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sesion.token}`
      },
      body: JSON.stringify({ microchip })
    });
    const data = await res.json();

    if (!res.ok) {
      mostrarAlerta(alerta, `Error ${res.status} (${data.error?.codigo}): ${data.error?.mensaje}`, true);
      return;
    }

    mostrarAlerta(alerta, data.mensaje, false);
    document.getElementById('animal-encontrado-json').textContent = JSON.stringify(data.animal, null, 2);
    document.getElementById('microchip-codigo').value = '';
  } catch (err) {
    mostrarAlerta(alerta, 'Error de red al asociar el microchip', true);
  }
});
