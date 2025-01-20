class GameConsole extends HTMLElement {
  constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.obfuscators = {};
      this.alreadyParsed = [];
      this.currId = 0;
      this.isItFirstLogRefresh = false;
      this.previousConsoleUpdateLength = 0;
      
      // Estilos para códigos Minecraft
      this.styleMap = {
          '§0': 'color:#000000',
          '§1': 'color:#0000AA',
          '§2': 'color:#00AA00',
          '§3': 'color:#00AAAA',
          '§4': 'color:#AA0000',
          '§5': 'color:#AA00AA',
          '§6': 'color:#FFAA00',
          '§7': 'color:#AAAAAA',
          '§8': 'color:#555555',
          '§9': 'color:#5555FF',
          '§a': 'color:#55FF55',
          '§b': 'color:#55FFFF',
          '§c': 'color:#FF5555',
          '§d': 'color:#FF55FF',
          '§e': 'color:#FFFF55',
          '§f': 'color:#FFFFFF',
          '§l': 'font-weight:bold',
          '§m': 'text-decoration:line-through',
          '§n': 'text-decoration:underline',
          '§o': 'font-style:italic'
      };
  }

  connectedCallback() {
      this.render();
  }

  getStyles() {
      return `
          .console-layout {
              width: 100%;
              height: 100%;
              min-height: 300px;
              background: var(--bg-darker);
              border-radius: 8px;
              box-sizing: border-box;
          }

          .console {
              width: 100%;
              height: 100%;
              max-height: 500px;
              overflow-y: auto;
              font-family: 'Consolas', 'Monaco', monospace;
              font-size: 14px;
              line-height: 1.5;
              color: var(--text-primary);
              padding-right: 8px;
              scroll-behavior: smooth;
          }

          .console::-webkit-scrollbar {
              width: 8px;
          }

          .console::-webkit-scrollbar-track {
              background: var(--bg-darker);
              border-radius: 4px;
          }

          .console::-webkit-scrollbar-thumb {
              background: var(--bg-dark-accent);
              border-radius: 4px;
          }

          .console::-webkit-scrollbar-thumb:hover {
              background: var(--bg-dark-accent-lighter);
          }`;
  }

  render() {
      this.shadowRoot.innerHTML = `
          <style>${this.getStyles()}</style>
          <div class="console-layout">
              <div class="console" id="console-text"></div>
          </div>
      `;
  }

  // Minecraft Parser Implementation
  obfuscate(elem, string) {
      const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
      
      const replaceRand = (str, i) => {
          const randChar = String.fromCharCode(randInt(64, 95));
          return str.substr(0, i) + randChar + str.substr(i + 1, str.length);
      };

      const initMagic = (el, str) => {
          let i = 0;
          const obsStr = str || el.innerHTML;
          const strLen = obsStr.length;
          
          if (!strLen) return;
          
          if (!this.obfuscators[this.currId]) {
              this.obfuscators[this.currId] = [];
          }

          this.obfuscators[this.currId].push(
              window.setInterval(() => {
                  if (i >= strLen) i = 0;
                  let newStr = replaceRand(obsStr, i);
                  el.innerHTML = newStr;
                  i++;
              }, 0)
          );
      };

      if (string.indexOf('<br>') > -1) {
          elem.innerHTML = string;
          const listLen = elem.childNodes.length;
          
          for (let nodeI = 0; nodeI < listLen; nodeI++) {
              const currNode = elem.childNodes[nodeI];
              if (currNode.nodeType === 3) {
                  const multiMagic = document.createElement('span');
                  multiMagic.innerHTML = currNode.nodeValue;
                  elem.replaceChild(multiMagic, currNode);
                  initMagic(multiMagic);
              }
          }
      } else {
          initMagic(elem, string);
      }
  }

  applyCode(string, codes) {
      const elem = document.createElement('span');
      let obfuscated = false;

      string = string.replace(/\x00/g, '');

      codes.forEach(code => {
          if (this.styleMap[code]) {
              elem.style.cssText += this.styleMap[code] + ';';
          }
          if (code === '§k') {
              this.obfuscate(elem, string);
              obfuscated = true;
          }
      });

      if (!obfuscated) {
          elem.innerHTML = string;
      }

      return elem;
  }

  mineParse(string) {
      const finalPre = document.createElement('pre');
      const codes = string.match(/§.{1}/g) || [];
      const indexes = [];
      let apply = [];

      if (!this.obfuscators[this.currId]) {
          this.obfuscators[this.currId] = [];
      }

      string = string.replace(/\n|\\n/g, '<br>');

      // Get indexes of all codes
      codes.forEach((code, i) => {
          indexes.push(string.indexOf(code));
          string = string.replace(code, '\x00\x00');
      });

      // Handle text before first code
      if (indexes[0] !== 0) {
          finalPre.appendChild(this.applyCode(string.substring(0, indexes[0]), []));
      }

      // Process codes and text
      for (let i = 0; i < codes.length; i++) {
          let indexDelta = indexes[i + 1] - indexes[i];
          
          if (indexDelta === 2) {
              while (indexDelta === 2) {
                  apply.push(codes[i]);
                  i++;
                  indexDelta = indexes[i + 1] - indexes[i];
              }
              apply.push(codes[i]);
          } else {
              apply.push(codes[i]);
          }

          if (apply.lastIndexOf('§r') > -1) {
              apply = apply.slice(apply.lastIndexOf('§r') + 1);
          }

          const strSlice = string.substring(indexes[i], indexes[i + 1]);
          finalPre.appendChild(this.applyCode(strSlice, apply));
      }

      this.alreadyParsed.push(finalPre);
      this.currId++;

      return {
          parsed: finalPre,
          raw: finalPre.innerHTML
      };
  }

  clearObfuscators(id) {
      if (this.obfuscators[id]) {
          this.obfuscators[id].forEach(interval => {
              clearInterval(interval);
          });
          this.alreadyParsed[id] = [];
          this.obfuscators[id] = [];
      }
  }

  refreshConsoleLog(serverLog) {
      const consoleTextElem = this.shadowRoot.querySelector('#console-text');
      if (!consoleTextElem) return;

      if (serverLog.length === this.previousConsoleUpdateLength) {
          return;
      }

      this.previousConsoleUpdateLength = serverLog.length;
      const parsedServerLog = serverLog.split(/\r?\n/);
      consoleTextElem.innerHTML = '';

      parsedServerLog.forEach(line => {
          let html_text = '';
          const parsedText = this.parseANSI(this.linkify(this.mineParse(line).raw));

          if (parsedText.length > 1) {
              let joinedLine = '';
              parsedText.forEach(item => {
                  let resultText = "<span style='";
                  if (item.bold) {
                      resultText += "font-weight:bold;";
                  }
                  if (item.foreground && item.bold) {
                      resultText += `color:${item.foreground};`;
                  }
                  resultText += `'>${item.text}</span>`;
                  joinedLine += resultText;
              });
              html_text += joinedLine + '<br>';
          } else {
              html_text += parsedText[0].text + '<br>';
          }

          consoleTextElem.innerHTML += html_text;
      });

      // Handle scrolling
      const scrollHeight = consoleTextElem.scrollHeight - Math.round(consoleTextElem.clientHeight) - 24;
      if (!this.isItFirstLogRefresh) {
          this.isItFirstLogRefresh = true;
          consoleTextElem.scrollTop = scrollHeight;
      } else if ((scrollHeight - consoleTextElem.scrollTop) < 200) {
          consoleTextElem.scrollTop = scrollHeight;
      }
  }

  parseANSI(text) {
      // Implementación básica - puedes expandirla según tus necesidades
      return [{ text, bold: false }];
  }

  linkify(text) {
      // Implementación básica - puedes expandirla según tus necesidades
      return text;
  }
}

