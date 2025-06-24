import {simularPaginacion} from "./paginacion.js";
import {simularSegmentacion} from "./segmentacion.js";

const btnLeerTabla = document.getElementById("btnLeerTabla");
const selAlgoritmo = document.getElementById("Algoritmo");
const tablaSimulacion = document.querySelector(".TablaSimulacion tbody");

document.addEventListener("click", (event) => {
	if (event.target.closest(".btnActivacionProcesos")) {
		setTimeout(render, 0);
	}
});

btnLeerTabla.addEventListener("click", () => {
	setTimeout(render, 0);
});

function render() {
	const datos = leerTablaProcesos();
	if (!datos.length) {
		alert("No hay procesos activos que simular.");
		return;
	}

	if (selAlgoritmo.value === "1") {
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

		const accesses = [];
		const MARCOS_DISPONIBLES = Math.floor((16 * 1024) / 4);

		const procesosPagLimitados = procesosPag.map((proc) => ({
			...proc,
			paginasActivas: Math.min(
				proc.numPages,
				Math.floor(MARCOS_DISPONIBLES / 8)
			),
		}));

		const maxPaginasActivas = Math.max(
			...procesosPagLimitados.map((p) => p.paginasActivas)
		);

		for (let page = 0; page < maxPaginasActivas; page++) {
			procesosPagLimitados.forEach((proc) => {
				if (page < proc.paginasActivas) {
					accesses.push({
						pid: proc.pid,
						addr: page * 4 * 1024,
					});
				}
			});
		}

		procesosPagLimitados.forEach((proc) => {
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

		console.time("simularPaginacion");
		const resultado = simularPaginacion({
			memoriaMiB: 16,
			pageKiB: 4,
			procesos: procesosPag,
			accesses: accesses,
		});

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
	const tabla = document.getElementById("TablaSimulacion");
	const thead = tabla.querySelector("thead");

	if (thead && thead.rows.length > 0) {
		const filaEncabezado = thead.rows[0];

		filaEncabezado.innerHTML = "";

		filaEncabezado.innerHTML = `
    <th>Segmento</th>
    <th>Direccion Base</th>
    <th>Dirrecion Fin</th>
    <th>Tamaño (KiB)</th>
  `;
	}

	tablaSimulacion.innerHTML = "";
	const fragment = document.createDocumentFragment();

	segmentos.forEach((s) => {
		const tr = document.createElement("tr");

		tr.innerHTML = `
			<td>${s.segmento}</td>
			<td>${s.base}</td>
			<td>${s.fin}</td>
			<td>${s.tam}</td>
		`;

		fragment.appendChild(tr);
	});

	const trResumen = document.createElement("tr");
	trResumen.innerHTML = `
		<td colspan="3">Memoria ocupada total (KiB)</td>
		<td>${memoriaOcupada}</td>
	`;

	fragment.appendChild(trResumen);
	tablaSimulacion.appendChild(fragment);
}

function renderTablaPaginacion({frames, PAGE_SIZE}) {
	tablaSimulacion.innerHTML = "";
	const fragment = document.createDocumentFragment();
	let memoriaOcupada = 0;
	const estadisticasProcesos = new Map();

	const tabla = document.getElementById("TablaSimulacion");
	const thead = tabla.querySelector("thead");

	if (thead && thead.rows.length > 0) {
		const filaEncabezado = thead.rows[0];

		filaEncabezado.innerHTML = "";

		filaEncabezado.innerHTML = `
    <th style="border-top-left-radius: 20px;">Marco</th>
    <th>Asignación</th>
    <th>Dirección base</th>
    <th>Dirección fin</th>
    <th style="border-top-right-radius: 20px;">Tamaño (KiB)</th>
  `;
	}

	frames.forEach(({frame, pid, page}) => {
		const tr = document.createElement("tr");
		const base = frame * PAGE_SIZE;
		const fin = (frame + 1) * PAGE_SIZE - 1;
		const tam = PAGE_SIZE / 1024;

		if (pid !== null) {
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

		fragment.appendChild(tr);
	});

	const trResumen = document.createElement("tr");
	trResumen.innerHTML = `
		<td colspan="4"><b>Memoria ocupada total (KiB)</b></td>
		<td><b>${memoriaOcupada}</b></td>
	`;
	fragment.appendChild(trResumen);
	tablaSimulacion.appendChild(fragment);
}
