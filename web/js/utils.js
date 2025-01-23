class WebDebugger {
  static isEnabled = true;
  static callSites = new Map();
  
  static toggleLogs(enable = !this.isEnabled) {
    this.isEnabled = enable;
  }

  static registerCallSite(file, line) {
    const error = new Error();
    // Agregar marca única para identificación más fácil
    error.isDebugMarker = true;
    this.callSites.set(error, { file, line });
    return error;
  }

  static log(...args) {
    if (!this.isEnabled) return;

    const error = new Error();
    const stackLines = error.stack?.split('\n') || [];
    let callerInfo = { file: 'Unknown', line: '0' };

    // Regex mejorado para múltiples formatos de stack trace
    const stackRegex = /(\S+):(\d+):(\d+)/;
    
    // Buscar primera línea relevante en el stack
    for (const line of stackLines.slice(2)) {
      const match = line.match(stackRegex);
      if (match) {
        callerInfo = { file: match[1], line: match[2] };
        break;
      }
    }

    // Buscar ubicación registrada usando marca
    const registeredSite = Array.from(this.callSites.entries()).find(([key]) => {
      return stackLines.some(line => line.includes(key.stack.split('\n')[0]));
    });

    if (registeredSite) {
      callerInfo = registeredSite[1];
      this.callSites.delete(registeredSite[0]);
    }

    const label = `${callerInfo.file}:${callerInfo.line}`;
    
    console.groupCollapsed(
      `%cDebug [${label}]`, 
      'color: #4CAF50; font-weight: bold; cursor: pointer;'
    );
    
    console.log(`%cCaller: ${label}`, 'color: #9E9E9E; font-size: 0.8em;');
    
    args.forEach(arg => {
      if (arg instanceof Error) {
        console.error('%cError:', 'color: #ff4444;', arg);
      } else if (typeof arg === 'object') {
        console.dir(arg);
      } else {
        console.log(arg);
      }
    });
    
    console.groupEnd();
  }

  static getcallSites() {
    return this.callSites;
  }
}
class DebuggerGroup {
  constructor(name) {
    this.name = name;
    this.isEnabled = true;
    this.callSites = new Map();
  }

  registerCallSite(file, line) {
    const error = new Error();
    this.callSites.set(error, { file, line });
    return error;
  }

  toggle(enable = !this.isEnabled) {
    this.isEnabled = enable;
  }

  log(...args) {
    if (!this.isEnabled) return;

    const error = new Error();
    const stackLines = error.stack?.split('\n') || [];
    let callerInfo = { file: 'Unknown', line: '0' };

    // Extracción de ubicación
    const stackRegex = /(\S+):(\d+):(\d+)/;
    for (const line of stackLines.slice(2)) {
      const match = line.match(stackRegex);
      if (match) {
        callerInfo = { file: match[1], line: match[2] };
        break;
      }
    }

    // Buscar ubicación registrada
    const registeredSite = Array.from(this.callSites.entries()).find(([key]) => {
      return stackLines.some(line => line.includes(key.stack.split('\n')[0]));
    });

    if (registeredSite) {
      callerInfo = registeredSite[1];
      this.callSites.delete(registeredSite[0]);
    }

    const label = `${callerInfo.file}:${callerInfo.line}`;
    
    console.groupCollapsed(
      `%c${this.name} [${label}]`, 
      'color: #4CAF50; font-weight: bold; cursor: pointer;'
    );
    
    console.log(`%cCaller: ${label}`, 'color: #9E9E9E; font-size: 0.8em;');
    
    args.forEach(arg => {
      if (arg instanceof Error) {
        console.error('%cError:', 'color: #ff4444;', arg);
      } else if (typeof arg === 'object') {
        console.dir(arg);
      } else {
        console.log(arg);
      }
    });
    
    console.groupEnd();
  }
}

class DebuggerGroupManager {
  static groups = new Map();

  static create(name) {
    if (!this.groups.has(name)) {
      this.groups.set(name, new DebuggerGroup(name));
    }
    return this.groups.get(name);
  }

