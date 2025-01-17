ACCOUNT_ITEM = "<div class='item' data-account='$0'><div class='iconBg'><span class='material-symbols-rounded'>person</span></div><span>$0</span></div>";
NEW_ACCOUNT_ITEM = "<div class='item' data-account='newAccItem'><div class='iconBg'><span class='material-symbols-rounded'>add</span></div><span>{{kubekSettings.addNewAccount}}</span></div>";
LANGUAGE_ITEM = '<div class="item" data-lang="$0"> <div class="text" style="display: flex; justify-content: center; flex-direction: column"> <span>$1 <sup style="color: var(--bg-dark-accent-lighter)">by $3</sup></span> <span style="color: var(--bg-dark-accent-lighter)">$2</span> </div> <span class=\'check material-symbols-rounded\'>check</span> </div>';

currentEditorMode = null;
currentConfig = null;

$(function () {
    KubekUI.setTitle("Kubek | {{sections.kubekSettings}}");

    KubekSettingsUI.refreshLanguagesList(() => {
        // Бинды кликов на языки
        $("#language-list .item").on("click", function () {
            if (!$(this).hasClass("active")) {
                $("#language-list .item.active").removeClass("active");
                $(this).addClass("active");
            }
        });

        KubekSettingsUI.loadConfig();
        KubekSettingsUI.refreshUsersList();
    })

    $(".userEditModal input[type='checkbox']").on("change", () => {
        KubekSettingsUI.validateInputs();
    });

    $(".userEditModal input[type='email'], .userEditModal input[type='password'], .userEditModal input[type='text']").on("input", () => {
        KubekSettingsUI.validateInputs();
    });

    // Скрытие/показ списка разрешённых серверов при переключении... переключателя
    $(".userEditModal #restrict-servers-access").on("change", function () {
        $(this).is(":checked") ? $(".userEditModal #allowed-servers-list").show() : $(".userEditModal #allowed-servers-list").hide();
    });

    $(".userEditModal #delete-account-btn").on("click", function () {
        let username = $(".userEditModal #username-input").val();
        KubekRequests.delete("/accounts/" + username, () => {
            KubekSettingsUI.hideUserEditor();
            KubekSettingsUI.refreshUsersList();
        });
    });

    // Обновляем список серверов
    KubekServers.getServersList((servers) => {
        servers.forEach(server => {
            $(".userEditModal #allowed-servers-list").append('<div class="item" data-server="' + server + '"><span class="text">' + server + '</span><span class="material-symbols-rounded check">check</span></div>');
        })

        $(".userEditModal #allowed-servers-list .item").on("click", function () {
            $(this).hasClass("active") ? $(this).removeClass("active") : $(this).addClass("active");
        });
    });

    // Загружаем версию Kubek
    KubekRequests.get("/kubek/version", (version) => {
        $("#kubek-version").text(version)
    });
});

