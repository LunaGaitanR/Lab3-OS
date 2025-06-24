import {simularPaginacion} from "./paginacion.js";
import {simularSegmentacion} from "./segmentacion.js";

const btnLeerTabla = document.getElementById("btnLeerTabla");
const selAlgoritmo = document.getElementById("Algoritmo");
const tablaSimulacion = document.querySelector(".TablaSimulacion tbody");

document.addEventListener("click", (event) => {
	if (event.target.closest(".btnActivacionProcesos")) {
		const boton = event.target.closest(".btnActivacionProcesos");

		// Esperar 500 milisegundos antes de ejecutar render()
		render();
	}
});
btnLeerTabla.addEventListener("click", render);

function render() {
	const datos = leerTablaProcesos();
	if (!datos.length) {
		alert("No hay procesos activos que simular.");
		return;
	}

	if (selAlgoritmo.value === "1") {
		// Segmentación
		const procesosSeg = datos.map((p) => ({
			nombre: p.nombre,
			segmentos: [
				{tipo: "text", tam: parseInt(p.text, 10), permisos: "rx"},
				{tipo: "data", tam: parseInt(p.data, 10), permisos: "rw"},
				{tipo: "bss", tam: parseInt(p.bss, 10), permisos: "rw"},
				{tipo: "stack", tam: parseInt(p.stack, 10), permisos: "rw"},
				{tipo: "heap", tam: parseInt(p.heap, 10), permisos: "rw"},
			],
		}));

		const resultado = simularSegmentacion({
			ramMiB: 16,
			algoritmo: "primer",
			procesos: procesosSeg,
		});
		renderTablaSegmentacion(resultado);
	} else {
		// Paginación FIFO
		const procesosPag = datos.map((p) => ({
			pid: p.nombre,
			numPages: Math.ceil(
				(parseInt(p.text, 10) +
					parseInt(p.data, 10) +
					parseInt(p.bss, 10) +
					parseInt(p.stack, 10) +
					parseInt(p.heap, 10)) /
					(4 * 1024)
			),
		}));

		// Generar accesos intercalados limitados para evitar thrashing excesivo
		const accesses = [];
		const MARCOS_DISPONIBLES = Math.floor((16 * 1024) / 4); // 4096 marcos

		// Limitar páginas por proceso para simular working set
		const procesosPagLimitados = procesosPag.map((proc) => ({
			...proc,
			// Limitar a máximo 1/8 de la memoria disponible por proceso o sus páginas reales, lo que sea menor
			paginasActivas: Math.min(
				proc.numPages,
				Math.floor(MARCOS_DISPONIBLES / 8)
			),
		}));

		const maxPaginasActivas = Math.max(
			...procesosPagLimitados.map((p) => p.paginasActivas)
		);

		// Intercalar accesos a las páginas activas
		for (let page = 0; page < maxPaginasActivas; page++) {
			procesosPagLimitados.forEach((proc) => {
				if (page < proc.paginasActivas) {
					accesses.push({
						pid: proc.pid,
						addr: page * 4 * 1024, // dirección base de cada página
					});
				}
			});
		}

		// Agregar algunos accesos adicionales aleatorios para simular comportamiento real
		procesosPagLimitados.forEach((proc) => {
			// Acceder a algunas páginas adicionales de forma aleatoria
			const paginasAdicionales = Math.min(
				5,
				proc.numPages - proc.paginasActivas
			);
			for (let i = 0; i < paginasAdicionales; i++) {
				const paginaAleatoria =
					proc.paginasActivas +
					Math.floor(
						Math.random() * (proc.numPages - proc.paginasActivas)
					);
				accesses.push({
					pid: proc.pid,
					addr: paginaAleatoria * 4 * 1024,
				});
			}
		});

		const resultado = simularPaginacion({
			memoriaMiB: 16,
			pageKiB: 4,
			procesos: procesosPag,
			accesses: accesses,
		});

		// Debug: mostrar información de los procesos
		console.log("Procesos y sus páginas:");
		procesosPag.forEach((p) => {
			console.log(`${p.pid}: ${p.numPages} páginas`);
		});
		console.log("Total de accesos:", accesses.length);
		console.log("Marcos disponibles:", Math.floor((16 * 1024) / 4));

		renderTablaPaginacion(resultado);
	}
}

