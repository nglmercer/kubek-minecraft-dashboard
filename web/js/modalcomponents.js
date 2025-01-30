setTimeout(() => {
    class CustomModal extends HTMLElement {
        constructor() {
            super();
            this.isOpen = false;
            this.currentMode = 'dark';
            this.onOpenCallback = null;
            this.onCloseCallback = null;
    
            // Create shadow DOM
            this.attachShadow({ mode: 'open', delegatesFocus: true });
    
            // Create styles
            const styles = document.createElement('style');
            styles.textContent = `
                :host {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 1000;
                    max-height: inherit;
                    overflow-y: inherit;
                }
    
                :host([visible]) .modal-overlay {
                    opacity: 1;
                }
    
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
    
                .modal-content {
                    position: relative;
                    min-width: 300px;
                    max-width: 90%;
                    padding: 20px;
                    border-radius: 8px;
                    max-height: inherit;
                    overflow-y: inherit;
                }
    
                :host(.dark-mode) .modal-content {
                    background-color: #333;
                    color: white;
                }
    
                :host(.light-mode) .modal-content {
                    background-color: white;
                    color: #333;
                }
    
                .close-button {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: none;
                    border: none;
                    font-size: 1.5em;
                    cursor: pointer;
                    padding: 0 8px;
                }
    
                :host(.dark-mode) .close-button {
                    color: white;
                }
    
                :host(.light-mode) .close-button {
                    color: #333;
                }
    
                .modal-body {
                    margin: 20px 0;
                }
            `;
    
            // Create modal structure
            const template = document.createElement('template');
            template.innerHTML = `
                <div class="modal-overlay">
                    <div class="modal-content">
                        <button class="close-button">&times;</button>
                        <div class="modal-body">
                            <slot></slot>
                        </div>
                    </div>
                </div>
            `;
    
            this.shadowRoot.append(styles, template.content.cloneNode(true));
    
            // Element references
            this.overlay = this.shadowRoot.querySelector('.modal-overlay');
            this.closeButton = this.shadowRoot.querySelector('.close-button');
            
            this.setupEventListeners();
            this.setMode('dark');
        }
    
        setupEventListeners() {
            this.closeButton.addEventListener('click', () => this.close());
            this.overlay.addEventListener('click', e => {
                if (e.target === this.overlay) this.close();
            });
        }
    
        setMode(mode = 'dark') {
            const validModes = ['dark', 'light'];
            if (!validModes.includes(mode)) {
                console.warn('Invalid mode. Using dark mode.');
                mode = 'dark';
            }
            
            this.classList.remove(...validModes.map(m => `${m}-mode`));
            this.classList.add(`${mode}-mode`);
            this.currentMode = mode;
        }
    
        toggleMode() {
            this.setMode(this.currentMode === 'dark' ? 'light' : 'dark');
        }
    
        open(callback = null) {
            this.onOpenCallback = callback;
            this.style.display = 'block';
            this.offsetHeight; // Trigger reflow
            this.setAttribute('visible', '');
            this.isOpen = true;
            this.onOpenCallback?.();
        }
    
        close(callback = null) {
            this.onCloseCallback = callback;
            this.removeAttribute('visible');
            this.isOpen = false;
    
            setTimeout(() => {
                this.style.display = 'none';
                this.onCloseCallback?.();
            }, 300);
        }
    
        setContent(content) {
            while (this.firstChild) this.removeChild(this.firstChild);
            
            if (typeof content === 'string') {
                const temp = document.createElement('div');
                temp.innerHTML = content;
                this.appendChild(temp);
            } else if (content instanceof Node) {
                this.appendChild(content);
            }
        }
    
        getContentContainer() {
            return this;
        }
    }
    
    customElements.define('custom-modal', CustomModal);
}, 100);