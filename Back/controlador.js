import { simularSegmentacion } from './segmentacion.js';
import { simularPaginacion }   from './paginacion.js';

const btnLeerTabla    = document.getElementById("btnLeerTabla");
const selAlgoritmo    = document.getElementById("Algoritmo");
const tablaSimulacion = document.querySelector(".TablaSimulacion tbody");

document.addEventListener("click", (event) => {
  if (event.target.closest(".btnActivacionProcesos")) {
    const boton = event.target.closest(".btnActivacionProcesos");

    // Esperar 500 milisegundos antes de ejecutar render()
    setTimeout(() => { render();}, 1000);
  }
});


btnLeerTabla.addEventListener("click", render)


function render(){
  const datos = leerTablaProcesos();
  if (!datos.length) {
    alert("No hay procesos activos que simular.");
    return;
  }

  if (selAlgoritmo.value === "1") {
    // Segmentación
    const procesosSeg = datos.map(p => ({
      nombre: p.nombre,
      segmentos: [
        { tipo: "text",  tam: parseInt(p.text, 10),  permisos: "rx" },
        { tipo: "data",  tam: parseInt(p.data, 10),  permisos: "rw" },
        { tipo: "bss",   tam: parseInt(p.bss, 10),   permisos: "rw" },
        { tipo: "stack", tam: parseInt(p.stack, 10), permisos: "rw" },
        { tipo: "heap",  tam: parseInt(p.heap, 10),  permisos: "rw" },
      ]
    }));

    const resultado = simularSegmentacion({
      ramMiB: 16,
      algoritmo: 'primer',
      procesos: procesosSeg
    });
    console.log(resultado) // Eliminar esto despues de las pruebas
    renderTablaSegmentacion(resultado);

  } else {
    // Paginación FIFO
    const procesosPag = datos.map(p => ({
      pid:      p.nombre,
      numPages: Math.ceil(
                  (parseInt(p.text,10)
                   + parseInt(p.data,10)
                   + parseInt(p.bss,10)
                   + parseInt(p.stack,10)
                   + parseInt(p.heap,10))
                  / (4 * 1024)
                )
    }));

    const resultado = simularPaginacion({
      memoriaMiB: 16,
      pageKiB:    4,
      procesos:   procesosPag,
      accesses:   []
    });
    console.log(resultado) // Eliminar esto despues de las pruebas
    renderTablaPaginacion(resultado);
  }
};

function leerTablaProcesos() {
  const tabla = document.querySelector(".TablaProcesosIterativos tbody");
  const datos = [];
  tabla.querySelectorAll("tr").forEach(fila => {
    const celdas = fila.querySelectorAll("td");
    const btn    = celdas[6]?.querySelector("button");
    if (btn && btn.classList.contains("desactivado")) return;
    if (celdas.length >= 6) {
      datos.push({
        nombre: celdas[0].textContent.trim(),
        text:   celdas[1].textContent.trim(),
        data:   celdas[2].textContent.trim(),
        bss:    celdas[3].textContent.trim(),
        stack:  celdas[4].textContent.trim(),
        heap:   celdas[5].textContent.trim(),
      });
    }
  });
  return datos;
}

function renderTablaSegmentacion({ segmentos, memoriaOcupada }) {
  tablaSimulacion.innerHTML = "";
//Celdad Normales
  segmentos.forEach(s => {
    const tr = document.createElement("tr");

    const tdSegmento = document.createElement("td");
    const tdBase     = document.createElement("td");
    const tdFin      = document.createElement("td");
    const tdTam      = document.createElement("td");

    tdSegmento.textContent = s.segmento;
    tdBase.textContent     = s.base;
    tdFin.textContent      = s.fin;
    tdTam.textContent      = s.tam;

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


function renderTablaPaginacion({ freeFrames, fifoQueue, tables }) {
  tablaSimulacion.innerHTML = "";

  // Marcos libres
  freeFrames.forEach(frame => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${frame}</td><td>Libre</td>`;
    tablaSimulacion.appendChild(tr);
  });

  // Cola FIFO
  fifoQueue.forEach(([pid, page]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>Frame</td><td>${pid}·pag${page}</td>`;
    tablaSimulacion.appendChild(tr);
  });

  // Entradas presentes
  tables.forEach((tabla, pid) => {
    tabla.forEach((entry, page) => {
      if (entry.present) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${entry.frame}</td><td>${pid}·pag${page}</td>`;
        tablaSimulacion.appendChild(tr);
      }
    });
  });
}
