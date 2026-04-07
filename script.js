let listaMateriales = [];
let listaServicios = [];

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

//#region Funciones

//#region  Materiales
function AgregarMaterial() {
  const nombre = inputNombre.value;
  const precio = parseFloat(inputPrecio.value);
  const rinde = parseInt(inputRinde.value);

  if (nombre === "" || isNaN(precio) || isNaN(rinde)) {
    alert("Por favor, llena todos los campos del material.");
    return;
  }

  const costoPorUso = precio / rinde;

  const nuevoMaterial = {
    nombre: nombre,
    precio: precio,
    rinde: rinde,
    costoUso: costoPorUso,
  };

  listaMateriales.push(nuevoMaterial);

  inputNombre.value = "";
  inputPrecio.value = "";
  inputRinde.value = "";

  actualizarTabla();
  guardarEnMemoria();
}

function actualizarTabla() {
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
          <input type="checkbox" class="check-material" data-costo="${material.costoUso}">
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
        <td><button class="btn-borrar" onclick="eliminarMaterial(${index})">Borrar</button></td>
      </tr>
    `;
    cuerpoTabla.innerHTML += fila;
  });
}

function eliminarMaterial(posicion) {
  listaMateriales.splice(posicion, 1); // Borra el elemento
  actualizarTabla(); // Vuelve poner la vaina
  guardarEnMemoria();
}
//#endregion

//#region  Servicios
function AgregarServicio() {
  const nombreS = document.getElementById("nombreServicio").value;
  const gHora = parseFloat(document.getElementById("gananciaHora").value) || 0;
  const tiempo =
    parseFloat(document.getElementById("tiempoTrabajo").value) || 0;
  const margen =
    parseFloat(document.getElementById("margenDeseado").value) || 0;

  if (nombreS === "") {
    alert("Ponle un nombre al servicio");
    return;
  }

  let costoMateriales = 0;
  const seleccionados = document.querySelectorAll(".check-material:checked");
  seleccionados.forEach((check) => {
    costoMateriales += parseFloat(check.dataset.costo);
  });
  const costoBase = costoMateriales + gHora * tiempo;
  const precioFinal = costoBase + costoBase * (margen / 100);

  const nuevoServicio = {
    nombre: nombreS,
    precio: precioFinal.toFixed(2),
  };
  listaServicios.push(nuevoServicio);

  actualizarTablaServicios();
  document.getElementById("nombreServicio").value = "";
  document.getElementById("tiempoTrabajo").value = "";
  document.getElementById("margenDeseado").value = "";
  document.getElementById("gananciaHora").value = "";
  guardarEnMemoria();
}

function actualizarTablaServicios() {
  cuerpoServicios.innerHTML = "";
  listaServicios.forEach((serv, index) => {
    cuerpoServicios.innerHTML += `
            <tr>
                <td>${serv.nombre}</td>
                <td>$${serv.precio}</td>
                <td><button onclick="eliminarServicio(${index})">Eliminar</button></td>
            </tr>
        `;
  });
}

function eliminarServicio(index) {
  listaServicios.splice(index, 1);
  actualizarTablaServicios();
  guardarEnMemoria();
}
//#endregion

//#region  Exportar
function descargarMenu() {
  if (listaServicios.length === 0) {
    alert("No hay servicios guardados para exportar.");
    return;
  }

  let contenidoTexto = "--- MENÚ DE SERVICIOS DE MANICURA ---\n\n";

  listaServicios.forEach((servicio) => {
    contenidoTexto += `Servicio: ${servicio.nombre}\n`;
    contenidoTexto += `Precio Sugerido: $${servicio.precio}\n`;
    contenidoTexto += `--------------------------\n`;
  });

  contenidoTexto += `\nGenerado el: ${new Date().toLocaleDateString()}`;

  const blob = new Blob([contenidoTexto], { type: "text/plain" });
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.download = "Menu_Servicios.txt";
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}
//#endregion

//#region  Guardado y cargado
function guardarEnMemoria() {
  localStorage.setItem("misMateriales", JSON.stringify(listaMateriales));
  localStorage.setItem("misServicios", JSON.stringify(listaServicios));
}

function cargarMemoria() {
  const materialesGuardados = localStorage.getItem("misMateriales");
  const serviciosGuardados = localStorage.getItem("misServicios");

  if (materialesGuardados) {
    listaMateriales = JSON.parse(materialesGuardados);
    actualizarTabla(); // Dibuja la tabla de materiales
  }
  if (serviciosGuardados) {
    listaServicios = JSON.parse(serviciosGuardados);
    actualizarTablaServicios(); // Dibuja la tabla de servicios
  }
}

cargarMemoria();
//#endregion

//#endregion
