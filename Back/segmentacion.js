class SimuladorSegmentacion {
  constructor(ramSize = 2 ** 24) {
    this.RAM_SIZE = ramSize;
    this.memoria = new Array(this.RAM_SIZE).fill(null);
    this.procesos = [];
  }

  bytesHumanos(bytes) {
    return (bytes / 1024).toFixed(2) + ' KiB';
  }

  buscarEspacio(tamaño, algoritmo) {
    let huecos = [], inicio = -1, longitud = 0;

    for (let i = 0; i < this.memoria.length; i++) {
      if (this.memoria[i] === null) {
        if (inicio === -1) inicio = i;
        longitud++;
      } else if (longitud > 0) {
        huecos.push({ inicio, tamaño: longitud });
        inicio = -1;
        longitud = 0;
      }
    }
    if (longitud > 0) huecos.push({ inicio, tamaño: longitud });

    if (algoritmo === 'primer') return huecos.find(h => h.tamaño >= tamaño) || null;
    if (algoritmo === 'mejor') return huecos.filter(h => h.tamaño >= tamaño).sort((a, b) => a.tamaño - b.tamaño)[0] || null;
    if (algoritmo === 'peor') return huecos.filter(h => h.tamaño >= tamaño).sort((a, b) => b.tamaño - a.tamaño)[0] || null;

    return null;
  }

  asignarSegmento(nombre, tipo, tamaño, permisos, algoritmo) {
    const hueco = this.buscarEspacio(tamaño, algoritmo);
    if (!hueco) return -1;

    for (let i = hueco.inicio; i < hueco.inicio + tamaño; i++) {
      this.memoria[i] = `${nombre}-${tipo}`;
    }
    return hueco.inicio;
  }

  cargarProceso(nombre, segmentosInfo, algoritmo = 'primer') {
    const segmentos = [];
    for (let { tipo, tamaño, permisos } of segmentosInfo) {
      const base = this.asignarSegmento(nombre, tipo, tamaño, permisos, algoritmo);
      if (base !== -1) {
        segmentos.push({ tipo, tamaño, permisos, base });
      } else {
        console.warn(`❌ No se pudo asignar memoria a ${nombre}-${tipo}`);
      }
    }
    this.procesos.push({ nombre, segmentos });
  }

  mostrarProcesos() {
    this.procesos.forEach(p => {
      console.log(`\n📄 Proceso: ${p.nombre}`);
      p.segmentos.forEach(s => {
        console.log(`  - ${s.tipo}: base ${s.base}, tamaño ${this.bytesHumanos(s.tamaño)}, permisos ${s.permisos}`);
      });
    });
  }

  resumenMemoria() {
    const usada = this.memoria.filter(x => x !== null).length;
    console.log(`\n📊 Memoria ocupada: ${this.bytesHumanos(usada)} / ${this.bytesHumanos(this.RAM_SIZE)}`);
  }

  cargarEjemplos() {
    const programas = [
      { nombre: "Notepad", segmentos: [
        { tipo: "text", tamaño: 18000, permisos: 'rx' },
        { tipo: "data", tamaño: 9000, permisos: 'rw' },
        { tipo: "stack", tamaño: 2048, permisos: 'rw' }
      ]},
      { nombre: "Paint", segmentos: [
        { tipo: "text", tamaño: 24000, permisos: 'rx' },
        { tipo: "data", tamaño: 14000, permisos: 'rw' },
        { tipo: "stack", tamaño: 2048, permisos: 'rw' }
      ]},
      { nombre: "Chrome", segmentos: [
        { tipo: "text", tamaño: 100000, permisos: 'rx' },
        { tipo: "data", tamaño: 40000, permisos: 'rw' },
        { tipo: "stack", tamaño: 8192, permisos: 'rw' }
      ]},
      { nombre: "Excel", segmentos: [
        { tipo: "text", tamaño: 60000, permisos: 'rx' },
        { tipo: "data", tamaño: 25000, permisos: 'rw' },
        { tipo: "stack", tamaño: 4096, permisos: 'rw' }
      ]},
      { nombre: "Word", segmentos: [
        { tipo: "text", tamaño: 77000, permisos: 'rx' },
        { tipo: "data", tamaño: 30000, permisos: 'rw' },
        { tipo: "stack", tamaño: 4096, permisos: 'rw' }
      ]}
    ];

    programas.forEach(p => this.cargarProceso(p.nombre, p.segmentos, 'mejor'));
  }

    mostrarPila() {
    const segmentos = [];

    this.procesos.forEach(proc => {
      proc.segmentos.forEach(seg => {
        segmentos.push({
          proceso: proc.nombre,
          tipo: seg.tipo,
          base: seg.base,
          tamaño: seg.tamaño,
          fin: seg.base + seg.tamaño
        });
      });
    });

    // Añadir Sistema Operativo (como en tu imagen)
    segmentos.push({
      proceso: 'S.O',
      tipo: 'kernel',
      base: 0x1000000 - 1048576, // 16 MiB - 1 MiB
      tamaño: 1048576,
      fin: 0x1000000
    });

    // Ordenar por base
    segmentos.sort((a, b) => a.base - b.base);

    console.log('\n🧱 PILA DE MEMORIA SEGMENTADA\n');
    console.log(`| Dirección Base | Dirección Fin | Tamaño      | Segmento            |`);
    console.log(`|----------------|---------------|-------------|---------------------|`);

    segmentos.forEach(seg => {
      const base = seg.base.toString(16).toUpperCase().padStart(6, '0');
      const fin = seg.fin.toString(16).toUpperCase().padStart(6, '0');
      const tamañoKB = (seg.tamaño / 1024).toFixed(2).padStart(8) + ' KiB';
      const nombre = `${seg.proceso} (${seg.tipo})`.padEnd(20);

      console.log(`| ${base}         | ${fin}        | ${tamañoKB}| ${nombre}|`);
    });
  }
  
}

// 👇 Ejecutar
sim.cargarEjemplos();
sim.mostrarProcesos();
sim.mostrarPila(); 
sim.resumenMemoria();