// Registrar el componente
customElements.define('game-console', GameConsole);
class inputCommand extends HTMLElement {
  constructor() {
      super();
      this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
      this.render();
      this.setupEventListeners();
  }
  getstyles() {
      return `
      :host {
      width: 100%;
      border-radius: 8px;
      box-sizing: border-box;
      border: 1px solid #333;
      font-family: 'Material Symbols Rounded';
      }
.material-symbols-outlined {
font-variation-settings:
'FILL' 0,
'wght' 400,
'GRAD' 0,
'opsz' 24
}
.input {
  display: flex;
  gap: 8px;
  width: 100%;
  padding: 8px;
  background: var(--bg-darker);
  border-radius: 8px;
  box-sizing: border-box;
}

#cmd-input {
  flex: 1;
  background: var(--bg-dark);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px 12px;
  color: var(--text-primary);
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
}

#cmd-input:focus {
  border-color: var(--primary-color);
}

#cmd-input::placeholder {
  color: var(--text-secondary);
}

.dark-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-dark);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.dark-btn:hover {
  background: var(--bg-dark-accent);
  border-color: var(--primary-color);
}

.dark-btn .material-symbols-rounded {
  font-size: 20px;
}

.icon-only {
  width: 36px;
  height: 36px;
  padding: 0;
}`;
  }
  render() {
      this.shadowRoot.innerHTML = `
          <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
      <style>${this.getstyles()}</style>
      <div class="input">
          <input type="text" id="cmd-input" placeholder="Enter command"/>
          <button class="dark-btn icon-only">
              <span class="material-symbols-outlined">
              send
              </span>
          </button>
      </div>
      `;
  }
  setupEventListeners() {
      const button = this.shadowRoot.querySelector('button');
      const input = this.shadowRoot.querySelector('#cmd-input');

      button.addEventListener('click', () => {
          this.sendCommand();
      });

      input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
              this.sendCommand();
          }
      });
  }
  
  sendCommand() {
      const input = this.shadowRoot.querySelector('#cmd-input');
      const command = input.value;
      if (command) {
          // Dispatch custom event for command sending
          this.dispatchEvent(new CustomEvent('command', {
              detail: { command },
              bubbles: true,
              composed: true
          }));
          input.value = '';
      }
  }
}
customElements.define('input-command', inputCommand);

