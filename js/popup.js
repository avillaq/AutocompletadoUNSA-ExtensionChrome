document.addEventListener('DOMContentLoaded', init);

const PROFILES = [
    {
        id: 'muy-bueno',
        label: 'Muy bueno',
        distribution: [2, 15, 43, 40],
        gradeRange: [17, 20]
    },
    {
        id: 'bueno',
        label: 'Bueno',
        distribution: [5, 25, 45, 25],
        gradeRange: [12, 16]
    },
    {
        id: 'regular',
        label: 'Regular',
        distribution: [20, 45, 28, 7],
        gradeRange: [6, 11]
    },
    {
        id: 'pesimo',
        label: 'Pesimo',
        distribution: [60, 30, 8, 2],
        gradeRange: [1, 5]
    },
];

function isSurveyUrl(url) {
    try {
        const parsedUrl = new URL(url);
        const isUnsaHost = /(^|\.)extranet\.unsa\.edu\.pe$/i.test(parsedUrl.hostname);
        const isSurveyPath = parsedUrl.pathname.toLowerCase().includes('/encuesta2/form/llenaenc.php');
        return isUnsaHost && isSurveyPath;
    } catch {
        return false;
    }
}

async function init() {
    const tituloEncuesta = document.querySelector('#titulo-encuesta');
    const container = document.querySelector('#container');

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const activeTab = tabs[0];
        const url = activeTab?.url || '';

        if (!isSurveyUrl(url)) {
            tituloEncuesta.innerHTML = 'Ingresa a la pagina de la encuesta';
            container.innerHTML = `
                <div class="no-encuesta-container">
                    <div class="no-encuesta-message">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M7.364 3.5a.5.5 0 0 1 .5-.5H14.5A1.5 1.5 0 0 1 16 4.5v10a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 3 14.5V7.864a.5.5 0 1 1 1 0V14.5a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5v-10a.5.5 0 0 0-.5-.5H7.864a.5.5 0 0 1-.5-.5"/>
                        <path fill-rule="evenodd" d="M0 .5A.5.5 0 0 1 .5 0h5a.5.5 0 0 1 0 1H1.707l8.147 8.146a.5.5 0 0 1-.708.708L1 1.707V5.5a.5.5 0 0 1-1 0z"/>
                        </svg>
                        <strong>Accede a la encuesta</strong><br>
                        Dirigete a la encuesta de un curso para poder calificar automaticamente.
                    </div>
                </div>
            `;
            return;
        }

        tituloEncuesta.innerHTML = '<p>Encuesta detectada</p>';
        const profilesHtml = PROFILES.map((profile, index) => `
            <label>
                <input type="radio" name="radio" value="${profile.id}" ${index === 0 ? 'checked' : ''}>
                <span>${profile.label}</span>
            </label>
        `).join('');

        container.innerHTML = `
            <div class="content-container">
                <div class="instrucciones">
                    Selecciona perfil y presiona <strong>Calificar</strong>.
                </div>
                <div class="separador-opciones"></div>
                <div class="checkbox-container">
                    <form>
                        ${profilesHtml}
                    </form>
                </div>

                <div class="acciones-container">
                    <button class="btn btn-calificar" id="btnCali">Calificar</button>
                    <button class="btn btn-limpiar" id="btnLimp">Limpiar</button>
                    <button class="btn" id="btnGuardarSeguro">Enviar</button>
                </div>
                <p id="estado-formulario" style="font-size:11px;margin:2px 10px 0 10px;color:#4a5568;"></p>
            </div>
        `;

        activarBotonCalificar();
        activarBotonLimpiar();
        activarBotonGuardarSeguro();
    });

    function setEstado(message, isError = false) {
        const estado = document.querySelector('#estado-formulario');
        if (!estado) return;
        estado.textContent = message;
        estado.style.color = isError ? '#b00020' : '#2d6a4f';
    }

    function obtenerCalificacionSeleccionada() {
        const radios = document.querySelectorAll("input[type='radio'][name='radio']");
        for (const radio of radios) {
            if (radio.checked) return radio.value;
        }
        return null;
    }

    function executeOnActiveTab(scriptFunction, args = [], onResult) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const tabId = tabs[0]?.id;
            if (!tabId) {
                setEstado('No se pudo detectar la pestana activa.', true);
                return;
            }

            chrome.scripting.executeScript(
                {
                    target: { tabId },
                    function: scriptFunction,
                    args
                },
                (results) => {
                    if (chrome.runtime.lastError) {
                        setEstado(chrome.runtime.lastError.message || 'Error al ejecutar script.', true);
                        return;
                    }
                    const result = results?.[0]?.result;
                    if (onResult) onResult(result);
                }
            );
        });
    }

    function activarBotonCalificar() {
        const btnCali = document.querySelector('#btnCali');
        btnCali.addEventListener('click', function () {
            const selectedProfileId = obtenerCalificacionSeleccionada();
            if (selectedProfileId == null) {
                setEstado('Selecciona una calificacion antes de llenar.', true);
                return;
            }

            const selectedProfile = PROFILES.find((profile) => profile.id === selectedProfileId);
            if (!selectedProfile) {
                setEstado('Perfil no valido.', true);
                return;
            }

            executeOnActiveTab(injectedFill, [selectedProfile], (result) => {
                if (!result) {
                    setEstado('No se pudo llenar la encuesta.', true);
                    return;
                }
                if (result.ok) {
                    setEstado(`Perfil ${selectedProfile.label}: ${result.answered}/${result.total} preguntas y nota ${result.grade}.`);
                } else {
                    setEstado(result.message || 'La encuesta no se pudo llenar por completo.', true);
                }
            });
        });
    }

    function activarBotonLimpiar() {
        const btnLimp = document.querySelector('#btnLimp');
        btnLimp.addEventListener('click', function () {
            const radios = document.querySelectorAll("input[type='radio'][name='radio']");
            radios.forEach((radio) => {
                radio.checked = false;
            });

            executeOnActiveTab(injectedClear, [], () => {
                setEstado('Respuestas limpiadas.');
            });
        });
    }

    function activarBotonGuardarSeguro() {
        const btnGuardarSeguro = document.querySelector('#btnGuardarSeguro');
        btnGuardarSeguro.addEventListener('click', function () {
            executeOnActiveTab(injectedValidateAndSave, [], (result) => {
                if (!result) {
                    setEstado('No se pudo validar el formulario.', true);
                    return;
                }

                if (result.ok) {
                    setEstado(`Formulario completo (${result.answered}/${result.total}). Enviando...`);
                    return;
                }

                const mensajeFaltantes = result.missing > 0
                    ? ` Faltan ${result.missing} pregunta(s).`
                    : '';
                const mensajeNota = result.gradeValid ? '' : ' La nota (0-20) es invalida.';
                setEstado(`No se envio.${mensajeFaltantes}${mensajeNota}`, true);
            });
        });
    }

}