KubekSettingsUI = class {
    // Получить конфиг
    static getConfig = (cb = () => {
    }) => {
      var urlink = "/kubek/settings";  
      KubekRequests.get(urlink, cb);
      console.log("urlink", urlink);    
    }

    // Загрузить конфиг в интерфейс
    static loadConfig = (cb = () => { }) => {
        this.getConfig((config) => {
          currentConfig = config;
          //const recatogrized = getcategorizeddata(config);
          console.log("config", config, currentConfig);
            const serverPortInput = document.querySelector('#server-port-input');
            serverPortInput.setInputValues(config.webserverPort);
            const ftpLoginInput = document.querySelector('#ftp-login-input');
            ftpLoginInput.setInputValues(config.ftpd.username);
            const ftpPasswordInput = document.querySelector('#ftp-password-input');
            ftpPasswordInput.setInputValues(config.ftpd.password);
            const ftpPortInput = document.querySelector('#ftp-port-input');
            ftpPortInput.setInputValues(config.ftpd.port);
            const authEnabled = document.querySelector('#auth-enabled');
            authEnabled.setInputValues(config.authorization);
            const ftpServerEnabled = document.querySelector('#ftp-server-enabled');
            ftpServerEnabled.setInputValues(config.ftpd.enabled);
            const ipsAccessSwitch = document.querySelector('#ips-access-switch');
            ipsAccessSwitch.setInputValues(config.allowOnlyIPsList);
            const subnetsInput = document.querySelector('#subnets-list');
            subnetsInput.setInputValues(config.IPsAllowed);
            console.log("config.IPsAllowed", config.IPsAllowed);
            selectedLanguage(config.language);
            cb();
        });
    }

    // Сохранить конфигурацию
    static saveConfig = () => {
        let language = getLanguage();
        let serverPort =  document.querySelector('#server-port-input').getInputValues();
        let ftpEnabled = document.querySelector('#ftp-server-enabled').getInputValues();
        let ftpLogin = document.querySelector('#ftp-login-input').getInputValues();
        let ftpPassword = document.querySelector('#ftp-password-input').getInputValues();
        let ftpPort = document.querySelector('#ftp-port-input').getInputValues();
        let authorization = document.querySelector('#auth-enabled').getInputValues();
        let ipsAccess = document.querySelector('#ips-access-switch').getInputValues();
        let subnets = document.querySelector('#subnets-list').getInputValues();
        currentConfig.language = language;
        currentConfig.webserverPort = serverPort;
        currentConfig.ftpd.enabled = ftpEnabled;
        currentConfig.ftpd.username = ftpLogin;
        currentConfig.ftpd.password = ftpPassword;
        currentConfig.ftpd.port = ftpPort;
        currentConfig.authorization = authorization;
        currentConfig.allowOnlyIPsList = ipsAccess;
        currentConfig.IPsAllowed = subnets;
        console.log("currentConfig", currentConfig);
        const componentdata = getAllInputValues();
        console.log("componentdata", componentdata);
        KubekRequests.put("/kubek/settings?config=" + Base64.encodeURI(JSON.stringify(currentConfig)), (result) => {
            if (result === true) {
                KubekAlerts.addAlert("{{kubekSettings.configSaved}}", "check", "", 5000);
            } else {
                KubekAlerts.addAlert("{{kubekSettings.configNotSaved}}", "warning", result.toString(), 5000);
            }
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        });
    }

    // Обновить список пользователей
    static refreshUsersList = () => {
        $("#accounts-list").html("");
        KubekRequests.get("/accounts", (accounts) => {
          console.log("accounts", accounts);
            $("#accounts-list").append(NEW_ACCOUNT_ITEM);
            accounts.forEach((account) => {
                $("#accounts-list").append(ACCOUNT_ITEM.replaceAll("$0", account));
            });

            $("#accounts-list .item").on("click", function () {
                let account = $(this).data("account");
                if (account === "newAccItem") {
                    KubekSettingsUI.showNewUserEditor();
                } else {
                    KubekSettingsUI.openUserEditorByUsername(account);
                }
            });
        });
    }

    // Переключить переключатель
    static switchASwtich = (element, state) => {
        if (state === true) {
            $(element).attr("checked", true);
        } else {
            $(element).removeAttr("checked");
        }
    };

    // Сбросить значения в редакторе пользователей
    static resetUserEditorValues = () => {
        $(".userEditModal input[type=checkbox]").removeAttr("checked");
        $(".userEditModal input[type=text], .userEditModal input[type=email], .userEditModal input[type=password]").val("");
        $(".userEditModal #allowed-servers-list .item.active").removeClass("active");
        $(".userEditModal #allowed-servers-list").hide();
    };

    // Открыть редактор в режиме создания нового пользователя
    static showNewUserEditor = () => {
        this.resetUserEditorValues();
        $(".userEditModal #delete-account-btn").hide();
        //$(".userEditModal #password-input").show();
        //$(".userEditModal #password-rules").show();
        $(".userEditModal #save-btn").attr("disabled", true);
        this.showUserEditor();
        currentEditorMode = "new";
    }

    // Получить данные по username и передать их в редактор
    static openUserEditorByUsername = (username) => {
        KubekRequests.get("/accounts/" + username, (data) => {
            this.showExistingUserEditor(data.username, data.email, data.permissions, data.serversAccessRestricted, data.serversAllowed);
        });
    };

    // Загрузить данные пользователя в поля редактора
    static showExistingUserEditor = (username, email, permissions, serversRestricted, allowedServersList) => {
        this.resetUserEditorValues();
        $(".userEditModal #delete-account-btn").show();
        //$(".userEditModal #password-input").hide();
        //$(".userEditModal #password-rules").hide();
        $(".userEditModal #username-input").val(username);
        $(".userEditModal #email-input").val(email);
        permissions.forEach((permItem) => {
            $(".userEditModal #perm-" + permItem).attr("checked", true);
        });
        if (serversRestricted === true) {
            $(".userEditModal #restrict-servers-access").attr("checked", true);
            $(".userEditModal #allowed-servers-list").show();
            allowedServersList.forEach((allowedServer) => {
                $(".userEditModal #allowed-servers-list .item[data-server='" + allowedServer + "']").addClass("active");
            });
        }
        this.showUserEditor();
        currentEditorMode = "existing";
    }

    // Показать интерфейс редактора
    static showUserEditor = () => {
        $(".blurScreen").show();
        $(".userEditModal").show();
    }

    // Скрыть интерфейс редактор
    static hideUserEditor = () => {
        $(".blurScreen").hide();
        $(".userEditModal").hide();
    }

    // Получить список выбранных серверов (для restrict access)
    static getSelectedServersInList = () => {
        let servers = [];
        $(".userEditModal #allowed-servers-list .item.active").each((i, item) => {
            servers.push($(item).data("server"));
        });
        return servers;
    };

    // Валидировать поля ввода
    static validateInputs = () => {
        let username = $(".userEditModal #username-input").val();
        let email = $(".userEditModal #email-input").val();
        let password = $(".userEditModal #password-input").val();

        if (username.match(KubekPredefined.LOGIN_REGEX) != null) {
            $(".userEditModal #username-input").removeClass("error");
        } else {
            $(".userEditModal #username-input").addClass("error");
            $(".userEditModal #save-btn").attr("disabled", true);
            return;
        }

        if (email === "" || email.match(KubekPredefined.EMAIL_REGEX) != null) {
            $(".userEditModal #email-input").removeClass("error");
        } else {
            $(".userEditModal #email-input").addClass("error");
            $(".userEditModal #save-btn").attr("disabled", true);
            return;
        }

        if (password.match(KubekPredefined.PASSWORD_REGEX) != null || (currentEditorMode !== "new" && password === "")) {
            $(".userEditModal #password-input").removeClass("error");
        } else {
            $(".userEditModal #password-input").addClass("error");
            $(".userEditModal #save-btn").attr("disabled", true);
            return;
        }

        $(".userEditModal #save-btn").removeAttr("disabled");
    }

    // Получить список выбранных пермсов
    static getSelectedPermissions = () => {
        let perms = [];
        $(".userEditModal .permissions input[type=checkbox]:checked").each((i, el) => {
            perms.push($(el)[0].id.replace("perm-", ""));
        });
        return perms;
    }

    // Сохранить нового/существующего пользователя
    static saveUser = () => {
        let login = $(".userEditModal #username-input").val();
        let password = $(".userEditModal #password-input").val();
        let email = $(".userEditModal #email-input").val();
        let isServersRestricted = $(".userEditModal #restrict-servers-access").is(":checked");
        let selectedServersInList = this.getSelectedServersInList();
        let permissions = this.getSelectedPermissions().join(",");
        if (!isServersRestricted) {
            selectedServersInList = [];
        }
        let reqURL;
        if (currentEditorMode === "new") {
            if (selectedServersInList.length === 0) {
                reqURL = "/accounts?login=" + login + "&email=" + email + "&permissions=" + permissions + "&password=" + password;
            } else {
                selectedServersInList = selectedServersInList.join(",");
                reqURL = "/accounts?login=" + login + "&email=" + email + "&servers=" + selectedServersInList + "&permissions=" + permissions + "&password=" + password;
            }
            KubekRequests.put(reqURL, (result) => {
                KubekSettingsUI.hideUserEditor();
                if (result === true) {
                    KubekAlerts.addAlert("{{kubekSettings.userAdded}}", "check", login, 5000);
                } else {
                    KubekAlerts.addAlert("{{kubekSettings.userNotAdded}}", "warning", login, 5000);
                }
                KubekSettingsUI.refreshUsersList();
            });
        } else {
            if (selectedServersInList.length === 0) {
                reqURL = "/accounts/" + login + "?email=" + email + "&permissions=" + permissions;
            } else {
                selectedServersInList = selectedServersInList.join(",");
                reqURL = "/accounts/" + login + "?email=" + email + "&servers=" + selectedServersInList + "&permissions=" + permissions;
            }
            if (password !== "") {
                reqURL += "&password=" + password;
            }
            KubekRequests.put(reqURL, (result) => {
                KubekSettingsUI.hideUserEditor();
                if (result === true) {
                    KubekAlerts.addAlert("{{kubekSettings.userSaved}}", "check", login, 5000);
                } else {
                    KubekAlerts.addAlert("{{kubekSettings.userNotEdited}}", "warning", login, 5000);
                }
                KubekSettingsUI.refreshUsersList();
            });
        }
    }

    // Функция для обновления списка языков
    static refreshLanguagesList = (cb) => {
        KubekRequests.get("/kubek/rawlanguages", (langs) => {
          console.log("rawlanguages", langs);
          localStorage.setItem("rawlanguages", JSON.stringify(langs));
        });
        KubekRequests.get("/kubek/languages", (langs) => {
          console.log("langs", langs);  
          setlangselector(langs);
            $("#language-list").html("");
            Object.values(langs).forEach(lang => {
                $("#language-list").append(LANGUAGE_ITEM.replaceAll("$0", lang.code).replaceAll("$1", lang.displayName).replaceAll("$2", lang.displayNameEnglish).replaceAll("$3", lang.author));
            });
            cb();
        });
    };
}
function setAllInputValues(dataObject) {
  const inputs = document.querySelectorAll('custom-input');
  
  inputs.forEach(input => {
    const id = input.getAttribute('id');
    const name = input.getAttribute('name');
    
    // Buscar el valor en el objeto usando id o name como clave
    const value = dataObject[id] || dataObject[name];
    
    if (value !== undefined) {
      input.setInputValues(value);
    }
  });
}
function getAllInputValues() {
  const allData = {};
  const inputs = document.querySelectorAll('custom-input');
  
  inputs.forEach((input) => {
    const id = input.getAttribute('id');
    const value = input.getInputValues();
    allData[id] = value;
  });
  
  return allData;
}
var makeAjaxRequest = (url, type, data = "", apiEndpoint = true, cb = () => {}) => {
  if (apiEndpoint) {
      url = KubekPredefined.API_ENDPOINT + url;
  }

  const options = {
      method: type.toUpperCase(),
      headers: {}
  };

  if (data !== "") {
      options.body = data; // Para enviar datos en la solicitud
      // Si necesitas enviar JSON, descomenta la línea siguiente
      // options.headers["Content-Type"] = "application/json";
  }

  fetch(url, options)
      .then(response => {
          if (!response.ok) {
              if (response.status === 403) {
                  KubekAlerts.addAlert(
                      "{{commons.failedToRequest}}", 
                      "warning", 
                      "{{commons.maybeUDoesntHaveAccess}}", 
                      5000
                  );
              }
              throw new Error(`${response.statusText} (status: ${response.status})`);
          }
          return response.json(); // O response.text(), según la respuesta esperada
      })
      .then(data => cb(data))
      .catch((error) => {
          cb(false, error.message, error);
      });
};

