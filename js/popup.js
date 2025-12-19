document.addEventListener('DOMContentLoaded', init);
async function init() {
    const tituloEncuesta = document.querySelector("#titulo-encuesta");
    const container = document.querySelector("#container");

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        let url = tabs[0]?.url || '';
        if (url.search("http://extranet.unsa.edu.pe/encuesta2/form/llenaEnc.php") === -1) {
            tituloEncuesta.innerHTML = `Ingresa a la página de la encuesta`;
            container.innerHTML = `
                        <div class="no-encuesta-container">
                            <div class="no-encuesta-message">
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M7.364 3.5a.5.5 0 0 1 .5-.5H14.5A1.5 1.5 0 0 1 16 4.5v10a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 3 14.5V7.864a.5.5 0 1 1 1 0V14.5a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5v-10a.5.5 0 0 0-.5-.5H7.864a.5.5 0 0 1-.5-.5"/>
                                <path fill-rule="evenodd" d="M0 .5A.5.5 0 0 1 .5 0h5a.5.5 0 0 1 0 1H1.707l8.147 8.146a.5.5 0 0 1-.708.708L1 1.707V5.5a.5.5 0 0 1-1 0z"/>
                                </svg>
                                <strong>Accede a la encuesta</strong ><br>
                                Dirígete a la encuesta de un curso para poder calificar automáticamente.
                            </div>
                        </div>
                    `;

        } else {
            tituloEncuesta.innerHTML = `<p>Instrucciones:</p>`;
            container.innerHTML = `
            <div class="content-container">
                <div class="instrucciones">
                    <strong>1.</strong> Elije una de las calificaciones.<br>
                    <strong>2.</strong> Presiona el boton "Calificar" para llenar la encuesta.<br>
                    <strong>3.</strong> Presiona el boton "Limpiar" para limpiar las respuestas.
                </div>
                <div class="separador-opciones"></div>
                <div class="checkbox-container">
                    <form >
                        <label>
                            <input type="radio" name="radio" id="2">
                            <span>Excelente</span>
                        </label>
                        <label>
                            <input type="radio" name="radio" id="1">
                            <span>Bueno</span>
                        </label>
                        <label>
                            <input type="radio" name="radio" id="0">
                            <span>Pesimo</span>
                        </label>
                    </form>
                </div>

                <div class="acciones-container">
                    <button class="btn btn-calificar" id="btnCali">Calificar</button>
                    <button class="btn btn-limpiar" id="btnLimp">Limpiar</button>
                </div>
            </div>`;

            activarBotonCalificar();
            activarBotonLimpiar();

        }
    });

    function activarBotonCalificar() {
        let calificacion = null;
        const btnCali = document.querySelector("#btnCali");
        btnCali.addEventListener('click', function (e) {
            const radio = document.querySelectorAll("input[type='radio'][name='radio']")
            radio.forEach(e => {
                if (e.checked) {
                    calificacion = e.id;
                }
            })

            if (calificacion == null) return;

            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    function: fill,
                    args: [calificacion]
                });
            });

        });
    }

    function activarBotonLimpiar() {
        const btnLimp = document.querySelector("#btnLimp");
        btnLimp.addEventListener('click', function (e) {
            const radio = document.querySelectorAll("input[type='radio'][name='radio']")
            radio.forEach(e => {
                e.checked = false;
            })

            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    function: clear
                });
            });
        });
    }

    function fill(id) {
        for (let i = 1; i < 21; i++) {
            const radios = document.querySelectorAll(`#radio${i}`);
            if (radios.length === 0) continue;
            let prob = Math.floor((Math.random()) * 2); // 0 o 1
            if (prob === 0) {
                radios[parseInt(id)].checked = true;
            } else {
                radios[parseInt(id) + 1].checked = true;
            }  
        }

        // Calificacion
        const inputNumber = document.querySelector("input[type='number'][id='calificacion']");
        if (!inputNumber) return;
        if (parseInt(id) === 2) { // 15-19
            inputNumber.value = Math.floor((Math.random() * 6) + 15);
        } else if (parseInt(id) === 1) { // 10-14
            inputNumber.value = Math.floor((Math.random() * 5) + 10);
        } else if (parseInt(id) === 0) { // 4-8
            inputNumber.value = Math.floor((Math.random() * 5) + 4);
        }

    }

    function clear() {
        const radios = document.querySelectorAll("input[type='radio']");
        if (!radios) return;
        radios.forEach(e => {
            e.checked = false;
        })
        const inputNumber = document.querySelector("input[type='number'][id='calificacion']");
        if (!inputNumber) return;
        inputNumber.value = "";
    }

}