function leerTablaProcesos() {
	const tabla = document.querySelector(".TablaProcesosIterativos tbody");
	const datos = [];
	tabla.querySelectorAll("tr").forEach((fila) => {
		const celdas = fila.querySelectorAll("td");
		const btn = celdas[6]?.querySelector("button");
		if (btn && btn.classList.contains("desactivado")) return;
		if (celdas.length >= 6) {
			datos.push({
				nombre: celdas[0].textContent.trim(),
				text: celdas[1].textContent.trim() || "0",
				data: celdas[2].textContent.trim() || "0",
				bss: celdas[3].textContent.trim() || "0",
				stack: celdas[4].textContent.trim() || "0",
				heap: celdas[5].textContent.trim() || "0",
			});
		}
	});
	return datos;
}

function renderTablaSegmentacion({segmentos, memoriaOcupada}) {
	tablaSimulacion.innerHTML = "";
	//Celdad Normales
	segmentos.forEach((s) => {
		const tr = document.createElement("tr");

		const tdSegmento = document.createElement("td");
		const tdBase = document.createElement("td");
		const tdFin = document.createElement("td");
		const tdTam = document.createElement("td");

		tdSegmento.textContent = s.segmento;
		tdBase.textContent = s.base;
		tdFin.textContent = s.fin;
		tdTam.textContent = s.tam;

		tr.append(tdSegmento, tdBase, tdFin, tdTam);
		tablaSimulacion.appendChild(tr);
	});

	// Fila resumen con memoria ocupada
	const trResumen = document.createElement("tr");

	const tdResumenLabel = document.createElement("td");
	tdResumenLabel.colSpan = 3;
	tdResumenLabel.textContent = "Memoria ocupada total (KiB)";

	const tdResumenValor = document.createElement("td");
	tdResumenValor.textContent = memoriaOcupada;

	trResumen.append(tdResumenLabel, tdResumenValor);
	tablaSimulacion.appendChild(trResumen);
}

function renderTablaPaginacion({frames, PAGE_SIZE}) {
	tablaSimulacion.innerHTML = "";

	let memoriaOcupada = 0;
	const estadisticasProcesos = new Map();

	// Cabecera
	const trHead = document.createElement("tr");
	trHead.innerHTML = `
    <th>Frame</th>
    <th>Asignación</th>
    <th>Dirección base</th>
    <th>Dirección fin</th>
    <th>Tamaño (KiB)</th>
  `;
	tablaSimulacion.appendChild(trHead);

	frames.forEach(({frame, pid, page}) => {
		const tr = document.createElement("tr");
		const base = frame * PAGE_SIZE;
		const fin = (frame + 1) * PAGE_SIZE - 1;
		const tam = PAGE_SIZE / 1024;

		if (pid !== null) {
			// Contar marcos por proceso
			if (!estadisticasProcesos.has(pid)) {
				estadisticasProcesos.set(pid, 0);
			}
			estadisticasProcesos.set(pid, estadisticasProcesos.get(pid) + 1);

			tr.innerHTML = `
        <td>${frame}</td>
        <td>${pid}·pag${page}</td>
        <td>${base}</td>
        <td>${fin}</td>
        <td>${tam}</td>
      `;
			memoriaOcupada += tam;
		} else {
			tr.innerHTML = `
        <td>${frame}</td>
        <td>Libre</td>
        <td>${base}</td>
        <td>${fin}</td>
        <td>${tam}</td>
      `;
		}
		tablaSimulacion.appendChild(tr);
	});

	// Fila resumen con memoria ocupada
	const trResumen = document.createElement("tr");
	trResumen.innerHTML = `
    <td colspan="4"><b>Memoria ocupada total (KiB)</b></td>
    <td><b>${memoriaOcupada}</b></td>
  `;
	tablaSimulacion.appendChild(trResumen);

	// Mostrar estadísticas de procesos en consola
	console.log("Distribución de marcos por proceso:");
	estadisticasProcesos.forEach((marcos, pid) => {
		console.log(`${pid}: ${marcos} marcos (${marcos * 4} KiB)`);
	});
}

