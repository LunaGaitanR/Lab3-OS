const btnLeerTablaProcesosIteractivos = document.getElementById("btnLeerTabla");

btnLeerTablaProcesosIteractivos.addEventListener("click", leerTablaProcesos);

function leerTablaProcesos() {
    const tabla = document.querySelector(".TablaProcesosIterativos tbody");
    const datos = [];

    tabla.querySelectorAll("tr").forEach((fila) => {
        const celdas = fila.querySelectorAll("td");

        // Verifica si hay botón y si está desactivado
        const btn = celdas[6]?.querySelector("button");
        if (btn && btn.classList.contains("desactivado")) {
            return;
        }

        if (celdas.length >= 6) {
            datos.push({
                nombre: celdas[0].textContent.trim(),
                text: celdas[1].textContent.trim(),
                data: celdas[2].textContent.trim(),
                bss: celdas[3].textContent.trim(),
                stack: celdas[4].textContent.trim(),
                heap: celdas[5].textContent.trim(),
            });
        }
    });

    console.log(datos); //Borrar esto despues de pruebas
    return datos;
}
