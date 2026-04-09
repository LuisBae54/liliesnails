let listaMateriales = [];
let listaServicios = [];
let idMaterialEditando = null;
let idServicioEditando = null;

const inputNombre = document.getElementById("nombreMat");
const inputPrecio = document.getElementById("precioMat");
const inputRinde = document.getElementById("usoMat");
const botonAgregar = document.getElementById("btn-agregar");
const cuerpoTabla = document.getElementById("cuerpo-tabla");
const cuerpoServicios = document.getElementById("cuerpo-servicios");
const btnGuardar = document.getElementById("btn-guardar-servicio");
const contenedorChecks = document.getElementById("contenedor-checkboxes");
const btnExportar = document.getElementById("btn-exportar");

botonAgregar.addEventListener("click", AgregarMaterial);

btnGuardar.addEventListener("click", AgregarServicio);

btnExportar.addEventListener("click", descargarMenu);

document.querySelectorAll('input[type="number"]').forEach((input) => {
  input.addEventListener("keydown", function (e) {
    if (e.key === "-" || e.key === "e" || e.key === "+") {
      e.preventDefault();
    }
  });
});

//#region Funciones

//#region  Materiales
function AgregarMaterial() {
  const nombre = inputNombre.value;
  const precio = Math.abs(parseFloat(inputPrecio.value));
  const rinde = Math.abs(parseInt(inputRinde.value));
  const costoPorUso = precio / rinde;

  if (nombre === "" || isNaN(precio) || isNaN(rinde)) {
    alert("Por favor, llena todos los campos del material.");
    return;
  }

  if (idMaterialEditando !== null) {
    // MODO EDICIÓN
    const index = listaMateriales.findIndex((m) => m.id === idMaterialEditando);
    listaMateriales[index] = {
      id: idMaterialEditando,
      nombre: nombre,
      precio: precio,
      rinde: rinde,
      costoUso: costoPorUso,
    };
    idMaterialEditando = null; // Reset
  } else {
    // MODO CREACION
    const nuevoMaterial = {
      id: Date.now(),
      nombre: nombre,
      precio: precio,
      rinde: rinde,
      costoUso: costoPorUso,
    };

    listaMateriales.push(nuevoMaterial);
  }

  limpiarCamposMateriales();
  actualizarTablaInventario();
  actualizarTablaServicios();
  guardarEnMemoria();
}

function actualizarTablaInventario() {
  cuerpoTabla.innerHTML = "";
  contenedorChecks.innerHTML = "";

  if (listaMateriales.length === 0) {
    contenedorChecks.innerHTML = `
      <p style="color: #4a90e2; font-style: italic; font-size: 0.9rem; opacity: 0.8; padding: 0px;">
        ✨ Aún no has agregado materiales. Añade algunos en el inventario abajo para empezar.
      </p>
    `;
  } else {
    listaMateriales.forEach((material) => {
      const checkHTML = `
        <label class="tarjeta-material">
      <input type="checkbox" 
             class="check-material" 
             value="${material.id}" 
             data-costo="${material.costoUso}">
      <span>${material.nombre} (+$${material.costoUso.toFixed(2)})</span>
    </label>
      `;
      contenedorChecks.innerHTML += checkHTML;
    });
  }

  listaMateriales.forEach((material, index) => {
    const fila = `
      <tr>
        <td>${material.nombre}</td>
        <td>$${material.precio.toFixed(2)}</td>
        <td>${material.rinde}</td>
        <td>$${material.costoUso.toFixed(2)}</td>
        <td>
                <button class="btn-editar" onclick="editarMaterial(${material.id})">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn-borrar" onclick="eliminarMaterial(${material.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
      </tr>
    `;
    cuerpoTabla.innerHTML += fila;
  });
}

function eliminarMaterial(idRecibida) {
  if (confirm("¿Seguro que quieres eliminar este material?")) {
    listaMateriales = listaMateriales.filter((mat) => mat.id !== idRecibida);
    actualizarTablaInventario();
    actualizarTablaServicios();
    guardarEnMemoria();
  }
}

function ordenarMateriales(criterio) {
  if (criterio === "nombre") {
    listaMateriales.sort((a, b) => a.nombre.localeCompare(b.nombre));
  } else if (criterio === "precio") {
    listaMateriales.sort((a, b) => {
      return parseFloat(b.precio) - parseFloat(a.precio);
    });
  } else if (criterio === "fecha") {
    listaMateriales.sort((a, b) => b.id - a.id);
  }
  actualizarTablaInventario();
}

