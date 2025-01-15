$(function() {
  KubekUI.setTitle("Kubek | {{sections.plugins}}");

  KubekPluginsUI.refreshAllLists();
});

KubekPluginsUI = class {
  // Обновить список плагинов
  static refreshPluginsList() {
    let listElem = $("#plugins-list");
    KubekPlugins.getPluginsList((plugins) => {
      if(listElem.length === 1){
        listElem.html("");
      }
      plugins.forEach((plugin) => {
        KubekPluginsUI.addPluginItemToList(listElem, plugin, "plugin");
      })
    });
  }

// Обновить список модов
  static refreshModsList() {
    let listElem = $("#mods-list");
    KubekPlugins.getModsList((mods) => {
      if(listElem.length === 1){
        listElem.html("");
      }
      mods.forEach((mod) => {
        KubekPluginsUI.addPluginItemToList(listElem, mod, "mod");
      })
    });
  }

  static addPluginItemToList(listElem, item, itemType) {
    // Preparar datos básicos
    const nameSplit = item.split('.');
    const displayName = item.replaceAll(".jar", "").replaceAll(".dis", "");
    
    // Construir rutas y acciones
    const filePath = `/${itemType}s/${item}`;
    console.log(filePath);
    const onclick1 = ""
    const onclick2 = "";
/*     const onclick1 = `KubekPluginsUI.togglePluginOrMod("${item}", "${itemType}")`;
    const onclick2 = `KubekFileManager.deleteFile("${filePath}", KubekPluginsUI.refreshAllLists)`; */
    
    // Determinar estado del switch
    const switchedOn = nameSplit[nameSplit.length - 1] !== "dis" ? " checked" : "";
    
    // Construir HTML usando template literal para mejor legibilidad
    const itemHTML = `
      <div class='item'>
        <label class='switch'>
          <input onchange='${onclick1}' type='checkbox'${switchedOn}>
          <span class='slider round'></span>
        </label>
        <span class='filename'>${displayName}</span>
        <button class='dark-btn icon-only' onclick='${onclick2}'>
          <span class='material-symbols-rounded'>delete</span>
        </button>
      </div>
    `;
    
    listElem.append(itemHTML);
  }

// Сменить состояние мода/файла (вкл./выкл.)
  static togglePluginOrMod(item, type){
    let nameSplit = item.split('.');
    let newName;
    if(nameSplit[nameSplit.length - 1] === "dis"){
      newName = item.replace(".dis", "");
    } else {
      newName = item + ".dis";
    }
    KubekFileManager.renameFile("/" + type + "s/" + item, newName, () => {
      setTimeout(() => {
        KubekPluginsUI.refreshAllLists();
      }, 800);
    });
  }

// Обновить все списки
  static refreshAllLists() {
    KubekPluginsUI.refreshPluginsList();
    KubekPluginsUI.refreshModsList();
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
        KubekPluginsUI.refreshAllLists();
      }, formData);
    });
  }
}
let modsandplugins = {
  plugins: [],
  mods: []
}
async function getpluginsandmods(type) {
  if(type === "plugins"){
    KubekPlugins.getPluginsList((plugins) => {
      modsandplugins.plugins = plugins;
      setpluginsandmods(type);
    });
  } else if(type === "mods"){
    KubekPlugins.getModsList((mods) => {
      modsandplugins.mods = mods;
      setpluginsandmods(type);
    });
  }
  return modsandplugins;
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

        .item {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
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
          background-color: #333;
          color: white;
          border: none;
          padding: 5px 10px;
          cursor: pointer;
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
const kubekPluginsUI = document.querySelector('kubek-plugins-ui');

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
  if(type === "plugins"){
    kubekPluginsUI.setElementList(modsandplugins.plugins);
  } else if(type === "mods"){
    kubekPluginsUI.setElementList(modsandplugins.mods);
  }
}
function deletefile(item, itemType){
  if (itemType !== "plugins" && itemType !== "mods") {
    console.log("Invalid item type", itemType);
    return;
  }
// after refreshing the list
  const itemtodelete = '/'+ itemType + '/'+ item;
  console.log(itemtodelete);
  // KubekFileManager.deleteFile("${filePath}", KubekPluginsUI.refreshAllLists) 1 params filePath string and callback function
}
function togglepluginormod(item, itemType, newName) {
  if (itemType !== "plugins" && itemType !== "mods") {
    console.log("Invalid item type", itemType);
    return;
  }
  if (newName) {
    const filePath = `/${itemType}/${item}`;
    // KubekFileManager.renameFile(filePath, newName, KubekPluginsUI.refreshAllLists) 3 params filePath string, newName string and callback function
    console.log(item, itemType, newName, filePath);
  }
}
getpluginsandmods("plugins");