  static get(name) {
    return this.groups.get(name);
  }

  static toggleGroup(name, enable) {
    const group = this.groups.get(name);
    if (group) group.toggle(enable);
  }

  static toggleAll(enable) {
    this.groups.forEach(group => group.toggle(enable));
  }
}

const TASK_ITEM_PLACEHOLDER = "<div class='alert' data-id='$0'><div class='$1'>$2</div><div class='content-2'><span class='caption'>$3</span><span class='description'>$4</span></div></div>";

let isConnectionLost = false;
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
class KubekTasksUI {
    static addTask(id, icon, title, description, append = true, iconType = "symbol", iconBgClasses = "icon-bg colored") {
        let iconPrepared = "";
        if (iconType === "symbol") {
            iconPrepared = "<span class='material-symbols-rounded'>" + icon + "</span>";
        } else if (iconType === "image") {
            iconPrepared = "<img src='" + icon + "' style='width: 24px; height: 24px;'/>";
        }
        let taskHTML = TASK_ITEM_PLACEHOLDER.replace(/\$0/g, id).replace(/\$1/g, iconBgClasses).replace(/\$2/g, iconPrepared).replace(/\$3/g, title).replace(/\$4/g, description);
        let tasksPool = document.querySelector("#tasks-pool");
        if (append) {
            tasksPool.insertAdjacentHTML('beforeend', taskHTML);
        } else {
            tasksPool.insertAdjacentHTML('afterbegin', taskHTML);
        }
    }

    static removeTaskByID(id) {
        document.querySelectorAll("#tasks-pool .alert").forEach(element => {
            if (element.dataset.id === id) {
                element.remove();
            }
        });
    }

    static removeAllTasks() {
        document.querySelector("#tasks-pool").innerHTML = "";
    }

