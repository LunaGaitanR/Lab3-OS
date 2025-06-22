export function simularSegmentacion({
  ramMiB = 16,
  algoritmo = 'primer', 
  procesos = []         
} = {}) {
  const RAM_SIZE = ramMiB * 1024 * 1024;
  const memoria  = Array(RAM_SIZE).fill(null);

  function buscarHueco(tam) {
    const huecos = [];
    let inicio = -1, len = 0;
    for (let i = 0; i < RAM_SIZE; i++) {
      if (memoria[i] == null) {
        if (inicio < 0) inicio = i;
        len++;
      } else if (len > 0) {
        huecos.push({ inicio, len });
        inicio = -1;
        len = 0;
      }
    }
    if (len > 0) huecos.push({ inicio, len });

    const cand = huecos.filter(h => h.len >= tam);
    if (!cand.length) return null;
    if (algoritmo === 'mejor') return cand.sort((a, b) => a.len - b.len)[0];
    if (algoritmo === 'peor')  return cand.sort((a, b) => b.len - a.len)[0];
    return cand[0]; 
  }

  function asignarSegmento(nombre, tipo, tam) {
    const hueco = buscarHueco(tam);
    if (!hueco) return null;
    for (let i = hueco.inicio; i < hueco.inicio + tam; i++) {
      memoria[i] = `${nombre}-${tipo}`;
    }
    return { tipo, tam, base: hueco.inicio };
  }

  const resultados = procesos.map(({ nombre, segmentos }) => {
    const segs = [];
    segmentos.forEach(s => {
      const res = asignarSegmento(nombre, s.tipo, s.tam);
      if (res) segs.push(res);
    });
    return { nombre, segmentos: segs };
  });

  const estadoFormateado = [];
  resultados.forEach(proc => {
    proc.segmentos.forEach(s => {
      estadoFormateado.push({
        segmento: `${proc.nombre} (${s.tipo})`,
        base: s.base,
        fin: s.base + s.tam - 1,
        tam: s.tam
      });
    });
  });

  const memoriaOcupada = Math.ceil(memoria.filter(cell => cell !== null).length / 1024);

  return {
    segmentos: estadoFormateado,
    memoriaOcupada 
  };
}
