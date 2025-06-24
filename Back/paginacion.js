export function simularPaginacion({
  memoriaMiB = 16,
  pageKiB    = 4,
  procesos   = [],   // [{ pid, numPages }]
  accesses   = []    // [{ pid, addr }]
} = {}) {
  const PAGE_SIZE  = pageKiB * 1024;
  const NUM_FRAMES = Math.floor((memoriaMiB * 1024 * 1024) / PAGE_SIZE);
  const freeFrames = Array.from({ length: NUM_FRAMES }, (_, i) => i);
  const fifo       = [];
  const tables     = new Map();

  // Inicializa tablas de páginas
  procesos.forEach(({ pid, numPages }) => {
    tables.set(pid, Array.from({ length: numPages }, () => ({ present: false, frame: null })));
  });

  // Manejo de fallo de página con política FIFO
  function pageFault(pid, page) {
    const table = tables.get(pid);
    let frame;
    if (freeFrames.length > 0) {
      frame = freeFrames.shift();
    } else {
      const [vPid, vPage] = fifo.shift();
      const vict = tables.get(vPid);
      frame = vict[vPage].frame;
      vict[vPage] = { present: false, frame: null };
    }
    // Asigna nueva página
    table[page] = { present: true, frame };
    fifo.push([pid, page]);
  }

  // Traducción de dirección virtual a física
  function access(pid, addr) {
    const table = tables.get(pid);
    if (!table) return null;
    const page   = Math.floor(addr / PAGE_SIZE);
    const offset = addr % PAGE_SIZE;
    if (page < 0 || page >= table.length) return null;
    if (!table[page].present) pageFault(pid, page);
    return table[page].frame * PAGE_SIZE + offset;
  }

  // Ejecuta la secuencia de accesos
  accesses.forEach(({ pid, addr }) => access(pid, addr));

  // Construye estado final de marcos (frame, pid, page)
  const frames = Array.from({ length: NUM_FRAMES }, (_, f) => {
    for (const [pid, table] of tables.entries()) {
      for (let p = 0; p < table.length; p++) {
        if (table[p].present && table[p].frame === f) {
          return { frame: f, pid, page: p };
        }
      }
    }
    return { frame: f, pid: null, page: null };
  });

  return {
    PAGE_SIZE,
    frames,       // [{ frame, pid, page }]
    freeFrames,   // índices libres
    fifoQueue: fifo,
    tables
  };
}