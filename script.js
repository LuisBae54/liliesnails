let listaMateriales = [];
let listaServicios = [];
let idMaterialEditando = null;
let idServicioEditando = null;
let limiteMateriales = 5;
let limiteServicios = 5;

const inputNombre = document.getElementById("nombreMat");
const inputPrecio = document.getElementById("precioMat");
const inputRinde = document.getElementById("usoMat");
const botonAgregar = document.getElementById("btn-agregar");
const cuerpoTabla = document.getElementById("cuerpo-tabla");
const cuerpoServicios = document.getElementById("cuerpo-servicios");
const btnGuardar = document.getElementById("btn-guardar-servicio");
const contenedorChecks = document.getElementById("contenedor-checkboxes");
const btnExportar = document.getElementById("btn-exportar");
const inputBusqueda = document.getElementById("buscarMaterial");
const inputBusquedaServicio = document.getElementById("buscarServicio");

inputBusquedaServicio.addEventListener("input", function() {
    const texto = inputBusquedaServicio.value.toLowerCase();
    actualizarTablaServicios(texto);
});

inputBusqueda.addEventListener("input", function() {
    const texto = inputBusqueda.value.toLowerCase();
    actualizarTablaInventario(texto);
});

document.querySelectorAll('input[type="number"]').forEach((input) => {
  input.addEventListener("keydown", function (e) {
    if (e.key === "-" || e.key === "e" || e.key === "+") {
      e.preventDefault();
    }
  });
});

botonAgregar.addEventListener("click", AgregarMaterial);

btnGuardar.addEventListener("click", AgregarServicio);

btnExportar.addEventListener("click", descargarMenu);

//#region Funciones

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