class CustomDialog extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open', delegatesFocus: true });
      
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
          background-color: inherit;
          background: inherit;
          color: inherit;
        }
  
        .container {
          padding: 1.5rem;
          border-radius: 8px;
          transition: all 0.3s ease;
          border: inherit;
          background: inherit;
          background-color: inherit;
          color: inherit;
        }
  
        .container.light {
          color: #1a1a1a;
          border-color: #e5e5e5;
        }
  
        .container.dark {
          color: #ffffff;
          border-color: #333333;
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
        button {
          color: inherit;
          background-color: inherit;
        }
        button:hover {
          background-color: inherit;
        }
  
        .save-btn {
          background-color: #007bff;
          color: white;
        }
        .save-btn:hover {
          background-color: #0056b3;
        }
        .cancel-btn {
          background-color: #e5e5e5;
          color: black;
        }
        .cancel-btn:hover {
          background-color: #0056b3;
        }
        .save-btn:hover {
          background-color: #0056b3;
        }
        .delete-btn {
          background-color: #dc3545;
          color: white;
        }
        .delete-btn:hover { 
          background-color: #bd2130;
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
              <button data-index="${index}" style="${option.style || ''}" class="${option.class || ''}">${option.label}</button>
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
      this.attachShadow({ mode: 'open', delegatesFocus: true });
      
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
          background: inherit;
          background-color: inherit;
          color: inherit;
          border-radius: inherit;
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
          /*blur effect*/
          backdrop-filter: blur(4px);
        }
        .dialog-overlay.visible {
          opacity: 1;
          visibility: visible;
        }
        .dialog-content {
          transform: scale(0.95);
          transition: transform 0.3s ease;
          max-height: 90dvh;
          overflow-y: auto;
          background: inherit;
          background-color: inherit;
          color: inherit;
          border-radius: inherit;
          border-radius: 16px;
          padding: inherit;
          margin: inherit;
          padding: 8px;
        }
        .dialog-overlay.visible .dialog-content {
          transform: scale(1);
        }
        .header .avatar {
            grid-area: avatar;
            width: 64px;
            height: 64px;
            background: var(--bg-dark-accent-light);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .header .username {
            align-self: center;
            grid-area: username;
            font-size: 16pt;
            font-weight: 600;
        }

        .header .email {
            align-self: center;
            grid-area: email;
            font-size: 12pt;
            font-weight: 400;
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
      if (!customElements.get('language-selector')) {
      class LanguageSelector extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: 'open' });
          this._langs = [];
          this._selectedLang = null;
          
          this.shadowRoot.innerHTML = `
            <style>
              :host {
                display: block;
                background-color: rgb(34, 44, 58);
                color: rgb(255, 255, 255);
                padding: 8px;
                border-radius: 8px;
                font-family: Arial, sans-serif;
              }
              .lang-list {
                list-style: none;
                padding: 0;
                margin: 0;
                display: flex;
                flex-direction: column;
              }
              .lang-item {
                padding: 14px;
                gap: 8px;
                cursor: pointer;
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                border-radius: 8px;
                background-color: rgb(46, 62, 83);
                color: rgb(255, 255, 255);
              }
              .lang-item:hover {
                background-color: rgba(255, 255, 255, 0.1);
              }
              .lang-item.selected {
                background-color: rgba(50, 213, 131, 0.1);
                color: rgb(50, 213, 131);
              }
              .author {
                font-size: 14px;
                color: rgb(104, 121, 138);
                margin-left: auto;
              }
              .display-name-english {
                color: rgb(104, 121, 138);
              }
            </style>
            <ul class="lang-list"></ul>
          `;
        }
      
        static get observedAttributes() {
          return ['selected'];
        }
      
        get langs() {
          return this._langs;
        }
      
        set langs(value) {
          this._langs = value;
          this.render();
        }
      
        get selected() {
          return this._selectedLang;
        }
      
        set selected(value) {
          if (this._selectedLang !== value) {
            this._selectedLang = value;
            this.dispatchEvent(new CustomEvent('language-change', {
              detail: {
                langCode: value,
                language: this._langs.find(lang => lang.code === value)
              },
              bubbles: true,
              composed: true
            }));
            this.render();
          }
        }
      
        attributeChangedCallback(name, oldValue, newValue) {
          if (name === 'selected' && oldValue !== newValue) {
            this.selected = newValue;
          }
        }
      
        render() {
          const list = this.shadowRoot.querySelector('.lang-list');
          list.innerHTML = '';
          console.log('Rendering languages:', this._langs);
          if (!this._langs.length) {
            return;
          }
          this._langs.forEach(lang => {
            const li = document.createElement('li');
            li.className = `lang-item ${lang.code === this._selectedLang ? 'selected' : ''}`;
            li.innerHTML = `
              <span class="display-name">${lang.displayName}</span>
              <span class="display-name-english">${lang.displayNameEnglish}</span>
              <span class="author">by ${lang.author}</span>
            `;
            li.addEventListener('click', () => {
              this.selected = lang.code;
            });
            list.appendChild(li);
          });
        }
      }
      
      customElements.define('language-selector', LanguageSelector);
      }
      if (!customElements.get('custom-input')) {
        class CustomInput extends HTMLElement {
          constructor() {
            super();
            this.attachShadow({ mode: 'open', delegatesFocus: true });
            this.handleInputChange = this.handleInputChange.bind(this);
          }
      
          static get observedAttributes() {
            return ['type', 'id', 'name', 'value', 'placeholder', 'disabled', 'readonly', 'darkmode', 'options', 'required', 'title', 'pattern'];
          }
      
          getStyles() {
            const darkMode = this.hasAttribute('darkmode');
      
            return `
              :host {
                display: block;
                margin: inherit;
                color-scheme: light dark;
                margin: 0.5rem;
                padding: 0.5rem;
              }
              
              .input-container {
                display: flex;
                flex-direction: column;
                padding: inherit;
              }
              
              input, textarea, select {
                padding: inherit;
                padding: 0.5rem;  /* Valor de respaldo si no se hereda */
                border: inherit;
                border-color: ${darkMode ? '#555' : '#ccc'};
                border-radius: 4px;
                font-size: 14px;
                background-color: inherit;
                color: inherit;
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
                height: 30px;
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
                height: 22px;
                width: 22px;
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
                transform: translateX(28px);
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
            // Corregimos el manejo del evento submit
            const form = this.shadowRoot.querySelectorAll('form');
          }
        
          disconnectedCallback() {
            const input = this.shadowRoot.querySelector('input, textarea, select');
            if (input) {
              input.removeEventListener('input', this.handleInputChange);
              input.removeEventListener('change', this.handleInputChange);
            }
            // Limpiamos el evento submit
            const form = this.shadowRoot.querySelector('#validate-form');
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
          handleSubmit(e) {
            e.preventDefault(); // Prevenimos la recarga de la página
            
            // Validamos el formulario
            const form = e.target;
            const isValid = form.checkValidity();
            
            if (isValid) {
              // Disparamos un evento personalizado con los datos del formulario
              this.dispatchEvent(new CustomEvent('form-submit', {
                detail: {
                  id: this.getAttribute('id'),
                  name: this.getAttribute('name'),
                  value: this.getInputValues()
                },
                bubbles: true,
                composed: true
              }));
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
            const required = this.hasAttribute('required') ? 'required' : '';
            const title = this.getAttribute('title') || '';
            const pattern = this.getAttribute('pattern') || '';
            const allarguments = { type, id, name, value, placeholder, disabled, readonly, options, required, title, pattern };
            this.shadowRoot.innerHTML = `
              <style>${this.getStyles()}</style>
              <form id="validate-form">
                <div class="input-container">
                  ${this.renderInput(allarguments)}
                </div>
              </form>
            `;
      
            // Reattach event listeners after rendering
            const input = this.shadowRoot.querySelector('input, textarea, select');
            if (input) {
              input.addEventListener('input', this.handleInputChange);
              input.addEventListener('change', this.handleInputChange);
            }
          }
      
          renderInput(allarguments) {
            const { type, id, name, value, placeholder, disabled, readonly, options, required, title, pattern } = allarguments;
            const requiredAttr = required ? 'required' : ''; // This will output just 'required' when needed
            
            switch (type) {
              case 'textarea':
                return `
                  <textarea
                    id="${id}"
                    name="${name}"
                    placeholder="${placeholder}"
                    ${disabled ? 'disabled' : ''}
                    ${readonly ? 'readonly' : ''}
                    ${requiredAttr}
                      ${title ? `title="${title}" oninvalid="this.setCustomValidity('${title}')" oninput="this.setCustomValidity('')"` : ''}
                      ${pattern ? `pattern="${pattern}"` : ''}
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
                      ${requiredAttr}
                      ${title ? `title="${title}" oninvalid="this.setCustomValidity('${title}')" oninput="this.setCustomValidity('')"` : ''}
                      ${pattern ? `pattern="${pattern}"` : ''}
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
                    ${required ? 'required' : ''}
                      ${title ? `title="${title}" oninvalid="this.setCustomValidity('${title}')" oninput="this.setCustomValidity('')"` : ''}
                      ${pattern ? `pattern="${pattern}"` : ''}
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
                      ${requiredAttr}
                      ${title ? `title="${title}" oninvalid="this.setCustomValidity('${title}')" oninput="this.setCustomValidity('')"` : ''}
                      ${pattern ? `pattern="${pattern}"` : ''}
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
              const value = input.value.trim();
              return value ? value.split('\n') : [];
            }
          
            if (input.tagName.toLowerCase() === 'select') {
              return input.value;
            }
          
            if (input.type === 'radio') {
              const selectedRadio = this.shadowRoot.querySelector(`input[name="${input.name}"]:checked`);
              return selectedRadio ? selectedRadio.value : null;
            }
          
            const inputvalue = this.parseValueByType(input);
            const validate_form = this.shadowRoot.querySelectorAll('form');
            if (validate_form) {
              validate_form.forEach(form => {
                const form_validity = form.reportValidity();
                if (!form_validity) {
                  form.classList.add('invalid');
                } else {
                  form.classList.remove('invalid');
                }
                console.log("form_validity", form_validity);
              });
            }

            return inputvalue;
          }
          getvalidation(){
            let isValid = false;
            const validate_form = this.shadowRoot.querySelectorAll('form');
            if (validate_form) {
              validate_form.forEach(form => {
                const form_validity = form.reportValidity();
                if (!form_validity) {
                  isValid = false;
                } else {
                  isValid = true;
                }
                console.log("form_validity", form_validity);
              });
            }
            return isValid;
          }
          parseValueByType(input) {
            const valueType = typeof input.value;
            const inputType = input.type;
            const value = input.value;
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
if (!customElements.get('kubek-plugins-ui')) {
    class KubekPluginsUIclass extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._elementList = [];
        this.render();
        this.setupEventListeners();
        this.type = "plugins";
      }
    
      addElement(element) {
        // Verificar si el elemento ya existe
        if (!this._elementList.includes(element)) {
          this._elementList.push(element);
          this.renderAllLists(this.type);
          return true; // Elemento añadido exitosamente
        }
        return false; // Elemento ya existe
      }
    
      // Nuevo método para eliminar un elemento específico
      removeElement(element) {
        const index = this._elementList.indexOf(element);
        if (index !== -1) {
          this._elementList.splice(index, 1);
          this.renderAllLists(this.type);
          return true; // Elemento eliminado exitosamente
        }
        return false; // Elemento no encontrado
      }
    
      get elements() {
        return this._elementList;
      }
    
      set elements(list) {
        this._elementList = list;
        this.renderList('elements-list', list, this.type);
      }
      connectedCallback() {
        this.renderAllLists();
      }
    
      render() {
        this.shadowRoot.innerHTML = `
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
          <style>
    
          :host {
          }
            button {
            appearance: none;
            outline: none;
            border: 0;
            padding: 12px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            display: flex
        ;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            font-size: 14pt;
            cursor: pointer;
          }
                button:hover {
            background: var(--bg-dark-accent-light);
          }
            .item {
              background: #222c3a;
              display: flex;
              align-items: center;
              padding-block: 1rem;
              padding-inline: 6px;
              justify-content: space-between;
              width: 100%;
              border-radius: 10px;
            }
            .switch {
              position: relative;
              display: inline-block;
              width: 60px;
              height: 28px;
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
              background-color: #e0e0e0;
              transition: .3s;
              border-radius: 34px;
            }
            .slider:before {
              position: absolute;
              content: "";
              height: 20px;
              width: 20px;
              left: 4px;
              bottom: 4px;
              background-color: white;
              transition: .3s;
              border-radius: 50%;
            }
            input:checked + .slider {
              background-color: #2196F3;
            }
            input:checked + .slider:before {
              transform: translateX(32px);
            }
            .dark-btn {
              background-color:transparent;
              color: white;
              border: none;
              padding: 5px 10px;
              cursor: pointer;
            }
              #elements-list {
                display: flex;
                flex-direction: column;
                width: 100%;
                gap: 10px;
                }
          </style>
          <div id="elements-list"></div>
        `;
      }
    
      setupEventListeners() {
        this.shadowRoot.addEventListener('change', this.handleToggle.bind(this));
        this.shadowRoot.addEventListener('click', this.handleDelete.bind(this));
      }
    
      createItemHTML(item, itemType) {
        const isEnabled = !item.endsWith('.dis');
        const displayName = item.replace('.jar', '').replace('.dis', '');
        console.log(displayName);
        return `
          <div class="item">
            <div class="item-container">
                    <label class="switch">
              <input 
                type="checkbox" 
                ${isEnabled ? 'checked' : ''} 
                data-item="${item}" 
                data-type="${itemType}"
              >
              <span class="slider round"></span>
            </label>
            <span class="filename">${displayName}</span>
            </div>
            <button 
              class="dark-btn icon-only" 
              data-item="${item}" 
              data-type="${itemType}"
            >
              <span class="material-symbols-outlined">
            delete
            </span>
            </button>
          </div>
        `;
      }
    
      renderList(containerId, items, type) {
        const container = this.shadowRoot.getElementById(containerId);
        const html = items.map(item => this.createItemHTML(item, type)).join('');
        container.innerHTML = html;
      }
    
      handleToggle(event) {
        if (!event.target.matches('input[type="checkbox"]')) return;
    
        const target = event.target;
        const item = target.dataset.item;
        const type = target.dataset.type;
        const isEnabled = target.checked;
        
        const newName = isEnabled ? 
          item.replace('.dis', '') : 
          `${item}${item.endsWith('.dis') ? '' : '.dis'}`;
    
        this.emitEvent('toggle', { item, type, newName });
      }
    
      handleDelete(event) {
        const button = event.target.closest('button.dark-btn');
        if (!button) return;
        
        this.emitEvent('delete', {
          item: button.dataset.item,
          type: button.dataset.type
        });
      }
    
      emitEvent(eventName, detail) {
        this.dispatchEvent(new CustomEvent(eventName, {
          detail,
          bubbles: true,
          composed: true
        }));
      }
    
      renderAllLists(type = "plugins") {
        this.renderList('elements-list', this.elements, type);
        this.setType(type);
      }
    
      setElementList(list) {
        this.elements = list;
      }
      setType(type){
        this.type = type;
      }
      
    }
    customElements.define('kubek-plugins-ui', KubekPluginsUIclass);
    }
    class CustomPopup extends HTMLElement {
      constructor() {
          super();
          this.attachShadow({ mode: 'open', delegatesFocus: true });
          this._options = [];
          this.container = document.createElement('div');
          this.lastFocusedElement = null;
          
          this.container.style.cssText = `
              position: fixed;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
              background-color: inherit;
              display: none;
              z-index: 1000;
              color-scheme: light dark;
              font-family: inherit;
              justify-content: center;
              align-items: stretch;
              flex-direction: column;
              min-width: inherit;
              width: 100%;
              max-width: 200px;
              border-radius: 4px;
              overflow: hidden;
          `;
      
          const style = document.createElement('style');
          style.textContent = `
              .material-symbols-rounded {
                  font-family: inherit;
                  font-size: 24px;
                  margin-right: 10px;
              }
              .popup-option {
                  cursor: pointer;
                  transition: background-color 0.2s;
                  display: flex;
                  align-items: center;
                  user-select: none;
              }
              .popup-option:hover {
                  background-color: rgba(0, 0, 0, 0.05);
              }
              .default-font {
                  font-family: Arial, sans-serif;
              }
              @media (prefers-color-scheme: dark) {
                  .popup-option:hover {
                      background-color: rgba(255, 255, 255, 0.1);
                  }
              }
          `;
      
          this.shadowRoot.appendChild(style);
          this.shadowRoot.appendChild(this.container);
          this.handleClickOutside = this.handleClickOutside.bind(this);
      }
  
      // Getter y setter para las opciones
      get options() {
          return this._options;
      }
  
      set options(newOptions) {
          this._options = newOptions;
          this.render();
      }
  
      // Método para agregar una única opción
      addOption(html, callback) {
          this._options.push({
              html,
              callback: (event) => {
                  callback(event);
                  this.hide();
              }
          });
          this.render();
          return this._options.length - 1; // Retorna el índice de la opción agregada
      }
  
      // Método para establecer múltiples opciones de una vez
      setOptions(options) {
          this._options = options.map(option => ({
              html: option.html,
              callback: (event) => {
                  option.callback(event);
                  this.hide();
              }
          }));
          this.render();
      }
  
      // Método para limpiar todas las opciones
      clearOptions() {
          this._options = [];
          this.render();
      }
  
      // Método para remover una opción específica por índice
      removeOption(index) {
          if (index >= 0 && index < this._options.length) {
              this._options.splice(index, 1);
              this.render();
              return true;
          }
          return false;
      }
  
      render() {
          this.container.innerHTML = '';
          this._options.forEach((option, index) => {
              const optionElement = document.createElement('div');
              optionElement.className = 'popup-option';
              optionElement.innerHTML = option.html;
              optionElement.addEventListener('click', option.callback);
              this.container.appendChild(optionElement);
          });
      }
  
      connectedCallback() {
          this.render();
      }
  
      handleClickOutside(event) {
          const path = event.composedPath();
          if (!path.includes(this.container) && !path.includes(this.lastFocusedElement)) {
              this.hide();
          }
      }
      
      show(x, y) {
          this.container.style.display = 'flex';
          if (x !== undefined && y !== undefined) {
              this.moveTo(x, y);
          }
          document.addEventListener('click', this.handleClickOutside);
      }
      
      hide() {
          this.container.style.display = 'none';
          document.removeEventListener('click', this.handleClickOutside);
      }
      
      moveTo(x, y) {
          const rect = this.container.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
      
          if (x + rect.width > viewportWidth) {
              x = viewportWidth - rect.width - 10;
          }
          if (y + rect.height > viewportHeight) {
              y = viewportHeight - rect.height - 10;
          }
          this.container.style.left = `${Math.max(0, x)}px`;
          this.container.style.top = `${Math.max(0, y)}px`;
      }
      
      showAtElement(element) {
          const rect = element.getBoundingClientRect();
          this.show(rect.left, rect.bottom);
          this.lastFocusedElement = element;
      }
      
      disconnectedCallback() {
          document.removeEventListener('click', this.handleClickOutside);
      }
  }
  
  // Registrar el componente
  customElements.define('custom-popup', CustomPopup);