    static refreshTasksList() {
        fetch(KubekPredefined.API_ENDPOINT + "/tasks")
            .then(response => response.json())
            .then(tasks => {
                if (isConnectionLost) {
                    KubekUI.connectionRestored();
                }
                isConnectionLost = false;
                this.removeAllTasks();
                for (const [id, task] of Object.entries(tasks)) {
                    let icon = "";
                    let title = "";
                    let description = "";
                    let iconBg = "icon-bg colored";
                    // Если идёт процесс создания сервера
                    if (task.type === KubekPredefined.TASKS_TYPES.CREATING && typeof task.serverName !== "undefined") {
                        icon = "deployed_code_history";
                        iconBg = "icon-bg";
                        title = "{{tasksTypes.creating}} " + task.serverName;
                        // Куча говнокода, уж простите меня
                        switch (task.currentStep) {
                            case KubekPredefined.SERVER_CREATION_STEPS.CHECKING_JAVA:
                                description = "{{serverCreationSteps.checkingJava}}";
                                break;
                            case KubekPredefined.SERVER_CREATION_STEPS.CREATING_BAT:
                                description = "{{serverCreationSteps.creatingBat}}";
                                break;
                            case KubekPredefined.SERVER_CREATION_STEPS.COMPLETED:
                                description = "{{serverCreationSteps.completed}}";
                                icon = "check_circle";
                                iconBg = "bg-success icon-bg";
                                KubekNotifyModal.create(task.serverName, "{{newServerWizard.creationCompleted}}", "{{commons.goto}}", "check", () => {
                                    window.localStorage.selectedServer = task.serverName;
                                    window.location = "/?act=console";
                                }, KubekPredefined.MODAL_CANCEL_BTN);
                                break;
                            case KubekPredefined.SERVER_CREATION_STEPS.COMPLETION:
                                description = "{{serverCreationSteps.completion}}";
                                break;
                            case KubekPredefined.SERVER_CREATION_STEPS.FAILED:
                                icon = "deployed_code_alert";
                                description = "{{serverCreationSteps.failed}}";
                                iconBg = "bg-error icon-bg";
                                break;
                            case KubekPredefined.SERVER_CREATION_STEPS.DOWNLOADING_CORE:
                                description = "{{serverCreationSteps.downloadingCore}}";
                                break;
                            case KubekPredefined.SERVER_CREATION_STEPS.DOWNLOADING_JAVA:
                                description = "{{serverCreationSteps.downloadingJava}}";
                                break;
                            case KubekPredefined.SERVER_CREATION_STEPS.SEARCHING_CORE:
                                description = "{{serverCreationSteps.searchingCore}}";
                                break;
                            case KubekPredefined.SERVER_CREATION_STEPS.UNPACKING_JAVA:
                                description = "{{serverCreationSteps.unpackingJava}}";
                                break;
                        }
                    } else if (task.type === KubekPredefined.TASKS_TYPES.DOWNLOADING) {
                        icon = "deployed_code_update";
                        title = "{{tasksTypes.downloading}} " + task.filename;
                        description = "<div style='display: flex; margin: 4px 0; align-items: center'><div style='margin: 2px 1px; height: 4px; width: 100%; background: var(--bg-dark-accent-light)'><div style='width: " + task.progress + "%; height: 100%; background: var(--bg-primary-500)'></div></div><span style='margin-left: 4px; font-size: 12pt;'>" + task.progress + "%</span></div>";
                        iconBg = "bg-warning icon-bg";
                    } else if (task.type === KubekPredefined.TASKS_TYPES.INSTALLING) {
                        icon = "install_desktop";
                        title = "{{tasksTypes.installing}}";
                        description = task.description;
                    } else if (task.type === KubekPredefined.TASKS_TYPES.UPDATING) {
                        icon = "update";
                        title = "{{tasksTypes.updating}}";
                        description = task.description;
                    } else if (task.type === KubekPredefined.TASKS_TYPES.RESTARTING) {
                        icon = "restart_alt";
                        title = "{{tasksTypes.restarting}}";
                        description = task.description;
                    } else if (task.type === KubekPredefined.TASKS_TYPES.UNPACKING) {
                        icon = "archive";
                        title = "{{tasksTypes.unpacking}}";
                        description = task.description;
                    } else if (task.type === KubekPredefined.TASKS_TYPES.ZIPPING) {
                        icon = "archive";
                        title = "{{tasksTypes.zipping}}";
                        description = task.description;
                    } else if (task.type === KubekPredefined.TASKS_TYPES.DELETION) {
                        icon = "delete";
                        title = "{{tasksTypes.deletion}}";
                        description = task.server;
                        if(task.status === KubekPredefined.SERVER_CREATION_STEPS.COMPLETED){
                            window.location = "/?act=console";
                        }
                    }
                    this.addTask(id, icon, title, description, true, "symbol", iconBg);
                }
            })
            .catch(() => {
                if (!isConnectionLost) {
                    KubekUI.connectionLost();
                }
                isConnectionLost = true;
            });
    }
}

class KubekUtils {
  // Convertir tamaño de archivo a un formato legible por humanos
  static humanizeFileSize(size) {
      if (size < 1024) {
          size = size + " B";
      } else if (size < 1024 * 1024) {
          size = Math.round((size / 1024) * 10) / 10 + " Kb";
      } else if (size < 1024 * 1024 * 1024) {
          size = Math.round((size / 1024 / 1024) * 10) / 10 + " Mb";
      } else if (size >= 1024 * 1024 * 1024) {
          size = Math.round((size / 1024 / 1024 / 1024) * 10) / 10 + " Gb";
      } else {
          size = size + " ?";
      }
      return size;
  }

  // Convertir segundos a un formato legible por humanos
  static humanizeSeconds(seconds) {
      let hours = Math.floor(seconds / (60 * 60));
      let minutes = Math.floor((seconds % (60 * 60)) / 60);
      seconds = Math.floor(seconds % 60);

      return (
          this.padZero(hours) + "{{commons.h}} " +
          this.padZero(minutes) + "{{commons.m}} " +
          this.padZero(seconds) + "{{commons.s}}"
      );
  }