function actualizarTablaServicios(filtro = "") {
  let contenido = "";
  cuerpoServicios.innerHTML = "";

  // 1. Filtrar primero según la búsqueda
  const serviciosFiltrados = listaServicios.filter(serv => 
    serv.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  // 2. Tomar solo la cantidad permitida por el límite actual
  const serviciosVisibles = serviciosFiltrados.slice(0, limiteServicios);

  // 3. Renderizar solo los visibles
  serviciosVisibles.forEach((serv) => {
    const precioActualizado = obtenerPrecioFinalDinamico(serv);

    contenido += `
      <tr>
        <td>${serv.nombre}</td>
        <td>${serv.ganancia}%</td>
        <td>$${precioActualizado}</td> 
        <td>
          <button class="btn-clonar" onclick="clonarServicio(${serv.id})" title="Crear nuevo a partir de este">
            <i class="fa-solid fa-copy"></i>
          </button>
          <button class="btn-editar" onclick="editarServicio(${serv.id})">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-borrar" onclick="eliminarServicio(${serv.id})">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>`;
  });
  cuerpoServicios.innerHTML = contenido;

  // 4. Si hay más elementos en el filtro que el límite, agregamos la fila de "Cargar más"
  gestionarBotonVerMas("servicios", serviciosFiltrados.length, limiteServicios);
}

function clonarServicio(idRecibida) {
  const serv = listaServicios.find((s) => s.id === idRecibida);

  if (serv) {
    document.getElementById("nombreServicio").value = serv.nombre + " (Copia)";
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

    idServicioEditando = null; 
    btnGuardar.innerText = "Guardar como Nuevo Servicio";
    document.getElementById("nombreServicio").focus();
  }

  const contenedor = document.getElementById("contenedor-checkboxes");
  const flecha = document.getElementById("icono-flecha");
  if (contenedor.classList.contains("oculto")) {
    contenedor.classList.remove("oculto");
    flecha.classList.add("rotar-flecha");
  }
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

  const contenedor = document.getElementById("contenedor-checkboxes");
  const flecha = document.getElementById("icono-flecha");
  if (contenedor.classList.contains("oculto")) {
    contenedor.classList.remove("oculto");
    flecha.classList.add("rotar-flecha");
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
  // Añadimos esto para restablecer el texto del botón cuando se limpie el flujo
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

function toggleMateriales() {
  const contenedor = document.getElementById("contenedor-checkboxes");
  const flecha = document.getElementById("icono-flecha");
  
  contenedor.classList.toggle("oculto");
  flecha.classList.toggle("rotar-flecha");
}

function mostrarMateriales(filtro = "") {
  contenedorChecks.innerHTML = "";

  // Leemos directamente del array global en memoria, no de la tabla visual
  listaMateriales.forEach((mat) => {
    const div = document.createElement("div");
    
    // Si hay un filtro de búsqueda activo y el material no coincide, lo ocultamos
    if (filtro && !mat.nombre.toLowerCase().includes(filtro.toLowerCase())) {
      div.className = "tarjeta-material oculto";
    } else {
      div.className = "tarjeta-material";
    }

    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = mat.id;
    checkbox.className = "check-material";

    // Mantener activos los checks si se está editando un servicio
    if (idServicioEditando !== null) {
      const serv = listaServicios.find((s) => s.id === idServicioEditando);
      if (serv && serv.materialesIds) {
        const IDsNumericos = serv.materialesIds.map(Number);
        if (IDsNumericos.includes(Number(mat.id))) {
          checkbox.checked = true;
        }
      }
    }

    const rinde = Number(mat.rinde) || 1;
    const precio = Number(mat.precio) || 0;
    const costoUso = (precio / rinde).toFixed(2);

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(` ${mat.nombre} (+$${costoUso})`));
    div.appendChild(label);
    contenedorChecks.appendChild(div);
  });
}
//#endregion

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

function actualizarTablaInventario(filtro = "") {
  let contenido = "";
  cuerpoTabla.innerHTML = "";
  
  contenedorChecks.innerHTML = "";

  const materialesFiltrados = listaMateriales.filter(mat => 
    mat.nombre.toLowerCase().includes(filtro.toLowerCase())
  );
  materialesFiltrados.forEach((mat) => {
    const div = document.createElement("div");
    div.className = "tarjeta-material";

    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = mat.id;
    checkbox.className = "check-material";

    if (idServicioEditando !== null) {
      const serv = listaServicios.find((s) => s.id === idServicioEditando);
      if (serv && serv.materialesIds) {
        const IDsNumericos = serv.materialesIds.map(Number);
        if (IDsNumericos.includes(Number(mat.id))) {
          checkbox.checked = true;
        }
      }
    }

    const rinde = Number(mat.rinde) || 1;
    const precio = Number(mat.precio) || 0;
    const costoUso = (precio / rinde).toFixed(2);

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(` ${mat.nombre} (+$${costoUso})`));
    div.appendChild(label);
    contenedorChecks.appendChild(div);
  });

  const materialesVisibles = materialesFiltrados.slice(0, limiteMateriales);

  materialesVisibles.forEach((mat) => {
    const rinde = Number(mat.rinde) || 1;
    const precio = Number(mat.precio) || 0;
    const costoUso = (precio / rinde).toFixed(2);

    contenido += `
      <tr>
        <td>${mat.nombre}</td>
        <td>$${precio}</td>
        <td>${rinde}</td>
        <td>$${costoUso}</td>
        <td>
          <button class="btn-editar" onclick="editarMaterial(${mat.id})"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-borrar" onclick="eliminarMaterial(${mat.id})"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`;
  });
  cuerpoTabla.innerHTML = contenido;

  gestionarBotonVerMas("materiales", materialesFiltrados.length, limiteMateriales);
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

//#region Miscelanea
function gestionarBotonVerMas(tipo, totalFiltrados, limiteActual) {
  let idBtn = `btn-ver-mas-${tipo}`;
  let botonExistente = document.getElementById(idBtn);
  if (botonExistente) botonExistente.remove();

  if (totalFiltrados > limiteActual) {
    const selectorContenedor = tipo === "servicios" ? "#seccion-servicios .contenedor-tabla" : "#seccion-inventario .contenedor-tabla";
    const contenedor = document.querySelector(selectorContenedor);
    
    const boton = document.createElement("button");
    boton.id = idBtn;
    boton.className = "btn-cargar-mas";
    boton.innerHTML = `Ver más ${tipo} <i class="fa-solid fa-angles-down"></i>`;
    boton.onclick = () => cargarMasElementos(tipo);
    
    contenedor.after(boton);
  }
}

function cargarMasElementos(tipo) {
  if (tipo === "servicios") {
    limiteServicios += 5;
    // Pasamos el texto actual del input de búsqueda para no romper el filtro activo
    actualizarTablaServicios(document.getElementById("buscarService")?.value || "");
  } else {
    limiteMateriales += 5;
    actualizarTablaInventario(document.getElementById("buscarMaterial")?.value || "");
  }
}

//#endregion
//#endregion