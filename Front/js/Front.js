import {simularPaginacion} from "../../Back/paginacion.js";

const btnAbrirPopUp = document.querySelector("#btnEditarProcesos");
const btnCerrarPopUp = document.querySelector("#btnVolver");
const TablaProcesos = document.querySelector("#TablaProcesos");
const btnAgregarProcesos = document.getElementById("btnAgregarProcesos");
const tablaDialog = TablaProcesos.querySelector("table tbody");
const tablaPrincipal = document.querySelector(
	"main .TablaProcesosIterativos tbody"
);

// Abrir el popup
btnAbrirPopUp.addEventListener("click", () => {
	TablaProcesos.showModal();
});

// Cerrar el popup y actualizar la tabla principal
btnCerrarPopUp.addEventListener("click", () => {
	actualizarTablaPrincipalDesdeDialog();
	TablaProcesos.close();
});

// Activar o desactivar un botón de proceso
document.querySelectorAll(".btnActivacionProcesos").forEach((boton) => {
	boton.addEventListener("click", function () {
		boton.classList.toggle("desactivado");
	});
});

// Función para asignar evento de eliminación a un botón
function asignarEventoEliminar(btnEliminar) {
	btnEliminar.addEventListener("click", (e) => {
		const fila = e.target.closest("tr");
		if (fila) fila.remove();
	});
}

// Asignar eventos de eliminar a los botones existentes
document.querySelectorAll("#btnEliminarProceso").forEach(asignarEventoEliminar);

// Agregar una fila nueva en el dialog
btnAgregarProcesos.addEventListener("click", () => {
	const fila = document.createElement("tr");

	for (let i = 0; i < 6; i++) {
		const celda = document.createElement("td");
		celda.contentEditable = "true";
		fila.appendChild(celda);
	}

	const celdaBoton = document.createElement("td");
	celdaBoton.classList.add("sinBorde");

	const btnEliminar = document.createElement("button");
	btnEliminar.classList.add("btn");
	btnEliminar.id = "btnEliminarProceso";
	btnEliminar.innerHTML = `<img src="../Statics/Imagenes/icons8-close-20.png" alt="Eliminar proceso">`;

	asignarEventoEliminar(btnEliminar);

	celdaBoton.appendChild(btnEliminar);
	fila.appendChild(celdaBoton);
	tablaDialog.appendChild(fila);
});

// Función para copiar datos del dialog a la tabla principal
function actualizarTablaPrincipalDesdeDialog() {
	tablaPrincipal.innerHTML = "";

	const filas = tablaDialog.querySelectorAll("tr");

	filas.forEach((filaDialog) => {
		const filaNueva = document.createElement("tr");
		const celdas = filaDialog.querySelectorAll("td");

		celdas.forEach((celda, index) => {
			const nuevaCelda = document.createElement("td");

			if (index < 6) {
				nuevaCelda.textContent = celda.textContent;
			} else {
				nuevaCelda.classList.add("sinBorde");

				const btnActivar = document.createElement("button");
				btnActivar.classList.add("btn", "btnActivacionProcesos");
				btnActivar.innerHTML = `<img src="../Statics/Imagenes/icons8-done-20.png" alt="Boton de activacion del proceso">`;

				btnActivar.addEventListener("click", function () {
					btnActivar.classList.toggle("desactivado");
				});

				nuevaCelda.appendChild(btnActivar);
			}

			filaNueva.appendChild(nuevaCelda);
		});

		tablaPrincipal.appendChild(filaNueva);
	});
}

// Esperar a que el DOM esté listo
window.addEventListener("DOMContentLoaded", () => {
	// Selecciona la tabla de gestión de memoria (ajusta el ID según tu HTML)
	const tablaMemoria =
		document.querySelector("#TablaGestionMemoria tbody") ||
		document.querySelector("#tablaMemoria tbody");

	function mostrarTablaMemoria(pagingResult) {
		tablaMemoria.innerHTML = "";
		const {frames, PAGE_SIZE} = pagingResult;
		const PAGE_KIB = PAGE_SIZE / 1024;

		frames.forEach(({frame, pid, page}) => {
			const baseAddr = frame * PAGE_SIZE;
			const endAddr = baseAddr + PAGE_SIZE;
			const row = document.createElement("tr");

			// Segmento
			const cellSeg = document.createElement("td");
			cellSeg.textContent =
				pid !== null ? `P${pid} (page ${page})` : "Libre";
			row.appendChild(cellSeg);

			// Dirección Base
			const cellBase = document.createElement("td");
			cellBase.textContent = baseAddr
				.toString(16)
				.padStart(8, "0")
				.toUpperCase();
			row.appendChild(cellBase);

			// Dirección Fin
			const cellEnd = document.createElement("td");
			cellEnd.textContent = endAddr
				.toString(16)
				.padStart(8, "0")
				.toUpperCase();
			row.appendChild(cellEnd);

			// Tamaño
			const cellSize = document.createElement("td");
			cellSize.textContent = `${PAGE_KIB.toFixed(0)} KiB`;
			row.appendChild(cellSize);

			tablaMemoria.appendChild(row);
		});
	}
});