  // Añadir un cero delante de un número (para fechas)
  static padZero(number) {
      return (number < 10 ? "0" : "") + number;
  }

  // Seleccionar un color de degradado según una fracción
  static pickGradientFadeColor(fraction, color1, color2, color3) {
      let fade = fraction * 2;

      if (fade >= 1) {
          fade -= 1;
          color1 = color2;
          color2 = color3;
      }

      let diffRed = color2.red - color1.red;
      let diffGreen = color2.green - color1.green;
      let diffBlue = color2.blue - color1.blue;

      let gradient = {
          red: parseInt(Math.floor(color1.red + diffRed * fade), 10),
          green: parseInt(Math.floor(color1.green + diffGreen * fade), 10),
          blue: parseInt(Math.floor(color1.blue + diffBlue * fade), 10),
      };

      return `rgb(${gradient.red}, ${gradient.green}, ${gradient.blue})`;
  }

  // Obtener un color de degradado basado en el progreso
  static getProgressGradientColor(progress) {
      let color1 = { red: 46, green: 204, blue: 113 };
      let color2 = { red: 241, green: 196, blue: 15 };
      let color3 = { red: 231, green: 76, blue: 60 };

      return this.pickGradientFadeColor(progress / 100, color1, color2, color3);
  }

  // Generar un UUID v4
  // Generar un UUID v4 sin usar la librería crypto
  static uuidv4() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
          let r = Math.random() * 16 | 0; // Generar un número aleatorio entre 0 y 15
          let v = c === "x" ? r : (r & 0x3 | 0x8); // Usar 4 para la posición fija de versión y ajustar los bits de "y"
          return v.toString(16); // Convertir a hexadecimal
      });
  }


  // Obtener el nombre del archivo desde una ruta
  static pathFilename(path) {
      let rgx = /\\|\//gm;
      let spl = path.split(rgx);
      return spl[spl.length - 1];
  }

  // Obtener la extensión de un archivo desde una ruta
  static pathExt(path) {
      let spl = path.split(".");
      return spl[spl.length - 1];
  }

  // Hacer que los enlaces en un texto sean clicables
  static linkify(inputText) {
      let replacedText;
      let replacePattern1, replacePattern2, replacePattern3;

      // URLs que comienzan con http://, https:// o ftp://
      replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
      replacedText = inputText.replace(
          replacePattern1,
          '<a href="$1" target="_blank">$1</a>'
      );

      // URLs que comienzan con "www." (sin // delante)
      replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
      replacedText = replacedText.replace(
          replacePattern2,
          '$1<a href="http://$2" target="_blank">$2</a>'
      );

      // Convertir direcciones de correo electrónico en enlaces mailto
      replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
      replacedText = replacedText.replace(
          replacePattern3,
          '<a href="mailto:$1">$1</a>'
      );

      return replacedText;
  }
}
class KubekPredefined {
  // Права
  static PERMISSIONS = {
      DEFAULT: "default",
      ACCOUNTS: "accounts",
      FILE_MANAGER: "file_manager",
      MANAGE_SERVERS: "manage_servers",
      MAKING_SERVERS: "making_servers",
      MONITOR_SERVERS: "monitor_servers",
      MANAGE_JAVA: "manage_java",
      MANAGE_PLUGINS: "manage_plugins"
  };

  // См. название :)
  static API_ENDPOINT = "/api";

  // Переводы статусов серверов
  static SERVER_STATUSES_TRANSLATE = {
      "stopped": "{{serverStatus.stopped}}",
      "starting": "{{serverStatus.starting}}",
      "stopping": "{{serverStatus.stopping}}",
      "running": "{{serverStatus.running}}"
  }

  // Статусы серверов
  static SERVER_STATUSES = {
      STOPPED: "stopped",
      RUNNING: "running",
      STARTING: "starting",
      STOPPING: "stopping"
  }

  // Базовые типы задач
  static TASKS_TYPES = {
      DOWNLOADING: "downloading",
      INSTALLING: "installing",
      ZIPPING: "zipping",
      UNPACKING: "unpacking",
      UPDATING: "updating",
      RESTARTING: "restarting",
      CREATING: "creating",
      DELETION: "deletion",
      COMMON: "common",
      UNKNOWN: "unknown"
  }