class StatusElement extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    padding: 5px 10px;
                    border-radius: 5px;
                    color: white;
                    font-family: Arial, sans-serif;
                }
                .status {
                    display: grid;
                    grid-template-columns: 10px 1fr;
                    align-items: center;
                    gap: 5px;
                }
                .status-circle {
                    display: inline-block;
                    min-width: 10px;
                    min-height: 10px;
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    margin-right: 5px;
                }
                .status-text {
                    display: inline-block;
                }
            </style>
            <div class="status">
                <span class="status-circle"></span>
                <span class="status-text"></span>
            </div>
        `;
        this.statusCircle = this.shadowRoot.querySelector('.status-circle');
        this.statusText = this.shadowRoot.querySelector('.status-text');
    }

    static get observedAttributes() {
        return ['status'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'status') {
            this.updateStatus(newValue);
        }
    }

    updateStatus(status,statusString) {
        const statusText = status || 'Unknown';
        this.statusText.textContent = statusString || statusText;

        // Cambiar el color según el estado
        this.statusCircle.style.backgroundColor = this.getStatusColor(status);
    }

    getStatusColor(status) {
        switch (status) {
            case "STOPPING":
            case "STARTING":
            case "stopping":
            case "starting":
                return 'yellow';
            case "RUNNING":
            case "running":
                return 'green';
            case "STOPPED":
            case "stopped":
                return 'red';
            default:
                return 'gray';
        }
    }
}

customElements.define('status-element', StatusElement);
class DropdownComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open', delegatesFocus: true });
    
    // Initial render
    this.render();
    this.isHidden = false;
    // Bind methods
    this.toggleDropdown = this.toggleDropdown.bind(this);
  }
  
  static get observedAttributes() {
    return ['button-text', "hidden-button"];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'button-text') {
      this.render();
    } else if (name === 'hidden-button') {
      const button = this.shadowRoot.querySelector('button');
      if (newValue !== null) {
        button.style.display = 'none';
      } else {
        button.style.display = 'grid';
      }
    }
  }
  
  toggleDropdown() {
    const content = this.shadowRoot.querySelector('.dropdown-content');
    content.classList.toggle('active');
    const button =this.shadowRoot.querySelector('button')
    if (content.classList.contains('active')) {
      this.isHidden = false;
      if (button) button.textContent = 'Ocultar';
    } else {
      this.isHidden = true;
      if (button) button.textContent = 'Mostrar';
    }
  }
  hide() {
    const content = this.shadowRoot.querySelector('.dropdown-content');
    const button =this.shadowRoot.querySelector('button')
    this.isHidden = true;
    if (button) button.textContent = 'Mostrar';
    if (content.classList.contains('active')) {
      content.classList.remove('active');
    }
  }
  show() {
    const content = this.shadowRoot.querySelector('.dropdown-content');
    const button =this.shadowRoot.querySelector('button')

    this.isHidden = false;
    if (button) button.textContent = 'Ocultar';
    if (!content.classList.contains('active')) {
      content.classList.add('active');
    }
  }
  render() {
    const buttonText = this.getAttribute('button-text');
    this.shadowRoot.innerHTML = `
      <style>
        .dropdown {
          margin-bottom: 20px;
        }
        
        .dropdown-content {
          display: none;
          padding: 6px;
          border: 1px solid;
          border-color: inherit;
          border-radius: 4px;
          gap: 0.5rem;
        }
        
        .dropdown-content.active {
          display: grid;
        }
        
        button {
          padding: 10px 20px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        button:hover {
          background-color: #45a049;
        }
        
        ::slotted(.row) {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        
        ::slotted(.item) {
          flex: 1;
          background-color: #f5f5f5;
          border-radius: 4px;
        }
      </style>
      
      <div class="dropdown">
      ${buttonText ? `<button>${buttonText}</button>` : ''}
        <div class="dropdown-content">
          <slot></slot>
        </div>
      </div>
    `;
    
    // Add event listener to button
    if (buttonText) {
      this.shadowRoot.querySelector('button').addEventListener('click', this.toggleDropdown);
    }
  }
  
  disconnectedCallback() {
    const button = this.shadowRoot.querySelector('button');
    if (button) {
      button.removeEventListener('click', this.toggleDropdown);
    }
  }
}

// Register the custom element
customElements.define('dropdown-component', DropdownComponent);
class TranslationSpan extends HTMLElement {
  constructor() {
    super();
    
    // Crear shadow DOM
    this.attachShadow({ mode: 'open' });
    
    // Crear el elemento span base
    this.span = document.createElement('span');
    this.shadowRoot.appendChild(this.span);
    
    // Almacenar las traducciones
    this.translations = new Map();
    this.defaultText = '';
    this.currentLang = this.getAttribute('lang') || 'es'; // obtener idioma del atributo o usar default
  }
  
  connectedCallback() {
    // Guardar el texto interno como valor por defecto
    this.defaultText = this.textContent.trim();
    this.span.textContent = this.defaultText;
    
    // Si hay un idioma especificado, intentar traducir
    if (this.currentLang) {
      this.translate(this.currentLang);
    }
  }
  
  // Método para establecer las traducciones
  setTranslations(translations) {
    if (Array.isArray(translations)) {
      translations.forEach(trans => {
        if (trans.lang && trans.text) {
          this.translations.set(trans.lang, trans.text);
        }
      });
    } else if (typeof translations === 'object') {
      Object.entries(translations).forEach(([lang, text]) => {
        this.translations.set(lang, text);
      });
    }
    
    // Actualizar el texto con el idioma actual
    this.translate(this.currentLang);
  }
  
  // Método para traducir al idioma especificado
  translate(lang) {
    this.currentLang = lang;
    if (this.translations.has(lang)) {
      this.span.textContent = this.translations.get(lang);
    } else {
      // Si no hay traducción, volver al texto por defecto
      this.span.textContent = this.defaultText;
    }
  }
  
  // Obtener el texto actual
  getCurrentText() {
    return this.span.textContent;
  }
  
  // Obtener el idioma actual
  getCurrentLang() {
    return this.currentLang;
  }
  
  // Observar cambios en los atributos
  static get observedAttributes() {
    return ['lang'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'lang' && oldValue !== newValue) {
      this.translate(newValue);
    }
  }
}

// Registrar el componente
customElements.define('translation-span', TranslationSpan);

class CustomSelect extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open', delegatesFocus: true });
    this.selectedValue = null;
    this.options = [];
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: Arial, sans-serif;
        }
        .select-container {
          border: 1px solid #ccc;
          border-radius: 4px;
          max-width: 300px;
          padding: 8px;
        }
        .preview-container {
          margin-bottom: 12px;
          padding: 8px;
          border-bottom: 1px solid #eee;
          min-height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .preview-container img {
          max-width: 100%;
          max-height: 150px;
          object-fit: contain;
        }
        .options-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .option {
          padding: 8px 12px;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s ease;
          border: 2px solid transparent;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .option:hover {
          background-color: #f5f5f5;
        }
        .option.selected {
          background-color: #e8f0fe;
          color: #1a73e8;
          border-color: #1a73e8;
          font-weight: 500;
        }
        .option img {
          width: 24px;
          height: 24px;
          object-fit: cover;
          border-radius: 2px;
        }
      </style>
      <div class="select-container">
        <div class="preview-container" style="display: none;"></div>
        <div class="options-list"></div>
      </div>
    `;
  }

  addEventListeners() {
    const optionsList = this.shadowRoot.querySelector('.options-list');
    optionsList.addEventListener('click', (e) => {
      const optionElement = e.target.closest('.option');
      if (optionElement) {
        this.selectOption(optionElement);
      }     
    });
  }

  updatePreview(option) {
    const previewContainer = this.shadowRoot.querySelector('.preview-container');
    previewContainer.style.display = 'inline-block';
    previewContainer.innerHTML = '';

    if (option) {
      if (option.img || option.image) {
        const img = document.createElement('img');
        img.src = option.img || option.image;
        img.alt = option.label;
        previewContainer.appendChild(img);
      } else if (option.html) {
        previewContainer.innerHTML = option.html;
      } else {
        previewContainer.style.display = 'none';
      }
    }
  }

  selectOption(optionElement) {
    const value = optionElement.dataset.value;
    const selectedOption = this.options.find(opt => opt.value === value);
    console.log("selectedOption", selectedOption, value);
    if (!selectedOption) return;
    
    this.selectedValue = value;
    
    // Actualizar selección visual
    const options = this.shadowRoot.querySelectorAll('.option');
    options.forEach(option => {
      option.classList.toggle('selected', option === optionElement);
    });

    // Actualizar preview
    this.updatePreview(selectedOption);

    // Emitir evento de cambio con el objeto completo
    this.dispatchEvent(new CustomEvent('change', {
      detail: selectedOption
    }));
  }

  setOptions(options) {
    this.options = options;
    const optionsList = this.shadowRoot.querySelector('.options-list');
    
    optionsList.innerHTML = options.map(option => {
      let optionContent = '';
      
      // Añadir imagen en miniatura si existe
      if (option.img || option.image) {
        optionContent += `<img src="${option.img || option.image}" alt="${option.label}">`;
      }
      
      // Añadir etiqueta
      optionContent += `<span>${option.label}</span>`;

      return `
        <div class="option ${this.selectedValue === option.value ? 'selected' : ''}" 
             data-value="${option.value}">
          ${optionContent}
        </div>
      `;
    }).join('');

    // Si hay una opción seleccionada, actualizar el preview
    if (this.selectedValue) {
      const selectedOption = options.find(opt => opt.value === this.selectedValue);
      if (selectedOption) {
        this.updatePreview(selectedOption);
      }
    }
  }

  getValue() {
    return this.selectedValue;
  }

  getSelectedOption() {
    return this.options.find(opt => opt.value === this.selectedValue);
  }
}

