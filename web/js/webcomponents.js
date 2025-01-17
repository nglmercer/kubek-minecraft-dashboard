class CustomDialog extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      
      // Initialize properties
      this._title = '';
      this._description = '';
      this._options = [];
      this._theme = 'light';
      
      this.render();
    }
  
    static get observedAttributes() {
      return ['title', 'description', 'theme'];
    }
  
    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue) {
        switch (name) {
          case 'title':
            this._title = newValue;
            break;
          case 'description':
            this._description = newValue;
            break;
          case 'theme':
            this._theme = newValue;
            break;
        }
        this.render();
      }
    }
  
    // Getter/Setter for options
    get options() {
      return this._options;
    }
  
    set options(value) {
      this._options = value;
      this.render();
    }
  
    createStyles() {
      return `
        :host {
          display: block;
          font-family: system-ui, -apple-system, sans-serif;
        }
  
        .container {
          padding: 1.5rem;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
  
        .container.light {
          background-color: #ffffff;
          color: #1a1a1a;
          border: 1px solid #e5e5e5;
        }
  
        .container.dark {
          background-color: #1a1a1a;
          color: #ffffff;
          border: 1px solid #333333;
        }
  
        .title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
  
        .description {
          margin: 0;
          font-size: 1rem;
          color: inherit;
          opacity: 0.8;
          margin-bottom: 1.5rem;
        }
  
        .options {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
  
        button {
          padding: 0.5rem 1rem;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }
  
        .light button {
          background-color: #f3f4f6;
          color: #1a1a1a;
        }
  
        .light button:hover {
          background-color: #e5e7eb;
        }
  
        .dark button {
          background-color: #374151;
          color: #ffffff;
        }
  
        .dark button:hover {
          background-color: #4b5563;
        }
      `;
    }
  
    render() {
      const content = `
        <style>
          ${this.createStyles()}
        </style>
        <div class="container ${this._theme}">
          <h2 class="title">${this._title}</h2>
          <p class="description">${this._description}</p>
          <div class="options">
            ${this._options.map((option, index) => `
              <button data-index="${index}">${option.label}</button>
            `).join('')}
          </div>
        </div>
      `;
  
      this.shadowRoot.innerHTML = content;
  
      // Add event listeners to buttons
      this.shadowRoot.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', (e) => {
          const index = parseInt(e.target.dataset.index);
          if (this._options[index] && this._options[index].callback) {
            this._options[index].callback();
          }
        });
      });
    }
  }
  
  customElements.define('custom-dialog', CustomDialog);
  class DialogContainer extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      
      // Estado inicial
      this._isVisible = false;
      this._content = null;
      
      this.render();
    }
  
    static get observedAttributes() {
      return ['visible'];
    }
  
    attributeChangedCallback(name, oldValue, newValue) {
      if (name === 'visible') {
        this._isVisible = newValue !== null;
        this.updateVisibility();
      }
    }
  
    // Métodos públicos para mostrar/ocultar
    show() {
      this._isVisible = true;
      this.setAttribute('visible', '');
      this.updateVisibility();
    }
  
    hide() {
      this._isVisible = false;
      this.removeAttribute('visible');
      this.updateVisibility();
    }
  
    // Método para insertar contenido
    setContent(element) {
      this._content = element;
      this.render();
    }
  
    createStyles() {
      return `
        :host {
          display: block;
          position: relative;
        }
        .dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }
        .dialog-overlay.visible {
          opacity: 1;
          visibility: visible;
        }
        .dialog-content {
          transform: scale(0.95);
          transition: transform 0.3s ease;
        }
        .dialog-overlay.visible .dialog-content {
          transform: scale(1);
        }
      `;
    }
  
    updateVisibility() {
      const overlay = this.shadowRoot.querySelector('.dialog-overlay');
      if (overlay) {
        if (this._isVisible) {
          overlay.classList.add('visible');
        } else {
          overlay.classList.remove('visible');
        }
      }
    }
  
    render() {
      const content = `
        <style>
          ${this.createStyles()}
        </style>
        <div class="dialog-overlay ${this._isVisible ? 'visible' : ''}">
          <div class="dialog-content">
            <slot></slot>
          </div>
        </div>
      `;
      
      this.shadowRoot.innerHTML = content;
  
      // Agregar evento para cerrar al hacer clic fuera
      const overlay = this.shadowRoot.querySelector('.dialog-overlay');
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.hide();
        }
      });
    }
  }
  customElements.define('dialog-container', DialogContainer);