  // Шаги создания сервера
  static SERVER_CREATION_STEPS = {
      SEARCHING_CORE: "searchingCore",
      CHECKING_JAVA: "checkingJava",
      DOWNLOADING_JAVA: "downloadingJava",
      UNPACKING_JAVA: "unpackingJava",
      DOWNLOADING_CORE: "downloadingCore",
      CREATING_BAT: "creatingBat",
      COMPLETION: "completion",
      COMPLETED: "completed",
      FAILED: "failed",
  }

  // REGEX для авторизации
  static PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,64}$/g;
  static LOGIN_REGEX = /^[a-zA-Z0-9_.-]{3,16}$/g;
  static EMAIL_REGEX = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;

  static MODAL_CANCEL_BTN = '<button class="dark-btn" onclick="KubekNotifyModal.destroyAllModals()">{{commons.close}}</button>';
}
let currentServerStatus = KubekPredefined.SERVER_STATUSES.STOPPED;
selectedServer = "";
if (window.localStorage.selectedServer) {
  selectedServer = window.localStorage.selectedServer;
}
// init logs
var uiDebugger = DebuggerGroupManager.create('UI');   
 uiDebugger.registerCallSite('kukeb-ui.js', 0).stack
 class KubekServerHeaderUI {
  /**
   * Refreshes the server header information
   * @param {Function} callback - Callback function to execute after refresh
   */
  static refreshServerHeader(callback) {
      this.loadServerByName(selectedServer, callback);
  }

  /**
   * Loads server information by server name and updates the UI
   * @param {string} server - Name of the server to load
   * @param {Function} callback - Callback function to execute after loading
   */
  static loadServerByName(server, callback = () => {}) {
      KubekServers.getServerInfo(server, (data) => {
          if (data.status !== false) {
              // Update server title
              const captionElement = document.querySelector('.content-header > .caption');
              if (captionElement) {
                  captionElement.textContent = server;
              }

              // Update server status
              this.setServerStatus(data.status);

              // Update server icon
              const iconElement = document.querySelector('.content-header .icon-bg img');
              if (iconElement) {
                  iconElement.src = `/api/servers/${server}/icon?${Date.now()}`;
              }

              callback(true);
          } else {
              callback(false);
          }
      });
  }

  /**
   * Updates the server status in the header and shows/hides relevant buttons
   * @param {string} status - The new server status
   * @returns {boolean} - Success status of the update
   */
  static setServerStatus(status) {
      const statusElement = document.querySelector('status-element');
      
      if (!KubekPredefined.SERVER_STATUSES_TRANSLATE[status]) {
          return false;
      }

      currentServerStatus = status;
      WebDebugger.log("status", status, KubekPredefined.SERVER_STATUSES_TRANSLATE[status]);
      WebDebugger.toggleLogs(false);
      // Hide all conditional elements
      const headerElements = document.querySelectorAll('.content-header .hide-on-change');
      headerElements.forEach(element => element.style.display = 'none');
      
      const moreButton = document.querySelector('.content-header #server-more-btn');
      moreButton.style.display = 'none';

      // Show relevant buttons based on status
      switch (status) {
          case KubekPredefined.SERVER_STATUSES.STARTING:
          case KubekPredefined.SERVER_STATUSES.STOPPING:
              statusElement.updateStatus(status, KubekPredefined.SERVER_STATUSES_TRANSLATE[status]);
              moreButton.style.display = 'block';
              break;

          case KubekPredefined.SERVER_STATUSES.RUNNING:
              statusElement.updateStatus(status, KubekPredefined.SERVER_STATUSES_TRANSLATE[status]);
              document.querySelector('.content-header #server-restart-btn').style.display = 'block';
              document.querySelector('.content-header #server-stop-btn').style.display = 'flex';
              moreButton.style.display = 'block';
              break;

          case KubekPredefined.SERVER_STATUSES.STOPPED:
              document.querySelector('.content-header #server-start-btn').style.display = 'flex';
              statusElement.updateStatus(status, KubekPredefined.SERVER_STATUSES_TRANSLATE[status]);
              break;
      }

      return true;
  }
}
class KubekUI {
    // Cargar sección en bloque - Reemplazamos $.get por fetch
    static loadSection = (name, container = "body", cb = () => {}) => {
        fetch(`/sections/${name}.html`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(code => {
                console.log("Loading section:", name, container);
                //$(container).append(code);
                //container.appendChild(code);
                //document.querySelector(container).appendChild(code);
                cb();
            })
            .catch(error => {
                console.error('Error loading section:', error);
            });
    }

    static showPreloader() {

    }

    static hidePreloader() {

    }

    static setActiveItemByPage(page) {
        document.querySelectorAll("#main-menu-sidebar .sidebar-item").forEach(item => {
            if (item.dataset.page === page) {
                item.classList.add("active");
            }
        });
    }

    static setAllSidebarItemsUnactive() {
        document.querySelectorAll("#main-menu-sidebar .sidebar-item").forEach(item => {
            item.classList.remove("active");
        });
    }

    static changeItemByPage = (page) => {
        this.setAllSidebarItemsUnactive();
        this.setActiveItemByPage(page);
    }

    static loadSelectedServer = () => {
        if (typeof window.localStorage.selectedServer !== "undefined") {
            selectedServer = window.localStorage.selectedServer;
            KubekServerHeaderUI.loadServerByName(selectedServer, (result) => {
                uiDebugger.log('loadSelectedServer, loadServerByName',selectedServer, result);
                if (result === false) {
                    KubekServers.getServersList((list) => {
                        window.localStorage.selectedServer = list[0];
                        uiDebugger.log('loadSelectedServer, getServersList',selectedServer, list);
                    });
                }
            });
        } else {
            KubekServers.getServersList((list) => {
                uiDebugger.log('loadSelectedServer, getServersList',selectedServer, list);
                window.localStorage.selectedServer = list[0];
            });
        }
    }

    static loadServersList() {
            KubekServers.getServersList(servers => {
                const allserver = [];
                if (!servers) return;
                console.log("servers getServersList", servers);
                servers.forEach(serverItem => {
                    const sidebar = document.querySelector('server-menu');
                    console.log("sidebar", sidebar);
                    const parsedserver = {
                        title: serverItem,
                        icon: `/api/servers/${serverItem}/icon`
                    }
                    allserver.push(parsedserver);
                    sidebar.setServersList(allserver);
                    uiDebugger.log('loadServersList, getServersList',serverItem, servers);
                    const isActive = serverItem === localStorage.selectedServer ? " active" : "";
                    const serverElement = document.createElement("div");
                    serverElement.className = `server-item sidebar-item${isActive}`;
                    serverElement.onclick = () => {
                        localStorage.selectedServer = serverItem;
                        location.reload();
                    };
                    serverElement.innerHTML = `
                        <div class="icon-circle-bg">
                            <img style="width: 24px; height: 24px;" alt="${serverItem}" src="/api/servers/${serverItem}/icon">
                        </div>
                        <span>${serverItem}</span>
                    `;
                    sidebar.appendChild(serverElement);
                });
            });
        
    }

    static connectionLost() {
        KubekAlerts.addAlert("{{commons.connectionLost}}", "warning", moment().format("DD.MM / HH:MM:SS"), 6000);
        this.showPreloader();
    }

    static connectionRestored() {
        KubekAlerts.addAlert("{{commons.connectionRestored}}", "check", moment().format("DD.MM / HH:MM:SS"), 3000);
        setTimeout(() => {
          //console.log("connectionRestored");
        }, 1000);
    }

    static toggleSidebar() {
        const sidebar = document.querySelector(".main-layout .sidebar");
        const blurScreen = document.querySelector(".blurScreen");

        if (window.matchMedia("(max-width: 1360px)").matches && sidebar) {
            if (sidebar.classList.contains("minimized")) {
                sidebar.classList.remove("minimized");
                if (blurScreen) blurScreen.style.display = "block";
            } else {
                sidebar.classList.add("minimized");
                if (blurScreen) blurScreen.style.display = "none";
            }
        }
    }

    static setTitle(title) {
        document.title = title;
    }
    static refreshConsoleLog = () => {
      let consoleTextElem = document.querySelector('game-console');
      if (consoleTextElem) {
          //console.log("consoleTextElem", consoleTextElem, typeof consoleTextElem);
          KubekServers.getServerLog(selectedServer, (data) => {
              if (!data) return;
              //console.log("getServerLog", selectedServer, {data});
              consoleTextElem.refreshConsoleLog(data.serverLog);
          });
      }
  }
}
setInterval(() => {
  KubekUI.refreshConsoleLog();
}, 1000);
const animateCSSJ = (element, animation, fast = true, prefix = "animate__") => {
    return new Promise((resolve) => {
        const animationName = `${prefix}${animation}`;
        const node = document.querySelector(element);

        if (fast) {
            node.classList.add(`${prefix}animated`, animationName, `${prefix}faster`);
        } else {
            node.classList.add(`${prefix}animated`, animationName);
        }

        function handleAnimationEnd(event) {
            event.stopPropagation();
            node.classList.remove(`${prefix}animated`, animationName, `${prefix}faster`);
            resolve("Animation ended");
        }

        node.addEventListener("animationend", handleAnimationEnd, { once: true });
    });
};
let refreshIntervals = {};
let isItFirstLogRefresh = false;
let previousConsoleUpdateLength = 0;
let timeStampRegexp = /\[[0-9]{2}\:[0-9]{2}\:[0-9]{2}\]/gm;

class KubekRefresher {
    // Добавить рефреш-интервал
    static addRefreshInterval = (interval, handler, name) => {
        refreshIntervals[name] = setInterval(handler, interval);
    }