customElements.define('custom-select', CustomSelect);
class EnhancedSelect extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open', delegatesFocus: true });
    this.selectedValues = [];
    this.options = [];
    this.multiple = false;
  }

  static get observedAttributes() {
    return ['multiple', "grid"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'multiple') {
      this.multiple = newValue !== null;
      // Reset selections when switching modes
      this.selectedValues = [];
      this.render();
      this.updateSelections();
    }
  }

  connectedCallback() {
    this.multiple = this.hasAttribute('multiple');
    this.render();
    this.addEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inherit;
          grid-template-columns: inherit;
          grid-template-rows: inherit;
          font-family: Arial, sans-serif;
          border: 0px;
        }
        .select-container {
          border-radius: 4px;
          max-width: ${this.hasAttribute('grid') ? '100%' : '300px'};
          padding: 8px;
        }
        .preview-container {
          border: 0px;
          margin-bottom: 12px;
          padding: 8px;
          border-bottom: 1px solid #eee;
          min-height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        .preview-container img {
          max-width: 100%;
          max-height: 150px;
          object-fit: contain;
        }
        .options-list {
          display: ${this.hasAttribute('grid') ? 'grid' : 'flex'};
          flex-direction: column;
          grid-template-columns: repeat(auto-fit, minmax(100px, auto));
          gap: ${this.hasAttribute('grid') ? '8px' : '4px'};
        }
        .option {
          padding: 8px 12px;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s ease;
          border: 2px solid transparent;
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #222c3a;
          border: 3px solid #2e3e53;
        }
        .option:hover {
          background-color: inherit;
          color: inherit;
        }
        .option.selected {
          background-color: inherit;
          color: #32d583;;
          border-color: #32d583;;
          font-weight: 500;
        }
        .option img {
          width: 24px;
          height: 24px;
          object-fit: cover;
          border-radius: 2px;
        }
      </style>
      <div class="select-container">
        <div class="preview-container" style="display: none;"></div>
        <div class="options-list"></div>
      </div>
    `;
  }

  addEventListeners() {
    const optionsList = this.shadowRoot.querySelector('.options-list');
    optionsList.addEventListener('click', (e) => {
      const optionElement = e.target.closest('.option');
      if (optionElement) {
        console.log("optionElement", optionElement);
        if (this.multiple) {
          this.toggleOption(optionElement);
        } else {
          this.selectOption(optionElement);
        }
      }
    });
  }

  updatePreview(selectedOptions) {
    const previewContainer = this.shadowRoot.querySelector('.preview-container');
    previewContainer.innerHTML = '';

    if (!Array.isArray(selectedOptions)) {
      selectedOptions = selectedOptions ? [selectedOptions] : [];
    }

    if (selectedOptions.length > 0) {
      previewContainer.style.display = 'flex';
      selectedOptions.forEach(option => {
        if (option.img || option.image) {
          const img = document.createElement('img');
          img.src = option.img || option.image;
          img.alt = option.label;
          previewContainer.appendChild(img);
        } else if (option.html) {
          const div = document.createElement('div');
          div.innerHTML = option.html;
          previewContainer.appendChild(div);
        } else {
          previewContainer.style.display = 'none';
        }
      });
    } else {
      previewContainer.style.display = 'none';
    }
  }

  toggleOption(optionElement) {
    const value = optionElement.dataset.value;
    const index = this.selectedValues.indexOf(value);
    
    if (index === -1) {
      this.selectedValues.push(value);
    } else {
      this.selectedValues.splice(index, 1);
    }
    
    this.updateSelections();
    
    const selectedOptions = this.options.filter(opt => this.selectedValues.includes(opt.value));
    this.updatePreview(selectedOptions);

    this.dispatchEvent(new CustomEvent('change', {
      detail: selectedOptions
    }));
  }

  selectOption(optionElement) {
    const value = optionElement.dataset.value;
    const selectedOption = this.options.find(opt => opt.value === value);
    console.log("selectedOption", selectedOption, value);
    if (!selectedOption) return;
    
    this.selectedValues = [value];
    this.updateSelections();
    this.updatePreview(selectedOption);

    this.dispatchEvent(new CustomEvent('change', {
      detail: selectedOption
    }));
  }
  setSelectedValues(values) {
    this.selectedValues = values;
    this.updateSelections();
  }
  updateSelections() {
    const options = this.shadowRoot.querySelectorAll('.option');
    options.forEach(option => {
      option.classList.toggle('selected', this.selectedValues.includes(option.dataset.value));
    });
  }

  setOptions(options) {
    this.options = options;
    const optionsList = this.shadowRoot.querySelector('.options-list');
    
    optionsList.innerHTML = options.map(option => {
      let optionContent = '';
      
      if (option.img || option.image) {
        optionContent += `<img src="${option.img || option.image}" alt="${option.label}">`;
      }
      
      optionContent += `<span>${option.label}</span>`;

      return `
        <div class="option ${this.selectedValues.includes(option.value) ? 'selected' : ''}" 
             data-value="${option.value}">
          ${optionContent}
        </div>
      `;
    }).join('');

    if (this.selectedValues.length > 0) {
      if (this.multiple) {
        const selectedOptions = options.filter(opt => this.selectedValues.includes(opt.value));
        this.updatePreview(selectedOptions);
      } else {
        const selectedOption = options.find(opt => opt.value === this.selectedValues[0]);
        if (selectedOption) {
          this.updatePreview(selectedOption);
        }
      }
    }
  }

  getValue() {
    return this.multiple ? this.selectedValues : this.selectedValues[0] || null;
  }

  getSelectedOptions() {
    const selected = this.options.filter(opt => this.selectedValues.includes(opt.value));
    return this.multiple ? selected : selected[0] || null;
  }
}

customElements.define('enhanced-select', EnhancedSelect);
class FileExplorer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open', delegatesFocus: true });
    this.currentPath = './';
    this._data = [];
  }

  // Utility function to normalize paths
  normalizePath(path) {
    // Remove duplicate slashes
    return path.replace(/\/+/g, '/');
  }

  // Utility function to format file sizes
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    // Calculate the appropriate size unit
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    // Return formatted size with up to 2 decimal places
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static get observedAttributes() {
    return ['current-path'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'current-path' && oldValue !== newValue) {
      this.currentPath = this.normalizePath(newValue);
      this.render();
      // Actualizar el display del path
      document.getElementById('path-display').textContent = `Current Path: ${this.currentPath}`;
    }
  }

  set data(value) {
    if (!value) return;
    // Normalize paths in the data before setting
    this._data = value.map(item => ({
      ...item,
      path: this.normalizePath(item.path)
    }));
    this.render();
  }

  get data() {
    return this._data;
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
  }

  addEventListeners() {
    this.shadowRoot.addEventListener('dblclick', (e) => {
      const row = e.target.closest('tr');
      if (row) {
        const item = this._data[row.dataset.index];
        this.dispatchEvent(new CustomEvent('item-dblclick', {
          detail: { item },
          bubbles: true,
          composed: true
        }));
      }
    });

    this.shadowRoot.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const row = e.target.closest('tr');
      if (row) {
        const item = this._data[row.dataset.index];
        this.dispatchEvent(new CustomEvent('item-contextmenu', {
          detail: {
            item,
            x: e.clientX,
            y: e.clientY
          },
          bubbles: true,
          composed: true
        }));
      }
    });
  }

  render() {
    const style = `
      <style>
        :host {
          display: block;
          font-family: Arial, sans-serif;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid rgb(46, 62, 83, 0.5);
        }
        tr:hover {
          background-color: #222;
          cursor: pointer;
        }
        .icon {
          width: 20px;
          height: 20px;
          display: inline-block;
          margin-right: 5px;
        }
        .directory {
          color: #2196F3;
        }
        .file {
          color: #607D8B;
        }
      </style>
    `;
    
    const content = `
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Path</th>
            <th>Size</th>
            <th>Modified</th>
          </tr>
        </thead>
        <tbody>
          ${this._data.map((item, index) => `
            <tr data-index="${index}" class="${item.type}">
              <td>
                <span class="icon">${item.type === 'directory' ? '📁' : '📄'}</span>
                ${item.name}
              </td>
              <td>${item.path}</td>
              <td>${item.type === 'directory' ? '-' : this.formatFileSize(item.size)}</td>
              <td>${this.formatDate(item.modify)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    this.shadowRoot.innerHTML = style + content;
  }
  formatDate(dateString) {
    const date = new Date(dateString);
    
    // Get date components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // Format as "YYYY-MM-DD HH:mm:ss"
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

}

customElements.define('file-explorer', FileExplorer);
class SidebarComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open', delegatesFocus: true });
    this.isVisible = true;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  toggleSidebar(isVisible) {
    this.isVisible = !this.isVisible;
    const sidebar = this.shadowRoot.querySelector('.sidebar');
    this.isVisible = isVisible || this.isVisible;
    if (this.isVisible) {
      sidebar.style.transform = 'translateX(0)';
      sidebar.style.opacity = '1';
      setTimeout(() => {
        sidebar.style.display = 'block';
      }, 222);
    } else {
      sidebar.style.transform = 'translateX(-100%)';
      sidebar.style.opacity = '0';
      setTimeout(() => {
        sidebar.style.display = 'none';
      }, 222);
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: absolute;
          left: 0;
          bottom: 0;
          top: 0;
          transform: translateY(25%);
          font-family: inherit;
          z-index: 4;
        }

        .sidebar {
          min-width: 250px;
          transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
          transform: translateX(0);
          opacity: 1;
        }

        .sidebar-box {
          background: var(--bg-dark-accent, #2a2a2a);
          border-radius: 10px;
          padding: 24px;
          min-height: 164px;
          margin-top: 16px;
        }

        .sidebar-item {
          display: flex;
          flex-direction: row;
          align-items: center;
          cursor: pointer;
          color: var(--bg-dark-accent-lighter, #888);
          margin-top: 14px;
        }

        .sidebar-item:hover {
          color: white;
        }

        .sidebar-item.active {
          color: white;
          cursor: default;
        }

        .material-symbols-rounded {
          margin-right: 10px;
          font-size: 24px;
          font-family: 'Material Symbols Rounded';
        }

        .sidebar-item span:not(.material-symbols-rounded) {
          font-size: 12pt;
          font-weight: 600;
        }

        .icon-circle-bg {
          border-radius: 999px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 10px;
          background: var(--bg-primary-500, #4a90e2);
        }

        .icon-circle-bg .material-symbols-rounded {
          color: white;
          margin: 0;
          font-size: 12pt;
        }

        #servers-list-sidebar {
          max-height: 30vh;
          overflow-y: auto;
        }

        #close-btn {
          display: none;
          width: 100%;
        }

        @media (max-width: 768px) {
          #close-btn {
            display: block;
          }
        }
      </style>
      
      <div class="sidebar">
        <button class="dark-btn icon-only" id="close-btn">
          <span class="material-symbols-rounded">close</span>
        </button>

        <div class="sidebar-box" id="servers-list-sidebar">
          <div class="sidebar-item" id="new-server-btn">
            <div class="icon-circle-bg">
              <span class="material-symbols-rounded">add</span>
            </div>
            <span>Create server</span>
          </div>
        </div>

        <div class="sidebar-box" id="main-menu-sidebar">
          <div class="sidebar-item" data-page="console">
            <span class="material-symbols-rounded">terminal</span>
            <span>Console</span>
          </div>
          <div class="sidebar-item" data-page="fileManager">
            <span class="material-symbols-rounded">folder</span>
            <span>File Manager</span>
          </div>
          <div class="sidebar-item" data-page="plugins">
            <span class="material-symbols-rounded">extension</span>
            <span>Plugins</span>
          </div>
          <div class="sidebar-item" data-page="serverSettings">
            <span class="material-symbols-rounded">tune</span>
            <span>Server Settings</span>
          </div>
          <div class="sidebar-item" data-page="server.properties">
            <span class="material-symbols-rounded">settings_ethernet</span>
            <span>Server.properties</span>
          </div>
          <div class="sidebar-item" data-page="kubekSettings">
            <span class="material-symbols-rounded">settings</span>
            <span>Kubek Settings</span>
          </div>
          <div class="sidebar-item" data-page="systemMonitor">
            <span class="material-symbols-rounded">area_chart</span>
            <span>System Monitor</span>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Setup menu item clicks
    const sidebarItems = this.shadowRoot.querySelectorAll("#main-menu-sidebar .sidebar-item");
    sidebarItems.forEach(item => {
      item.addEventListener("click", () => {
        const page = item.getAttribute("data-page");
        
        // Remove active class from all items
        sidebarItems.forEach(i => i.classList.remove('active'));
        // Add active class to clicked item
        item.classList.add('active');

        // Dispatch custom event
        const event = new CustomEvent('page-change', {
          detail: {
            page: page
          },
          bubbles: true,
          composed: true
        });
        this.dispatchEvent(event);
      });
    });

    // Setup new server button
    const newServerBtn = this.shadowRoot.getElementById('new-server-btn');
    newServerBtn.addEventListener('click', () => {
      const event = new CustomEvent('new-server', {
        bubbles: true,
        composed: true
      });
      this.dispatchEvent(event);
    });

    // Setup close button
    const closeBtn = this.shadowRoot.getElementById('close-btn');
    closeBtn.addEventListener('click', () => {
      this.toggleSidebar();
      const event = new CustomEvent('toggle-sidebar', {
        detail: {
          isVisible: this.isVisible
        },
        bubbles: true,
        composed: true
      });
      this.dispatchEvent(event);
    });
  }
}

customElements.define('sidebar-menu', SidebarComponent);
class GridSelector extends HTMLElement {
  constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._selected = null;
  }

  static get observedAttributes() {
      return ['data'];
  }

  connectedCallback() {
      this.render();
      this.addEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
      if (name === 'data' && oldValue !== newValue) {
          this.render();
      }
  }

  get data() {
      try {
          return JSON.parse(this.getAttribute('data') || '[]');
      } catch {
          return [];
      }
  }

  set data(value) {
      this.setAttribute('data', JSON.stringify(value));
  }

  get selected() {
      return this._selected;
  }

  set selected(value) {
      const oldValue = this._selected;
      this._selected = value;
      if (oldValue !== value) {
          this.dispatchEvent(new CustomEvent('change', {
              detail: { selected: value },
              bubbles: true,
              composed: true
          }));
      }
  }

  render() {
      const style = `
          :host {
              display: block;
          }
          .cards-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 1rem;
              padding: 1rem;
          }
          .card {
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 1rem;
              border: 2px solid #ddd;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.3s ease;
          }
          .card:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }
          .card.active {
              border-color: #4a90e2;
              background-color: rgba(74, 144, 226, 0.1);
          }
          .icon {
              width: 64px;
              height: 64px;
              object-fit: contain;
              margin-bottom: 0.5rem;
          }
          .title {
              text-align: center;
              font-weight: 500;
          }
      `;

      const items = this.data.map(item => `
          <div class="card ${this._selected === item.id ? 'active' : ''}" data-id="${item.id}">
              <img class="icon" src="${item.img}" alt="${item.title} logo">
              <span class="title">${item.title}</span>
          </div>
      `).join('');

      this.shadowRoot.innerHTML = `
          <style>${style}</style>
          <div class="cards-grid">
              ${items}
          </div>
      `;
  }

  addEventListeners() {
      this.shadowRoot.addEventListener('click', (e) => {
          const card = e.target.closest('.card');
          if (card) {
              const id = card.dataset.id;
              this.selected = id;
              this.render();
          }
      });
  }
}

// Register the web component
customElements.define('grid-selector', GridSelector);