/*   const dialog = document.querySelector('custom-dialog');
  dialog.options = [
    {
      label: 'Aceptar',
      callback: () => {
    togglecontent()
      }
    },
    {
      label: 'Cancelar',
          callback: () => {
    togglecontent()
      }
    }
  ];
  
    const dialogContainer = document.getElementById('myDialog');
  dialogContainer.show()
  function togglecontent() {
      const dialogContainer = document.getElementById('myDialog');
          dialogContainer.hide()
      setTimeout(()=>{
            dialogContainer.show()
      },1000)
  } */
      if (!customElements.get('custom-input')) {
        class CustomInput extends HTMLElement {
          constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this.handleInputChange = this.handleInputChange.bind(this);
          }
      
          static get observedAttributes() {
            return ['type', 'id', 'name', 'value', 'placeholder', 'disabled', 'readonly', 'darkmode', 'options'];
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
              
              input, textarea, select {
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
              input:disabled, textarea:disabled, select:disabled {
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
              
              input:focus, textarea:focus, select:focus {
                outline: none;
                border-color: #2196F3;
                box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
              }
            `;
          }
      
          connectedCallback() {
            this.render();
            const input = this.shadowRoot.querySelector('input, textarea, select');
            if (input) {
              input.addEventListener('input', this.handleInputChange);
              input.addEventListener('change', this.handleInputChange);
            }
          }
      
          disconnectedCallback() {
            const input = this.shadowRoot.querySelector('input, textarea, select');
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
            const options = this.getAttribute('options') || '[]';
      
            this.shadowRoot.innerHTML = `
              <style>${this.getStyles()}</style>
              <div class="input-container">
                ${this.renderInput(type, id, name, value, placeholder, disabled, readonly, options)}
              </div>
            `;
      
            // Reattach event listeners after rendering
            const input = this.shadowRoot.querySelector('input, textarea, select');
            if (input) {
              input.addEventListener('input', this.handleInputChange);
              input.addEventListener('change', this.handleInputChange);
            }
          }
      
          renderInput(type, id, name, value, placeholder, disabled, readonly, options) {
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
              
              case 'select':
                const optionsArray = JSON.parse(options);
                return `
                  <select
                    id="${id}"
                    name="${name}"
                    ${disabled ? 'disabled' : ''}
                    ${readonly ? 'readonly' : ''}
                  >
                    ${optionsArray.map(option => `
                      <option value="${option.value}" ${option.value === value ? 'selected' : ''}>
                        ${option.image ? `<img src="${option.image}" alt="${option.label}" style="vertical-align: middle; margin-right: 5px;">` : ''}
                        ${option.label}
                      </option>
                    `).join('')}
                  </select>
                `;
              
              case 'radio':
                const radioOptions = JSON.parse(options);
                return radioOptions.map(option => `
                  <label>
                    <input
                      type="radio"
                      id="${id}"
                      name="${name}"
                      value="${option.value}"
                      ${option.value === value ? 'checked' : ''}
                      ${disabled ? 'disabled' : ''}
                      ${readonly ? 'readonly' : ''}
                    >
                    ${option.label}
                  </label>
                `).join('');
              
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
            const input = this.shadowRoot.querySelector('input, textarea, select');
            if (!input) return null;
          
            if (input.type === 'checkbox') {
              return input.checked;
            }
            
            if (input.tagName.toLowerCase() === 'textarea') {
              return input.value.split('\n');
            }
          
            if (input.tagName.toLowerCase() === 'select') {
              return input.value;
            }
          
            if (input.type === 'radio') {
              const selectedRadio = this.shadowRoot.querySelector(`input[name="${input.name}"]:checked`);
              return selectedRadio ? selectedRadio.value : null;
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
            const input = this.shadowRoot.querySelector('input, textarea, select');
            if (!input) return;
          
            if (input.type === 'checkbox') {
              input.checked = Boolean(value);
            } else if (Array.isArray(value) && input.tagName.toLowerCase() === 'textarea') {
              input.value = value.join('\n');
            } else if (input.tagName.toLowerCase() === 'select') {
              input.value = value;
            } else if (input.type === 'radio') {
              const radioToSelect = this.shadowRoot.querySelector(`input[name="${input.name}"][value="${value}"]`);
              if (radioToSelect) {
                radioToSelect.checked = true;
              }
            } else {
              input.value = value;
            }
          
            // Dispatch event when setting values programmatically
            this.handleInputChange();
          }
      
          resetInputValues() {
            const input = this.shadowRoot.querySelector('input, textarea, select');
            if (!input) return;
      
            if (input.type === 'checkbox') {
              input.checked = false;
            } else {
              input.value = '';
            }
      
            // Dispatch event when resetting values
            this.handleInputChange();
          }
      
          setOptions(options) {
            if (this.getAttribute('type') === 'select') {
              this.setAttribute('options', JSON.stringify(options));
              this.render();
            }
          }
      
          getSelectedOption() {
            if (this.getAttribute('type') === 'select') {
              const select = this.shadowRoot.querySelector('select');
              return select ? select.value : null;
            }
            return null;
          }
        }
      
        customElements.define('custom-input', CustomInput);
      }
      class ServerPropertiesElement extends HTMLElement {
        static get observedAttributes() {
            return ['server-id'];
        }
    
        constructor() {
            super();
            this.SWITCH_ELEMENT = '<label class="switch"> <input type="checkbox"$0> <span class="slider round"></span></label>';
            this.NUMBER_INPUT = "<input type='number' value='$0'>";
            this.TEXT_INPUT = "<input type='text' value='$0'>";
            
            // Store original types mapping
            this.propertyTypes = new Map();
            
            // Create shadow DOM
            this.attachShadow({ mode: 'open' });
            
            // Add styles
            this.shadowRoot.innerHTML = `
                <style>
                ${this.getStyles()}
                </style>
                <table id="sp-table"></table>
                <button id="save-btn" class="primary-btn hidden">Save Properties</button>
            `;
        }
        getStyles() {
            return `
            :host {
                width: 100%;
                border-radius: 8px;
                box-sizing: border-box;
                color-scheme: light dark;
            }
                .hidden {
                    display: none;
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
                        background-color: #ccc;
                        transition: .4s;
                    }
                    
                    .slider:before {
                        position: absolute;
                        content: "";
                        height: 26px;
                        width: 26px;
                        left: 4px;
                        bottom: 4px;
                        background-color: white;
                        transition: .4s;
                    }
                    
                    input:checked + .slider {
                        background-color: #2196F3;
                    }
                    
                    input:checked + .slider:before {
                        transform: translateX(26px);
                    }
                    
                    .slider.round {
                        border-radius: 34px;
                    }
                    
                    .slider.round:before {
                        border-radius: 50%;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        table-layout: fixed;
                        border: 1px solid rgb(46, 62, 83, 0.5);
                    }
                    
                    td {
                        padding: 8px;
                        border: 1px solid rgb(46, 62, 83, 0.5);
                    }
                    
                    input[type="text"], input[type="number"] {
                        width: auto;
                        padding: 6px;
                        box-sizing: border-box;
                    }
                        `;
        }
        connectedCallback() {
            this.loadProperties();
            this.shadowRoot.querySelector('#save-btn').addEventListener('click', () => this.emitPropertiesChange());
        }
    
        getValueType(value) {
            if (value === null) {
                return "null";
            }
            const type = typeof value;
            if (type === "boolean" || type === "number") {
                return type;
            }
            return "string";
        }
    
        parseValueByType(value, type) {
            switch (type) {
                case "null":
                    return null;
                case "boolean":
                    return value === "true" || value === true;
                case "number":
                    const num = Number(value);
                    return isNaN(num) ? 0 : num;
                default:
                    return String(value);
            }
        }
    
        async loadProperties() {
            const serverId = this.getAttribute('server-id') || selectedServer;
            try {
                const url = `/api/servers/${serverId}/server.properties`;
                const response = await fetch(url);
                const result = await response.json();
                console.log("result", result, response);
                
                const table = this.shadowRoot.querySelector('#sp-table');
                table.innerHTML = ''; // Clear existing content
                
                for (const [key, value] of Object.entries(result)) {
                    // Store original type
                    const originalType = this.getValueType(value);
                    this.propertyTypes.set(key, originalType);
    
                    // Handle display value
                    let displayValue = value;
                    if (originalType === "null") {
                        displayValue = "";
                    }
    
                    // Override specific property types
                    if (key === "server-ip") {
                        this.propertyTypes.set(key, "string");
                    }
    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${key}</td>
                        <td>${this.createInput(this.propertyTypes.get(key), displayValue)}</td>
                    `;
                    // Store type information in the row
                    row.dataset.propertyType = this.propertyTypes.get(key);
                    table.appendChild(row);
                }
                
            } catch (error) {
                console.error('Error loading properties:', error);
            }
        }
    
        createInput(type, value) {
            switch (type) {
                case "boolean":
                    const isChecked = value === true ? " checked" : "";
                    return this.SWITCH_ELEMENT.replace("$0", isChecked);
                case "number":
                    return this.NUMBER_INPUT.replace("$0", value);
                case "null":
                    return this.TEXT_INPUT.replace("$0", "");
                default:
                    return this.TEXT_INPUT.replace("$0", value);
            }
        }
    
        async getPropertiesToSave() {
            const serverId = this.getAttribute('server-id');
            const saveResult = {};
            
            this.shadowRoot.querySelectorAll('#sp-table tr').forEach(row => {
                const key = row.cells[0].textContent;
                const inputCell = row.cells[1];
                const originalType = this.propertyTypes.get(key);
                
                let rawValue;
                const checkbox = inputCell.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    rawValue = checkbox.checked;
                } else {
                    rawValue = inputCell.querySelector('input').value;
                }
    
                // Parse value according to its original type
                saveResult[key] = this.parseValueByType(rawValue, originalType);
            });
            const data = {
                server: serverId,
                result: saveResult
            }
            return data;
    
        }
        async emitPropertiesChange() {
            const data = await this.getPropertiesToSave();
            console.log("result", data);
            try {
                if (Object.keys(data).length === 0) {
                    console.log("saveResult is empty");
                    return;
                }
    
                this.dispatchEvent(new CustomEvent('save-success', {
                    bubbles: true,
                    composed: true,
                    detail: data,
                }));
            } catch (error) {
                console.error('Error saving properties:', error);
            }
        }
    }
    // Register the custom element
    customElements.define('server-properties', ServerPropertiesElement);
    // Define el componente personalizado
    class SystemMonitor extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
        }
    
        connectedCallback() {
            this.render();
        }
    
        render() {
            this.shadowRoot.innerHTML = `
                <style>
                    :host {
                        display: block;
                        font-family: Arial, sans-serif;
                        word-wrap: break-word;
                    }
    
                    @media (prefers-color-scheme: dark) {
                        :host {
                            color: #e0e0e0;
                            background-color: #1a1a1a;
                        }
                        table {
                            border-color: #404040;
                        }
                        th, td {
                            border-color: #404040;
                        }
                        th {
                            background-color: #2a2a2a;
                        }
                    }
    
                    @media (prefers-color-scheme: light) {
                        :host {
                            color: #1a1a1a;
                            background-color: #ffffff;
                        }
                        table {
                            border-color: #ddd;
                        }
                        th, td {
                            border-color: #ddd;
                        }
                        th {
                            background-color: #f5f5f5;
                        }
                    }
    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 10px 0;
                        table-layout: fixed;
                    }
    
                    th, td {
                        padding: 8px;
                        border: 1px solid;
                        text-align: left;
                    }
    
                    td {
                        word-break: break-word;
                        overflow-wrap: break-word;
                        hyphens: auto;
                    }
    
                    #enviroment-table td {
                        white-space: pre-wrap;
                        word-wrap: break-word;
                        max-width: 0;
                    }
    
                    .system-info p {
                        margin: 8px 0;
                    }
    
                    sup {
                        font-size: 0.75em;
                    }
                </style>
                <div class="system-monitor">
                    <div class="system-info">
                        <h3>Sistema Operativo</h3>
                        <p>Nombre: <span id="os-name"></span></p>
                        <p>Build: <span id="os-build"></span></p>
                        <p>RAM Total: <span id="total-ram"></span></p>
                        <p>Tiempo Activo: <span id="kubek-uptime"></span></p>
                        <p>CPU: <span id="cpu-model"></span></p>
                        <p>Velocidad CPU: <span id="cpu-speed"></span></p>
                    </div>
                    
                    <h3>Variables de Entorno</h3>
                    <table id="enviroment-table">
                        <colgroup>
                            <col style="width: 30%">
                            <col style="width: 70%">
                        </colgroup>
                    </table>
                    
                    <h3>Interfaces de Red</h3>
                    <table id="networks-table">
                        <colgroup>
                            <col style="width: 30%">
                            <col style="width: 70%">
                        </colgroup>
                    </table>
                    
                    <h3>Discos</h3>
                    <table id="disks-table">
                        <colgroup>
                            <col style="width: 20%">
                            <col style="width: 20%">
                            <col style="width: 20%">
                            <col style="width: 20%">
                            <col style="width: 20%">
                        </colgroup>
                        <tr>
                            <th>Unidad</th>
                            <th>Usado</th>
                            <th>Libre</th>
                            <th>Total</th>
                            <th>Porcentaje</th>
                        </tr>
                    </table>
                </div>
            `;
        }
    
        renderdata(data) {
            const getElement = (id) => this.shadowRoot.querySelector(`#${id}`);
    
            // Procesar variables de entorno
            const envTable = getElement('enviroment-table');
            for (const [key, value] of Object.entries(data.enviroment)) {
                const row = document.createElement('tr');
                row.innerHTML = `<th>${key}</th><td>${value}</td>`;
                envTable.appendChild(row);
            }
    
            // Procesar interfaces de red
            const networkTable = getElement('networks-table');
            for (const [key, value] of Object.entries(data.networkInterfaces)) {
                const ips = value.map(inner => 
                    `<span>${inner.address} <sup>${inner.family}</sup></span>`
                ).join('<br>');
                
                const row = document.createElement('tr');
                row.innerHTML = `<th>${key}</th><td>${ips}</td>`;
                networkTable.appendChild(row);
            }
    
            // Procesar discos
            const disksTable = getElement('disks-table');
            data.disks.forEach(disk => {
                let { _mounted: letter, _blocks: total, _used: used, 
                      _available: free, _capacity: percent } = disk;
    
                if (data.platform.name === "Linux") {
                    total *= 1024;
                    used *= 1024;
                    free *= 1024;
                }
    
                const row = document.createElement('tr');
                row.innerHTML = `
                    <th>${letter}</th>
                    <td>${KubekUtils.humanizeFileSize(used)}</td>
                    <td>${KubekUtils.humanizeFileSize(free)}</td>
                    <td>${KubekUtils.humanizeFileSize(total)}</td>
                    <td>${percent}</td>
                `;
                disksTable.appendChild(row);
            });
    
            // Actualizar información del sistema
            getElement('os-name').innerHTML = 
                `${data.platform.version} <sup>${data.platform.arch}</sup>`;
            getElement('os-build').textContent = data.platform.release;
            getElement('total-ram').textContent = `${data.totalmem} Mb`;
            getElement('kubek-uptime').textContent = 
                KubekUtils.humanizeSeconds(data.uptime);
            getElement('cpu-model').textContent = 
                `${data.cpu.model} (${data.cpu.cores} cores)`;
            getElement('cpu-speed').textContent = `${data.cpu.speed} MHz`;
        }
    }

// Registrar el componente
customElements.define('system-monitor', SystemMonitor);