loadedSettings = null;

$(function () {
    KubekUI.setTitle("Kubek | {{sections.serverSettings}}");

    KubekServerSettingsUI.loadSettings();
    KubekServerSettingsUI.loadStartScript();
});

KubekServerSettingsUI = class {
    // Загрузить настройки в интерфейс
    static loadSettings = () => {
        KubekRequests.get("/servers/" + selectedServer + "/info", (kSettings) => {
            loadedSettings = kSettings;
            if (kSettings.restartOnError === false) {
                document.querySelector('#restart-on-error').setInputValues(false);
            } else {
                document.querySelector('#restart-on-error').setInputValues(true);
            }
            document.querySelector("#stop-command").setInputValues(kSettings.stopCommand);
            document.querySelector('#restart-attempts').setInputValues(kSettings.maxRestartAttempts);
        });
    }

    // Загрузить start script в интерфейс
    static loadStartScript = () => {
        KubekRequests.get("/servers/" + selectedServer + "/startScript", (startScript) => {
            document.querySelector('#start-script').setInputValues(startScript);
        });
    }

    // Сохранить настройки и start script
    static writeSettings = () => {
        loadedSettings.maxRestartAttempts = document.querySelector('#restart-attempts').getInputValues();
        loadedSettings.restartOnError = document.querySelector('#restart-on-error').getInputValues();
        loadedSettings.stopCommand = document.querySelector("#stop-command").getInputValues();
        let startScript = document.querySelector('#start-script').getInputValues();
        KubekRequests.put("/servers/" + selectedServer + "/info?data=" + Base64.encodeURI(JSON.stringify(loadedSettings)), (result) => {
            KubekRequests.put("/servers/" + selectedServer + "/startScript?data=" + Base64.encodeURI(startScript), (result2) => {
                if (result !== false && result2 !== false) {
                    KubekAlerts.addAlert("{{fileManager.writeEnd}}", "check", "", 5000);
                }
            });
        });


    };

    // Удалить сервер с модалкой подтверждения
    static deleteServer = () => {
        KubekNotifyModal.create(selectedServer, "{{serverSettings.deleteServer}}", "{{commons.delete}}", "delete", () => {
            KubekRequests.delete("/servers/" + selectedServer, () => {});
        }, KubekPredefined.MODAL_CANCEL_BTN);
    }
}
var restartOnErrorswitch = document.querySelector('#restart-on-error');
restartOnErrorswitch.addEventListener('input-change', (e) => {
    console.log("restartOnErrorswitch", e.detail);
  if (e.detail.value === true) {
    document.querySelector('#restart-attempts-tr').classList.remove('hidden');
  } else {
    document.querySelector('#restart-attempts-tr').classList.add('hidden');
  }
});

