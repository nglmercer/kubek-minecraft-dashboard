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