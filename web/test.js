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
            margin: 5px 0;
            color-scheme: light dark;
          }
          
          .input-container {
            display: flex;
            flex-direction: column;
            padding: 5px;
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