function editarMaterial(idRecibida) {
  const material = listaMateriales.find((mat) => mat.id === idRecibida);

  if (material) {
    inputNombre.value = material.nombre;
    inputPrecio.value = material.precio;
    inputRinde.value = material.rinde;

    idMaterialEditando = idRecibida;

    botonAgregar.innerText = "Actualizar Material";
  }
}

function limpiarCamposMateriales() {
  botonAgregar.innerText = "Agregar al inventario";
  inputNombre.value = "";
  inputPrecio.value = "";
  inputRinde.value = "";
}
//#endregion

//#region  Servicios
function AgregarServicio() {
  const nombreS = document.getElementById("nombreServicio").value;
  const gHora =
    Math.abs(parseFloat(document.getElementById("gananciaHora").value)) || 0;
  const tiempo =
    Math.abs(parseFloat(document.getElementById("tiempoTrabajo").value)) || 0;
  const margen =
    Math.abs(parseFloat(document.getElementById("margenDeseado").value)) || 0;

  if (nombreS === "") {
    alert("Ponle un nombre al servicio");
    return;
  }

  let costoMateriales = 0;
  let materialesSeleccionados = []; // <--- NUEVO: Para guardar los IDs

  const seleccionados = document.querySelectorAll(".check-material:checked");
  // Dentro de AgregarServicio, en el forEach de seleccionados:
  seleccionados.forEach((check) => {
    costoMateriales += parseFloat(check.dataset.costo);
    materialesSeleccionados.push(Number(check.value));
  });

  const costoBase = costoMateriales + (gHora / 60) * tiempo;
  const precioFinal = costoBase + costoBase * (margen / 100);

  const datosServicio = {
    id: idServicioEditando || Date.now(),
    nombre: nombreS,
    precio: precioFinal.toFixed(2),
    ganancia: margen,
    gHora: gHora,
    tiempo: tiempo,
    materialesIds: materialesSeleccionados, // <--- Se guarda en el objeto
  };

  if (idServicioEditando !== null) {
    const index = listaServicios.findIndex((s) => s.id === idServicioEditando);
    if (index !== -1) {
      listaServicios[index] = datosServicio;
    }
    idServicioEditando = null;
    btnGuardar.innerText = "Calcular y Guardar Servicio";
  } else {
    listaServicios.push(datosServicio);
  }
  limpiarCamposServicios();
  actualizarTablaServicios();
  guardarEnMemoria();
}

function actualizarTablaServicios() {
  let contenido = "";
  cuerpoServicios.innerHTML = "";

  listaServicios.forEach((serv) => {
    const precioActualizado = obtenerPrecioFinalDinamico(serv);

    contenido += `
            <tr>
                <td>${serv.nombre}</td>
                <td>${serv.ganancia}%</td>
                <td>$${precioActualizado}</td> <td>
                <button class="btn-editar" onclick="editarServicio(${serv.id})">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn-borrar" onclick="eliminarServicio(${serv.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
                </td>
            </tr>
        `;
  });
  cuerpoServicios.innerHTML = contenido;
}

function eliminarServicio(idRecibida) {
  if (confirm("¿Seguro que quieres eliminar este servicio del menú?")) {
    listaServicios = listaServicios.filter((serv) => serv.id !== idRecibida);
    actualizarTablaServicios();
    guardarEnMemoria();
  }
}

function ordenarServicios(criterio) {
  if (criterio === "nombre") {
    listaServicios.sort((a, b) => a.nombre.localeCompare(b.nombre));
  } else if (criterio === "precio") {
    listaServicios.sort((a, b) => {
      return (
        parseFloat(obtenerPrecioFinalDinamico(b)) -
        parseFloat(obtenerPrecioFinalDinamico(a))
      );
    });
  } else if (criterio === "fecha") {
    listaServicios.sort((a, b) => b.id - a.id);
  }

  actualizarTablaServicios();
}