    // Удалить рефреш-интервал
    static removeRefreshInterval = (name) => {
        clearInterval(refreshIntervals[name]);
    }

    // Добавить интервал обновления server header (каждые 2 секунды)
    static addRefreshServerHeaderInterval = () => {
        this.addRefreshInterval(1500, () => {
            KubekServerHeaderUI.refreshServerHeader(() => {
            });
        }, "serverHeader");
    };

    // Добавить интервал обновления server log (каждые 650 мсек)
    static addRefreshServerLogInterval = () => {
        this.addRefreshInterval(650, () => {
            this.refreshConsoleLog();
        }, "serverConsole");
    };

    // Добавить интервал обновления использования рес-ов (каждые 4 сек)
    static addRefreshUsageInterval = () => {
        this.addRefreshInterval(5000, () => {
            if (typeof KubekConsoleUI !== "undefined") {
                KubekHardware.getUsage((usage) => {
                    if (!usage) return;
                    KubekConsoleUI.refreshUsageItems(usage.cpu, usage.ram.percent, usage.ram);
                });
            }
        }, "usage");
    }

    // Обновить текст в консоли
    static refreshConsoleLog = () => {
        let consoleTextElem = document.querySelector('game-console');
        if (consoleTextElem) {
            //console.log("consoleTextElem", consoleTextElem, typeof consoleTextElem);
            KubekServers.getServerLog(selectedServer, (data) => {
                if (!data) return;
                //console.log("getServerLog", selectedServer, {data});
                consoleTextElem.refreshConsoleLog(data.serverLog);
            });
        }
    }

    // Интервал обновления списка задач
    static addRefreshTasksInterval = () => {
        this.addRefreshInterval(500, () => {
            KubekTasksUI.refreshTasksList();
        }, "tasksList");
    }
}
KubekRefresher.addRefreshServerLogInterval();
KubekRefresher.addRefreshServerHeaderInterval();
KubekRefresher.addRefreshUsageInterval();
KubekRefresher.addRefreshTasksInterval();
KubekUI.loadServersList();