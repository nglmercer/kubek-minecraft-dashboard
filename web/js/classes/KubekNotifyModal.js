const NOTIFY_MODAL_CODE =
    '<div class="notify-modal modal-bg" id="$5"> <div class="notify-window"> <div class="notify-icon">$4</div> <div class="notify-caption">$1</div> <div class="notify-description">$2</div> <button id="cmbtn-$5" class="primary-btn">$3</button> $6 </div> </div>';

class KubekNotifyModal {
    static create(caption, text, buttonText, icon, cb = () => {
    }, additionalElements = "") {
        $(".blurScreen").show();
        let iconEl = "<span class='material-symbols-rounded'>" + icon + "</span>";
        let randomID = "notify-" + Math.floor(Math.random() * (1000 - 10 + 1)) + 10;
        $("body").append(
            NOTIFY_MODAL_CODE.replaceAll(/\$1/gim, caption)
                .replaceAll(/\$2/gim, text)
                .replaceAll(/\$3/gim, buttonText)
                .replaceAll(/\$4/gim, iconEl)
                .replaceAll(/\$5/gim, randomID)
                .replaceAll(/\$6/gim, additionalElements)
        );
        $("#cmbtn-" + randomID)
            .on("click", function () {
                animateCSSJ("#" + randomID, "fadeOut", true).then(() => {
                    $(this).parent().parent().remove();
                });
                $(".blurScreen").hide();
                cb();
            });
    }

    // Удалить все модальные окна
    static destroyAllModals() {
        $(".notify-modal").remove();
        $(".blurScreen").hide();
    }

    // Создать modal с запросом ввода от пользователя
    static askForInput(caption, icon, cb = () => {}, description = "", placeholder = "{{commons.input}}", value = "", iType = "text"){
        let inputRandID = KubekUtils.uuidv4();
        let desc = "<p>" + description + "</p><input style='width: 300px;' id='" + inputRandID + "' type='" + iType + "' placeholder='" + placeholder + "' value='" + value + "'></input>";
        this.create(caption, desc, "{{commons.save}}", icon, () => {
            cb($("#" + inputRandID).val());
        }, KubekPredefined.MODAL_CANCEL_BTN);
    }
}
// Definimos el template HTML base para el modal
const template = document.createElement('template');
template.innerHTML = `
  <style>
    .notify-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .notify-window {
      background: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 500px;
      width: 90%;
    }

    .notify-icon {
      text-align: center;
      margin-bottom: 15px;
    }

    .notify-caption {
      font-size: 1.2em;
      font-weight: bold;
      margin-bottom: 10px;
    }

    .notify-description {
      margin-bottom: 20px;
    }

    .primary-btn {
      padding: 8px 16px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .primary-btn:hover {
      background: #0056b3;
    }

    .cancel-btn {
      margin-left: 10px;
      padding: 8px 16px;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  </style>
  <div class="notify-modal">
    <div class="notify-window">
      <div class="notify-icon"></div>
      <div class="notify-caption"></div>
      <div class="notify-description"></div>
      <div class="buttons">
        <button class="primary-btn"></button>
      </div>
    </div>
  </div>
`;

class NotifyModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    
    // Bindings
    this._handlePrimaryButton = this._handlePrimaryButton.bind(this);
    this._handleCancelButton = this._handleCancelButton.bind(this);
  }

  static get observedAttributes() {
    return ['caption', 'text', 'button-text', 'icon'];
  }

  connectedCallback() {
    this.shadowRoot.querySelector('.primary-btn').addEventListener('click', this._handlePrimaryButton);
  }

  disconnectedCallback() {
    this.shadowRoot.querySelector('.primary-btn').removeEventListener('click', this._handlePrimaryButton);
    if (this.shadowRoot.querySelector('.cancel-btn')) {
      this.shadowRoot.querySelector('.cancel-btn').removeEventListener('click', this._handleCancelButton);
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'caption':
        this.shadowRoot.querySelector('.notify-caption').textContent = newValue;
        break;
      case 'text':
        this.shadowRoot.querySelector('.notify-description').innerHTML = newValue;
        break;
      case 'button-text':
        this.shadowRoot.querySelector('.primary-btn').textContent = newValue;
        break;
      case 'icon':
        this.shadowRoot.querySelector('.notify-icon').innerHTML = 
          `<span class="material-symbols-rounded">${newValue}</span>`;
        break;
    }
  }

  _handlePrimaryButton() {
    this.dispatchEvent(new CustomEvent('confirm'));
    this.remove();
  }

  _handleCancelButton() {
    this.remove();
  }

  // Métodos estáticos similares a KubekNotifyModal
  static create(caption, text, buttonText, icon, callback = () => {}, additionalElements = "") {
    const modal = document.createElement('notify-modal');
    modal.setAttribute('caption', caption);
    modal.setAttribute('text', text);
    modal.setAttribute('button-text', buttonText);
    modal.setAttribute('icon', icon);
    
    modal.addEventListener('confirm', callback);

    if (additionalElements) {
      const buttons = modal.shadowRoot.querySelector('.buttons');
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'cancel-btn';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', () => modal.remove());
      buttons.appendChild(cancelBtn);
    }

    document.body.appendChild(modal);
    return modal;
  }

  static destroyAllModals() {
    document.querySelectorAll('notify-modal').forEach(modal => modal.remove());
  }

  static askForInput(caption, icon, callback = () => {}, description = "", placeholder = "Input", value = "", inputType = "text") {
    const inputId = 'input-' + Math.random().toString(36).substr(2, 9);
    const inputHTML = `
      <p>${description}</p>
      <input style="width: 300px;" 
             id="${inputId}" 
             type="${inputType}" 
             placeholder="${placeholder}" 
             value="${value}">
    `;

    const modal = this.create(
      caption,
      inputHTML,
      'Save',
      icon,
      () => {
        const input = modal.shadowRoot.querySelector(`#${inputId}`);
        callback(input.value);
      },
      true
    );

    return modal;
  }
}

// Registrar el componente
customElements.define('notify-modal', NotifyModal);

// Ejemplo de uso:
/*
// Crear un modal simple
NotifyModal.create(
  'Título',
  'Descripción del modal',
  'Aceptar',
  'info',
  () => console.log('Modal confirmado')
);

// Crear un modal con input
NotifyModal.askForInput(
  'Ingrese datos',
  'edit',
  (value) => console.log('Valor ingresado:', value),
  'Por favor ingrese la información requerida',
  'Escriba aquí...'
);
*/