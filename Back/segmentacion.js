export function simularSegmentacion({
  ramMiB = 16,
  algoritmo = 'primer', // 'primer'|'mejor'|'peor'
  procesos = []        // [{ nombre, segmentos: [{ tipo, tam, permisos }] }]
} = {}) {
  const RAM_SIZE = ramMiB * 1024 * 1024;
  const memoria  = Array(RAM_SIZE).fill(null);

  // Busca hueco según el algoritmo
  function buscarHueco(tam) {
    const huecos = [];
    let inicio = -1, len = 0;
    for (let i = 0; i < RAM_SIZE; i++) {
      if (memoria[i] == null) { inicio = inicio < 0 ? i : inicio; len++; }
      else if (len > 0) { huecos.push({ inicio, len }); inicio = -1; len = 0; }
    }
    if (len > 0) huecos.push({ inicio, len });
    const cand = huecos.filter(h => h.len >= tam);
    if (!cand.length) return null;
    if (algoritmo === 'mejor') return cand.sort((a,b)=>a.len-b.len)[0];
    if (algoritmo === 'peor') return cand.sort((a,b)=>b.len-a.len)[0];
    return cand[0]; // primer
  }

  // Asigna un segmento en memoria y retorna su descriptor
  function asignarSegmento(nombre, tipo, tam) {
    const hueco = buscarHueco(tam);
    if (!hueco) return null;
    for (let i = hueco.inicio; i < hueco.inicio + tam; i++) memoria[i] = `${nombre}-${tipo}`;
    return { tipo, tam, base: hueco.inicio };
  }

  // Carga todos los procesos y sus segmentos
  const resultados = procesos.map(({ nombre, segmentos }) => {
    const segs = [];
    segmentos.forEach(s => {
      const res = asignarSegmento(nombre, s.tipo, s.tam, s.permisos);
      if (res) segs.push(res);
    });
    return { nombre, segmentos: segs };
  }); 
  // Genera estado final listo para renderizar
  const estado = [];
  resultados.forEach(proc => {
    proc.segmentos.forEach(s => {
      estado.push({
        proceso: proc.nombre,
        tipo: s.tipo,
        base: s.base,
        fin: s.base + s.tam,
        tam: s.tam
      });
    });
  });
  return estado;
}