function refreshLanguagesList(cb) {
  var apiget = (url, callback, apiEndpoint = true) => {
    makeAjaxRequest(url, "GET", "", apiEndpoint, callback);
  }
  var settingslink = "/kubek/settings"; 
  var languageslink = "/kubek/languages";
  apiget(languageslink, (langs) => {
/*       $("#language-list").html("");
      Object.values(langs).forEach(lang => {
          $("#language-list").append(LANGUAGE_ITEM.replaceAll("$0", lang.code).replaceAll("$1", lang.displayName).replaceAll("$2", lang.displayNameEnglish).replaceAll("$3", lang.author));
      });
      cb(); */
      cb();
      console.log("langs", langs);
      setlangselector(langs);
      return langs;
  });
};
if (!customElements.get('custom-input')) {
  class CustomInput extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.handleInputChange = this.handleInputChange.bind(this);
      }
    
      static get observedAttributes() {
        return ['type', 'id', 'name', 'value', 'placeholder', 'disabled', 'readonly', 'darkmode'];
      }
    
      getStyles() {
        const darkMode = this.hasAttribute('darkmode');
        
        return `
          :host {
            display: block;
            margin: 10px 0;
            color-scheme: light dark;
          }
          
          .input-container {
            display: flex;
            flex-direction: column;
            padding: 8px;
          }
          
          input, textarea {
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
          input:disabled, textarea:disabled {
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
          
          input:focus, textarea:focus {
            outline: none;
            border-color: #2196F3;
            box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
          }
        `;
      }
    
      connectedCallback() {
        this.render();
        const input = this.shadowRoot.querySelector('input, textarea');
        if (input) {
          input.addEventListener('input', this.handleInputChange);
          input.addEventListener('change', this.handleInputChange);
        }
      }
    
      disconnectedCallback() {
        const input = this.shadowRoot.querySelector('input, textarea');
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
    
        this.shadowRoot.innerHTML = `
          <style>${this.getStyles()}</style>
          <div class="input-container">
            ${this.renderInput(type, id, name, value, placeholder, disabled, readonly)}
          </div>
        `;
    
        // Reattach event listeners after rendering
        const input = this.shadowRoot.querySelector('input, textarea');
        if (input) {
          input.addEventListener('input', this.handleInputChange);
          input.addEventListener('change', this.handleInputChange);
        }
      }
    
      renderInput(type, id, name, value, placeholder, disabled, readonly) {
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
        const input = this.shadowRoot.querySelector('input, textarea');
        if (!input) return null;
    
        if (input.type === 'checkbox') {
          return input.checked;
        }
        
        if (input.tagName.toLowerCase() === 'textarea') {
          return input.value.split('\n');
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
        const input = this.shadowRoot.querySelector('input, textarea');
        if (!input) return;
    
        if (input.type === 'checkbox') {
          input.checked = Boolean(value);
        } else if (Array.isArray(value) && input.tagName.toLowerCase() === 'textarea') {
          input.value = value.join('\n');
        } else {
          input.value = value;
        }
    
        // Dispatch event when setting values programmatically
        this.handleInputChange();
      }
    
      resetInputValues() {
        const input = this.shadowRoot.querySelector('input, textarea');
        if (!input) return;
    
        if (input.type === 'checkbox') {
          input.checked = false;
        } else {
          input.value = '';
        }
    
        // Dispatch event when resetting values
        this.handleInputChange();
      }
    }
  customElements.define('custom-input', CustomInput);
}
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
var langSelector = document.querySelector('language-selector');
// transform objeto en array
var objlang = {
  en: {
    code: "en",
    id: "en",
    displayName: "English",
    displayNameEnglish: "English",
    author: "Seeroy"
  },
  es: {
    code: "es",
    id: "es",
    displayName: "Español",
    displayNameEnglish: "Spanish",
    author: "melser"
  },
};
langSelector.langs = Object.values(objlang);
function setlangselector(langs = []) {
  const objtoarray = Object.values(langs);
  console.log("langs", langs, objtoarray);
  if (!langs.length) {
    langSelector.langs = objtoarray;
  } else {
    langSelector.langs = langs;
  }
}
function selectedLanguage(value) {
  langSelector.selected = value;
}
function getLanguage() {
  return langSelector.selected;
}
// Listen for language changes
langSelector.addEventListener('language-change', (event) => {
  console.log('Selected language:', event.detail.langCode);
  console.log('Language data:', event.detail.language);
});
/* class ObjectCategorizer {
  constructor(categoryArrays, options = {}) {
      this.validateInput(categoryArrays);
      
      const defaultOptions = {
          uncategorizedKey: 'uncategorized',
          allowMultipleCategories: false
      };
      
      this.options = { ...defaultOptions, ...options };
      this.categoryMappings = this.buildCategoryMappings(categoryArrays);
  }

  validateInput(categoryArrays) {
      if (!categoryArrays || typeof categoryArrays !== 'object') {
          throw new Error('Category arrays must be provided as an object');
      }

      for (const [category, fields] of Object.entries(categoryArrays)) {
          if (!Array.isArray(fields)) {
              throw new Error(`Category ${category} must be an array`);
          }
      }
  }

  buildCategoryMappings(categoryArrays) {
      const mappings = new Map();
      
      for (const [category, fields] of Object.entries(categoryArrays)) {
          fields.forEach(field => {
              if (mappings.has(field) && !this.options.allowMultipleCategories) {
                  throw new Error(`Field "${field}" is already mapped to category "${mappings.get(field)}"`);
              }
              
              if (this.options.allowMultipleCategories) {
                  if (!mappings.has(field)) {
                      mappings.set(field, new Set());
                  }
                  mappings.get(field).add(category);
              } else {
                  mappings.set(field, category);
              }
          });
      }
      
      return mappings;
  }

  categorizeObject(inputObject) {
      if (!inputObject || typeof inputObject !== 'object') {
          throw new Error('Input must be an object');
      }

      const result = this.initializeResultObject();

      for (const [key, value] of Object.entries(inputObject)) {
          if (this.categoryMappings.has(key)) {
              this.assignValueToCategories(result, key, value);
          } else {
              result[this.options.uncategorizedKey][key] = value;
          }
      }

      return result;
  }

  initializeResultObject() {
      const result = {};
      const uniqueCategories = new Set(
          Array.from(this.categoryMappings.values())
          .flatMap(cat => this.options.allowMultipleCategories ? Array.from(cat) : [cat])
      );

      uniqueCategories.forEach(category => {
          result[category] = {};
      });
      result[this.options.uncategorizedKey] = {};

      return result;
  }

  assignValueToCategories(result, key, value) {
      const categories = this.categoryMappings.get(key);
      
      if (this.options.allowMultipleCategories) {
          categories.forEach(category => {
              result[category][key] = value;
          });
      } else {
          result[categories][key] = value;
      }
  }
}
const categoryArrays = {
  general: [
      'webserverPort',
      'allowOnlyIPsList',
      'IPsAllowed'
  ],
  security: [
      'authorization'
  ],
  system: [
      'eulaAccepted',
      'configVersion'
  ],
  services: [
      'ftpd',
      'telegramBot'
  ]
};
const categorizer = new ObjectCategorizer(categoryArrays, {
  uncategorizedKey: 'other',
  allowMultipleCategories: true
});
function getcategorizeddata(data) {
  const categorizedData = categorizer.categorizeObject(data);
  return categorizedData;
}
class InputFieldsElement extends HTMLElement {
  static get observedAttributes() {
      return ['data-id'];
  }

  getStyles() {
      return `
          :host {
              display: flex;
              flex-direction: column;
              gap: 16px;
              width: 100%;
              padding: 16px;
              box-sizing: border-box;
              color-scheme: light dark;
          }
        .hidden {
            display: none;
        }
          .field-container {
              display: flex;
              align-items: center;
              gap: 8px;
          }

          .primary-btn {
              padding: 8px 16px;
              background: #007bff;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              align-self: flex-start;
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
              border-radius: 34px;
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
              border-radius: 50%;
          }
          
          input:checked + .slider {
              background-color: #2196F3;
          }
          
          input:focus + .slider {
              box-shadow: 0 0 1px #2196F3;
          }
          
          input:checked + .slider:before {
              transform: translateX(26px);
          }

          input[type="text"], input[type="number"] {
              padding: 8px;
              border-radius: 4px;
              border: 1px solid #ccc;
              font-size: 14px;
              width: 200px;
          }

          input[type="text"]:focus, input[type="number"]:focus {
              outline: none;
              border-color: #007bff;
              box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
          }
      `;
  }

  constructor() {
      super();
      this.SWITCH_ELEMENT = '<label class="switch"><input type="checkbox"$0><span class="slider"></span></label>';
      this.NUMBER_INPUT = '<input type="number" value="$0">';
      this.TEXT_INPUT = '<input type="text" value="$0">';
      this.propertyTypes = new Map();
      
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
          <style>${this.getStyles()}</style>
          <div id="fields-container"></div>
          <button id="save-btn" class="primary-btn hidden">Save</button>
      `;
  }

  getValueType(value) {
      if (value === null) return "null";
      const type = typeof value;
      return (type === "boolean" || type === "number") ? type : "string";
  }

  parseValueByType(value, type) {
      switch (type) {
          case "null": return null;
          case "boolean": return value === "true" || value === true;
          case "number":
              const num = Number(value);
              return isNaN(num) ? 0 : num;
          default: return String(value);
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

  setProperties(properties, typeOverrides = {}) {
      this.propertyTypes.clear();
      const container = this.shadowRoot.querySelector('#fields-container');
      container.innerHTML = '';
      
      for (const [key, value] of Object.entries(properties)) {
          const originalType = typeOverrides[key] || this.getValueType(value);
          this.propertyTypes.set(key, originalType);

          let displayValue = value;
          if (originalType === "null") {
              displayValue = "";
          }

          const fieldDiv = document.createElement('div');
          fieldDiv.className = 'field-container';
          fieldDiv.innerHTML = this.createInput(this.propertyTypes.get(key), displayValue);
          fieldDiv.dataset.key = key;
          fieldDiv.dataset.propertyType = this.propertyTypes.get(key);
          container.appendChild(fieldDiv);
      }
  }

  getProperties() {
      const properties = {};
      
      this.shadowRoot.querySelectorAll('#fields-container .field-container').forEach(field => {
          const key = field.dataset.key;
          const originalType = this.propertyTypes.get(key);
          
          let rawValue;
          const checkbox = field.querySelector('input[type="checkbox"]');
          if (checkbox) {
              rawValue = checkbox.checked;
          } else {
              rawValue = field.querySelector('input').value;
          }

          properties[key] = this.parseValueByType(rawValue, originalType);
      });

      return properties;
  }

  connectedCallback() {
      this.shadowRoot.querySelector('#save-btn').addEventListener('click', () => {
          const properties = this.getProperties();
          const dataId = this.getAttribute('data-id');
          
          this.dispatchEvent(new CustomEvent('properties-save', {
              bubbles: true,
              composed: true,
              detail: {
                  id: dataId,
                  properties
              }
          }));
      });
  }
}

customElements.define('input-fields', InputFieldsElement); */

