document.addEventListener('DOMContentLoaded', init);
async function init() {
    const tituloEncuesta = document.querySelector("#titulo-encuesta");
    const contenidoContainer = document.querySelector("#contenido-container");

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        let url = tabs[0]?.url || '';
        if (url.search("http://extranet.unsa.edu.pe/encuesta2/form/llenaEnc.php") === -1) {
            tituloEncuesta.innerHTML = `Ingresa a la página de la encuesta`;
            contenidoContainer.innerHTML = `
                        <div class="no-encuesta-container">
                            <div class="no-encuesta-message">
                                <i class="fas fa-external-link-alt"></i>
                                <strong>Accede a la encuesta</strong><br>
                                Dirígete a la encuesta de un curso para poder calificar automáticamente.
                            </div>
                        </div>
                    `;

        } else {
            tituloEncuesta.innerHTML = `<p>Instrucciones:</p>`;
            contenidoContainer.innerHTML = `
            <div class="no-encuesta-container">
                <div class="no-encuesta-message">
                    <strong>1.</strong> Elije una de las calificaciones.<br>
                    <strong>2.</strong> Presiona el boton "Calificar" para llenar la encuesta.<br>
                    <strong>3.</strong> Presiona el boton "Limpiar" para borrar las respuestas.
                </div>
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

                <div class="container-btn">
                    <a href="#" class="btn" id="btnCali">Calificar</a>
                    <a href="#" class="btn" id="btnLimp">Limpiar</a>
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
            e.preventDefault();
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
            e.preventDefault();
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
            let prob = Math.floor((Math.random()) * 2); // 0 o 1
            if (prob === 0) {
                radios[parseInt(id)].checked = true;
            } else {
                radios[parseInt(id) + 1].checked = true;
            }
            //console.log(e.value);    
        }

        // Calificacion
        const inputNumber = document.querySelector("input[type='number'][id='calificacion']");
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
        radios.forEach(e => {
            e.checked = false;
        })
        const inputNumber = document.querySelector("input[type='number'][id='calificacion']");
        inputNumber.value = "";
    }

}