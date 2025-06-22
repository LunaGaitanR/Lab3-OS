export function simularPaginacion({
  memoriaMiB = 16,
  pageKiB    = 4,
  procesos   = [],   // [{ pid, numPages }]
  accesses   = []    // [{ pid, addr }]
} = {}) {
  const PAGE_SIZE  = pageKiB * 1024;
  const NUM_FRAMES = (memoriaMiB * 1024 * 1024) / PAGE_SIZE;
  const freeFrames = Array.from({ length: NUM_FRAMES }, (_, i) => i);
  const fifo       = [];
  const tables     = new Map();

  // Inicializa tablas de páginas
  procesos.forEach(({ pid, numPages }) => {
    tables.set(pid, Array.from({ length: numPages }, () => ({ present: false, frame: null })));
  });

  // Fallo de página con FIFO
  function pageFault(pid, page) {
    const table = tables.get(pid);
    const frame = freeFrames.length
      ? freeFrames.shift()
      : (() => {
          const [vPid,vPage] = fifo.shift();
          const vict = tables.get(vPid);
          const f = vict[vPage].frame;
          vict[vPage] = { present: false, frame: null };
          return f;
        })();
    table[page] = { present: true, frame };
    fifo.push([pid, page]);
  }

  // Traduce virtual a física
  function access(pid, addr) {
    const table = tables.get(pid);
    if (!table) return null;
    const page   = Math.floor(addr / PAGE_SIZE);
    const offset = addr % PAGE_SIZE;
    if (!table[page].present) pageFault(pid, page);
    return table[page].frame * PAGE_SIZE + offset;
  }

  // Ejecuta accesos
  accesses.forEach(({ pid, addr }) => access(pid, addr));

  // Estado final
  return {
    freeFrames,
    fifoQueue: fifo,
    tables
  };
}