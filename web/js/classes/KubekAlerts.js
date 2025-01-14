class KubekAlerts {
    // Функция для добавления нового алёрта
    static addAlert(text, icon = "info", description = "", duration = 5000, iconClasses = "", callback = () => {
    }) {
        let alertsPoolElement = $("#alerts-pool");
        let newID = this.generateAlertID();
        let alertCode = "<div id='alert-" + newID + "' class='alert animate__animate animate__fadeIn animate__faster'>";
        if (iconClasses !== "") {
            alertCode = alertCode + "<div class='icon-bg " + iconClasses + "'><span class='material-symbols-rounded'>" + icon + "</span></div>";
        } else {
            alertCode = alertCode + "<div class='icon-bg'><span class='material-symbols-rounded'>" + icon + "</span></div>";
        }
        if (description !== "") {
            alertCode = alertCode + "<div class='content-2'><div class='caption'>" + text + "</div><div class='description'>" + description + "</div></div>";
        } else {
            alertCode = alertCode + "<div class='caption'>" + text + "</div>";
        }
        alertCode = alertCode + "</div>";
        alertsPoolElement.append(alertCode);
        $("#alert-" + newID).on("click", function () {
            $(this).remove();
            callback();
        });
        if (duration > 0) {
            $("#alert-" + newID)
                .delay(duration)
                .queue(function () {
                    let rid = "#" + $(this)[0].id;
                    animateCSSJ(rid, "fadeOut", false).then(() => {
                        $(this).remove();
                    });
                });
        }
    }

    // Получить ID для нового alert`а
    static generateAlertID() {
        return $("#alerts-pool .alert").length;
    }

    // Удалить все алёрты
    static removeAllAlerts() {
        $("#alerts-pool").html("");
    }
}
class CustomAlert extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.setupStyles();
        this.createAlertsPool();
    }

    setupStyles() {
        const style = document.createElement('style');
        style.textContent = `
            :host {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
            }
            
            .alerts-pool {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .alert {
                display: flex;
                align-items: center;
                padding: 12px;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                cursor: pointer;
                animation: fadeIn 0.3s ease-in;
                margin-bottom: 8px;
                transition: background-color 0.3s, color 0.3s;
            }

            /* Light theme (default) */
            :host([theme="light"]) .alert,
            :host(:not([theme])) .alert {
                background: white;
                color: #333;
            }
            
            :host([theme="light"]) .description,
            :host(:not([theme])) .description {
                color: #666;
            }

            /* Dark theme */
            :host([theme="dark"]) .alert {
                background: #2d2d2d;
                color: #ffffff;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            }
            
            :host([theme="dark"]) .description {
                color: #aaa;
            }

            :host([theme="dark"]) .icon-bg {
                color: #ffffff;
            }
            
            .icon-bg {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 12px;
            }
            
            .caption {
                font-size: 14px;
            }
            
            .description {
                font-size: 12px;
                margin-top: 4px;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(-20px); }
            }
        `;
        this.shadowRoot.appendChild(style);
    }

    createAlertsPool() {
        const alertsPool = document.createElement('div');
        alertsPool.className = 'alerts-pool';
        this.shadowRoot.appendChild(alertsPool);
    }

    static get observedAttributes() {
        return ['icon', 'text', 'description', 'duration', 'icon-classes', 'theme'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'theme' && oldValue !== newValue) {
            // Validar que solo se acepten los temas 'light' y 'dark'
            if (newValue && !['light', 'dark'].includes(newValue)) {
                console.warn('Theme must be either "light" or "dark". Defaulting to light theme.');
                this.setAttribute('theme', 'light');
            }
        }
    }

    addAlert(text, icon = "info", description = "", duration = 5000, iconClasses = "", callback = () => {}) {
        const alertsPool = this.shadowRoot.querySelector('.alerts-pool');
        const newID = this.generateAlertID();
        
        const alert = document.createElement('div');
        alert.id = `alert-${newID}`;
        alert.className = 'alert';
        
        const iconContainer = document.createElement('div');
        iconContainer.className = `icon-bg ${iconClasses}`;
        
        const iconSpan = document.createElement('span');
        iconSpan.className = 'material-symbols-rounded';
        iconSpan.textContent = icon;
        iconContainer.appendChild(iconSpan);
        
        const content = document.createElement('div');
        
        if (description) {
            content.className = 'content-2';
            const captionDiv = document.createElement('div');
            captionDiv.className = 'caption';
            captionDiv.textContent = text;
            
            const descriptionDiv = document.createElement('div');
            descriptionDiv.className = 'description';
            descriptionDiv.textContent = description;
            
            content.appendChild(captionDiv);
            content.appendChild(descriptionDiv);
        } else {
            content.className = 'caption';
            content.textContent = text;
        }
        
        alert.appendChild(iconContainer);
        alert.appendChild(content);
        
        alert.addEventListener('click', () => {
            alert.remove();
            callback();
        });
        
        alertsPool.appendChild(alert);
        
        if (duration > 0) {
            setTimeout(() => {
                alert.style.animation = 'fadeOut 0.3s ease-out';
                alert.addEventListener('animationend', () => {
                    alert.remove();
                });
            }, duration);
        }
        
        return alert;
    }

    generateAlertID() {
        return this.shadowRoot.querySelectorAll('.alert').length;
    }

    removeAllAlerts() {
        const alertsPool = this.shadowRoot.querySelector('.alerts-pool');
        alertsPool.innerHTML = '';
    }
}

// Register the custom element
customElements.define('custom-alert', CustomAlert);

// Usage example:
/*
// Add the component to your HTML
<custom-alert theme="light"></custom-alert>

// Create alerts from JavaScript
const alertsComponent = document.querySelector('custom-alert');

// Change theme
alertsComponent.setAttribute('theme', 'dark');

// Create alert
alertsComponent.addAlert(
    'Hello World',
    'info',
    'This is a description',
    5000,
    'custom-icon-class',
    () => console.log('Alert clicked')
);
*/