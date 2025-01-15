$(function() {
  KubekUI.setTitle("Kubek | {{sections.plugins}}");
});

const KubekPluginsUI = class {
  static refreshAllLists(type) {
    console.log("refreshAllLists");
    setTimeout(() => {
      getpluginsandmods(type);
    }, 1000);
  }

// Загрузить плагин/мод на сервер
  static uploadItem(itemType){
    let uploadURL = "/" + itemType + "s/" + selectedServer;
    let inputElement = $("#server-" + itemType + "-input");
    inputElement.trigger("click");
    inputElement.off("change");
    inputElement.on("change", () => {
      let formData = new FormData($("#server-" + itemType + "-form")[0]);
      KubekRequests.post(uploadURL, () => {
        KubekPluginsUI.refreshAllLists(itemType);
        getpluginsandmods(itemType);
        console.log(uploadURL, inputElement, selectedServer, formData);
      }, formData);
    });
  }
}
class PluginsAndModsManager {
  constructor() {
    this._state = {
      plugins: [],
      mods: []
    };
    this._listeners = new Set();
  }

  // Getter methods
  get plugins() {
    return [...this._state.plugins];
  }

  get mods() {
    return [...this._state.mods];
  }

  // Subscribe to state changes
  subscribe(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  // Notify all listeners of state changes
  _notifyListeners() {
    this._listeners.forEach(listener => listener(this._state));
  }

  // Update state methods
  setPlugins(plugins) {
    this._state.plugins = [...plugins];
    this._notifyListeners();
  }

  setMods(mods) {
    this._state.mods = [...mods];
    this._notifyListeners();
  }

  // Async methods to fetch data
  async fetchPlugins() {
    return new Promise((resolve) => {
      KubekPlugins.getPluginsList((plugins) => {
        if (plugins) {
          this.setPlugins(plugins);
        }
        resolve(plugins);
      });
    });
  }

  async fetchMods() {
    return new Promise((resolve) => {
      KubekPlugins.getModsList((mods) => {
        if (mods) {
          this.setMods(mods);
        }
        resolve(mods);
      });
    });
  }
}

// Create a single instance of the manager
const pluginsManager = new PluginsAndModsManager();

async function getpluginsandmods(type) {
  const verifytype = type.includes("plugin") ? "plugins" : "mods";
  try {

    if (verifytype === "plugins") {
    const plugins = await pluginsManager.fetchPlugins();
    console.log(plugins, "plugins", pluginsManager.plugins);
    if (plugins) {
      pluginsManager.setPlugins(plugins);
      }
    } else {
    const mods = await pluginsManager.fetchMods();
    if (mods) {
      pluginsManager.setMods(mods);
      }
    console.log(mods, "mods", pluginsManager.mods);
    }
    setpluginsandmods(type);
    updateplugin(type);
  } catch (error) {
    console.error('Error fetching plugins/mods:', error);
  }
}
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

// Usage example:
const kubekPluginsUI = document.querySelector('#plugins-ui');
const updateplugin  = (type) => {
  console.log("updateplugin", type, pluginsManager.mods);
  if (kubekPluginsUI.renderAllLists)   kubekPluginsUI.renderAllLists(type);
}
['toggle', 'delete'].forEach(eventName => {
  kubekPluginsUI.addEventListener(eventName, event => {
    const detail = event.detail;
    console.log(detail);
    const itemname = detail.item;
    if (eventName === "delete") {
      deletefile(itemname, detail.type);
    } else if (eventName === "toggle") {
      togglepluginormod(itemname, detail.type, detail.newName);
    }
  });
});
kubekPluginsUI.renderAllLists("plugins");

function setpluginsandmods(type) {
  const verifytype = type.includes("plugin") ? "plugins" : "mods";
  if (!kubekPluginsUI) return;

  if (verifytype === "plugins") {
    console.log('Before setting plugins list:', pluginsManager.plugins);
    kubekPluginsUI.setElementList(pluginsManager.plugins);
    console.log('After setting plugins list:', pluginsManager.plugins);

  } else if (verifytype === "mods") {
    console.log('Before setting mods list:', pluginsManager.mods);
    kubekPluginsUI.setElementList(pluginsManager.mods);
    console.log('After setting mods list:', pluginsManager.mods);
  }
  updateplugin(type);
}
function deletefile(item, itemType){
  if (itemType !== "plugins" && itemType !== "mods") {
    console.log("Invalid item type", itemType);
    return;
  }
// after refreshing the list
  const itemtodelete = '/'+ itemType + '/'+ item;
  console.log(itemtodelete);
  // params filePath string and callback function
  KubekFileManager.delete(itemtodelete, (data) => {
    console.log("File deleted successfully", data);
    if (data)     kubekPluginsUI.removeElement(item);
    // KubekPluginsUI.refreshAllLists();
  });
}
function togglepluginormod(item, itemType, newName) {
  if (itemType !== "plugins" && itemType !== "mods") {
    console.log("Invalid item type", itemType);
    return;
  }
  if (newName) {
    const filePath = `/${itemType}/${item}`;
    // params filePath string, newName string and callback function
    KubekFileManager.renameFile(filePath, newName, (data) => {
      console.log("File renamed successfully", data);
      // KubekPluginsUI.refreshAllLists();
    });
    console.log(item, itemType, newName, filePath);
  }
}
getpluginsandmods("plugins");