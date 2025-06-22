import { simularSegmentacion } from './segmentacion.js';
import { simularPaginacion }   from './paginacion.js';

const btnLeerTabla    = document.getElementById("btnLeerTabla");
const selAlgoritmo    = document.getElementById("Algoritmo");
const tablaSimulacion = document.querySelector(".TablaSimulacion tbody");

btnLeerTabla.addEventListener("click", () => {
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

    renderTablaPaginacion(resultado);
  }
});

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

function renderTablaSegmentacion(segmentos) {
  tablaSimulacion.innerHTML = "";
  segmentos.forEach(s => {
    const tr = document.createElement("tr");
    const td1 = document.createElement("td");
    const td2 = document.createElement("td");
    td1.textContent = `${s.base}–${s.fin}`;
    td2.textContent = `${s.proceso} (${s.tipo})`;
    tr.append(td1, td2);
    tablaSimulacion.appendChild(tr);
  });
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
