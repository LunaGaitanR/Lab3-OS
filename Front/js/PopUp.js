const btnAbrirPopUp = document.querySelector("#btnEditarProcesos");
const btnCerrarPopUp = document.querySelector("#btnVolver");

const TablaProcesos = document.querySelector("#TablaProcesos");

btnAbrirPopUp.addEventListener("click", () => {
	TablaProcesos.showModal();
});

btnCerrarPopUp.addEventListener("click", () => {
	TablaProcesos.close();
});