function editarServicio(idRecibida) {
  const serv = listaServicios.find((s) => s.id === idRecibida);

  if (serv) {
    document.getElementById("nombreServicio").value = serv.nombre;
    document.getElementById("gananciaHora").value = serv.gHora;
    document.getElementById("tiempoTrabajo").value = serv.tiempo;
    document.getElementById("margenDeseado").value = serv.ganancia;

    const todosLosChecks = document.querySelectorAll(".check-material");
    todosLosChecks.forEach((check) => (check.checked = false));

    if (serv.materialesIds) {
      const IDsNumericos = serv.materialesIds.map(Number);
      todosLosChecks.forEach((check) => {
        const idCheck = Number(check.value);
        if (IDsNumericos.includes(idCheck)) {
          check.checked = true;
        }
      });
    }

    idServicioEditando = idRecibida;

    btnGuardar.innerText = "Actualizar Servicio";
  }
}

function limpiarCamposServicios() {
  document.getElementById("nombreServicio").value = "";

  document.getElementById("tiempoTrabajo").value = "";

  document.getElementById("margenDeseado").value = "";

  document.getElementById("gananciaHora").value = "";

  const todosLosChecks = document.querySelectorAll(".check-material");
  todosLosChecks.forEach((check) => {
    check.checked = false;
  });

  idServicioEditando = null;
  btnGuardar.innerText = "Calcular y Guardar Servicio";
}

function obtenerPrecioFinalDinamico(serv) {
  let costoMaterialesActual = 0;

  // Buscamos los materiales por ID para obtener su costo/uso actual
  if (serv.materialesIds && serv.materialesIds.length > 0) {
    serv.materialesIds.forEach((id) => {
      const materialEncontrado = listaMateriales.find((m) => m.id === id);
      if (materialEncontrado) {
        costoMaterialesActual += materialEncontrado.costoUso;
      }
    });
  }

  const costoBase = costoMaterialesActual + (serv.gHora / 60) * serv.tiempo;
  const precioFinal = costoBase + costoBase * (serv.ganancia / 100);

  return precioFinal.toFixed(2);
}
//#endregion

//#region  Exportar Menu (TEXTO)
function descargarMenu() {
  if (listaServicios.length === 0) {
    alert("No hay servicios guardados para exportar.");
    return;
  }

  let contenidoTexto = "--- MENÚ DE SERVICIOS DE MANICURA ---\n\n";

  listaServicios.forEach((servicio) => {
    const precioVenta = obtenerPrecioFinalDinamico(servicio);

    contenidoTexto += `Servicio: ${servicio.nombre}\n`;
    contenidoTexto += `Precio Sugerido: $${precioVenta}\n`;
    contenidoTexto += `--------------------------\n`;
  });

  contenidoTexto += `\nGenerado el: ${new Date().toLocaleDateString()}`;

  const blob = new Blob([contenidoTexto], { type: "text/plain" });
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.download = "Menu_Servicios.txt";
  enlace.click();
}
//#endregion

//#region  Guardado y cargado / Exportado e importado (JSON)
function guardarEnMemoria() {
  localStorage.setItem("misMateriales", JSON.stringify(listaMateriales));
  localStorage.setItem("misServicios", JSON.stringify(listaServicios));
}

function cargarMemoria() {
  const materialesGuardados = localStorage.getItem("misMateriales");
  const serviciosGuardados = localStorage.getItem("misServicios");

  if (materialesGuardados) {
    listaMateriales = JSON.parse(materialesGuardados);
    actualizarTablaInventario();
  }
  if (serviciosGuardados) {
    listaServicios = JSON.parse(serviciosGuardados);
    actualizarTablaServicios();
  }
}

function exportarDatos() {
  const datos = {
    materiales: listaMateriales,
    servicios: listaServicios,
  };
  const dataStr =
    "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(datos));
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "respaldo_nails.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

function importarDatos(event) {
  const archivo = event.target.files[0];
  if (!archivo) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const contenido = JSON.parse(e.target.result);
      if (contenido.materiales && contenido.servicios) {
        listaMateriales = contenido.materiales;
        listaServicios = contenido.servicios;

        actualizarTablaInventario();
        actualizarTablaServicios();
        guardarEnMemoria();
        alert("¡Datos restaurados con éxito!");
      }
    } catch (err) {
      alert("Error al leer el archivo de respaldo.");
    }
  };
  reader.readAsText(archivo);
}

cargarMemoria();
//#endregion

//#endregion