function injectedFill(profile) {
    function collectSurveyGroups() {
        const radios = document.querySelectorAll("input[type='radio'][name^='radio']");
        const groups = {};

        radios.forEach((radio) => {
            const groupName = radio.name;
            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push(radio);
        });

        return Object.values(groups).filter((group) => group.length > 0);
    }

    function randomFromRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function normalizeDistribution(distribution) {
        if (!Array.isArray(distribution) || distribution.length !== 4) return [10, 20, 35, 35];

        const parsed = distribution.map((value) => Number(value));
        const valid = parsed.every((value) => Number.isFinite(value) && value >= 0);
        if (!valid) return [10, 20, 35, 35];

        const total = parsed.reduce((acc, value) => acc + value, 0);
        if (total <= 0) return [10, 20, 35, 35];

        return parsed.map((value) => value / total);
    }

    function pickWeightedIndex(weights) {
        const roll = Math.random();
        let accumulator = 0;

        for (let i = 0; i < weights.length; i++) {
            accumulator += weights[i];
            if (roll <= accumulator) return i;
        }

        return weights.length - 1;
    }

    const groups = collectSurveyGroups();
    if (groups.length === 0) return { ok: false, message: 'No se encontraron preguntas en la encuesta.' };

    const weights = normalizeDistribution(profile?.distribution);

    groups.forEach((group) => {
        const selectedIndex = pickWeightedIndex(weights);
        const safeIndex = Math.min(selectedIndex, group.length - 1);
        group[safeIndex].checked = true;
    });

    const inputNumber = document.querySelector("input[type='number'][id='calificacion']");
    let grade = null;
    const gradeMin = Number(profile?.gradeRange?.[0]);
    const gradeMax = Number(profile?.gradeRange?.[1]);
    const hasValidRange = Number.isFinite(gradeMin) && Number.isFinite(gradeMax) && gradeMin <= gradeMax;

    if (inputNumber) {
        if (hasValidRange) {
            grade = randomFromRange(gradeMin, gradeMax);
        } else {
            grade = randomFromRange(10, 16);
        }
        if (grade !== null) inputNumber.value = grade;
    }

    const answered = groups.filter((group) => group.some((radio) => radio.checked)).length;
    return { ok: answered === groups.length, answered, total: groups.length, grade };
}

function injectedValidateAndSave() {
    function collectSurveyGroups() {
        const radios = document.querySelectorAll("input[type='radio'][name^='radio']");
        const groups = {};

        radios.forEach((radio) => {
            const groupName = radio.name;
            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push(radio);
        });

        return Object.values(groups).filter((group) => group.length > 0);
    }

    const groups = collectSurveyGroups();
    const total = groups.length;
    const answered = groups.filter((group) => group.some((radio) => radio.checked)).length;
    const missing = total - answered;

    const inputNumber = document.querySelector("input[type='number'][id='calificacion']");
    const grade = Number(inputNumber?.value);
    const gradeValid = Number.isFinite(grade) && grade >= 0 && grade <= 20;

    const ok = missing === 0 && gradeValid;
    if (!ok) return { ok: false, total, answered, missing, gradeValid };

    const saveButton = document.querySelector('#agrega') || document.querySelector("input[type='button'][value='Guardar']");
    if (!saveButton) {
        return { ok: false, total, answered, missing: 0, gradeValid, message: 'No se encontro el boton Guardar.' };
    }

    saveButton.click();
    return { ok: true, total, answered, missing: 0, gradeValid };
}

function injectedClear() {
    function collectSurveyGroups() {
        const radios = document.querySelectorAll("input[type='radio'][name^='radio']");
        const groups = {};

        radios.forEach((radio) => {
            const groupName = radio.name;
            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push(radio);
        });

        return Object.values(groups).filter((group) => group.length > 0);
    }

    const groups = collectSurveyGroups();
    groups.forEach((group) => {
        group.forEach((radio) => {
            radio.checked = false;
        });
    });

    const inputNumber = document.querySelector("input[type='number'][id='calificacion']");
    if (inputNumber) inputNumber.value = '';
    return { ok: true };
}