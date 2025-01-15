SWITCH_ELEMENT = '<label class="switch"> <input type="checkbox"$0> <span class="slider round"></span></label>';
NUMBER_INPUT = "<input type='number' value='$0'>";
TEXT_INPUT = "<input type='text' value='$0'>";

$(function () {
    KubekUI.setTitle("Kubek | Server.properties");

    KubekServerPropertiesUI.loadProperties();
})

KubekServerPropertiesUI = class {
    static loadProperties() {
        KubekRequests.get("/servers/" + selectedServer + "/server.properties", (result) => {
            for (const [key, value] of Object.entries(result)) {
                let keyStr = key;
                let valueStr = value;
                valueStr === null ? valueStr = "" : valueStr;

                let valType = this.getValueType(valueStr);
                if(keyStr === "server-ip") valType = "string";

                let htmlCode = "";
                htmlCode += "<tr><td>" + keyStr + "</td><td>";
                switch (valType) {
                    case "boolean":
                        let isChecked = "";
                        if (valueStr === true) {
                            isChecked = " checked";
                        }
                        htmlCode += SWITCH_ELEMENT.replace("$0", isChecked);
                        break;
                    case "number":
                        htmlCode += NUMBER_INPUT.replace("$0", valueStr);
                        break;
                    default:
                        htmlCode += TEXT_INPUT.replace("$0", valueStr);
                        break;
                }
                htmlCode += "</td></tr>";
                $("#sp-table").append(htmlCode);
            }
        });
    }

    static saveProperties() {
        let saveResult = {};
        $("#sp-table tr").each((i, element) => {
            let key = $(element).find("td:first-child").text();
            let innerItem = $(element).find("td:last-child")[0];
            let value = null;
            // Ищем чекбоксы/поля ввода
            if ($(innerItem).find("input[type='checkbox']").length === 1) {
                value = $(innerItem).find("input[type='checkbox']").is(":checked");
            } else {
                value = $(innerItem).find("input").val();
            }
            saveResult[key] = value;
        });
        KubekRequests.put("/servers/" + selectedServer + "/server.properties?server=" + selectedServer + "&data=" + Base64.encodeURI(JSON.stringify(saveResult)), (result) => {
            if (result !== false) {
                KubekAlerts.addAlert("{{fileManager.writeEnd}}", "check", "", 5000);
            }
        });
    }

    static getValueType(value) {
        if (value === true || value === false) {
            return "boolean";
        }
        if (!isNaN(parseInt(value))) {
            return "number";
        }
        return "string";
    }
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
        
        // Create shadow DOM
        this.attachShadow({ mode: 'open' });
        
        // Add styles
        this.shadowRoot.innerHTML = `
            <style>
            ${this.getStyles()}
            </style>
            <table id="sp-table"></table>
            <button id="save-btn" class="primary-btn">Save Properties</button>
        `;
    }
    getStyles() {
        return `
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
                }
                
                td {
                    padding: 8px;
                    border: 1px solid #ddd;
                }
                
                input[type="text"], input[type="number"] {
                    width: 100%;
                    padding: 6px;
                    box-sizing: border-box;
                }
                    `;
    }
    connectedCallback() {
        this.loadProperties();
        this.shadowRoot.querySelector('#save-btn').addEventListener('click', () => this.saveProperties());
    }

    getValueType(value) {
        if (value === true || value === false) {
            return "boolean";
        }
        if (!isNaN(parseInt(value))) {
            return "number";
        }
        return "string";
    }

    async loadProperties() {
        const serverId = this.getAttribute('server-id') || selectedServer;
        try {
            const url = `/api/servers/${serverId}/server.properties`;
            console.log("url", url);
            const response = await fetch(url);
                console.log("response", response);
            const result = await response.json();
            
            const table = this.shadowRoot.querySelector('#sp-table');
            table.innerHTML = ''; // Clear existing content
            
            for (const [key, value] of Object.entries(result)) {
                let valueStr = value === null ? "" : value;
                let valType = this.getValueType(valueStr);
                if(key === "server-ip") valType = "string";
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${key}</td>
                    <td>${this.createInput(valType, valueStr)}</td>
                `;
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
            default:
                return this.TEXT_INPUT.replace("$0", value);
        }
    }

    async saveProperties() {
        const serverId = this.getAttribute('server-id');
        const saveResult = {};
        
        this.shadowRoot.querySelectorAll('#sp-table tr').forEach(row => {
            const key = row.cells[0].textContent;
            const inputCell = row.cells[1];
            let value = null;
            
            const checkbox = inputCell.querySelector('input[type="checkbox"]');
            if (checkbox) {
                value = checkbox.checked;
            } else {
                value = inputCell.querySelector('input').value;
            }
            
            saveResult[key] = value;
        });

        try {
            const encodedData = btoa(JSON.stringify(saveResult));
            const response = await fetch(`/servers/${serverId}/server.properties?server=${serverId}&data=${encodedData}`, {
                method: 'PUT'
            });
            
            const result = await response.json();
            if (result !== false) {
                this.dispatchEvent(new CustomEvent('save-success', {
                    bubbles: true,
                    composed: true
                }));
            }
        } catch (error) {
            console.error('Error saving properties:', error);
        }
    }
}

// Register the custom element
customElements.define('server-properties', ServerPropertiesElement);
const serverPropertiesElement = document.querySelector('server-properties');
serverPropertiesElement.setAttribute('server-id', selectedServer);