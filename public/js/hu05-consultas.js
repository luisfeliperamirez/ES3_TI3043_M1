document.getElementById('form-hu05-buscar').addEventListener('submit', async (e) => {
  e.preventDefault();
  const sesion = obtenerSesion();
  const alerta = document.getElementById('hu05-mensaje');
  const cajaResultado = document.getElementById('hu05-resultado');
  const preJson = document.getElementById('hu05-json');
  const animalId = document.getElementById('hu05-animal-id').value.trim().toUpperCase();

  if (!sesion || !animalId) return;

  try {
    const res = await fetch(`/api/registro/animales/${encodeURIComponent(animalId)}`, {
      headers: { Authorization: `Bearer ${sesion.token}` }
    });

    const data = await res.json();

    if (!res.ok) {
      cajaResultado.classList.add('hidden');
      mostrarAlerta(alerta, `Error ${res.status} (${data.error?.codigo}): ${data.error?.mensaje}`, true);
      return;
    }

    mostrarAlerta(alerta, `Animal ${data.animalId} encontrado (HTTP 200)`, false);
    preJson.textContent = JSON.stringify(data, null, 2);
    cajaResultado.classList.remove('hidden');
  } catch (err) {
    mostrarAlerta(alerta, 'Error de red al consultar el animal', true);
  }
});

document.getElementById('btn-hu05-listar').addEventListener('click', async () => {
  const sesion = obtenerSesion();
  const alerta = document.getElementById('hu05-mensaje');
  const cajaResultado = document.getElementById('hu05-resultado');
  const preJson = document.getElementById('hu05-json');

  if (!sesion) return;

  try {
    const res = await fetch('/api/registro/animales?page=1&limit=10', {
      headers: { Authorization: `Bearer ${sesion.token}` }
    });

    const data = await res.json();

    if (!res.ok) {
      cajaResultado.classList.add('hidden');
      mostrarAlerta(alerta, `Error ${res.status} (${data.error?.codigo}): ${data.error?.mensaje}`, true);
      return;
    }

    mostrarAlerta(alerta, `Listado obtenido: ${data.total} animal(es) registrados`, false);
    preJson.textContent = JSON.stringify(data, null, 2);
    cajaResultado.classList.remove('hidden');
  } catch (err) {
    mostrarAlerta(alerta, 'Error de red al listar animales', true);
  }
});