if (!customElements.get('custom-input')) {
    class CustomInput extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: 'open' });
          this.handleInputChange = this.handleInputChange.bind(this);
        }
      
        static get observedAttributes() {
          return ['type', 'id', 'name', 'value', 'placeholder', 'disabled', 'readonly', 'darkmode'];
        }
      
        getStyles() {
          const darkMode = this.hasAttribute('darkmode');
          
          return `
            :host {
              display: block;
              margin: 10px 0;
              color-scheme: light dark;
            }
            
            .input-container {
              display: flex;
              flex-direction: column;
              padding: 8px;
            }
            
            input, textarea {
              padding: 1rem;
              border: 1px solid ${darkMode ? '#555' : '#ccc'};
              border-radius: 4px;
              font-size: 14px;
              background-color: ${darkMode ? '#333' : '#fff'};
              color: ${darkMode ? '#fff' : '#000'};
            }
            textarea {
              resize: vertical;
              min-height: 100px;
            }
            input:disabled, textarea:disabled {
              background-color: ${darkMode ? '#222' : '#f5f5f5'};
              cursor: not-allowed;
              color: ${darkMode ? '#666' : '#888'};
            }
            
            .switch {
              position: relative;
              display: inline-block;
              width: 60px;
              height: 34px;
            }
            
            .switch input {
              opacity: 0;
              width: 0;
              height: 0;
            }
            
            .slider {
              position: absolute;
              cursor: pointer;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-color: ${darkMode ? '#555' : '#ccc'};
              transition: .4s;
              border-radius: 34px;
            }
            
            .slider:before {
              position: absolute;
              content: "";
              height: 26px;
              width: 26px;
              left: 4px;
              bottom: 4px;
              background-color: ${darkMode ? '#888' : 'white'};
              transition: .4s;
              border-radius: 50%;
            }
            
            input:checked + .slider {
              background-color: #2196F3;
            }
            
            input:checked + .slider:before {
              transform: translateX(26px);
            }
            
            input:focus, textarea:focus {
              outline: none;
              border-color: #2196F3;
              box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
            }
          `;
        }
      
        connectedCallback() {
          this.render();
          const input = this.shadowRoot.querySelector('input, textarea');
          if (input) {
            input.addEventListener('input', this.handleInputChange);
            input.addEventListener('change', this.handleInputChange);
          }
        }
      
        disconnectedCallback() {
          const input = this.shadowRoot.querySelector('input, textarea');
          if (input) {
            input.removeEventListener('input', this.handleInputChange);
            input.removeEventListener('change', this.handleInputChange);
          }
        }
      
        handleInputChange(event) {
          const value = this.getInputValues();
          this.dispatchEvent(new CustomEvent('input-change', {
            detail: {
              id: this.getAttribute('id'),
              name: this.getAttribute('name'),
              value: value
            },
            bubbles: true,
            composed: true
          }));
        }
      
        attributeChangedCallback(name, oldValue, newValue) {
          if (oldValue !== newValue) {
            this.render();
          }
        }
      
        render() {
          const type = this.getAttribute('type') || 'text';
          const id = this.getAttribute('id');
          const name = this.getAttribute('name');
          const value = this.getAttribute('value') || '';
          const placeholder = this.getAttribute('placeholder') || '';
          const disabled = this.hasAttribute('disabled');
          const readonly = this.hasAttribute('readonly');
      
          this.shadowRoot.innerHTML = `
            <style>${this.getStyles()}</style>
            <div class="input-container">
              ${this.renderInput(type, id, name, value, placeholder, disabled, readonly)}
            </div>
          `;
      
          // Reattach event listeners after rendering
          const input = this.shadowRoot.querySelector('input, textarea');
          if (input) {
            input.addEventListener('input', this.handleInputChange);
            input.addEventListener('change', this.handleInputChange);
          }
        }
      
        renderInput(type, id, name, value, placeholder, disabled, readonly) {
          switch (type) {
            case 'textarea':
              return `
                <textarea
                  id="${id}"
                  name="${name}"
                  placeholder="${placeholder}"
                  ${disabled ? 'disabled' : ''}
                  ${readonly ? 'readonly' : ''}
                >${value}</textarea>
              `;
            
            case 'checkbox':
            case 'switch':
            case 'boolean':
              return `
                <label class="switch">
                  <input
                    type="checkbox"
                    id="${id}"
                    name="${name}"
                    ${value === 'true' ? 'checked' : ''}
                    ${disabled ? 'disabled' : ''}
                    ${readonly ? 'readonly' : ''}
                  >
                  <span class="slider"></span>
                </label>
              `;
            
            default:
              return `
                <input
                  type="${type === 'string' ? 'text' : type}"
                  id="${id}"
                  name="${name}"
                  value="${value}"
                  placeholder="${placeholder}"
                  ${disabled ? 'disabled' : ''}
                  ${readonly ? 'readonly' : ''}
                >
              `;
          }
        }
      
        getInputValues() {
          const input = this.shadowRoot.querySelector('input, textarea');
          if (!input) return null;
      
          if (input.type === 'checkbox') {
            return input.checked;
          }
          
          if (input.tagName.toLowerCase() === 'textarea') {
            return input.value.split('\n');
          }
          const inputvalue = this.parseValueByType(input);
          return inputvalue;
        }
        parseValueByType(input) {
          const valueType = typeof input.value;
          const inputType = input.type;
          const value = input.value;
          console.log("valueType", valueType, value, inputType);
          switch (inputType) {
            case 'number':
              const num = Number(value);
              return isNaN(num) ? 0 : num * 1;
            case 'text':
            case 'string':
              return value;
            default:
              return value;
          }
        }
        setInputValues(value) {
          const input = this.shadowRoot.querySelector('input, textarea');
          if (!input) return;
      
          if (input.type === 'checkbox') {
            input.checked = Boolean(value);
          } else if (Array.isArray(value) && input.tagName.toLowerCase() === 'textarea') {
            input.value = value.join('\n');
          } else {
            input.value = value;
          }
      
          // Dispatch event when setting values programmatically
          this.handleInputChange();
        }
      
        resetInputValues() {
          const input = this.shadowRoot.querySelector('input, textarea');
          if (!input) return;
      
          if (input.type === 'checkbox') {
            input.checked = false;
          } else {
            input.value = '';
          }
      
          // Dispatch event when resetting values
          this.handleInputChange();
        }
      }
    customElements.define('custom-input', CustomInput);
}
  function setAllInputValues(dataObject) {
    const inputs = document.querySelectorAll('custom-input');
    
    inputs.forEach(input => {
      const id = input.getAttribute('id');
      const name = input.getAttribute('name');
      
      // Buscar el valor en el objeto usando id o name como clave
      const value = dataObject[id] || dataObject[name];
      
      if (value !== undefined) {
        input.setInputValues(value);
      }
    });
  }
  function getAllInputValues() {
    const allData = {};
    const inputs = document.querySelectorAll('custom-input');
    
    inputs.forEach((input) => {
      const id = input.getAttribute('id');
      const value = input.getInputValues();
      allData[id] = value;
    });
    
    return allData;
  }