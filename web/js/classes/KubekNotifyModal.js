const NOTIFY_MODAL_TEMPLATE = `
    <div class="notify-modal modal-bg" id="{id}">
        <div class="notify-window">
            <div class="notify-icon">{icon}</div>
            <div class="notify-caption">{caption}</div>
            <div class="notify-description">{description}</div>
            <button id="cmbtn-{id}" class="primary-btn">{buttonText}</button>
            {additionalElements}
        </div>
    </div>
`;

class KubekNotifyModal {
    /**
     * Crear una ventana modal de notificación
     * @param {string} caption - El título de la notificación
     * @param {string} text - La descripción del mensaje
     * @param {string} buttonText - El texto del botón principal
     * @param {string} icon - El icono que se mostrará
     * @param {Function} cb - Callback a ejecutar al cerrar la ventana
     * @param {string} additionalElements - Elementos adicionales que se agregarán
     */
    static create(caption, text, buttonText, icon, cb = () => {}, additionalElements = "") {
        // Mostrar pantalla difuminada
        const blurScreen = document.querySelector(".blurScreen");
        if (blurScreen) blurScreen.style.display = "block";

        const randomID = `notify-${Math.floor(Math.random() * 991) + 10}`;
        const iconElement = `<span class='material-symbols-rounded'>${icon}</span>`;

        // Crear el contenido del modal
        const modalHTML = NOTIFY_MODAL_TEMPLATE
            .replace("{id}", randomID)
            .replace("{icon}", iconElement)
            .replace("{caption}", caption)
            .replace("{description}", text)
            .replace("{buttonText}", buttonText)
            .replace("{additionalElements}", additionalElements);

        // Insertar el modal en el body
        const modalElement = document.createElement("div");
        modalElement.innerHTML = modalHTML;
        document.body.appendChild(modalElement.firstElementChild);

        // Configurar el evento del botón principal
        const button = document.getElementById(`cmbtn-${randomID}`);
        if (button) {
            button.addEventListener("click", () => {
                this.animateCSS(`#${randomID}`, "fadeOut").then(() => {
                    const modal = document.getElementById(randomID);
                    if (modal) modal.remove();
                });
                if (blurScreen) blurScreen.style.display = "none";
                cb();
            });
        }
    }

    /**
     * Eliminar todos los modales de notificación
     */
    static destroyAllModals() {
        const modals = document.querySelectorAll(".notify-modal");
        modals.forEach((modal) => modal.remove());

        const blurScreen = document.querySelector(".blurScreen");
        if (blurScreen) blurScreen.style.display = "none";
    }

    /**
     * Crear un modal solicitando entrada del usuario
     * @param {string} caption - El título del modal
     * @param {string} icon - El icono que se mostrará
     * @param {Function} cb - Callback que recibe el valor ingresado
     * @param {string} description - La descripción del modal
     * @param {string} placeholder - Placeholder del campo de entrada
     * @param {string} value - Valor por defecto en el campo de entrada
     * @param {string} iType - Tipo del campo de entrada (por defecto "text")
     */
    static askForInput(
        caption,
        icon,
        cb = () => {},
        description = "",
        placeholder = "{{commons.input}}",
        value = "",
        iType = "text"
    ) {
        const inputRandID = `input-${Math.floor(Math.random() * 10000)}`;
        const inputField = `
            <p>${description}</p>
            <input 
                style="width: 300px;" 
                id="${inputRandID}" 
                type="${iType}" 
                placeholder="${placeholder}" 
                value="${value}"
            >
        `;
        this.create(
            caption,
            inputField,
            "{{commons.save}}",
            icon,
            () => {
                const inputElement = document.getElementById(inputRandID);
                if (inputElement) cb(inputElement.value);
            },
            KubekPredefined.MODAL_CANCEL_BTN
        );
    }

    /**
     * Animar un elemento usando clases CSS
     * @param {string} selector - Selector del elemento
     * @param {string} animation - Nombre de la animación
     * @returns {Promise} - Promesa que se resuelve al finalizar la animación
     */
    static animateCSS(selector, animation) {
        return new Promise((resolve) => {
            const element = document.querySelector(selector);
            if (!element) return resolve();

            element.classList.add("animate__animated", `animate__${animation}`);
            element.addEventListener(
                "animationend",
                () => {
                    element.classList.remove("animate__animated", `animate__${animation}`);
                    resolve();
                },
                { once: true }
            );
        });
    }
}