/* const generalFields = document.querySelector('#general-fields');
const securityFields = document.querySelector('#security-fields');
const systemFields = document.querySelector('#FTP-fields');
function setPropertiestoInputs(properties, fields) {
  const typesofproperties = {
    webserverPort: "number",
    allowOnlyIPsList: "boolean",
    IPsAllowed: "string",
    authorization: "boolean",
    eulaAccepted: "boolean",
    configVersion: "string",
  }
  switch (fields) {
    case 'general':
      generalFields.setProperties(properties, typesofproperties);
      break;
    case 'security':
      securityFields.setProperties(properties, typesofproperties);
      break;
    case 'FTP':
      systemFields.setProperties(properties, typesofproperties);
      break;
  }
}

 */







/*$(document).ready(function () {
  loadUsersList();
  loadKubekSettings();
  $.get("/kubek/tgOTP", function (otp) {
    $(".tgbot-otp").val(otp);
  });
  $("#tgbot-checkbox").change(function () {
    if ($(this).is(":checked")) {
      $("#tgbot-token-item").show();
      $("#tgbot-otp-item").show();
    } else {
      $("#tgbot-token-item").hide();
      $("#tgbot-otp-item").hide();
    }
  });
  $("#auth-checkbox").change(function () {
    if ($(this).is(":checked")) {
      $("#auth-users-item").show();
      showModal("needtosave-auth-warn-modal", "fadeIn");
      startNSAModalTimeout();
    } else {
      $("#auth-users-item").hide();
    }
  });
  $("#ftpserver-checkbox").change(function () {
    if ($(this).is(":checked")) {
      $("#ftp-login-item").show();
      $("#ftp-pass-item").show();
    } else {
      $("#ftp-login-item").hide();
      $("#ftp-pass-item").hide();
    }
  });

  $("#blurrange-range").change(function () {
    window.localStorage.setItem("blurrange", $(this).val());
    refreshBlurRange();
  });

  $("#backgrounds-select").change(function () {
    window.localStorage.setItem(
      "background",
      $(this).find("option:selected").val()
    );
    refreshBackgroundImage();
  });
  $("#toastspos-select").change(function () {
    window.localStorage.setItem(
      "toastspos",
      $(this).find("option:selected").val()
    );
    refreshToastsPosition();
    Toaster("Test", 800, false, "success");
  });
  $("#fontfamily-select").change(function () {
    window.localStorage.setItem(
      "fontfamily",
      $(this).find("option:selected").val()
    );
    refreshFont();
  });

  $("#noupdatenotify-checkbox").change(function () {
    window.localStorage.setItem(
      "noupdatenotify",
      $(this).is(":checked").toString()
    );
  });
  $("#norounded-checkbox").change(function () {
    window.localStorage.setItem("norounded", $(this).is(":checked").toString());
    refreshNoRounded();
  });
  $("#nolowpriority-checkbox").change(function () {
    window.localStorage.setItem(
      "nolowpriority",
      $(this).is(":checked").toString()
    );
  });
  $("#nobackdrop-checkbox").change(function () {
    window.localStorage.setItem(
      "nobackdrop",
      $(this).is(":checked").toString()
    );
    refreshNoBackdrop();
  });
  $("#simplify-checkbox").change(function () {
    window.localStorage.setItem("simplify", $(this).is(":checked").toString());
    refreshSimplify();
  });
});

function loadKubekSettings() {
  $.get("/kubek/config", function (data) {
    kubekCfg = data;
    if (kubekCfg["ftpd"] == true) {
      $("#ftpserver-checkbox").attr("checked", true);
    }

    if (window.localStorage.getItem("simplify") == "true") {
      $("#simplify-checkbox").attr("checked", true);
    }

    if (window.localStorage.getItem("nobackdrop") == "true") {
      $("#nobackdrop-checkbox").attr("checked", true);
    }

    if (window.localStorage.getItem("blurrange") != null) {
      $("#blurrange-range").val(window.localStorage.getItem("blurrange"));
    }

    if (window.localStorage.getItem("norounded") == "true") {
      $("#norounded-checkbox").attr("checked", true);
    }

    if (window.localStorage.getItem("noupdatenotify") == "true") {
      $("#noupdatenotify-checkbox").attr("checked", true);
    }

    if (window.localStorage.getItem("nolowpriority") == "true") {
      $("#nolowpriority-checkbox").attr("checked", true);
    }

    $.get("/kubek/bgList", function (bgList) {
      bgList.forEach(function (bg, i) {
        iv = i + 1;
        $("#backgrounds-select").append(
          "<option value='" + bg + "'>Image " + iv + "</option>"
        );
      });
      if (window.localStorage.background != null) {
        $(
          "#backgrounds-select option[value='" +
            window.localStorage.background +
            "']"
        ).prop("selected", true);
      }
    });

    if (window.localStorage.getItem("toastspos") != null) {
      $(
        "#toastspos-select option[value='" +
          window.localStorage.getItem("toastspos") +
          "']"
      ).prop("selected", true);
    }

    if (window.localStorage.getItem("fontfamily") != null) {
      $(
        "#fontfamily-select option[value='" +
          window.localStorage.getItem("fontfamily") +
          "']"
      ).prop("selected", true);
    }

    if (kubekCfg["tgbot-enabled"] == true) {
      $("#tgbot-checkbox").attr("checked", true);
      $("#tgbot-token-item").show();
      $("#tgbot-otp-item").show();
      $(".tgbot-token").val(kubekCfg["tgbot-token"]);
    }

    if (kubekCfg["auth"] == true) {
      $("#auth-checkbox").attr("checked", true);
    }

    if (kubekCfg["save-logs"] == true) {
      $("#savelogs-checkbox").attr("checked", true);
    }

    if (kubekCfg["internet-access"] == true) {
      $("#allowintacc-checkbox").attr("checked", true);
    }

    $(".ftppass").val(kubekCfg["ftpd-password"]);
    $(".ftpuser").val(kubekCfg["ftpd-user"]);
    $(".webserverport").val(kubekCfg["webserver-port"]);
    $(".socketport").val(kubekCfg["socket-port"]);

    $.get("/kubek/support-uid", function (supuid) {
      $("#supuid").text(supuid);
    });

    if ($("#tgbot-checkbox").is(":checked")) {
      $("#tgbot-token-item").show();
      $("#tgbot-otp-item").show();
    } else {
      $("#tgbot-token-item").hide();
      $("#tgbot-otp-item").hide();
    }
    if ($("#auth-checkbox").is(":checked")) {
      $("#auth-users-item").show();
    } else {
      $("#auth-users-item").hide();
    }
    if ($("#ftpserver-checkbox").is(":checked")) {
      $("#ftp-login-item").show();
      $("#ftp-pass-item").show();
    } else {
      $("#ftp-login-item").hide();
      $("#ftp-pass-item").hide();
    }
  });

  $("#user-edit-modal .password-input").keyup(function () {
    passwd = $("#user-edit-modal .password-input").val();
    if (passwd.match(PASSWORD_REGEX) != null) {
      $("#user-edit-modal .passwd-err").hide();
    } else {
      $("#user-edit-modal .passwd-err").show();
    }
  });
}

function shutdownKubek() {
  showModal("turnoff-warn-modal", "fadeIn", function () {
    $.get("/kubek/shutdown");
  });
}

function setNewUserMode(bool) {
  if (bool) {
    $("#user-edit-modal #user-edit-modal-label").text("{{adding-usr-ks}}");
    $("#user-edit-modal .input-bg").show();
    $("#user-edit-modal .passwd-err").hide();
    $("#user-edit-modal .buttons-cont").hide();
    modalModeNewUser = true;
  } else {
    $("#user-edit-modal #user-edit-modal-label").text("{{editing-usr-ks}}");
    $("#user-edit-modal .input-bg").hide();
    $("#user-edit-modal .passwd-err").hide();
    $("#user-edit-modal .buttons-cont").show();
    modalModeNewUser = false;
  }
  setModalDefaultValues();
}

function setModalDefaultValues() {
  $("#user-edit-modal input[type=checkbox]:not(:disabled)").each(function () {
    $(this).prop("checked", false);
  });
  $(
    "#user-edit-modal input[type=text], #user-edit-modal input[type=password], #user-edit-modal input[type=email]"
  ).each(function () {
    $(this).val("");
  });
}

function openNewUserModal() {
  setNewUserMode(true);
  setModalDefaultValues();
  showModal("user-edit-modal", "fadeIn", function () {
    saveUser();
  });
}

function saveUser() {
  usrname = $("#user-edit-modal .usrname-input").val();
  mail = $("#user-edit-modal .mail-input").val();
  if (mail == "" || mail.match(EMAIL_REGEX)) {
    if (usrname.match(LOGIN_REGEX)) {
      perms = [];
      $("#user-edit-modal input[type=checkbox]:checked:not(:disabled)").each(
        function () {
          perm = $(this).data("perm");
          perms.push(perm);
        }
      );
      perms = perms.join(",");
      if (modalModeNewUser == true) {
        passwd = $("#user-edit-modal .password-input").val();
        if (passwd.match(PASSWORD_REGEX)) {
          if (mail == "") {
            reqUrl =
              "/auth/newUser?login=" +
              usrname +
              "&permissions=" +
              perms +
              "&password=" +
              passwd;
          } else {
            reqUrl =
              "/auth/newUser?login=" +
              usrname +
              "&mail=" +
              mail +
              "&permissions=" +
              perms +
              "&password=" +
              passwd;
          }
          $.get(reqUrl, function (res) {
            if (res == "Users count is limited to 5 users") {
              Toaster("{{users-limited-count-ks}}", 3000, false, "warning");
            }
            loadUsersList();
          });
        }
      } else {
        $.get(
          "/auth/editUser?login=" +
            usrname +
            "&mail=" +
            mail +
            "&permissions=" +
            perms,
          function () {
            loadUsersList();
          }
        );
      }
    }
  }
}

function setModalDataByUserInfo(userInfo) {
  setModalDefaultValues();
  currEdit = userInfo.username;
  $("#user-edit-modal .usrname-input").val(userInfo.username);
  $("#user-edit-modal .mail-input").val(userInfo.mail);
  perms = userInfo.permissions;
  $("#user-edit-modal input[type=checkbox]").each(function () {
    perm = $(this).data("perm");
    if (perms.includes(perm)) {
      $(this).prop("checked", true);
    }
  });
}

function saveKubekSettings() {
  ftpd = $("#ftpserver-checkbox").is(":checked");
  auth = $("#auth-checkbox").is(":checked");
  savelogs = $("#savelogs-checkbox").is(":checked");
  allowint = $("#allowintacc-checkbox").is(":checked");
  tgbot = $("#tgbot-checkbox").is(":checked");
  if (tgbot == false || $(".tgbot-token").val() != "") {
    if (kubekCfg["tgbot-enabled"] != tgbot && tgbot == true) {
      showModal("about-otp-modal", "fadeIn", function () {
        saveSettingsStage2();
      });
    } else {
      saveSettingsStage2();
    }
  }
}

function saveSettingsStage2() {
  if (kubekCfg["ftpd"] != ftpd) {
    showModal("ftp-need-res-modal", "fadeIn", function () {
      saveSettingsStage3();
    });
  } else {
    saveSettingsStage3();
  }
}

function saveSettingsStage3() {
  if (kubekCfg["internet-access"] != allowint) {
    showModal("othip-need-res-modal", "fadeIn", function () {
      saveSettingsStage35();
    });
  } else {
    saveSettingsStage35();
  }
}

function saveSettingsStage35() {
  if (
    kubekCfg["webserver-port"] != $(".webserverport").val() ||
    kubekCfg["socket-port"] != $(".socketport").val()
  ) {
    if (
      $(".webserverport").val() >= 80 &&
      $(".webserverport").val() <= 65500 &&
      $(".socketport").val() >= 81 &&
      $(".socketport").val() <= 65500
    ) {
      showModal("othport-need-res-modal", "fadeIn", function () {
        saveSettingsStage4();
      });
    }
  } else {
    saveSettingsStage4();
  }
}

function saveSettingsStage4() {
  kubekCfg["ftpd"] = ftpd;
  kubekCfg["auth"] = auth;
  kubekCfg["tgbot-enabled"] = tgbot;
  kubekCfg["internet-access"] = allowint;
  kubekCfg["save-logs"] = savelogs;
  kubekCfg["ftpd-password"] = $(".ftppass").val();
  kubekCfg["ftpd-user"] = $(".ftpuser").val();
  kubekCfg["tgbot-token"] = $(".tgbot-token").val();
  kubekCfg["socket-port"] = $(".socketport").val();
  kubekCfg["webserver-port"] = $(".webserverport").val();
  kubekCfg["tgbot-chatid"] = [];
  $.get(
    "/kubek/saveConfig?data=" + encodeURI(JSON.stringify(kubekCfg)),
    function (data) {
      $.get("/kubek/setFTPDStatus?value=" + ftpd, function (data) {
        location.reload();
      });
    }
  );
}

function changeAdminPass() {
  oldPass = $("#admin-edit-modal .opassword-input").val();
  newPass = $("#admin-edit-modal .npassword-input").val();
  if (oldPass != "" && newPass != "") {
    $.get(
      "/auth/changeAdminPass?oldPass=" + oldPass + "&newPass=" + newPass,
      function (ret) {
        if (ret == true) {
          window.location = "/";
        } else {
          $("#admin-edit-modal .opassword-input").val("");
          $("#admin-edit-modal .npassword-input").val("");
        }
      }
    );
  }
}

function deleteCurrUserAccount() {
  $.get("/auth/deleteUser?login=" + currEdit, function () {
    loadUsersList();
    $("#user-edit-modal").hide();
  });
}

function regenCurrUserHash() {
  $.get("/auth/regenUserHash?login=" + currEdit, function () {
    loadUsersList();
    $("#user-edit-modal").hide();
  });
}

function openEditAdminModal() {
  showModal("admin-edit-modal", "fadeIn", function () {
    changeAdminPass();
  });
}

function openEditUserModal(username) {
  setNewUserMode(false);
  $.get("/auth/getUserInfo?username=" + username, function (usrdata) {
    setModalDataByUserInfo(usrdata);
    showModal("user-edit-modal", "fadeIn", function () {
      saveUser();
    });
  });
}

function loadUsersList() {
  $("#users-list tr:not(.addusr)").each(function () {
    $(this).remove();
  });
  htmlc = "";
  $.get("/auth/listUsers", function (users) {
    htmlc =
      htmlc +
      '<tr class="bg-white dark:bg-gray-800 cursor-pointer" onclick="openEditAdminModal()"><th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"><div class="flex items-center"><i class="ri-user-2-fill text-xl"></i><span style="margin-left: 16px"></span></div></th><td class="px-6 py-4">{{admin-acc-ks}}</td></tr>';
    for (const [key, value] of Object.entries(users)) {
      usr = value;
      if (usr.mail == "undefined" || usr.mail == null || usr.mail == "") {
        usr.mail = "{{mail-no-ks}}";
      }
      if (usr.username != "kubek") {
        htmlc =
          htmlc +
          '<tr class="bg-white dark:bg-gray-800 cursor-pointer" onclick="openEditUserModal(' +
          "'" +
          usr.username +
          "'" +
          ')"><th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"><div class="flex items-center"><i class="ri-user-fill text-xl"></i><span style="margin-left: 16px"></span></div></th><td class="px-6 py-4">' +
          usr.username +
          "</td></tr>";
      }
    }
    $("#users-list").append(htmlc);
  });
}

function startNSAModalTimeout(){
  $("#needtosave-auth-warn-modal button").hide();
  $("#needtosave-auth-warn-modal .nsatimeout-span").text(nsatimeout + "s");
  setInterval(function(){
    if(nsatimeout > 1){
      nsatimeout--;
      $("#needtosave-auth-warn-modal .nsatimeout-span").text(nsatimeout + "s");
    } else {
      $("#needtosave-auth-warn-modal .nsatimeout-span").hide();
      $("#needtosave-auth-warn-modal button").show();
    }
  }, 1000);
}*/