KubekUI.setTitle("Kubek | {{sections.plugins}}");
var KubekPluginsUI = class {
// Загрузить плагин/мод на сервер
  static uploadItem(itemType){
    const baseelement = "#server-" + itemType
    const a_inputElement = document.querySelector(baseelement + "-input");
    const a_uploadURL = "/" + itemType + "s/" + selectedServer;
    a_inputElement.click();
    a_inputElement.addEventListener("change", () => {
      const a_formData = new FormData(document.querySelector(baseelement + "-form"));
      KubekRequests.post(a_uploadURL, () => {
        getpluginsandmods(itemType);
        console.log(a_uploadURL, a_inputElement, selectedServer, a_formData);
      }, a_formData);
    });
  }
}
var pluginsmanagerclass = class PluginsAndModsManager {
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
var pluginsManager = new pluginsmanagerclass();

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


// Usage example:
var kubekModsUI = document.querySelector('#mods-ui');
var kubekPluginsUI = document.querySelector('#plugins-ui');
var updateplugin  = (type) => {
  console.log("updateplugin", type, pluginsManager.mods);
  if (kubekPluginsUI.renderAllLists)   kubekPluginsUI.renderAllLists(type);
}

["plugins", "mods"].forEach(type => {
  const elements = {
    "plugins": document.querySelector('#plugins-ui'),
    "mods": document.querySelector('#mods-ui')
  };
  if (elements[type]) {
    elements[type].renderAllLists(type);
    elements[type].setType(type);
    ["toggle", "delete"].forEach(eventName => {
      elements[type].addEventListener(eventName, event => {
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
  }

});
kubekPluginsUI.renderAllLists("plugins");
kubekModsUI.renderAllLists("mods");
function setpluginsandmods(type) {
  const verifytype = type.includes("plugin") ? "plugins" : "mods";
  if (!kubekPluginsUI) return;

  if (verifytype === "plugins") {
    console.log('Before setting plugins list:', pluginsManager.plugins);
    kubekPluginsUI.setElementList(pluginsManager.plugins);
    console.log('After setting plugins list:', pluginsManager.plugins);

  } else if (verifytype === "mods") {
    console.log('Before setting mods list:', pluginsManager.mods);
    kubekModsUI.setElementList(pluginsManager.mods);
    console.log('After setting mods list:', pluginsManager.mods);
  }
  updateplugin(type);
}
function deletefile(item, itemType){
  const verifytype = itemType.includes("plugin") ? "plugins" : "mods";
  if (verifytype !== "plugins" && verifytype !== "mods") {
    console.log("Invalid item type", itemType);
    return;
  }
// after refreshing the list
  const itemtodelete = '/'+ verifytype + '/'+ item;
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
getpluginsandmods("mods");